import axios from 'axios';
import { UnifiedFoodItem } from './usdaApi';

export async function searchByBarcode(
  barcode: string
): Promise<UnifiedFoodItem | null> {
  try {
    const response = await axios.get(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
      { timeout: 8000 }
    );

    const product = response.data?.product;
    if (!product) return null;

    const n = product.nutriments || {};

    const calories = Math.round(
      n['energy-kcal_100g'] ||
        n['energy-kcal'] ||
        (n['energy_100g'] || 0) / 4.184 ||
        0
    );

    const protein =
      Math.round((n['proteins_100g'] || n['proteins'] || 0) * 10) / 10;
    const carbs =
      Math.round((n['carbohydrates_100g'] || n['carbohydrates'] || 0) * 10) /
      10;
    const fat = Math.round((n['fat_100g'] || n['fat'] || 0) * 10) / 10;
    const fiber = Math.round((n['fiber_100g'] || n['fiber'] || 0) * 10) / 10;

    const name =
      product.product_name ||
      product.product_name_en ||
      product.generic_name ||
      'Unknown Product';

    const brand = product.brands || product.brand_owner || undefined;

    return {
      id: `barcode_${barcode}`,
      name: name.trim(),
      brand: brand?.trim(),
      category: product.category_tags?.[0] || 'Packaged Food',
      source: 'usda',
      is_veg: undefined,
      calories,
      protein,
      carbs,
      fat,
      fiber,
      serving_size: 1,
      serving_unit: '100g',
      serving_weight_grams: 100,
      all_servings: [
        { label: '100g', weight_grams: 100 },
        { label: '1 serving (30g)', weight_grams: 30 },
        { label: '1 pack (200g)', weight_grams: 200 },
      ],
    };
  } catch (e) {
    console.error('Open Food Facts error:', e);
    return null;
  }
}
