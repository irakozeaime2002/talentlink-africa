// Quick test to verify Gemini API key works
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testModels() {
  const models = [
    "gemini-flash-latest",
    "gemini-pro-latest",
    "gemini-3-flash-preview",
    "gemini-2.0-flash-lite",
    "gemini-2.5-flash-lite",
  ];

  for (const modelName of models) {
    try {
      console.log(`\n[Testing] ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      // Add timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout after 10s')), 10000)
      );
      
      const generatePromise = model.generateContent("Say 'OK' if you can read this.");
      
      const result = await Promise.race([generatePromise, timeoutPromise]);
      const text = result.response.text();
      console.log(`✓ SUCCESS: ${modelName} → ${text.slice(0, 50)}`);
      return; // Stop after first success
    } catch (err) {
      console.log(`✗ FAILED: ${modelName}`);
      console.log(`   Message: ${err.message}`);
      console.log(`   Status: ${err.status || 'N/A'}`);
      if (err.response) {
        console.log(`   Response: ${JSON.stringify(err.response).slice(0, 200)}`);
      }
    }
  }
  console.log("\n❌ All models failed. Check API key or region restrictions.");
}

testModels();
