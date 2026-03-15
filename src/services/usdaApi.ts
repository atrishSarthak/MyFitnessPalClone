import axios from 'axios';

const USDA_API_KEY = process.env.EXPO_PUBLIC_USDA_API_KEY;
const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

export interface UnifiedFoodItem {
  id: string;
  name: string;
  brand?: string;
  category: string;
  source: 'indian' | 'usda';
  is_veg?: boolean;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  serving_size: number;
  serving_unit: string;
  serving_weight_grams: number;
  all_servings?: { label: string; weight_grams: number }[];
}

function transformUSDA(food: any): UnifiedFoodItem {
  const nutrients = food.foodNutrients || [];
  const get = (id: number) => {
    const n = nutrients.find((n: any) => n.nutrientId === id || n.nutrientNumber === String(id));
    return Math.round((n?.value || 0) * 10) / 10;
  };

  return {
    id: `usda_${food.fdcId}`,
    name: food.description || 'Unknown',
    brand: food.brandOwner || food.brandName || undefined,
    category: food.foodCategory || food.branded_food_category || 'General',
    source: 'usda',
    is_veg: undefined,
    calories: Math.round(get(1008)),
    protein: get(1003),
    carbs: get(1005),
    fat: get(1004),
    fiber: get(1079),
    serving_size: 1,
    serving_unit: '100g',
    serving_weight_grams: 100,
    all_servings: [
      { label: '100g', weight_grams: 100 },
      { label: '1 serving (150g)', weight_grams: 150 },
    ],
  };
}

export async function searchUSDA(query: string): Promise<UnifiedFoodItem[]> {
  if (!query || query.trim().length < 2) return [];

  if (!USDA_API_KEY) {
    console.warn('USDA API key not set');
    return [];
  }

  try {
    const response = await axios.get(`${BASE_URL}/foods/search`, {
      params: {
        query: query.trim(),
        api_key: USDA_API_KEY,
        dataType: 'Foundation,SR Legacy,Survey (FNDDS)',
        pageSize: 10,
      },
      timeout: 8000,
    });

    return (response.data.foods || []).map(transformUSDA);
  } catch (e) {
    console.error('USDA search error:', e);
    return [];
  }
}
