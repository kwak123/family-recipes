import { GoogleGenerativeAI } from '@google/generative-ai';
import { Recipe, FittedIngredient } from '../types';
import {
  RECIPE_GENERATION_SYSTEM_PROMPT,
  MEAL_SIMPLIFY_SYSTEM_PROMPT,
  URL_IMPORT_SYSTEM_PROMPT,
  FIT_MEAL_PLAN_SYSTEM_PROMPT,
  buildUserPrompt,
  validateRecipes
} from '../recipe-prompt';

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Stream recipes from Google Gemini one at a time using NDJSON
 */
export async function* generateRecipesWithGeminiStream(
  preferences: string,
  favoriteIngredients?: string[],
  groceryIngredients?: string[],
  selectedTags?: string[],
  excludeIngredients?: string[]
): AsyncGenerator<Recipe> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.1-flash-lite-preview',
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
    },
  });

  const fullPrompt = `${RECIPE_GENERATION_SYSTEM_PROMPT}

${buildUserPrompt(preferences, favoriteIngredients, groceryIngredients, selectedTags, excludeIngredients)}

Remember: Return ONLY NDJSON — one complete JSON object per line, no array wrapper, no markdown.`;

  const result = await model.generateContentStream(fullPrompt);
  let buffer = '';

  for await (const chunk of result.stream) {
    buffer += chunk.text();
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const recipe = JSON.parse(trimmed);
        if (validateRecipes([recipe])) {
          yield recipe as Recipe;
        }
      } catch {
        // incomplete or non-JSON line — skip
      }
    }
  }

  // flush remaining buffer
  const trimmed = buffer.trim();
  if (trimmed) {
    try {
      const recipe = JSON.parse(trimmed);
      if (validateRecipes([recipe])) {
        yield recipe as Recipe;
      }
    } catch {
      console.error('Could not parse final buffer:', buffer);
    }
  }
}

/**
 * Simplify a list of meal plan recipes using Gemini to reduce total unique ingredients
 */
export async function simplifyMealPlanWithGemini(recipes: Recipe[], excludedIngredients?: string[]): Promise<Recipe[]> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.1-flash-lite-preview',
    generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
  });

  const recipeNdjson = recipes
    .map(r => JSON.stringify({
      id: r.id,
      name: r.name,
      description: r.description,
      cookTimeMinutes: r.cookTimeMinutes,
      servings: r.servings,
      ingredients: r.ingredients,
      instructions: r.instructions,
      tags: r.tags,
    }))
    .join('\n');

  const excludedSection = excludedIngredients && excludedIngredients.length > 0
    ? `\n\nEXCLUDED INGREDIENTS: Do NOT use any of these ingredients in any recipe — find alternatives: ${excludedIngredients.join(', ')}\n`
    : '';

  const fullPrompt = `${MEAL_SIMPLIFY_SYSTEM_PROMPT}${excludedSection}

Input recipes (NDJSON):
${recipeNdjson}

Remember: Return ONLY NDJSON — one simplified recipe per line, same order as input, no array wrapper, no markdown.`;

  const result = await model.generateContent(fullPrompt);
  const responseText = result.response.text().trim();

  const simplified: Recipe[] = [];
  for (const line of responseText.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const recipe = JSON.parse(trimmed);
      if (validateRecipes([recipe])) {
        simplified.push(recipe as Recipe);
      }
    } catch {
      // skip unparseable lines
    }
  }
  return simplified;
}

/**
 * Parse a recipe from webpage text using Gemini
 */
export async function parseRecipeFromUrl(pageText: string): Promise<Recipe | null> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.1-flash-lite-preview',
    generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
  });

  const fullPrompt = `${URL_IMPORT_SYSTEM_PROMPT}

Webpage text:
${pageText}

Remember: Return ONLY a single JSON object, no markdown, no array wrapper.`;

  const result = await model.generateContent(fullPrompt);
  let responseText = result.response.text().trim();

  // Strip markdown code blocks if present
  if (responseText.startsWith('```json')) {
    responseText = responseText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
  } else if (responseText.startsWith('```')) {
    responseText = responseText.replace(/^```\n?/, '').replace(/\n?```$/, '');
  }

  try {
    const recipe = JSON.parse(responseText);
    if (validateRecipes([recipe])) {
      return recipe as Recipe;
    }
    console.error('parseRecipeFromUrl: invalid recipe structure', recipe);
    return null;
  } catch {
    console.error('parseRecipeFromUrl: failed to parse JSON', responseText.slice(0, 200));
    return null;
  }
}

/**
 * Fit an imported recipe's ingredients to the existing meal plan
 */
export async function fitRecipeToMealPlan(recipe: Recipe, mealPlanRecipes: Recipe[]): Promise<FittedIngredient[]> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.1-flash-lite-preview',
    generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
  });

  const mealPlanIngredients = mealPlanRecipes
    .flatMap(r => r.ingredients.map(i => i.name))
    .filter((name, idx, arr) => arr.indexOf(name) === idx);

  const fullPrompt = `${FIT_MEAL_PLAN_SYSTEM_PROMPT}

Imported recipe ingredients:
${JSON.stringify(recipe.ingredients, null, 2)}

Existing meal plan ingredients (already in grocery list):
${mealPlanIngredients.join(', ')}

Remember: Return ONLY a JSON array, one entry per ingredient in the imported recipe.`;

  const result = await model.generateContent(fullPrompt);
  let responseText = result.response.text().trim();

  if (responseText.startsWith('```json')) {
    responseText = responseText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
  } else if (responseText.startsWith('```')) {
    responseText = responseText.replace(/^```\n?/, '').replace(/\n?```$/, '');
  }

  try {
    const parsed = JSON.parse(responseText);
    if (Array.isArray(parsed)) {
      return parsed as FittedIngredient[];
    }
    return [];
  } catch {
    console.error('fitRecipeToMealPlan: failed to parse JSON', responseText.slice(0, 200));
    return [];
  }
}

/**
 * Generate recipes using Google Gemini
 */
export async function generateRecipesWithGemini(
  preferences: string,
  favoriteIngredients?: string[]
): Promise<Recipe[]> {
  try {
    // Use Gemini 3 Flash Preview for fast, high-quality results
    const model = genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192, // Safe buffer for 6 detailed recipes
      },
    });

    // Combine system prompt and user prompt
    const fullPrompt = `${RECIPE_GENERATION_SYSTEM_PROMPT}

${buildUserPrompt(preferences, favoriteIngredients)}

Remember: Return ONLY the JSON array, no markdown code blocks, no explanations.`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    let responseText = response.text();

    // Clean up response - remove markdown code blocks if present
    responseText = responseText.trim();
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (responseText.startsWith('```')) {
      responseText = responseText.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    // Log the raw response for debugging
    console.log('Raw Gemini response length:', responseText.length);
    console.log('First 500 chars:', responseText.substring(0, 500));
    console.log('Last 500 chars:', responseText.substring(Math.max(0, responseText.length - 500)));

    // Parse the JSON
    const recipes = JSON.parse(responseText);

    // Validate the structure
    if (!validateRecipes(recipes)) {
      console.error('Invalid recipe format from Gemini:', recipes);
      throw new Error('AI returned invalid recipe format');
    }

    return recipes;
  } catch (error) {
    console.error('Gemini API error:', error);

    // Provide more specific error messages
    if (error instanceof SyntaxError) {
      throw new Error('AI returned invalid JSON format');
    }

    if (error instanceof Error) {
      throw new Error(`Recipe generation failed: ${error.message}`);
    }

    throw new Error('Failed to generate recipes with Gemini');
  }
}
