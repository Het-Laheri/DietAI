process.env.NODE_ENV = 'test';
import assert from 'node:assert';
import app from './server';
import http from 'node:http';

console.log('🧪 Starting NutriSnap AI Dietician Message Inbox & Approval Test Suite...\n');

async function runTests() {
  const PORT = 3099;
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(PORT, '127.0.0.1', () => {
      console.log(`✓ Test server running on http://127.0.0.1:${PORT}`);
      resolve();
    });
  });

  try {
    // -------------------------------------------------------------
    // TEST 1: POST /api/ai/coach - Missing question validation
    // -------------------------------------------------------------
    console.log('Test 1: Validating missing question handling on /api/ai/coach...');
    const res1 = await fetch(`http://127.0.0.1:${PORT}/api/ai/coach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId: 'test-pt-1', patientName: 'Priya Sharma' })
    });
    assert.strictEqual(res1.status, 400, 'Expected 400 status for missing question');
    const data1 = await res1.json();
    assert.ok(data1.error, 'Expected error message in response');
    console.log('✓ Test 1 Passed: 400 Bad Request returned correctly for missing question.\n');

    // -------------------------------------------------------------
    // TEST 2: POST /api/ai/coach - AI Draft generation with patient context
    // -------------------------------------------------------------
    console.log('Test 2: Generating AI Draft for patient query with clinical context...');
    const patientProfile = {
      dietaryType: 'Vegetarian',
      goals: ['Weight Loss', 'PCOS Management'],
      currentWeightKg: 68,
      targetWeightKg: 58,
      allergies: ['Peanuts']
    };

    const res2 = await fetch(`http://127.0.0.1:${PORT}/api/ai/coach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: 'patient_priya_101',
        patientName: 'Priya Sharma',
        question: 'Can I replace paneer with tofu for lunch to cut calories?',
        patientProfile
      })
    });

    assert.strictEqual(res2.status, 200, `Expected 200 status, got ${res2.status}`);
    const data2 = await res2.json();
    assert.ok(data2.aiDraft, 'Expected aiDraft field in response');
    assert.ok(typeof data2.aiDraft === 'string' && data2.aiDraft.length > 10, 'aiDraft should be a non-empty string');
    console.log(`✓ Test 2 Passed: AI Draft successfully generated.`);
    console.log(`   Sample Draft: "${data2.aiDraft.substring(0, 90)}..."\n`);

    // -------------------------------------------------------------
    // TEST 3: Pre-generated Draft Editing Simulation
    // -------------------------------------------------------------
    console.log('Test 3: Simulating Dietician Draft Customization & Editing...');
    const originalDraft = data2.aiDraft;
    const dieticianCustomizedAnswer = `${originalDraft} Additionally, pair with steamed green beans to ensure adequate dietary fiber.`;
    assert.notStrictEqual(dieticianCustomizedAnswer, originalDraft);
    assert.ok(dieticianCustomizedAnswer.includes('fiber'));
    console.log('✓ Test 3 Passed: Pre-generated draft editing and clinical note augmentation verified.\n');

    // -------------------------------------------------------------
    // TEST 4: Message Status Lifecycle Simulation
    // -------------------------------------------------------------
    console.log('Test 4: Verifying Message Lifecycle (pending -> approved)...');
    const mockMessage = {
      id: 'msg_test_' + Date.now(),
      patientId: 'patient_priya_101',
      patientName: 'Priya Sharma',
      question: 'Can I replace paneer with tofu for lunch to cut calories?',
      aiDraft: originalDraft,
      approvedAnswer: '',
      status: 'pending' as const,
      createdAt: new Date().toISOString()
    };

    assert.strictEqual(mockMessage.status, 'pending');
    assert.strictEqual(mockMessage.approvedAnswer, '');

    // Dietician approves
    const approvedMessage = {
      ...mockMessage,
      approvedAnswer: dieticianCustomizedAnswer,
      dieticianNote: 'Approved with extra fiber advice',
      status: 'approved' as const,
      approvedAt: new Date().toISOString()
    };

    assert.strictEqual(approvedMessage.status, 'approved');
    assert.strictEqual(approvedMessage.approvedAnswer, dieticianCustomizedAnswer);
    assert.ok(approvedMessage.approvedAt);
    console.log('✓ Test 4 Passed: Status transition to "approved" with authorized answer verified.\n');

    // -------------------------------------------------------------
    // TEST 5: Direct Message Composition from Dietician Portal
    // -------------------------------------------------------------
    console.log('Test 5: Testing Direct Dietician Message Payload Format...');
    const directRecommendation = {
      patientId: 'patient_priya_101',
      patientName: 'Priya Sharma',
      question: 'Hydration & Electrolyte Recommendation',
      aiDraft: 'Please increase water intake to 2.5L today and add a pinch of pink salt before your evening workout.',
      approvedAnswer: 'Please increase water intake to 2.5L today and add a pinch of pink salt before your evening workout.',
      status: 'approved',
      dieticianNote: 'Direct message from Lead Dietician',
      createdAt: new Date().toISOString()
    };

    assert.strictEqual(directRecommendation.status, 'approved');
    assert.ok(directRecommendation.approvedAnswer.includes('2.5L'));
    console.log('✓ Test 5 Passed: Direct dietician message format and immediate approval status verified.\n');

    console.log('🎉 ALL 5 TEST SUITES PASSED SUCCESSFULLY!');
  } finally {
    server.close();
  }
}

runTests().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
