// List all available Gemini models for this API key
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    console.log("Fetching available models...\n");
    
    // List all models
    const models = await genAI.listModels();
    
    console.log(`Found ${models.length} models:\n`);
    
    models.forEach((model, i) => {
      console.log(`${i + 1}. ${model.name}`);
      console.log(`   Display Name: ${model.displayName}`);
      console.log(`   Supported Methods: ${model.supportedGenerationMethods?.join(", ") || "N/A"}`);
      console.log(`   Input Token Limit: ${model.inputTokenLimit || "N/A"}`);
      console.log(`   Output Token Limit: ${model.outputTokenLimit || "N/A"}`);
      console.log("");
    });
    
    // Find models that support generateContent
    const contentModels = models.filter(m => 
      m.supportedGenerationMethods?.includes("generateContent")
    );
    
    console.log(`\n✓ Models supporting generateContent (${contentModels.length}):`);
    contentModels.forEach(m => {
      console.log(`  - ${m.name.replace("models/", "")}`);
    });
    
  } catch (err) {
    console.error("Error listing models:", err.message);
  }
}

listModels();
