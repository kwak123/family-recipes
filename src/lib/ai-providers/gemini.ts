import { GoogleGenerativeAI } from '@google/generative-ai';
import { Recipe } from '../types';
import {
  RECIPE_GENERATION_SYSTEM_PROMPT,
  buildUserPrompt,
  validateRecipes
} from '../recipe-prompt';

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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
        maxOutputTokens: 16384, // Safe buffer for 9 detailed recipes
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
