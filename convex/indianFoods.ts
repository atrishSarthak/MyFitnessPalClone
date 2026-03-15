import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const insertIndianFood = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("indian_foods")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("indian_foods", args);
  },
});

export const searchIndianFoods = query({
  args: { searchQuery: v.string() },
  handler: async (ctx, args) => {
    if (!args.searchQuery || args.searchQuery.trim().length < 2) {
      return [];
    }

    const results = await ctx.db
      .query("indian_foods")
      .withSearchIndex("search_name", (q) =>
        q.search("name", args.searchQuery)
      )
      .take(15);

    return results;
  },
});

export const searchIndianFoodsByAlias = query({
  args: { searchQuery: v.string() },
  handler: async (ctx, args) => {
    if (!args.searchQuery || args.searchQuery.trim().length < 2) {
      return [];
    }

    const q = args.searchQuery.toLowerCase().trim();
    const all = await ctx.db.query("indian_foods").take(2000);

    return all
      .filter(
        (food) =>
          food.name.toLowerCase().includes(q) ||
          food.name_aliases.some((alias) => alias.includes(q)) ||
          food.category.toLowerCase().includes(q)
      )
      .slice(0, 15);
  },
});
