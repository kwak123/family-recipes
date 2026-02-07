import { Recipe, WeekPlan } from './types';
import { sampleRecipes } from './sample-recipes';

// In-memory data store
let weekPlan: WeekPlan = {
  id: 'default-week-plan',
  recipeIds: []
};

// Stub database functions
export function getGeneratedRecipes(preferences: string): Recipe[] {
  // For now, ignore preferences and return all sample recipes
  // Later, this could filter based on preferences
  return sampleRecipes;
}

export function getWeekPlan(): WeekPlan {
  return { ...weekPlan };
}

export function addToWeekPlan(recipeId: string): WeekPlan {
  // Check if recipe exists
  const recipe = getRecipeById(recipeId);
  if (!recipe) {
    throw new Error(`Recipe with id ${recipeId} not found`);
  }

  // Check if already in plan
  if (!weekPlan.recipeIds.includes(recipeId)) {
    weekPlan.recipeIds.push(recipeId);
  }

  return { ...weekPlan };
}

export function removeFromWeekPlan(recipeId: string): WeekPlan {
  weekPlan.recipeIds = weekPlan.recipeIds.filter(id => id !== recipeId);
  return { ...weekPlan };
}

export function getRecipeById(id: string): Recipe | undefined {
  return sampleRecipes.find(recipe => recipe.id === id);
}

export function getRecipesByIds(ids: string[]): Recipe[] {
  return ids
    .map(id => getRecipeById(id))
    .filter((recipe): recipe is Recipe => recipe !== undefined);
}
