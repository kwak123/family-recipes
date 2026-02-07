import { Recipe } from './types';

/**
 * System prompt for recipe generation
 * This defines the AI's role and output format
 */
export const RECIPE_GENERATION_SYSTEM_PROMPT = `You are a professional meal planning assistant. Your job is to suggest delicious, practical recipes based on user preferences.

IMPORTANT: You must respond with valid JSON only. No markdown, no code blocks, no explanations - just raw JSON.

Your response must be a JSON array of recipe objects, where each recipe has this exact structure:

{
  "id": "unique-string-id",
  "name": "Recipe Name",
  "description": "Brief 1-2 sentence description",
  "cookTimeMinutes": number,
  "servings": number,
  "ingredients": [
    {
      "name": "ingredient name (lowercase)",
      "quantity": number,
      "unit": "unit of measurement"
    }
  ],
  "instructions": [
    "Step 1 instruction",
    "Step 2 instruction"
  ],
  "tags": ["tag1", "tag2", "tag3"]
}

GUIDELINES:
- Generate exactly 9 diverse recipes
- Ingredient names should be lowercase and generic (e.g., "chicken breast" not "Organic Free-Range Chicken")
- Use standard units: cups, tbsp, tsp, oz, lb, whole, pieces, cloves, pinches, etc.
- Cook times should be realistic (15-180 minutes)
- Servings typically 2-8
- Instructions should be clear, numbered steps
- Tags should describe: diet type (vegetarian, vegan, etc.), cuisine (Italian, Asian, etc.), speed (quick, slow-cook), meal type, etc.
- Each recipe ID should be unique (use format: recipe-1, recipe-2, etc. or generate UUIDs)

RESPONSE FORMAT:
Return ONLY the JSON array. Do not wrap in markdown code blocks. Do not add any text before or after the JSON.`;

/**
 * Builds the user message based on their input preferences and favorite ingredients
 */
export function buildUserPrompt(
  preferences: string,
  favoriteIngredients?: string[]
): string {
  const cleanPreferences = preferences.trim();
  let prompt = '';

  if (!cleanPreferences && (!favoriteIngredients || favoriteIngredients.length === 0)) {
    return "Generate a diverse set of recipes suitable for a typical week. Include a mix of vegetarian and meat dishes, quick meals and slower options, various cuisines.";
  }

  if (cleanPreferences) {
    prompt = `Generate recipes based on these preferences: ${cleanPreferences}`;
  } else {
    prompt = "Generate a diverse set of recipes suitable for a typical week.";
  }

  // Add favorite ingredients if provided
  if (favoriteIngredients && favoriteIngredients.length > 0) {
    prompt += `\n\nIMPORTANT: Try to incorporate these favorite ingredients: ${favoriteIngredients.join(', ')}. These are ingredients the household loves and wants to use regularly. Prioritize recipes that use one or more of these ingredients.`;
  }

  prompt += `\n\nPlease ensure the recipes match these preferences while maintaining variety in cooking time, ingredients, and preparation style.`;

  return prompt;
}

/**
 * Example of how to call an AI API (Claude, GPT, etc.)
 * This is a template - you'll need to implement based on your chosen provider
 */
export async function generateRecipesWithAI(
  preferences: string,
  favoriteIngredients?: string[]
): Promise<Recipe[]> {
  // Example using Claude API (you'll need to install @anthropic-ai/sdk)
  // const Anthropic = require('@anthropic-ai/sdk');
  // const anthropic = new Anthropic({
  //   apiKey: process.env.ANTHROPIC_API_KEY,
  // });

  const systemPrompt = RECIPE_GENERATION_SYSTEM_PROMPT;
  const userPrompt = buildUserPrompt(preferences, favoriteIngredients);

  // EXAMPLE - Replace with your actual AI API call
  // const message = await anthropic.messages.create({
  //   model: 'claude-3-5-sonnet-20241022',
  //   max_tokens: 4096,
  //   temperature: 0.7,
  //   system: systemPrompt,
  //   messages: [
  //     {
  //       role: 'user',
  //       content: userPrompt
  //     }
  //   ]
  // });

  // Parse the JSON response
  // const responseText = message.content[0].text;
  // const recipes = JSON.parse(responseText);

  // Validate that it matches our Recipe type
  // return recipes as Recipe[];

  throw new Error('AI integration not implemented yet. Implement generateRecipesWithAI() with your chosen AI provider.');
}

/**
 * Validates that the AI response matches our Recipe interface
 */
export function validateRecipes(data: any): data is Recipe[] {
  if (!Array.isArray(data)) {
    console.error('Validation failed: data is not an array');
    return false;
  }

  for (let i = 0; i < data.length; i++) {
    const recipe = data[i];

    if (typeof recipe.id !== 'string') {
      console.error(`Recipe ${i}: id is not a string`, recipe.id);
      return false;
    }
    if (typeof recipe.name !== 'string') {
      console.error(`Recipe ${i}: name is not a string`, recipe.name);
      return false;
    }
    if (typeof recipe.description !== 'string') {
      console.error(`Recipe ${i}: description is not a string`, recipe.description);
      return false;
    }
    if (typeof recipe.cookTimeMinutes !== 'number') {
      console.error(`Recipe ${i}: cookTimeMinutes is not a number`, recipe.cookTimeMinutes);
      return false;
    }
    if (typeof recipe.servings !== 'number') {
      console.error(`Recipe ${i}: servings is not a number`, recipe.servings);
      return false;
    }
    if (!Array.isArray(recipe.ingredients)) {
      console.error(`Recipe ${i}: ingredients is not an array`, recipe.ingredients);
      return false;
    }

    for (let j = 0; j < recipe.ingredients.length; j++) {
      const ing = recipe.ingredients[j];
      if (typeof ing.name !== 'string' || typeof ing.quantity !== 'number' || typeof ing.unit !== 'string') {
        console.error(`Recipe ${i}, ingredient ${j} invalid:`, JSON.stringify(ing));
        return false;
      }
    }

    if (!Array.isArray(recipe.instructions)) {
      console.error(`Recipe ${i}: instructions is not an array`, recipe.instructions);
      return false;
    }
    if (!recipe.instructions.every((step: any) => typeof step === 'string')) {
      console.error(`Recipe ${i}: instructions contains non-string`, recipe.instructions);
      return false;
    }
    if (!Array.isArray(recipe.tags)) {
      console.error(`Recipe ${i}: tags is not an array`, recipe.tags);
      return false;
    }
    if (!recipe.tags.every((tag: any) => typeof tag === 'string')) {
      console.error(`Recipe ${i}: tags contains non-string`, recipe.tags);
      return false;
    }
  }

  return true;
}

/**
 * Example prompts for testing
 */
export const EXAMPLE_PROMPTS = {
  vegetarian: "vegetarian meals, no meat or seafood",
  quick: "quick meals under 30 minutes, easy weeknight dinners",
  italian: "Italian cuisine, pasta dishes, Mediterranean flavors",
  healthy: "healthy, low-calorie meals with lots of vegetables",
  familyFriendly: "family-friendly meals, kid-approved, not too spicy",
  budget: "budget-friendly recipes, inexpensive ingredients, meal prep",
  asian: "Asian cuisine, Chinese, Thai, Japanese, Korean flavors",
  comfort: "comfort food, hearty meals, cozy dinners",
  ketoDiet: "keto diet, low-carb, high-fat, no grains or sugar",
  mealPrep: "meal prep friendly, recipes that reheat well, batch cooking",
  romantic: "romantic dinner for two, date night, elegant presentation",
  slowCooker: "slow cooker recipes, set it and forget it, 4-8 hours cook time"
};
