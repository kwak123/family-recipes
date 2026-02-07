import { Recipe, GroceryItem } from '@/lib/types';

export function aggregateIngredients(recipes: Recipe[]): GroceryItem[] {
  const ingredientMap = new Map<string, GroceryItem>();

  for (const recipe of recipes) {
    for (const ingredient of recipe.ingredients) {
      // Normalize the ingredient name (lowercase, trim whitespace)
      const normalizedName = ingredient.name.toLowerCase().trim();
      const key = `${normalizedName}-${ingredient.unit}`;

      if (ingredientMap.has(key)) {
        // Add to existing quantity
        const existing = ingredientMap.get(key)!;
        existing.totalQuantity += ingredient.quantity;
      } else {
        // Create new grocery item
        ingredientMap.set(key, {
          name: ingredient.name,
          totalQuantity: ingredient.quantity,
          unit: ingredient.unit
        });
      }
    }
  }

  // Convert map to array and sort alphabetically by name
  return Array.from(ingredientMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}
