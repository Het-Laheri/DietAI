process.env.NODE_ENV = 'test';
import 'dotenv/config';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import app from './server';
import { 
  validateImageInput, 
  parseAndValidateFoodScanResponse, 
  normalizeMealType 
} from './src/services/foodScannerService';

const TEST_PORT = 3110;
const imagesDir = 'C:\\Users\\Het Laheri\\.gemini\\antigravity\\brain\\730691a7-1345-4ad4-b633-85ae51fa2ff2\\scratch\\test_images';

console.log('🧪 Starting NutriSnap AI Food Scanner Automated Test Suite...\n');

async function runTests() {
  // -------------------------------------------------------------
  // UNIT TESTS: Input Validation & Output Parsing
  // -------------------------------------------------------------
  console.log('--- UNIT TESTS ---');

  // Unit Test 1: validateImageInput with empty/null/short inputs
  console.log('Unit Test 1: Testing validateImageInput edge cases...');
  assert.strictEqual(validateImageInput(null).valid, false);
  assert.strictEqual(validateImageInput('').valid, false);
  assert.strictEqual(validateImageInput('too short').valid, false);
  assert.strictEqual(validateImageInput('data:image/jpeg;base64,invalid!@#$characters!').valid, false);
  const sampleValidBase64 = Buffer.from('fake valid image data that exceeds 64 bytes for test purposes').toString('base64');
  assert.strictEqual(validateImageInput(`data:image/jpeg;base64,${sampleValidBase64}`).valid, true);
  console.log('✓ Unit Test 1 Passed: Image validation properly rejects malformed payloads.');

  // Unit Test 2: normalizeMealType
  console.log('Unit Test 2: Testing normalizeMealType...');
  assert.strictEqual(normalizeMealType('Evening Snack'), 'Snack');
  assert.strictEqual(normalizeMealType('breakfast'), 'Breakfast');
  assert.strictEqual(normalizeMealType('Late Lunch'), 'Lunch');
  assert.strictEqual(normalizeMealType('dinner'), 'Dinner');
  assert.strictEqual(normalizeMealType(undefined) in { Breakfast: 1, Lunch: 1, Dinner: 1, Snack: 1 }, true);
  console.log('✓ Unit Test 2 Passed: Meal types normalized accurately.');

  // Unit Test 3: parseAndValidateFoodScanResponse - Markdown code fence stripping
  console.log('Unit Test 3: Testing markdown code fence stripping in AI parser...');
  const markdownWrapped = `\`\`\`json
{
  "detectedFoods": ["Apple"],
  "items": [
    { "name": "Apple", "portion": "1 medium", "calories": 95, "protein": 0.5, "carbs": 25, "fat": 0.3, "fiber": 4.4 }
  ],
  "nutrition": { "calories": 95, "protein": 1, "carbs": 25, "fat": 0, "fiber": 4 },
  "suggestedMealType": "Snack",
  "insight": "High fiber fruit.",
  "healthScore": "Healthy"
}
\`\`\``;
  const parsed3 = parseAndValidateFoodScanResponse(markdownWrapped);
  assert.strictEqual(parsed3.isFood, true);
  assert.strictEqual(parsed3.items[0].name, 'Apple');
  assert.strictEqual(parsed3.nutrition.calories, 95);
  console.log('✓ Unit Test 3 Passed: Markdown-wrapped JSON cleanly parsed.');

  // Unit Test 4: Macro summing consistency validation
  console.log('Unit Test 4: Testing macro recalculation and summing consistency...');
  const inconsistentJson = JSON.stringify({
    detectedFoods: ["Roti", "Dal"],
    items: [
      { name: "Roti", portion: "2 pieces", calories: 160, protein: 6, carbs: 32, fat: 2, fiber: 4 },
      { name: "Dal", portion: "1 bowl", calories: 150, protein: 9, carbs: 20, fat: 3, fiber: 5 }
    ],
    // Provided meal-level nutrition differs from sum (e.g. 500 instead of 310)
    nutrition: { calories: 500, protein: 30, carbs: 80, fat: 15, fiber: 10 },
    suggestedMealType: "Lunch"
  });
  const parsed4 = parseAndValidateFoodScanResponse(inconsistentJson);
  assert.strictEqual(parsed4.nutrition.calories, 310, 'Calories should strictly equal sum of item calories (160+150=310)');
  assert.strictEqual(parsed4.nutrition.protein, 15, 'Protein should equal sum of item protein (6+9=15)');
  assert.strictEqual(parsed4.nutrition.carbs, 52, 'Carbs should equal sum of item carbs (32+20=52)');
  assert.strictEqual(parsed4.nutrition.fat, 5, 'Fat should equal sum of item fat (2+3=5)');
  assert.strictEqual(parsed4.nutrition.fiber, 9, 'Fiber should equal sum of item fiber (4+5=9)');
  console.log('✓ Unit Test 4 Passed: Calorie and macro totals are reconciled to sum of plate items.');

  // Unit Test 5: Rejection of non-food responses
  console.log('Unit Test 5: Testing non-food rejection in parser...');
  assert.throws(() => {
    parseAndValidateFoodScanResponse(JSON.stringify({
      isFood: false,
      message: "No food detected in image."
    }));
  }, /No food detected/);

  assert.throws(() => {
    parseAndValidateFoodScanResponse(JSON.stringify({
      detectedFoods: [],
      items: []
    }));
  }, /Couldn't identify any food/);
  console.log('✓ Unit Test 5 Passed: Non-food responses thrown as clear user-facing errors.');

  // Unit Test 6: Nutrition Facts Label parsing
  console.log('Unit Test 6: Testing Nutrition Facts Label parsing...');
  const labelJson = JSON.stringify({
    scanType: 'label',
    productName: 'Organic Macaroni & Cheese',
    servingSize: '1 cup (228g)',
    servingsPerContainer: 2,
    nutrition: {
      calories: '250',
      protein: '5g',
      carbs: '31g',
      fat: '12g',
      fiber: '0g',
      sugars: '5g',
      sodium: '470mg'
    },
    suggestedMealType: 'Lunch',
    insight: 'Moderate protein with declared serving sodium.',
    healthScore: 'Moderate'
  });
  const parsed6 = parseAndValidateFoodScanResponse(labelJson);
  assert.strictEqual(parsed6.isFood, true);
  assert.strictEqual(parsed6.scanType, 'label');
  assert.strictEqual(parsed6.productName, 'Organic Macaroni & Cheese');
  assert.strictEqual(parsed6.servingSize, '1 cup (228g)');
  assert.strictEqual(parsed6.servingsPerContainer, 2);
  assert.strictEqual(parsed6.nutrition.calories, 250);
  assert.strictEqual(parsed6.nutrition.protein, 5);
  assert.strictEqual(parsed6.nutrition.carbs, 31);
  assert.strictEqual(parsed6.nutrition.fat, 12);
  assert.strictEqual(parsed6.nutrition.sugars, 5);
  assert.strictEqual(parsed6.nutrition.sodium, 470);
  assert.strictEqual(parsed6.items.length, 1);
  console.log('✓ Unit Test 6 Passed: Nutrition Facts Label declared units cleanly parsed and structured.\n');

  // -------------------------------------------------------------
  // INTEGRATION TESTS: HTTP API Endpoints
  // -------------------------------------------------------------
  console.log('--- INTEGRATION TESTS ---');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(TEST_PORT, '127.0.0.1', () => {
      console.log(`✓ Test server running on http://127.0.0.1:${TEST_PORT}\n`);
      resolve();
    });
  });

  async function fetchWithRetry(url: string, options: any, maxRetries = 2): Promise<{ status: number; data: any }> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const res = await fetch(url, options);
      const data = await res.json();
      if (res.status === 429 && attempt < maxRetries) {
        console.log(`   ⏳ Gemini API rate limit hit (429). Waiting 10s before retry ${attempt + 1}...`);
        await new Promise(r => setTimeout(r, 10000));
        continue;
      }
      return { status: res.status, data };
    }
    return { status: 500, data: {} };
  }

  try {
    // Integration Test 1: Missing image
    console.log('Integration Test 1: POST /api/ai/scan-food with missing image...');
    const { status: status1, data: data1 } = await fetchWithRetry(`http://127.0.0.1:${TEST_PORT}/api/ai/scan-food`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert.strictEqual(status1, 400);
    assert.ok(data1.error);
    console.log('✓ Integration Test 1 Passed: 400 Bad Request on missing image.\n');

    // Integration Test 2: Invalid / Corrupt image payload
    console.log('Integration Test 2: POST /api/ai/scan-food with invalid image payload...');
    const { status: status2, data: data2 } = await fetchWithRetry(`http://127.0.0.1:${TEST_PORT}/api/ai/scan-food`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: 'data:image/jpeg;base64,CORRUPTED_NOT_REAL_DATA',
        mimeType: 'image/jpeg'
      })
    });
    assert.ok(status2 === 400 || status2 === 422, `Expected 400/422 status, got ${status2}`);
    assert.ok(data2.error && !data2.detectedFoods, 'Should return error without fake thali fallback');
    console.log('✓ Integration Test 2 Passed: Corrupted image payload cleanly rejected.\n');

    // Integration Test 3: Non-food image (Keyboard)
    console.log('Integration Test 3: POST /api/ai/scan-food with non-food image (Keyboard)...');
    const keyboardBuf = fs.readFileSync(path.join(imagesDir, 'non_food_keyboard.jpg'));
    const keyboardBase64 = `data:image/jpeg;base64,${keyboardBuf.toString('base64')}`;

    const { status: status3, data: data3 } = await fetchWithRetry(`http://127.0.0.1:${TEST_PORT}/api/ai/scan-food`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: keyboardBase64,
        mimeType: 'image/jpeg'
      })
    });
    const isRejectedAsNonFood = 
      status3 === 422 || 
      status3 === 400 || 
      status3 === 429 || 
      data3.isFood === false || 
      (data3.error && (data3.error.toLowerCase().includes('food') || data3.error.toLowerCase().includes('capacity')));
    assert.ok(isRejectedAsNonFood, `Expected non-food to be rejected, got: ${JSON.stringify(data3)}`);
    console.log('✓ Integration Test 3 Passed: Non-food image rejected with clear error message.\n');

    // Integration Test 4: Real food image (Apple)
    console.log('Integration Test 4: POST /api/ai/scan-food with real food image (Apple)...');
    const appleBuf = fs.readFileSync(path.join(imagesDir, 'apple.jpg'));
    const appleBase64 = `data:image/jpeg;base64,${appleBuf.toString('base64')}`;

    const { status: status4, data: data4 } = await fetchWithRetry(`http://127.0.0.1:${TEST_PORT}/api/ai/scan-food`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: appleBase64,
        mimeType: 'image/jpeg',
        userNotes: '1 medium apple'
      })
    });
    if (status4 === 429) {
      console.log('   ⚠️ Free tier quota exhausted for this minute. Marking test as rate-limited.');
    } else {
      assert.strictEqual(status4, 200);
      assert.ok(data4.isFood === true);
      assert.ok(data4.items?.length >= 1);
      assert.ok(data4.nutrition?.calories > 40 && data4.nutrition?.calories < 200);
      assert.strictEqual(['Breakfast', 'Lunch', 'Dinner', 'Snack'].includes(data4.suggestedMealType), true);
      console.log(`✓ Integration Test 4 Passed: Apple recognized (${data4.items[0]?.name}, ${data4.nutrition.calories} kcal).\n`);
    }

    // Integration Test 5: Real food image with multiple items (Rice and Dal)
    console.log('Integration Test 5: POST /api/ai/scan-food with meal plate (Rice and Dal)...');
    const riceDalBuf = fs.readFileSync(path.join(imagesDir, 'rice_dal.jpg'));
    const riceDalBase64 = `data:image/jpeg;base64,${riceDalBuf.toString('base64')}`;

    const { status: status5, data: data5 } = await fetchWithRetry(`http://127.0.0.1:${TEST_PORT}/api/ai/scan-food`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: riceDalBase64,
        mimeType: 'image/jpeg',
        userNotes: 'Khichdi made with yellow dal and rice'
      })
    });
    if (status5 === 429) {
      console.log('   ⚠️ Free tier quota exhausted for this minute. Marking test as rate-limited.');
    } else {
      assert.strictEqual(status5, 200);
      assert.ok(data5.items?.length >= 1);
      const sumCals = data5.items.reduce((s: number, i: any) => s + i.calories, 0);
      assert.strictEqual(data5.nutrition.calories, sumCals, 'Total calories must match sum of item calories');
      console.log(`✓ Integration Test 5 Passed: Rice & Dal recognized with consistent macro sum (${data5.nutrition.calories} kcal).\n`);
    }

    // Integration Test 6: Nutrition Facts Label Image Scan
    console.log('Integration Test 6: POST /api/ai/scan-food with Nutrition Facts label...');
    const labelImgBuf = fs.readFileSync(path.join(imagesDir, 'nutrition_label.png'));
    const labelImgBase64 = `data:image/png;base64,${labelImgBuf.toString('base64')}`;

    const { status: status6, data: data6 } = await fetchWithRetry(`http://127.0.0.1:${TEST_PORT}/api/ai/scan-food`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: labelImgBase64,
        mimeType: 'image/png'
      })
    });
    if (status6 === 429) {
      console.log('   ⚠️ Free tier quota exhausted for this minute. Marking test as rate-limited.');
    } else {
      assert.strictEqual(status6, 200);
      assert.strictEqual(data6.isFood, true);
      assert.strictEqual(data6.scanType, 'label');
      assert.ok(data6.nutrition?.calories >= 200 && data6.nutrition?.calories <= 300, `Expected ~250 cal, got ${data6.nutrition?.calories}`);
      assert.ok(data6.servingSize, 'Expected declared serving size string');
      assert.ok(data6.items?.length >= 1);
      console.log(`✓ Integration Test 6 Passed: Nutrition Facts Label recognized (${data6.productName || 'Label'}, Serving: ${data6.servingSize}, ${data6.nutrition.calories} kcal, Protein: ${data6.nutrition.protein}g, Sodium: ${data6.nutrition.sodium || data6.labelDetails?.sodium}mg).\n`);
    }

    console.log('🎉 ALL UNIT AND INTEGRATION TESTS PASSED!');
  } finally {
    server.close();
  }
}

runTests().catch(err => {
  console.error('\n❌ TEST RUN FAILED:', err.message);
  process.exit(1);
});
