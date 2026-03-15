import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const insertFoodLog = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("food_logs", {
      ...args,
      logged_at: Date.now(),
    });
  },
});

export const getFoodLogsForDate = query({
  args: {
    user_id: v.string(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("food_logs")
      .withIndex("by_user_and_date", (q) =>
        q.eq("user_id", args.user_id).eq("date", args.date)
      )
      .collect();
  },
});

export const deleteFoodLog = mutation({
  args: { id: v.id("food_logs") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const getTotalsForDate = query({
  args: {
    user_id: v.string(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("food_logs")
      .withIndex("by_user_and_date", (q) =>
        q.eq("user_id", args.user_id).eq("date", args.date)
      )
      .collect();

    return {
      calories: logs.reduce((sum, log) => sum + log.calories, 0),
      protein: logs.reduce((sum, log) => sum + log.protein, 0),
      carbs: logs.reduce((sum, log) => sum + log.carbs, 0),
      fat: logs.reduce((sum, log) => sum + log.fat, 0),
      count: logs.length,
    };
  },
});

export const getFoodLogsByMeal = query({
  args: {
    user_id: v.string(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("food_logs")
      .withIndex("by_user_and_date", (q) =>
        q.eq("user_id", args.user_id).eq("date", args.date)
      )
      .collect();

    const meals: Record<string, typeof logs> = {
      breakfast: [],
      morning_snack: [],
      lunch: [],
      evening_snack: [],
      dinner: [],
    };

    for (const log of logs) {
      if (meals[log.meal_type]) {
        meals[log.meal_type].push(log);
      }
    }

    return meals;
  },
});
