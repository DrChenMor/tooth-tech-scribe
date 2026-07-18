/* MyPlan data: recipes, training, coffee.
   Every recipe is: no added sugar, gluten-free, low cholesterol, <= 15 min hands-on. */

const COFFEE = {
  name: "Coffee with regular milk",
  kcal: 50,
  note: "Your fixed daily treat — twice a day. 1 shot of coffee (espresso, instant or filter) + 100 ml regular 3% milk. No sugar, no sweetener syrups. If you like it hot and milky, warm the milk first.",
};

const RECIPES = {
  breakfast: [
    {
      id: "b1",
      name: "Greek Yogurt Berry Bowl",
      kcal: 280, protein: 20, time: 5,
      ingredients: [
        "200 g Greek yogurt 0–2% fat",
        "100 g fresh or frozen berries (thawed)",
        "1 tbsp chia seeds",
        "6 walnut halves, crushed",
        "Cinnamon to taste",
      ],
      steps: [
        "Spoon the yogurt into a bowl. Use a kitchen scale once — after that you will know the amount by eye.",
        "Top with berries, chia and walnuts. Dust with cinnamon.",
        "Do NOT add honey, granola or sweetener. The berries are the sweetness.",
      ],
      mindful: "Before the first spoon, look at the colors for 5 seconds. Eat the first three spoons slowly and name the flavors you notice. You chose this bowl — it's your metabolism's wake-up call, and you're the one pressing the button.",
    },
    {
      id: "b2",
      name: "Cinnamon Apple Oatmeal (GF oats)",
      kcal: 300, protein: 10, time: 8,
      ingredients: [
        "40 g certified gluten-free oats",
        "200 ml unsweetened almond milk (or water)",
        "1/2 apple, diced small",
        "1/2 tsp cinnamon",
        "5 almonds, chopped",
      ],
      steps: [
        "Put oats, almond milk and apple in a small pot. Bring to a simmer.",
        "Cook 4–5 minutes, stirring twice. It should be creamy, not soupy.",
        "Pour into a bowl, top with cinnamon and almonds. No sugar, no honey — the apple does the job.",
      ],
      mindful: "Wrap both hands around the warm bowl for one breath before eating. Slow food, slow bites — your slow metabolism isn't your enemy this morning; a warm, steady breakfast is exactly what keeps it working for you.",
    },
    {
      id: "b3",
      name: "Veggie Egg-White Scramble + Rice Cakes",
      kcal: 260, protein: 22, time: 10,
      ingredients: [
        "4 egg whites + 1 whole egg (only 1 yolk — keeps cholesterol low)",
        "1 tsp olive oil",
        "1/2 tomato + handful of spinach, chopped",
        "2 plain rice cakes",
        "Salt, pepper, pinch of paprika",
      ],
      steps: [
        "Heat the olive oil in a nonstick pan on medium.",
        "Add tomato and spinach, cook 2 minutes until soft.",
        "Pour in the eggs, stir gently 2–3 minutes until just set. Season.",
        "Serve with the 2 rice cakes. Exactly 2 — count them, don't refill.",
      ],
      mindful: "Put your fork down between bites. Each pause is a small win over autopilot eating. Protein in the morning keeps you full until lunch — you're stacking the day in your favor before it even starts.",
    },
    {
      id: "b4",
      name: "Cottage Cheese Israeli Bowl",
      kcal: 290, protein: 24, time: 5,
      ingredients: [
        "200 g cottage cheese 3% or less",
        "1 cucumber + 1 tomato, diced",
        "1 tsp olive oil + squeeze of lemon",
        "2 plain rice cakes",
        "Za'atar or black pepper",
      ],
      steps: [
        "Dice the vegetables into small cubes — small cubes make you eat slower.",
        "Mix with olive oil, lemon and seasoning.",
        "Serve next to the cottage cheese with the 2 rice cakes.",
      ],
      mindful: "Crunch is your friend: notice the sound of the cucumber for the first bites. Fresh, simple, honest food — this is what 'strict' actually tastes like, and it tastes good.",
    },
    {
      id: "b5",
      name: "Green Banana Protein Smoothie",
      kcal: 270, protein: 20, time: 5,
      ingredients: [
        "1 small banana (the only sweetness — no dates, no honey)",
        "Big handful of spinach",
        "200 ml regular 1% milk",
        "1 tbsp natural peanut butter (100% peanuts)",
        "4 ice cubes",
      ],
      steps: [
        "Blend everything for 45 seconds until fully smooth.",
        "Pour into a real glass — never drink it from the blender standing up.",
        "Sit down and drink it over at least 5 minutes.",
      ],
      mindful: "Sip, don't gulp. Set the glass down twice before finishing. Liquid meals disappear fast — slowing this one down is today's discipline rep, and discipline is what moves the scale.",
    },
    {
      id: "b6",
      name: "Overnight Chia Pudding",
      kcal: 300, protein: 12, time: 5,
      ingredients: [
        "3 tbsp chia seeds (prepare the night before)",
        "200 ml unsweetened almond milk",
        "1/2 tsp vanilla extract + cinnamon",
        "80 g berries or 1/2 chopped pear on top",
        "5 almonds",
      ],
      steps: [
        "Night before: stir chia, almond milk, vanilla and cinnamon in a jar. Stir again after 5 minutes. Refrigerate.",
        "Morning: top with fruit and almonds. That's it — a 1-minute breakfast.",
        "No maple syrup, no honey. If it feels bland, add more cinnamon, not sweetness.",
      ],
      mindful: "You made this yesterday — thank yesterday's you before the first bite. Every prepared meal is proof you can plan ahead, and people who plan ahead are the ones who finish the 10 kg journey.",
    },
  ],

  lunch: [
    {
      id: "l1",
      name: "Grilled Chicken, Quinoa & Big Salad",
      kcal: 430, protein: 38, time: 15,
      ingredients: [
        "150 g chicken breast, butterflied thin",
        "1/2 cup cooked quinoa (cook a batch for 3 days)",
        "Big bowl: lettuce, cucumber, tomato, red pepper",
        "1 tsp olive oil + lemon + salt for dressing",
        "Paprika, garlic powder, black pepper for chicken",
      ],
      steps: [
        "Season the chicken and grill on a hot pan 3–4 minutes per side. Thin cut = fast and juicy.",
        "While it cooks, chop the salad and dress with olive oil and lemon.",
        "Plate: half the plate salad, quarter quinoa, quarter chicken. This plate shape IS the diet.",
      ],
      mindful: "Halfway through the plate, stop for one full breath and ask: am I still hungry, or just finishing? Big lunch, smart shape — you're feeding the afternoon, not the sofa.",
    },
    {
      id: "l2",
      name: "Tuna & White Bean Power Salad",
      kcal: 380, protein: 34, time: 10,
      ingredients: [
        "1 can tuna in water, drained (not in oil)",
        "1/2 cup cooked white beans, rinsed",
        "Cucumber, tomato, 1/4 red onion, parsley",
        "1 tsp olive oil + lemon + black pepper",
        "2 plain rice cakes on the side",
      ],
      steps: [
        "Chop the vegetables into a bowl.",
        "Add tuna and beans, dress with olive oil, lemon and pepper. Toss well.",
        "Eat with the rice cakes. No mayo — the olive oil and lemon are the dressing.",
      ],
      mindful: "Chew each bite 15 times — count for the first three bites, then just keep the rhythm. Tuna and beans are quiet, boring champions. So is steady weight loss. Boring works.",
    },
    {
      id: "l3",
      name: "12-Minute Baked Salmon, Rice & Broccoli",
      kcal: 450, protein: 32, time: 15,
      ingredients: [
        "125 g salmon fillet",
        "1/2 cup cooked rice (batch-cooked)",
        "1.5 cups broccoli florets",
        "1 tsp olive oil, lemon, garlic powder, salt",
      ],
      steps: [
        "Oven or air-fryer to 200°C. Rub salmon with olive oil, garlic powder, salt.",
        "Bake salmon 12 minutes. Steam or microwave broccoli 4 minutes at the same time.",
        "Serve everything with lemon squeezed over. Done — restaurant lunch, home numbers.",
      ],
      mindful: "Notice the difference between the soft salmon and the crunchy broccoli — keep your attention on texture for the first minutes. Omega-3, low cholesterol, real food: this meal is literally on your side.",
    },
    {
      id: "l4",
      name: "Warm Lentil & Veggie Bowl",
      kcal: 400, protein: 22, time: 12,
      ingredients: [
        "3/4 cup cooked lentils (canned is fine — rinse well)",
        "1 tsp olive oil",
        "1/2 zucchini + 1/2 red pepper + 1/4 onion, diced",
        "1 tsp cumin + paprika + salt",
        "Handful of baby spinach folded in at the end",
      ],
      steps: [
        "Sauté the diced vegetables in olive oil 5 minutes.",
        "Add lentils and spices, stir 3 minutes until hot.",
        "Kill the heat, fold in spinach until it wilts. Eat from a bowl, with a spoon, sitting down.",
      ],
      mindful: "Smell the cumin before the first spoon — really smell it. Fiber is the most underrated weight-loss tool there is, and this bowl is full of it. You're eating like someone who finishes what they start.",
    },
    {
      id: "l5",
      name: "Turkey Stir-Fry with Rice Noodles",
      kcal: 420, protein: 33, time: 15,
      ingredients: [
        "140 g turkey breast strips",
        "50 g dry rice noodles",
        "1.5 cups frozen stir-fry vegetables",
        "1 tbsp gluten-free tamari (NOT regular soy sauce — that has gluten)",
        "1 tsp olive oil, garlic, ginger if you have",
      ],
      steps: [
        "Soak rice noodles in hot water per package (usually 5–8 minutes).",
        "Stir-fry turkey in oil on high heat 4 minutes. Add vegetables, 4 more minutes.",
        "Add drained noodles and tamari, toss 1 minute. Serve immediately.",
      ],
      mindful: "Use chopsticks if you have them — they force smaller, slower bites. Fast to cook, slow to eat: that's the exact opposite of how weight is gained, and it's how it's lost.",
    },
    {
      id: "l6",
      name: "Chickpea Greek Salad with Light Feta",
      kcal: 390, protein: 18, time: 8,
      ingredients: [
        "3/4 cup cooked chickpeas, rinsed",
        "40 g light feta (5–16%), cubed",
        "Cucumber, tomato, red onion, 6 olives",
        "1 tsp olive oil + lemon + oregano",
      ],
      steps: [
        "Chop vegetables chunky, halve the olives.",
        "Add chickpeas and feta, dress with olive oil, lemon, oregano.",
        "Exactly 40 g feta — weigh it. Feta is where 'a little' becomes 'a lot'.",
      ],
      mindful: "Eat the olives one at a time, never two together — savor the salt. Mediterranean food, measured portions: you're not on a punishment diet, you're on a precision diet.",
    },
  ],

  dinner: [
    {
      id: "d1",
      name: "Big Herb Omelet (mostly whites) & Salad",
      kcal: 300, protein: 24, time: 10,
      ingredients: [
        "4 egg whites + 1 whole egg (1 yolk max — cholesterol rule)",
        "1 tsp olive oil, parsley/dill, salt, pepper",
        "Big salad: lettuce, cucumber, tomato",
        "1 tsp olive oil + lemon for the salad",
        "1 plain rice cake",
      ],
      steps: [
        "Whisk eggs with herbs and seasoning.",
        "Cook in olive oil on medium-low, 2–3 minutes per side. Low heat = tender omelet.",
        "Serve with the salad and 1 rice cake. Dinner stays lighter than lunch — that's the plan working with your slow metabolism, not against it.",
      ],
      mindful: "Evening eating is where most diets break. Sit at a table, no phone, and taste the herbs. Finishing today clean is worth more than any perfect Monday you've ever planned.",
    },
    {
      id: "d2",
      name: "Baked Cod with Zucchini & Baby Potato",
      kcal: 350, protein: 28, time: 15,
      ingredients: [
        "150 g cod (or any white fish) fillet",
        "1 zucchini, sliced into rounds",
        "2 baby potatoes, halved (microwave 3 min first to speed up)",
        "1 tsp olive oil, paprika, garlic powder, lemon",
      ],
      steps: [
        "Oven/air-fryer to 200°C. Microwave the potato halves 3 minutes.",
        "Put fish, zucchini and potatoes on a tray, rub with the oil and spices.",
        "Bake 12 minutes. Squeeze lemon over everything. One tray, one wash-up.",
      ],
      mindful: "White fish is delicate — eat it with attention or you'll miss it. Notice how a real cooked dinner feels compared to grazing. You cooked at 39 with a full life. That's not a small thing.",
    },
    {
      id: "d3",
      name: "Quick Chicken & Vegetable Soup Bowl",
      kcal: 320, protein: 30, time: 15,
      ingredients: [
        "130 g chicken breast, small cubes",
        "2 cups water + 1 GF chicken stock cube (check label: gluten-free)",
        "1 carrot + 1 zucchini + 1 celery stick, sliced thin",
        "Handful of frozen green beans, black pepper, dill",
      ],
      steps: [
        "Boil water with the stock cube. Add carrot and celery, 5 minutes.",
        "Add chicken cubes and zucchini, simmer 7 minutes until chicken is cooked through.",
        "Add green beans for the last 2 minutes. Season, top with dill.",
      ],
      mindful: "Soup forces slowness — every spoon needs a small pause to cool. Let it. Warm, salty, filling, light: this is the dinner that makes tomorrow morning's weigh-in something to look forward to.",
    },
    {
      id: "d4",
      name: "Tofu & Vegetable Stir-Fry",
      kcal: 340, protein: 22, time: 12,
      ingredients: [
        "150 g firm tofu, cubed and patted dry",
        "2 cups vegetables (broccoli, pepper, mushrooms)",
        "1 tbsp gluten-free tamari + 1 tsp olive oil",
        "Garlic, ginger, chili flakes optional",
      ],
      steps: [
        "Dry the tofu well — dry tofu browns, wet tofu steams.",
        "Sear tofu in oil 4 minutes until golden. Remove.",
        "Stir-fry vegetables 4 minutes, return tofu, add tamari, toss 1 minute.",
      ],
      mindful: "Zero cholesterol in this whole plate — your arteries are getting a night off. Eat it hot and slow, and notice you don't miss anything that isn't here.",
    },
    {
      id: "d5",
      name: "Turkey Patties with Cauliflower Mash",
      kcal: 360, protein: 32, time: 15,
      ingredients: [
        "150 g ground turkey breast",
        "1/4 grated onion, parsley, salt, pepper, 1 tbsp rice flour",
        "2 cups cauliflower florets (fresh or frozen)",
        "1 tsp olive oil, splash of milk for the mash",
      ],
      steps: [
        "Microwave/steam cauliflower 6 minutes until very soft.",
        "Mix turkey with onion, parsley, seasoning and rice flour. Form 3 flat patties, pan-fry in oil 4 minutes per side.",
        "Mash cauliflower with a fork, splash of milk, salt and pepper.",
      ],
      mindful: "Comfort food, redesigned. Before eating, notice it looks like 'real dinner' — because it is. You don't need bread or fries to feel fed; you need this feeling, remembered.",
    },
    {
      id: "d6",
      name: "Tuna-Stuffed Baked Pepper & Quinoa",
      kcal: 330, protein: 28, time: 15,
      ingredients: [
        "1 large red pepper, halved and seeded",
        "1 can tuna in water, drained",
        "1/3 cup cooked quinoa",
        "1 tbsp chopped olives, parsley, lemon, 1 tsp olive oil",
      ],
      steps: [
        "Microwave the pepper halves 3 minutes to soften.",
        "Mix tuna, quinoa, olives, parsley, lemon and oil.",
        "Fill the pepper halves, then grill/air-fry 5 minutes until the edges char slightly.",
      ],
      mindful: "Eat the pepper 'boat' with a knife and fork, slowly, like it was served to you. It was — by you. Treat yourself like a guest and you'll stop eating like a fugitive.",
    },
  ],

  snack: [
    {
      id: "s1", name: "Apple + 10 Almonds", kcal: 150, protein: 4, time: 1,
      ingredients: ["1 medium apple", "10 almonds — count them, don't pour them"],
      steps: ["Slice the apple (sliced fruit is eaten slower than bitten fruit).", "Eat alternating: slice, almond, slice, almond."],
      mindful: "Crunch break. Ten almonds counted out is a tiny act of control — and today is built from tiny acts of control.",
    },
    {
      id: "s2", name: "Carrots + 2 tbsp Hummus", kcal: 120, protein: 4, time: 2,
      ingredients: ["2 carrots cut into sticks (or a handful of baby carrots)", "2 level tablespoons hummus"],
      steps: ["Measure the hummus with an actual spoon into a small dish. Never eat from the tub.", "Dip and enjoy."],
      mindful: "The small dish is the whole trick. Portion first, then eat — you decided the ending before you started. Champions do that.",
    },
    {
      id: "s3", name: "Rice Cakes + 1/4 Avocado", kcal: 140, protein: 3, time: 3,
      ingredients: ["2 plain rice cakes", "1/4 avocado, mashed", "Lemon, salt, chili flakes"],
      steps: ["Mash the avocado with lemon and salt, spread on the cakes.", "Eat over a plate — enjoy the crunch mess."],
      mindful: "Good fat, real crunch, 3 minutes of your afternoon. This snack exists so 6 pm hunger never gets to vote on your dinner.",
    },
    {
      id: "s4", name: "Small 0% Yogurt + Cinnamon", kcal: 90, protein: 9, time: 1,
      ingredients: ["150 g plain 0% yogurt", "Cinnamon"],
      steps: ["Stir cinnamon into the yogurt.", "Use a teaspoon, not a tablespoon — small spoon, longer snack."],
      mindful: "Protein between meals is your slow metabolism's bodyguard. A quiet, cold, two-minute pause in the day. Take the pause too, not just the yogurt.",
    },
    {
      id: "s5", name: "Warm Edamame Cup", kcal: 120, protein: 11, time: 4,
      ingredients: ["1 cup frozen edamame in pods", "Coarse salt"],
      steps: ["Microwave or boil 3–4 minutes.", "Sprinkle salt. Pop them from the pod one at a time."],
      mindful: "The pods set your pace — you literally can't rush this snack. Enjoy being forced to slow down; it's the point.",
    },
    {
      id: "s6", name: "Pear or Orange", kcal: 100, protein: 1, time: 1,
      ingredients: ["1 medium pear or orange"],
      steps: ["Peel or slice it. Put it on a plate.", "Eat it sitting down, not walking around."],
      mindful: "Whole fruit, whole attention. No wrapper, no label, nothing to regret. Sweetness with zero small print — remember this feeling next time a cookie argues its case.",
    },
  ],
};

/* Low-intensity training — home or outside, conversational pace, no jumping, no high impact. */
const TRAINING = [
  {
    id: "t1", name: "Brisk Outdoor Walk", minutes: 35, kcal: 160, place: "Outside",
    steps: [
      "First 5 minutes: easy pace, let the joints warm up.",
      "25 minutes: purposeful pace — you can still talk, but you couldn't sing. That's the intensity ceiling for this plan.",
      "Last 5 minutes: slow down gradually.",
      "Arms swinging, shoulders relaxed, eyes up not on the phone.",
    ],
    tip: "Walking after a meal (even 15 min) is the single best free tool for a slow metabolism.",
  },
  {
    id: "t2", name: "Home Mobility & Stretch", minutes: 20, kcal: 70, place: "Home",
    steps: [
      "2 min: march gently in place.",
      "Neck rolls ×5 each way, shoulder rolls ×10.",
      "Cat–cow on all fours ×10 slow reps.",
      "Standing hamstring stretch 30 sec/leg, quad stretch 30 sec/leg (hold a wall).",
      "Hip circles ×10 each way, then child's pose 1 minute.",
      "Finish: 2 minutes lying on your back, knees bent, slow breathing.",
    ],
    tip: "This is a training day, not a rest day. Mobility keeps the walking days pain-free.",
  },
  {
    id: "t3", name: "Gentle Strength Circuit", minutes: 20, kcal: 110, place: "Home",
    steps: [
      "Do 3 rounds, resting 60–90 sec between rounds. All movements slow and controlled:",
      "Wall push-ups ×10 (hands on wall, body straight).",
      "Chair squats ×10 (sit back to touch the chair, stand up — no plopping).",
      "Glute bridges ×12 (lying down, squeeze at the top for 2 sec).",
      "Standing calf raises ×15 (hold a counter for balance).",
      "Bird-dog ×6 per side (on all fours, opposite arm and leg).",
    ],
    tip: "Muscle is the only tissue that raises your resting metabolism. This easy circuit is your metabolism medicine — never skip it twice in a row.",
  },
  {
    id: "t4", name: "Long Easy Walk", minutes: 45, kcal: 190, place: "Outside",
    steps: [
      "One continuous easy-to-moderate walk. Comfortable pace throughout.",
      "Pick a route with a small slope if you can — hills at walking pace are free extra work with zero impact.",
      "Optional: podcast or music, but do the first 5 minutes in silence, just noticing your breath and steps.",
    ],
    tip: "Long and easy beats short and brutal for fat loss you can sustain. You're building a habit, not a highlight reel.",
  },
  {
    id: "t5", name: "Band / Light Weights at Home", minutes: 20, kcal: 100, place: "Home",
    steps: [
      "Use a resistance band or two small water bottles (0.5–1 L). 3 rounds, slow tempo:",
      "Bottle/band rows ×12 (hinge forward slightly, pull elbows back).",
      "Overhead press ×10 (light! stop 2 reps before it feels hard).",
      "Biceps curls ×12.",
      "Standing side leg raises ×10 per side.",
      "Slow sit-to-stand from a chair ×8.",
    ],
    tip: "If any rep makes you strain or hold your breath, the weight is too heavy for this plan. Light and consistent wins.",
  },
  {
    id: "t6", name: "Relaxed Weekend Walk", minutes: 60, kcal: 240, place: "Outside",
    steps: [
      "The week's longest, easiest session. Park, beach, neighborhood — anywhere pleasant.",
      "No pace goal at all. Just stay on your feet and moving for about an hour.",
      "Invite someone. A talking partner guarantees the intensity stays where it should: low.",
    ],
    tip: "Weekend movement is what separates a diet week from a diet-and-a-half week. Same food, better numbers.",
  },
  {
    id: "t7", name: "Rest + 10-Minute Breathing & Stretch", minutes: 10, kcal: 30, place: "Home",
    steps: [
      "Today the body repairs — that's when results are actually made.",
      "Evening: 5 minutes of slow breathing (in 4 sec, out 6 sec), sitting or lying down.",
      "Then 5 minutes of favorite gentle stretches from the mobility day.",
    ],
    tip: "Rest is part of the program, not a break from it. Sleep 7+ hours tonight — poor sleep slows a slow metabolism further.",
  },
];

/* Default reminder schedule (24h clock). All editable in the Reminders tab. */
const DEFAULT_REMINDERS = [
  { id: "weigh",   label: "Morning weigh-in (before breakfast)", time: "07:00", emoji: "⚖️", on: true },
  { id: "bfast",   label: "Breakfast", time: "07:30", emoji: "🍳", on: true },
  { id: "coffee1", label: "Coffee #1 with milk", time: "09:00", emoji: "☕", on: true },
  { id: "snack1",  label: "Morning snack", time: "10:45", emoji: "🍎", on: true },
  { id: "lunch",   label: "Lunch", time: "13:00", emoji: "🥗", on: true },
  { id: "coffee2", label: "Coffee #2 with milk", time: "16:00", emoji: "☕", on: true },
  { id: "train",   label: "Training time", time: "17:30", emoji: "🚶", on: true },
  { id: "dinner",  label: "Dinner", time: "19:30", emoji: "🍽️", on: true },
  { id: "water",   label: "Water check — have you had 6+ glasses?", time: "15:00", emoji: "💧", on: true },
];

const REMINDER_MESSAGES = {
  weigh:   "Same scale, same time, after the bathroom, before coffee. One number, no drama — just data.",
  bfast:   "Breakfast time. Skipping it slows a slow metabolism further. 10 minutes, sitting down.",
  coffee1: "Your coffee #1 with regular milk. Enjoy it properly — sit, sip, no sugar.",
  snack1:  "Small planned snack now = no desperate snack later.",
  lunch:   "Lunch — your biggest meal. Half plate vegetables, quarter protein, quarter carbs.",
  coffee2: "Coffee #2 with milk. The afternoon reset you promised yourself.",
  train:   "Easy training time. Low intensity, high consistency. 20–45 minutes and done.",
  dinner:  "Dinner — lighter than lunch, at a table, phone away.",
  water:   "Water check. Aim for 8 glasses today; you should be at 6 by now.",
};
