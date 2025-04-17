const express = require("express");
const axios = require("axios");
const cors = require("cors");
const { SYSTEM_PROMPT } = require("../prompt");
require("dotenv").config();

const app = express();
const PORT = 3000;

app.use(cors()); // allow requests from any origin
app.use(express.json()); // to parse JSON bodies

// POST route from extension
app.post("/api/chat", async (req, res) => {
  const { problemName, userMessage } = req.body;

  const models = [
    "google/gemini-2.5-pro-exp-03-25:free",
    "google/gemini-2.0-flash-exp:free",
    "deepseek/deepseek-chat-v3-0324:free",
    "deepseek/deepseek-chat:free",
    "qwen/qwq-32b:free",
    "qwen/qwen-2.5-coder-32b-instruct:free",
    "qwen/qwen-2.5-72b-instruct:free",
    "nousresearch/deephermes-3-llama-3-8b-preview:free",
    "mistralai/mistral-small-3.1-24b-instruct:free",
    "mistralai/mistral-nemo:free",
    "moonshotai/kimi-vl-a3b-thinking:free",
    "openrouter/optimus-alpha",
    "nvidia/llama-3.1-nemotron-nano-8b-v1:free",
    "nvidia/llama-3.3-nemotron-super-49b-v1:free",
    "nvidia/llama-3.1-nemotron-ultra-253b-v1:free",
    "meta-llama/llama-4-maverick:free",
    "meta-llama/llama-3.3-70b-instruct:free"
  ];
  try {
    let response;
    let data;
    const prompt = SYSTEM_PROMPT(problemName, userMessage)
    // Try each model until one succeeds or all models are exhausted
    for (const model of models) {
      response = await fetchFromModel(model, userMessage);
      
      // If the rate limit is exhausted (HTTP 429), try the next model
      if (response.status === 429) {
        console.log(`Rate limit exceeded for model ${model}. Trying the next model...`);
        continue;
      }
      
      // If response is successful, parse and return data
      if (response.ok) {
        data = await response.json();
        return res.json(data);
      }
    }
    
    // If no models returned a valid response, send an error
    res.status(500).json({ error: "All models exhausted or failed." });

  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Failed to process request." });
  }

});

// Helper function to fetch data from a model
const fetchFromModel = async (model, prompt) => {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
        "X-Title": process.env.SITE_NAME || "Chrome Extension",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        models: [model],  // Use the single model in the array
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt || "How are you?"
              }
            ]
          }
        ]
      })
    });
  
    return response;
  };
  

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
