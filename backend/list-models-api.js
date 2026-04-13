// List available models via direct API call
require("dotenv").config();

const API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
    
    console.log("Fetching available models...\n");
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      console.error("Error:", data);
      return;
    }
    
    console.log(`Found ${data.models?.length || 0} models:\n`);
    
    data.models?.forEach((model, i) => {
      console.log(`${i + 1}. ${model.name}`);
      console.log(`   Display Name: ${model.displayName}`);
      console.log(`   Methods: ${model.supportedGenerationMethods?.join(", ") || "N/A"}`);
      console.log("");
    });
    
    // Filter for generateContent support
    const contentModels = data.models?.filter(m => 
      m.supportedGenerationMethods?.includes("generateContent")
    ) || [];
    
    console.log(`\n✓ Models supporting generateContent (${contentModels.length}):`);
    contentModels.forEach(m => {
      const shortName = m.name.replace("models/", "");
      console.log(`  - ${shortName}`);
    });
    
  } catch (err) {
    console.error("Error:", err.message);
  }
}

listModels();
