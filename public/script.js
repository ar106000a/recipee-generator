document.addEventListener("DOMContentLoaded", () => {
  const recipeForm = document.getElementById("recipeForm");
  const ingredientsInput = document.getElementById("ingredientsInput");
  const commonIngredientsCheckboxes = document.querySelectorAll(
    '.checkbox-group input[type="checkbox"]'
  );
  const loadingSpinner = document.getElementById("loading");
  const recipeOutput = document.getElementById("recipeOutput");
  const errorOutput = document.getElementById("errorOutput");

  recipeForm.addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent default form submission

    // Clear previous outputs
    recipeOutput.style.display = "none";
    errorOutput.style.display = "none";
    recipeOutput.innerHTML = "";
    errorOutput.innerHTML = "";

    // Show loading spinner
    loadingSpinner.style.display = "flex";

    let ingredients = [];

    // Get ingredients from text input
    const textIngredients = ingredientsInput.value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item !== "");
    ingredients = [...textIngredients];

    // Get ingredients from checkboxes
    commonIngredientsCheckboxes.forEach((checkbox) => {
      if (checkbox.checked && !ingredients.includes(checkbox.value)) {
        ingredients.push(checkbox.value);
      }
    });

    if (ingredients.length === 0) {
      loadingSpinner.style.display = "none";
      errorOutput.style.display = "block";
      errorOutput.innerHTML =
        "<p>Please enter or select at least one ingredient.</p>";
      return;
    }

try {
  const response = await fetch("/generate-recipe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ingredients }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`
    );
  }

  const data = await response.json();

  // Check for the error key from the server response
  if (data.error) {
    throw new Error(data.error);
  }

  displayRecipe(data);
} catch (error) {
  console.error("Error:", error);
  errorOutput.style.display = "block";
  errorOutput.innerHTML = `<p>Failed to generate recipe: ${error.message}. Please try again.</p>`;
} finally {
  loadingSpinner.style.display = "none";
}
  });

  function displayRecipe(recipe) {
    recipeOutput.style.display = "block";
    let ingredientsHtml = recipe.ingredients
      .map((item) => `<li>${item}</li>`)
      .join("");
    let instructionsHtml = recipe.instructions
      .map((item) => `<li>${item}</li>`)
      .join("");

    recipeOutput.innerHTML = `
            <h2>${recipe.title}</h2>
            <h3>Ingredients:</h3>
            <ul>${ingredientsHtml}</ul>
            <h3>Instructions:</h3>
            <ol>${instructionsHtml}</ol>
        `;
  }
});
