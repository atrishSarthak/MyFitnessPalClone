import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import * as fs from "fs";
import * as path from "path";

// Load .env manually
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex > 0) {
      const key = trimmed.slice(0, eqIndex).trim();
      const val = trimmed.slice(eqIndex + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

// Also try .env.local
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const lines = fs.readFileSync(envLocalPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex > 0) {
      const key = trimmed.slice(0, eqIndex).trim();
      const val = trimmed.slice(eqIndex + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL;
if (!CONVEX_URL) {
  console.error("❌ EXPO_PUBLIC_CONVEX_URL not found in .env");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

// ─── Serving sizes by food type ───────────────────────────
function getDefaultServings(name: string, category: string) {
  const n = name.toLowerCase();
  const c = category.toLowerCase();

  if (n.includes("roti") || n.includes("chapati") || n.includes("phulka")) {
    return [
      { label: "1 small roti (25g)", weight_grams: 25 },
      { label: "1 medium roti (35g)", weight_grams: 35 },
      { label: "1 large roti (50g)", weight_grams: 50 },
      { label: "100g", weight_grams: 100 },
    ];
  }

  if (n.includes("paratha")) {
    return [
      { label: "1 paratha (60g)", weight_grams: 60 },
      { label: "1 large paratha (90g)", weight_grams: 90 },
      { label: "100g", weight_grams: 100 },
    ];
  }

  if (n.includes("rice") || n.includes("chawal")) {
    return [
      { label: "1 katori cooked (100g)", weight_grams: 100 },
      { label: "1 plate (200g)", weight_grams: 200 },
      { label: "100g", weight_grams: 100 },
    ];
  }

  if (c.includes("pulse") || n.includes("dal") || n.includes("daal")) {
    return [
      { label: "1 katori (125g)", weight_grams: 125 },
      { label: "1 bowl (200g)", weight_grams: 200 },
      { label: "100g", weight_grams: 100 },
    ];
  }

  if (c.includes("milk") || c.includes("dairy") || n.includes("doodh") || n.includes("dahi")) {
    return [
      { label: "1 glass (200ml)", weight_grams: 200 },
      { label: "1 katori (125ml)", weight_grams: 125 },
      { label: "100g", weight_grams: 100 },
    ];
  }

  if (c.includes("vegetable") || c.includes("sabzi")) {
    return [
      { label: "1 katori sabzi (110g)", weight_grams: 110 },
      { label: "1 bowl (200g)", weight_grams: 200 },
      { label: "100g", weight_grams: 100 },
    ];
  }

  if (c.includes("fruit")) {
    return [
      { label: "1 medium piece (100g)", weight_grams: 100 },
      { label: "1 large piece (150g)", weight_grams: 150 },
      { label: "100g", weight_grams: 100 },
    ];
  }

  return [
    { label: "1 serving (100g)", weight_grams: 100 },
    { label: "1 katori (125g)", weight_grams: 125 },
  ];
}

// ─── Veg detection ────────────────────────────────────────
function isVeg(name: string, category: string): boolean {
  const nonVeg = [
    "chicken",
    "mutton",
    "beef",
    "pork",
    "fish",
    "prawn",
    "crab",
    "egg",
    "meat",
    "lamb",
    "goat",
    "murgh",
    "gosht",
    "keema",
    "tuna",
    "salmon",
    "sardine",
    "anchovy",
    "squid",
    "shrimp",
  ];

  const n = name.toLowerCase();
  const c = category.toLowerCase();

  return !nonVeg.some((k) => n.includes(k) || c.includes(k));
}

// ─── Build search aliases ─────────────────────────────────
function buildAliases(name: string): string[] {
  const aliases: string[] = [name.toLowerCase()];

  const map: Record<string, string[]> = {
    "potato":       ["aloo","alu","aaloo"],
    "tomato":       ["tamatar","tamater"],
    "onion":        ["pyaz","pyaaz","kanda"],
    "rice":         ["chawal","bhaat"],
    "wheat":        ["gehun","atta"],
    "milk":         ["doodh","dudh"],
    "curd":         ["dahi","yogurt","dahee"],
    "butter":       ["makhan"],
    "spinach":      ["palak","saag"],
    "lentil":       ["dal","daal","dhal"],
    "chickpea":     ["chana","chole","kabuli chana"],
    "chicken":      ["murgh","murg"],
    "mutton":       ["gosht","lamb"],
    "egg":          ["anda","anday"],
    "banana":       ["kela"],
    "mango":        ["aam"],
    "apple":        ["seb"],
    "orange":       ["santra","narangi"],
    "cauliflower":  ["gobi","phool gobi"],
    "eggplant":     ["baingan","brinjal"],
    "okra":         ["bhindi","lady finger"],
    "tea":          ["chai","chay"],
    "garlic":       ["lahsun"],
    "ginger":       ["adrak"],
    "peas":         ["matar","mattar"],
    "carrot":       ["gajar"],
    "radish":       ["mooli"],
    "bitter gourd": ["karela"],
    "bottle gourd": ["lauki","doodhi","ghia"],
    "fenugreek":    ["methi"],
    "paneer":       ["cottage cheese"],
    "roti":         ["chapati","chapatti","phulka"],
    "sugar":        ["cheeni","shakkar"],
  };

  const lower = name.toLowerCase();
  for (const [eng, indian] of Object.entries(map)) {
    if (lower.includes(eng)) aliases.push(...indian);
    if (indian.some((a) => lower.includes(a))) {
      aliases.push(eng, ...indian);
    }
  }

  return [...new Set(aliases)];
}

// ─── Manual cooked dishes ─────────────────────────────────
const manualDishes = [
  { code:"M001", name:"Dal Tadka", category:"Cooked Dish", is_veg:true, calories:116, protein:6.2, carbs:16.1, fat:3.4, fiber:3.8 },
  { code:"M002", name:"Rajma", category:"Cooked Dish", is_veg:true, calories:144, protein:8.7, carbs:21.5, fat:2.9, fiber:6.4 },
  { code:"M003", name:"Chole", category:"Cooked Dish", is_veg:true, calories:164, protein:8.9, carbs:22.5, fat:4.3, fiber:5.2 },
  { code:"M004", name:"Palak Paneer", category:"Cooked Dish", is_veg:true, calories:173, protein:7.8, carbs:8.4, fat:12.6, fiber:2.1 },
  { code:"M005", name:"Paneer Butter Masala", category:"Cooked Dish", is_veg:true, calories:198, protein:8.1, carbs:10.2, fat:14.8, fiber:1.8 },
  { code:"M006", name:"Aloo Sabzi", category:"Cooked Dish", is_veg:true, calories:98, protein:2.1, carbs:15.6, fat:3.4, fiber:2.2 },
  { code:"M007", name:"Veg Biryani", category:"Cooked Dish", is_veg:true, calories:186, protein:4.2, carbs:32.4, fat:5.1, fiber:2.8 },
  { code:"M008", name:"Chicken Biryani", category:"Cooked Dish", is_veg:false, calories:198, protein:11.2, carbs:22.6, fat:6.8, fiber:1.2 },
  { code:"M009", name:"Dal Makhani", category:"Cooked Dish", is_veg:true, calories:154, protein:7.8, carbs:18.2, fat:5.6, fiber:4.2 },
  { code:"M010", name:"Shahi Paneer", category:"Cooked Dish", is_veg:true, calories:210, protein:8.4, carbs:12.4, fat:15.2, fiber:1.4 },
  { code:"M011", name:"Matar Paneer", category:"Cooked Dish", is_veg:true, calories:168, protein:8.2, carbs:12.8, fat:10.4, fiber:3.2 },
  { code:"M012", name:"Kadai Paneer", category:"Cooked Dish", is_veg:true, calories:188, protein:8.6, carbs:9.6, fat:13.8, fiber:2.4 },
  { code:"M013", name:"Plain Dosa", category:"South Indian", is_veg:true, calories:133, protein:3.8, carbs:25.2, fat:2.4, fiber:1.2 },
  { code:"M014", name:"Masala Dosa", category:"South Indian", is_veg:true, calories:168, protein:4.6, carbs:28.4, fat:4.8, fiber:2.2 },
  { code:"M015", name:"Idli", category:"South Indian", is_veg:true, calories:39, protein:2.0, carbs:7.8, fat:0.4, fiber:0.6 },
  { code:"M016", name:"Sambar", category:"South Indian", is_veg:true, calories:52, protein:3.1, carbs:7.2, fat:1.4, fiber:2.8 },
  { code:"M017", name:"Coconut Chutney", category:"South Indian", is_veg:true, calories:182, protein:1.8, carbs:7.2, fat:16.4, fiber:3.2 },
  { code:"M018", name:"Upma", category:"South Indian", is_veg:true, calories:160, protein:4.2, carbs:25.6, fat:5.2, fiber:1.8 },
  { code:"M019", name:"Uttapam", category:"South Indian", is_veg:true, calories:118, protein:3.6, carbs:20.4, fat:2.8, fiber:1.4 },
  { code:"M020", name:"Vada", category:"South Indian", is_veg:true, calories:196, protein:6.2, carbs:22.4, fat:9.2, fiber:2.6 },
  { code:"M021", name:"Roti", category:"Breads", is_veg:true, calories:264, protein:7.8, carbs:49.4, fat:2.6, fiber:4.8 },
  { code:"M022", name:"Paratha", category:"Breads", is_veg:true, calories:297, protein:6.4, carbs:41.0, fat:12.4, fiber:3.6 },
  { code:"M023", name:"Aloo Paratha", category:"Breads", is_veg:true, calories:213, protein:4.6, carbs:30.6, fat:8.2, fiber:2.8 },
  { code:"M024", name:"Puri", category:"Breads", is_veg:true, calories:360, protein:7.0, carbs:47.4, fat:16.6, fiber:2.2 },
  { code:"M025", name:"Naan", category:"Breads", is_veg:true, calories:299, protein:9.6, carbs:54.6, fat:5.0, fiber:2.4 },
  { code:"M026", name:"Bhatura", category:"Breads", is_veg:true, calories:346, protein:8.0, carbs:45.2, fat:15.0, fiber:2.2 },
  { code:"M027", name:"Poha", category:"Breakfast", is_veg:true, calories:132, protein:2.8, carbs:24.6, fat:3.2, fiber:1.6 },
  { code:"M028", name:"Khichdi", category:"Breakfast", is_veg:true, calories:124, protein:5.2, carbs:21.6, fat:2.4, fiber:2.8 },
  { code:"M029", name:"Samosa", category:"Street Food", is_veg:true, calories:272, protein:5.6, carbs:36.4, fat:12.4, fiber:2.4 },
  { code:"M030", name:"Vada Pav", category:"Street Food", is_veg:true, calories:286, protein:7.2, carbs:42.4, fat:9.8, fiber:3.2 },
  { code:"M031", name:"Pav Bhaji", category:"Street Food", is_veg:true, calories:198, protein:5.4, carbs:28.6, fat:7.2, fiber:3.8 },
  { code:"M032", name:"Pani Puri", category:"Street Food", is_veg:true, calories:32, protein:0.8, carbs:5.6, fat:0.9, fiber:0.4 },
  { code:"M033", name:"Bhel Puri", category:"Street Food", is_veg:true, calories:146, protein:3.8, carbs:24.6, fat:4.2, fiber:2.6 },
  { code:"M034", name:"Plain Rice", category:"Rice", is_veg:true, calories:130, protein:2.7, carbs:28.1, fat:0.3, fiber:0.4 },
  { code:"M035", name:"Pulao", category:"Rice", is_veg:true, calories:156, protein:3.8, carbs:28.4, fat:4.2, fiber:1.8 },
  { code:"M036", name:"Curd Rice", category:"Rice", is_veg:true, calories:134, protein:4.2, carbs:22.8, fat:3.2, fiber:0.6 },
  { code:"M037", name:"Chai", category:"Drinks", is_veg:true, calories:44, protein:1.4, carbs:6.2, fat:1.6, fiber:0.0 },
  { code:"M038", name:"Lassi", category:"Drinks", is_veg:true, calories:98, protein:3.6, carbs:12.4, fat:3.8, fiber:0.0 },
  { code:"M039", name:"Buttermilk", category:"Drinks", is_veg:true, calories:40, protein:3.3, carbs:4.7, fat:0.9, fiber:0.0 },
  { code:"M040", name:"Gulab Jamun", category:"Sweets", is_veg:true, calories:382, protein:5.6, carbs:58.4, fat:14.2, fiber:0.6 },
  { code:"M041", name:"Halwa", category:"Sweets", is_veg:true, calories:316, protein:4.2, carbs:42.6, fat:14.8, fiber:1.4 },
  { code:"M042", name:"Kheer", category:"Sweets", is_veg:true, calories:178, protein:4.8, carbs:28.4, fat:5.2, fiber:0.2 },
  { code:"M043", name:"Aloo Gobi", category:"Cooked Dish", is_veg:true, calories:112, protein:3.2, carbs:16.8, fat:4.2, fiber:3.4 },
  { code:"M044", name:"Baingan Bharta", category:"Cooked Dish", is_veg:true, calories:88, protein:2.4, carbs:10.2, fat:4.6, fiber:4.8 },
  { code:"M045", name:"Bhindi Masala", category:"Cooked Dish", is_veg:true, calories:94, protein:2.8, carbs:10.6, fat:4.8, fiber:3.6 },
  { code:"M046", name:"Egg Curry", category:"Cooked Dish", is_veg:false, calories:168, protein:10.4, carbs:6.2, fat:11.2, fiber:1.2 },
  { code:"M047", name:"Chicken Curry", category:"Cooked Dish", is_veg:false, calories:186, protein:18.6, carbs:4.8, fat:10.4, fiber:0.8 },
  { code:"M048", name:"Fish Curry", category:"Cooked Dish", is_veg:false, calories:162, protein:16.8, carbs:5.4, fat:8.6, fiber:1.4 },
  { code:"M049", name:"Mutton Curry", category:"Cooked Dish", is_veg:false, calories:218, protein:20.4, carbs:4.2, fat:13.6, fiber:0.6 },
  { code:"M050", name:"Tandoori Chicken", category:"Cooked Dish", is_veg:false, calories:176, protein:22.4, carbs:4.6, fat:7.8, fiber:0.4 },
  { code:"M051", name:"Paneer", category:"Dairy", is_veg:true, calories:265, protein:18.3, carbs:1.2, fat:20.8, fiber:0.0 },
  { code:"M052", name:"Dahi", category:"Dairy", is_veg:true, calories:98, protein:11.0, carbs:3.4, fat:4.3, fiber:0.0 },
  { code:"M053", name:"Chaas", category:"Drinks", is_veg:true, calories:40, protein:3.3, carbs:4.7, fat:0.9, fiber:0.0 },
  { code:"M054", name:"Aloo Curry", category:"Cooked Dish", is_veg:true, calories:102, protein:2.2, carbs:16.8, fat:3.6, fiber:2.4 },
  { code:"M055", name:"Kadhi", category:"Cooked Dish", is_veg:true, calories:88, protein:2.8, carbs:8.6, fat:5.2, fiber:0.8 },
  { code:"M056", name:"Kadhi Pakora", category:"Cooked Dish", is_veg:true, calories:124, protein:4.2, carbs:12.4, fat:6.8, fiber:1.2 },
  { code:"M057", name:"Chana Dal", category:"Cooked Dish", is_veg:true, calories:164, protein:10.2, carbs:22.4, fat:3.2, fiber:7.6 },
  { code:"M058", name:"Moong Dal", category:"Cooked Dish", is_veg:true, calories:104, protein:7.6, carbs:14.2, fat:1.8, fiber:4.2 },
  { code:"M059", name:"Masoor Dal", category:"Cooked Dish", is_veg:true, calories:116, protein:8.4, carbs:15.6, fat:2.2, fiber:5.8 },
  { code:"M060", name:"Toor Dal", category:"Cooked Dish", is_veg:true, calories:118, protein:7.2, carbs:16.8, fat:2.6, fiber:4.4 },
  { code:"M061", name:"Urad Dal", category:"Cooked Dish", is_veg:true, calories:122, protein:8.6, carbs:14.8, fat:3.2, fiber:5.2 },
  { code:"M062", name:"Aloo Roti", category:"Breads", is_veg:true, calories:148, protein:3.8, carbs:24.6, fat:4.2, fiber:2.8 },
  { code:"M063", name:"Missi Roti", category:"Breads", is_veg:true, calories:186, protein:7.4, carbs:28.2, fat:4.8, fiber:4.6 },
  { code:"M064", name:"Makki Roti", category:"Breads", is_veg:true, calories:192, protein:4.2, carbs:32.6, fat:5.4, fiber:3.8 },
  { code:"M065", name:"Sarson Ka Saag", category:"Cooked Dish", is_veg:true, calories:94, protein:3.8, carbs:8.4, fat:5.2, fiber:4.2 },
  { code:"M066", name:"Methi Thepla", category:"Breads", is_veg:true, calories:168, protein:5.2, carbs:24.8, fat:6.4, fiber:3.2 },
  { code:"M067", name:"Dhokla", category:"Snacks", is_veg:true, calories:160, protein:6.4, carbs:24.2, fat:4.2, fiber:1.8 },
  { code:"M068", name:"Khandvi", category:"Snacks", is_veg:true, calories:142, protein:6.8, carbs:16.4, fat:5.6, fiber:1.2 },
  { code:"M069", name:"Poha Chivda", category:"Snacks", is_veg:true, calories:386, protein:8.4, carbs:56.2, fat:14.8, fiber:3.2 },
  { code:"M070", name:"Mathri", category:"Snacks", is_veg:true, calories:468, protein:8.2, carbs:52.4, fat:24.6, fiber:2.4 },
  { code:"M071", name:"Namkeen", category:"Snacks", is_veg:true, calories:524, protein:10.2, carbs:48.6, fat:32.4, fiber:3.6 },
  { code:"M072", name:"Bread Pakora", category:"Snacks", is_veg:true, calories:248, protein:6.8, carbs:28.4, fat:12.6, fiber:2.2 },
  { code:"M073", name:"Onion Pakora", category:"Snacks", is_veg:true, calories:224, protein:5.2, carbs:22.8, fat:13.2, fiber:2.8 },
  { code:"M074", name:"Palak Pakora", category:"Snacks", is_veg:true, calories:198, protein:5.6, carbs:18.6, fat:12.4, fiber:3.4 },
  { code:"M075", name:"Aloo Tikki", category:"Street Food", is_veg:true, calories:196, protein:4.2, carbs:28.4, fat:7.8, fiber:2.6 },
  { code:"M076", name:"Dahi Puri", category:"Street Food", is_veg:true, calories:186, protein:4.8, carbs:28.6, fat:6.4, fiber:1.8 },
  { code:"M077", name:"Sev Puri", category:"Street Food", is_veg:true, calories:224, protein:5.4, carbs:32.8, fat:8.6, fiber:2.4 },
  { code:"M078", name:"Dahi Vada", category:"Street Food", is_veg:true, calories:188, protein:8.4, carbs:22.6, fat:7.2, fiber:2.8 },
  { code:"M079", name:"Chole Bhature", category:"Street Food", is_veg:true, calories:458, protein:14.2, carbs:62.4, fat:18.6, fiber:8.2 },
  { code:"M080", name:"Puri Bhaji", category:"Street Food", is_veg:true, calories:364, protein:7.6, carbs:50.8, fat:14.8, fiber:4.2 },
  { code:"M081", name:"Egg Bhurji", category:"Cooked Dish", is_veg:false, calories:196, protein:12.4, carbs:4.2, fat:14.8, fiber:0.8 },
  { code:"M082", name:"Boiled Egg", category:"Cooked Dish", is_veg:false, calories:155, protein:13.0, carbs:1.1, fat:11.0, fiber:0.0 },
  { code:"M083", name:"Omelette", category:"Cooked Dish", is_veg:false, calories:184, protein:11.6, carbs:2.4, fat:14.2, fiber:0.4 },
  { code:"M084", name:"Chicken Tikka", category:"Cooked Dish", is_veg:false, calories:162, protein:20.8, carbs:3.6, fat:7.2, fiber:0.4 },
  { code:"M085", name:"Butter Chicken", category:"Cooked Dish", is_veg:false, calories:218, protein:18.6, carbs:8.4, fat:12.8, fiber:1.2 },
  { code:"M086", name:"Dal Rice", category:"Cooked Dish", is_veg:true, calories:244, protein:9.8, carbs:44.2, fat:3.2, fiber:4.8 },
  { code:"M087", name:"Roti Sabzi", category:"Cooked Dish", is_veg:true, calories:186, protein:5.4, carbs:32.8, fat:4.8, fiber:4.2 },
  { code:"M088", name:"Bread", category:"Breads", is_veg:true, calories:265, protein:9.0, carbs:49.0, fat:3.2, fiber:2.7 },
  { code:"M089", name:"Banana", category:"Fruits", is_veg:true, calories:89, protein:1.1, carbs:22.8, fat:0.3, fiber:2.6 },
  { code:"M090", name:"Apple", category:"Fruits", is_veg:true, calories:52, protein:0.3, carbs:13.8, fat:0.2, fiber:2.4 },
  { code:"M091", name:"Mango", category:"Fruits", is_veg:true, calories:60, protein:0.8, carbs:15.0, fat:0.4, fiber:1.6 },
  { code:"M092", name:"Papaya", category:"Fruits", is_veg:true, calories:43, protein:0.5, carbs:10.8, fat:0.3, fiber:1.8 },
  { code:"M093", name:"Watermelon", category:"Fruits", is_veg:true, calories:30, protein:0.6, carbs:7.6, fat:0.2, fiber:0.4 },
  { code:"M094", name:"Grapes", category:"Fruits", is_veg:true, calories:67, protein:0.6, carbs:17.2, fat:0.4, fiber:0.9 },
  { code:"M095", name:"Amul Butter", category:"Dairy", is_veg:true, calories:717, protein:0.9, carbs:0.1, fat:81.1, fiber:0.0 },
  { code:"M096", name:"Ghee", category:"Dairy", is_veg:true, calories:900, protein:0.0, carbs:0.0, fat:99.7, fiber:0.0 },
  { code:"M097", name:"Whole Milk", category:"Dairy", is_veg:true, calories:61, protein:3.2, carbs:4.8, fat:3.4, fiber:0.0 },
  { code:"M098", name:"Coconut Chutney", category:"South Indian", is_veg:true, calories:182, protein:1.8, carbs:7.2, fat:16.4, fiber:3.2 },
  { code:"M099", name:"Tomato Chutney", category:"Condiments", is_veg:true, calories:62, protein:1.4, carbs:10.8, fat:1.8, fiber:2.2 },
  { code:"M100", name:"Green Chutney", category:"Condiments", is_veg:true, calories:48, protein:2.2, carbs:6.4, fat:1.6, fiber:2.8 },
];

async function seed() {
  console.log("🌱 Starting Indian food database seed...");

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  // ── Seed manual dishes ──────────────────────────────────
  console.log(`\n📝 Seeding ${manualDishes.length} manual dishes...`);

  for (const dish of manualDishes) {
    try {
      await client.mutation(api.indianFoods.insertIndianFood, {
        code: dish.code,
        name: dish.name,
        name_aliases: buildAliases(dish.name),
        source: "manual" as const,
        category: dish.category,
        is_veg: dish.is_veg,
        calories: dish.calories,
        protein: dish.protein,
        carbs: dish.carbs,
        fat: dish.fat,
        fiber: dish.fiber,
        default_servings: getDefaultServings(dish.name, dish.category),
      });
      successCount++;
      process.stdout.write(".");
    } catch (e: any) {
      if (e?.message?.includes("already exists") || e?.message?.includes("duplicate")) {
        skipCount++;
      } else {
        errorCount++;
        console.error(`\n❌ ${dish.name}:`, e?.message);
      }
    }
  }

  // ── Seed IFCT 2017 data ─────────────────────────────────
  console.log(`\n\n📊 Loading IFCT 2017 dataset...`);

  try {
    const ifct = await import("ifct2017");

    // Try calling codes with no args, empty object, and check what it returns
    console.log("Trying codes()...");
    let allCodes = (ifct as any).codes();
    console.log(`codes() returned: ${typeof allCodes}, length: ${allCodes?.length || 0}`);
    
    // Try with empty object
    if (!allCodes || allCodes.length === 0) {
      console.log("Trying codes({})...");
      allCodes = (ifct as any).codes({});
      console.log(`codes({}) returned: ${typeof allCodes}, length: ${allCodes?.length || 0}`);
    }

    // Get all descriptions to see structure
    console.log("Trying descriptions()...");
    let allDescriptions = (ifct as any).descriptions();
    console.log(`descriptions() returned: ${typeof allDescriptions}, length: ${allDescriptions?.length || 0}`);
    
    if (!allDescriptions || allDescriptions.length === 0) {
      console.log("Trying descriptions({})...");
      allDescriptions = (ifct as any).descriptions({});
      console.log(`descriptions({}) returned: ${typeof allDescriptions}, length: ${allDescriptions?.length || 0}`);
    }

    if (allCodes && allCodes.length > 0) {
      console.log(`Found ${allCodes.length} IFCT food codes`);
      console.log("Sample code entry:", JSON.stringify(allCodes[0]));
    }

    if (allDescriptions && allDescriptions.length > 0) {
      console.log("Sample description entry:", JSON.stringify(allDescriptions[0]));
    }

    if (!allCodes || allCodes.length === 0) {
      console.log("\n⚠️ No codes found. Checking available methods...");
      console.log("Available IFCT methods:", Object.keys(ifct));
      return;
    }

    // Build a code→name map
    const nameMap: Record<string, string> = {};
    for (const desc of allDescriptions) {
      const code = desc.code || desc.c || Object.values(desc)[0];
      const name = desc.name || desc.n || desc.description || Object.values(desc)[1];
      if (code && name) nameMap[String(code)] = String(name);
    }

    for (const codeEntry of allCodes) {
      try {
        const code = String(
          codeEntry.code || codeEntry.c || codeEntry || Object.values(codeEntry)[0]
        ).trim();
        if (!code) continue;

        // Get composition for this specific code
        const comp = (ifct as any).compositions(code);

        // comp might be an object or array with one item
        const data = Array.isArray(comp) ? comp[0] : comp;
        if (!data) continue;

        const name = nameMap[code] || data.name || data.Name || code;
        const calories = Number(data.energy || data.Energy || data.ENERC_KCAL || data.kcal || 0);
        const protein = Number(data.protein || data.Protein || data.PROCNT || 0);
        const carbs = Number(data.carbohydrate || data.Carbohydrate || data.CHOCDF || 0);
        const fat = Number(data.fat || data.Fat || data.FAT || 0);
        const fiber = Number(data.fibre || data.Fibre || data.fiber || data.FIBTG || 0);
        const category = String(data.group || data.Group || data.category || "General");

        if (!name || name.length < 2 || calories === 0) continue;

        await client.mutation(api.indianFoods.insertIndianFood, {
          code,
          name,
          name_aliases: buildAliases(name),
          source: "ifct" as const,
          category,
          is_veg: isVeg(name, category),
          calories: Math.round(calories),
          protein:  Math.round(protein  * 10) / 10,
          carbs:    Math.round(carbs    * 10) / 10,
          fat:      Math.round(fat      * 10) / 10,
          fiber:    Math.round(fiber    * 10) / 10,
          default_servings: getDefaultServings(name, category),
        });

        successCount++;
        process.stdout.write(".");
      } catch (e: any) {
        errorCount++;
      }
    }
  } catch (e) {
    console.error("\n❌ Failed to load ifct2017:", e);
  }

  console.log(`\n\n✅ Seed complete!`);
  console.log(`   Inserted: ${successCount}`);
  console.log(`   Skipped:  ${skipCount} (duplicates)`);
  console.log(`   Errors:   ${errorCount}`);
}

seed().catch(console.error);
