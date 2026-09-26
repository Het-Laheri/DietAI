const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const estimateFoodStr = `
  app.post(['/api/ai/estimate-food', '/ai/estimate-food'], async (req, res) => {
    try {
      const { foodDesc } = req.body;
      if (!foodDesc) return res.status(400).json({ error: 'Missing foodDesc' });
      
      const prompt = \`Estimate the nutritional value for the following food consumed by a patient: "\${foodDesc}".
Return ONLY a valid JSON object with the following schema:
{
  "name": "Standardized Food Name (e.g. Brownie Cake)",
  "portion": "Estimated Portion Size (e.g. 250g)",
  "calories": 1150,
  "protein": 15,
  "carbs": 140,
  "fat": 55
}
\`;

      const aiText = await generateAIResponse({
        systemInstruction: 'Respond with a valid JSON object only. Do not wrap in markdown.',
        userPrompt: prompt,
        jsonMode: true
      });
      
      const cleanedAI = aiText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
      const est = JSON.parse(cleanedAI);
      res.json(est);
    } catch (e) {
      console.error('AI Food Estimation Error:', e);
      res.status(500).json({ error: 'Failed to estimate food' });
    }
  });
`;

code = code.replace(/app\.post\(\['\/api\/ai\/scan-food', '\/ai\/scan-food'\], async \(req, res\) => \{/, estimateFoodStr + "\n  app.post(['/api/ai/scan-food', '/ai/scan-food'], async (req, res) => {");

fs.writeFileSync('server.ts', code);
