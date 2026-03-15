import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  food_logs: defineTable({
    user_id: v.string(),
    food_id: v.string(),
    food_source: v.union(
      v.literal("indian"),
      v.literal("usda"),
      v.literal("barcode"),
      v.literal("custom")
    ),
    name: v.string(),
    calories: v.number(),
    protein: v.number(),
    carbs: v.number(),
    fat: v.number(),
    fiber: v.number(),
    serving_size: v.number(),
    serving_unit: v.string(),
    meal_type: v.union(
      v.literal("breakfast"),
      v.literal("morning_snack"),
      v.literal("lunch"),
      v.literal("evening_snack"),
      v.literal("dinner")
    ),
    date: v.string(),
    logged_at: v.number(),
  })
    .index("by_user_and_date", ["user_id", "date"])
    .index("by_user_date_meal", ["user_id", "date", "meal_type"]),

  indian_foods: defineTable({
    code: v.string(),
    name: v.string(),
    name_aliases: v.array(v.string()),
    source: v.union(v.literal("ifct"), v.literal("manual")),
    category: v.string(),
    is_veg: v.boolean(),
    calories: v.number(),
    protein: v.number(),
    carbs: v.number(),
    fat: v.number(),
    fiber: v.number(),
    default_servings: v.array(
      v.object({
        label: v.string(),
        weight_grams: v.number(),
      })
    ),
  })
    .index("by_code", ["code"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["category", "is_veg"],
    }),

  user_profiles: defineTable({
    user_id: v.string(),
    name: v.string(),
    daily_calorie_goal: v.number(),
    daily_protein_goal: v.number(),
    daily_carb_goal: v.number(),
    daily_fat_goal: v.number(),
  }).index("by_user_id", ["user_id"]),
});
