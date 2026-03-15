import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { searchUSDA, UnifiedFoodItem } from '../services/usdaApi';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function transformConvexFood(food: any): UnifiedFoodItem {
  const defaultServing = food.default_servings?.[0] || {
    label: '100g',
    weight_grams: 100,
  };

  return {
    id: `indian_${food._id}`,
    name: food.name,
    category: food.category,
    source: 'indian',
    is_veg: food.is_veg,
    calories: food.calories,
    protein: food.protein,
    carbs: food.carbs,
    fat: food.fat,
    fiber: food.fiber,
    serving_size: 1,
    serving_unit: defaultServing.label,
    serving_weight_grams: defaultServing.weight_grams,
    all_servings: food.default_servings || [],
  };
}

export function useUnifiedSearch(query: string) {
  const debouncedQuery = useDebounce(query.trim(), 400);
  const [usdaResults, setUsdaResults] = useState<UnifiedFoodItem[]>([]);
  const [usdaLoading, setUsdaLoading] = useState(false);

  // Convex search (Indian foods) — reactive, instant
  const indianResultsRaw = useQuery(
    api.indianFoods.searchIndianFoods,
    debouncedQuery.length >= 2
      ? { searchQuery: debouncedQuery }
      : 'skip'
  );

  // Alias fallback if search index returns nothing
  const aliasResultsRaw = useQuery(
    api.indianFoods.searchIndianFoodsByAlias,
    debouncedQuery.length >= 2 && indianResultsRaw !== undefined &&
    indianResultsRaw.length === 0
      ? { searchQuery: debouncedQuery }
      : 'skip'
  );

  const indianResults: UnifiedFoodItem[] = (
    (indianResultsRaw && indianResultsRaw.length > 0
      ? indianResultsRaw
      : aliasResultsRaw) || []
  ).map(transformConvexFood);

  // USDA search (global foods) — fires after debounce
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setUsdaResults([]);
      return;
    }

    setUsdaLoading(true);
    searchUSDA(debouncedQuery)
      .then(setUsdaResults)
      .finally(() => setUsdaLoading(false));
  }, [debouncedQuery]);

  const isLoading =
    indianResultsRaw === undefined || usdaLoading;

  // Merge: Indian foods always first
  const allResults = [...indianResults, ...usdaResults];

  return {
    results: allResults,
    indianResults,
    usdaResults,
    isLoading,
    hasQuery: debouncedQuery.length >= 2,
  };
}
