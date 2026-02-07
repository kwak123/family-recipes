export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  cookTimeMinutes: number;
  servings: number;
  ingredients: Ingredient[];
  instructions: string[];
  tags: string[];
}

export interface WeekPlan {
  id: string;
  recipeIds: string[];
}

export interface GroceryItem {
  name: string;
  totalQuantity: number;
  unit: string;
}
