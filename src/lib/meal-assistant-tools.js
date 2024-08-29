import { DynamicTool } from "@langchain/core/tools";

export const FindRecipesByIngredientsTool = new DynamicTool({
  name: "find-recipes-by-ingredients",
  description: "Find recipes based on available ingredients. Input should be a comma-separated list of ingredients.",
  func: async (input) => {
    const apiKey = process.env.NEXT_PUBLIC_SPOONACULAR_API_KEY;
    if (!apiKey) {
      throw new Error("Spoonacular API key not set. You can set it as NEXT_PUBLIC_SPOONACULAR_API_KEY in your environment variables.");
    }
    const url = `https://api.spoonacular.com/recipes/findByIngredients?apiKey=${apiKey}&ingredients=${input}&number=5`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Got ${response.status} error from Spoonacular API: ${response.statusText}`);
    }
    const data = await response.json();
    let formattedResults = "Here are some recipes based on your ingredients:\n\n";
    const recipeData = {};
    data.forEach((recipe, index) => {
      formattedResults += `${index + 1}. ${recipe.title}\n`;
      formattedResults += `   Missing ingredients: ${recipe.missedIngredients.map(ing => ing.name).join(', ')}\n\n`;
      recipeData[index + 1] = { id: recipe.id, title: recipe.title };
    });
    formattedResults += "\nPlease choose a recipe by its number or name.";
    global.lastRecipeSearch = recipeData;
    return JSON.stringify({
      text: formattedResults,
      recipes: recipeData
    });
  }
});

export const ComplexRecipeSearchTool = new DynamicTool({
  name: "complex-recipe-search",
  description: "Search for recipes based on various parameters like cuisine, diet, etc. Input should be a JSON string with query, cuisine, diet, intolerances, and number.",
  func: async (input) => {
    const apiKey = process.env.NEXT_PUBLIC_SPOONACULAR_API_KEY;
    if (!apiKey) {
      throw new Error("Spoonacular API key not set. You can set it as NEXT_PUBLIC_SPOONACULAR_API_KEY in your environment variables.");
    }
    const { query, cuisine, diet, intolerances, number = 5 } = JSON.parse(input);
    let url = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${apiKey}&query=${query}&number=${number}`;
    if (cuisine) url += `&cuisine=${cuisine}`;
    if (diet) url += `&diet=${diet}`;
    if (intolerances) url += `&intolerances=${intolerances}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Got ${response.status} error from Spoonacular API: ${response.statusText}`);
    }
    const data = await response.json();
    let formattedResults = `Here are some ${cuisine || ''} recipes ${diet ? 'suitable for ' + diet + ' diet' : ''} ${intolerances ? 'without ' + intolerances : ''}:\n\n`;
    const recipeData = {};
    data.results.forEach((recipe, index) => {
      formattedResults += `${index + 1}. ${recipe.title}\n`;
      recipeData[index + 1] = { id: recipe.id, title: recipe.title };
    });
    formattedResults += "\nPlease choose a recipe by its number or name.";
    global.lastRecipeSearch = recipeData;
    return JSON.stringify({
      text: formattedResults,
      recipes: recipeData
    });
  }
});

export const GetRecipeInformationTool = new DynamicTool({
  name: "get-recipe-information",
  description: "Get detailed information about a specific recipe. Input should be a recipe name or number from the previous search results.",
  func: async (input) => {
    const apiKey = process.env.NEXT_PUBLIC_SPOONACULAR_API_KEY;
    if (!apiKey) {
      throw new Error("Spoonacular API key not set. You can set it as NEXT_PUBLIC_SPOONACULAR_API_KEY in your environment variables.");
    }

    let recipeId;
    let recipeTitle;

    try {
      const inputNumber = parseInt(input);
      if (!isNaN(inputNumber) && inputNumber > 0 && inputNumber <= 5) {
        recipeId = global.lastRecipeSearch[inputNumber].id;
        recipeTitle = global.lastRecipeSearch[inputNumber].title;
      } else {
        const recipe = Object.values(global.lastRecipeSearch).find(r => r.title.toLowerCase() === input.toLowerCase());
        if (recipe) {
          recipeId = recipe.id;
          recipeTitle = recipe.title;
        } else {
          throw new Error("Recipe not found. Please choose a valid recipe number or name from the previous search results.");
        }
      }
    } catch (error) {
      console.error("Error processing recipe choice:", error);
      return `Error: ${error.message}. Please try again with a valid recipe number or name.`;
    }
    try{
    const url = `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${apiKey}&includeNutrition=true`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Got ${response.status} error from Spoonacular API: ${response.statusText}`);
    }
    const data = await response.json();
    let formattedResults = `Recipe Information for ${recipeTitle}:\n\n`;
    
    // Safely access nutrition information
    const nutrition = data.nutrition || {};
    const nutrients = nutrition.nutrients || [];
    const getnutrientAmount = (name) => {
      const nutrient = nutrients.find(n => n.name === name);
      return nutrient ? `${nutrient.amount} ${nutrient.unit}` : 'Not available';
    };

    formattedResults += `Calories: ${getnutrientAmount("Calories")}\n`;
    formattedResults += `Protein: ${getnutrientAmount("Protein")}\n`;
    formattedResults += `Fat: ${getnutrientAmount("Fat")}\n`;
    formattedResults += `Carbs: ${getnutrientAmount("Carbohydrates")}\n`;
    formattedResults += `Preparation Time: ${data.readyInMinutes || 'Not available'} minutes\n`;
    formattedResults += `Servings: ${data.servings || 'Not available'}\n`;
    
    return formattedResults;
  }
  catch(error){
    console.error("Error processing recipe choice:", error);
    return `Error: Unable to fetch information for the recipe. ${error.message}`;
  }
}
}); 

export const GetRecipeInstructionsTool = new DynamicTool({
  name: "get-recipe-instructions",
  description: "Get step-by-step instructions for a specific recipe. Input should be a recipe name or number from the previous search results.",
  func: async (input) => {
    const apiKey = process.env.NEXT_PUBLIC_SPOONACULAR_API_KEY;
    if (!apiKey) {
      throw new Error("Spoonacular API key not set. You can set it as NEXT_PUBLIC_SPOONACULAR_API_KEY in your environment variables.");
    }

    let recipeId;
    let recipeTitle;

    try {
      const inputNumber = parseInt(input);
      if (!isNaN(inputNumber) && inputNumber > 0 && inputNumber <= 5) {
        recipeId = global.lastRecipeSearch[inputNumber].id;
        recipeTitle = global.lastRecipeSearch[inputNumber].title;
      } else {
        const recipe = Object.values(global.lastRecipeSearch).find(r => r.title.toLowerCase() === input.toLowerCase());
        if (recipe) {
          recipeId = recipe.id;
          recipeTitle = recipe.title;
        } else {
          throw new Error("Recipe not found. Please choose a valid recipe number or name from the previous search results.");
        }
      }
    } catch (error) {
      console.error("Error processing recipe choice:", error);
      return `Error: ${error.message}. Please try again with a valid recipe number or name.`;
    }

    const url = `https://api.spoonacular.com/recipes/${recipeId}/analyzedInstructions?apiKey=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Got ${response.status} error from Spoonacular API: ${response.statusText}`);
    }
    const data = await response.json();
    let formattedResults = `Recipe Instructions for ${recipeTitle}:\n\n`;
    if (data[0] && data[0].steps) {
      data[0].steps.forEach((step, index) => {
        formattedResults += `${index + 1}. ${step.step}\n`;
      });
    } else {
      formattedResults += "No instructions available for this recipe.";
    }
    return formattedResults;
  }
});

export const GoogleSearchTool = new DynamicTool({
  name: "google-search",
  description: "Search for restaurants in Singapore, including menu and calorie information when available. Input should be a restaurant name or cuisine type.",
  func: async (input) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_SEARCH_API_KEY;
    const googleCSEId = process.env.NEXT_PUBLIC_GOOGLE_SEARCH_ENGINE_ID;
    if (!apiKey || !googleCSEId) {
      throw new Error("Google API key or CSE ID not set. Please check your environment variables.");
    }
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${googleCSEId}&q=${encodeURIComponent(input + ' restaurant Singapore menu calories')}&num=5`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error from Google custom search: ${response.statusText}`);
    }
    const json = await response.json();
    
    let formattedResults = `Information about "${input}" restaurants in Singapore:\n\n`;
    
    json.items.forEach((item, index) => {
      const title = item.title.replace(/[|] Website.*$/, '').trim();  // Remove website suffix if present
      const snippet = item.snippet.split('. ')[0];  // Take only the first sentence of the snippet
      
      formattedResults += `${index + 1}. ${title}\n`;
      formattedResults += `   ${snippet}\n`;
      
      // Look for calorie information in the snippet
      const calorieMatch = item.snippet.match(/(\d+)\s*calories?/i);
      if (calorieMatch) {
        formattedResults += `   Calorie info found: Approximately ${calorieMatch[1]} calories\n`;
      }
      
      formattedResults += '\n';
    });
    
    formattedResults += "Note: Calorie information may not be available for all restaurants. Please check with the restaurant for the most accurate and up-to-date nutritional information.";
    
    return formattedResults;
  }
});


export const HalalRecipeSearchTool = new DynamicTool({
  name: "halal-recipe-search",
  description: "Search for halal recipes based on various parameters like cuisine, diet, etc. Input should be a JSON string with query, cuisine, diet, intolerances, and number.",
  func: async (input) => {
    const apiKey = process.env.NEXT_PUBLIC_SPOONACULAR_API_KEY;
    if (!apiKey) {
      throw new Error("Spoonacular API key not set. You can set it as NEXT_PUBLIC_SPOONACULAR_API_KEY in your environment variables.");
    }
    const { query, cuisine, diet, intolerances, number = 5 } = JSON.parse(input);
    let url = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${apiKey}&query=${query}&number=${number}`;
    if (cuisine) url += `&cuisine=${cuisine}`;
    if (diet) url += `&diet=${diet}`;
    if (intolerances) url += `&intolerances=${intolerances}`;
    
    // Add exclusions for halal
    url += '&excludeIngredients=pork,lard,alcohol,wine,beer';
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Got ${response.status} error from Spoonacular API: ${response.statusText}`);
    }
    const data = await response.json();
    let formattedResults = `Here are some halal ${cuisine || ''} recipes ${diet ? 'suitable for ' + diet + ' diet' : ''} ${intolerances ? 'without ' + intolerances : ''}:\n\n`;
    const recipeData = {};
    if (data.results.length > 0) {
      data.results.forEach((recipe, index) => {
        formattedResults += `${index + 1}. ${recipe.title}\n`;
        recipeData[index + 1] = { id: recipe.id, title: recipe.title };
      });
      formattedResults += "\nPlease choose a recipe by its number or name.";
    } else {
      formattedResults = "I'm sorry, I couldn't find any halal recipes matching your criteria. Would you like to try a different cuisine or type of dish?";
    }
    return JSON.stringify({
      text: formattedResults,
      recipes: recipeData
    });
  }
});