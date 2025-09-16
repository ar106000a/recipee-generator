require("dotenv").config(); // Load environment variables from .env file
const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files (your front-end)
app.use(express.static(path.join(__dirname, "public"))); // Assuming your HTML, CSS, JS are in a 'public' folder

// Initialize the Generative AI model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// API endpoint to generate a recipe
app.post("/generate-recipe", async (req, res) => {
  const { ingredients } = req.body;

  if (!ingredients || ingredients.length === 0) {
    return res
      .status(400)
      .json({ message: "Please provide at least one ingredient." });
  }

  const ingredientsList = ingredients.join(", ");
  const prompt = `Generate a detailed recipe based on the following ingredients: ${ingredientsList}.
    
    The recipe should include:
    1. A creative recipe title.
    2. A list of all ingredients with quantities (assume common kitchen staples are available if not listed, e.g., salt, pepper, oil, water, but prioritize the provided ingredients).
    3. Step-by-step cooking instructions.
    
    Format the response as a JSON object with the following structure:
    {
      "title": "Recipe Title",
      "ingredients": [
        "Ingredient 1 (quantity)",
        "Ingredient 2 (quantity)",
        // ...
      ],
      "instructions": [
        "Step 1: ...",
        "Step 2: ...",
        // ...
      ]
    }`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Attempt to parse the text as JSON
    let recipeData;
    try {
      // Try to find the JSON block using a regular expression
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const jsonString = jsonMatch[0];
        recipeData = JSON.parse(jsonString);
      } else {
        // If no JSON block is found, log the raw text and return an error
        console.error("No JSON object found in LLM response.");
        return res.status(500).json({
          message:
            "Could not parse recipe from AI. No valid JSON found in the response.",
          rawResponse: text,
        });
      }
    } catch (jsonError) {
      console.error("Failed to parse extracted JSON string:", jsonError);
      console.log("Raw LLM response:", text);
      return res.status(500).json({
        message:
          "Could not parse recipe from AI. Please try again or refine ingredients.",
        rawResponse: text,
      });
    }

    // Basic validation for the expected structure
    if (
      !recipeData.title ||
      !Array.isArray(recipeData.ingredients) ||
      !Array.isArray(recipeData.instructions)
    ) {
      return res.status(500).json({
        message: "AI returned an unexpected recipe format.",
        data: recipeData,
      });
    }

    res.json(recipeData);
  } catch (error) {
    console.log("Error generating recipe with AI:", error);
    res
      .status(500)
      .json({ message: "Error generating recipe. Please try again later." });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Front-end accessible at http://localhost:${port}/index.html`);
});
