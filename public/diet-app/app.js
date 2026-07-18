/* MyPlan — diet & easy training app. Vanilla JS, localStorage, no build step. */

const STORE_KEY = "myplan-state-v1";

const defaultState = {
  calorieTarget: 1400,
  startWeight: null,
  goalLoss: 10,
  startDate: null,
  weights: [],            // { date: "YYYY-MM-DD", kg: number }
  reminders: DEFAULT_REMINDERS,
  swaps: {},              // { "YYYY-MM-DD": { breakfast: 2, lunch: 0, ... } }
  done: {},               // { "YYYY-MM-DD": { b1: true, coffee1: true, training: true, ... } }
  notifWarned: false,
};

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return structuredClone(defaultState);
    const s = { ...structuredClone(defaultState), ...JSON.parse(raw) };
    // merge in any newly added default reminders
    for (const d of DEFAULT_REMINDERS) {
      if (!s.reminders.find((r) => r.id === d.id)) s.reminders.push({ ...d });
    }
    return s;
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

/* ---------- helpers ---------- */

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function dayOfPlan() {
  if (!state.startDate) return 1;
  const ms = new Date(todayKey()) - new Date(state.startDate);
  return Math.max(1, Math.floor(ms / 86400000) + 1);
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => (t.hidden = true), 3500);
}

/* ---------- daily plan generation ---------- */

/* Deterministic per-day rotation + user swaps. */
function pickIndex(list, dayNum, offset) {
  return (dayNum + offset) % list.length;
}

function getPlan(dateKey = todayKey()) {
  const day = dayNum(dateKey);
  const swaps = state.swaps[dateKey] || {};
  const plan = {};
  for (const meal of ["breakfast", "lunch", "dinner"]) {
    const list = RECIPES[meal];
    plan[meal] = list[pickIndex(list, day, swaps[meal] || 0)];
  }
  // snacks: fill toward the calorie target
  const coffeeKcal = 2 * COFFEE.kcal;
  const base = plan.breakfast.kcal + plan.lunch.kcal + plan.dinner.kcal + coffeeKcal;
  const remaining = state.calorieTarget - base;
  const snacks = [];
  const sList = RECIPES.snack;
  if (remaining >= 90) snacks.push(sList[pickIndex(sList, day, swaps.snack1 || 0)]);
  if (remaining >= 240) {
    let idx = pickIndex(sList, day + 3, swaps.snack2 || 0);
    if (snacks[0] && sList[idx].id === snacks[0].id) idx = (idx + 1) % sList.length;
    snacks.push(sList[idx]);
  }
  plan.snacks = snacks;
  plan.training = TRAINING[(day - 1) % TRAINING.length];
  plan.totalKcal = base + snacks.reduce((a, s) => a + s.kcal, 0);
  return plan;
}

function dayNum(dateKey) {
  // stable positive integer per date
  return Math.floor(new Date(dateKey).getTime() / 86400000);
}

function swapMeal(slot) {
  const k = todayKey();
  state.swaps[k] = state.swaps[k] || {};
  state.swaps[k][slot] = (state.swaps[k][slot] || 0) + 1;
  saveState();
  render();
  toast("Swapped! Same calories zone, different plate.");
}

function toggleDone(itemId) {
  const k = todayKey();
  state.done[k] = state.done[k] || {};
  state.done[k][itemId] = !state.done[k][itemId];
  saveState();
  render();
}

function doneToday(itemId) {
  return !!(state.done[todayKey()] || {})[itemId];
}

function consumedKcal(plan) {
  let kcal = 0;
  for (const meal of ["breakfast", "lunch", "dinner"]) {
    if (doneToday(plan[meal].id)) kcal += plan[meal].kcal;
  }
  for (const s of plan.snacks) if (doneToday(s.id)) kcal += s.kcal;
  if (doneToday("coffee1")) kcal += COFFEE.kcal;
  if (doneToday("coffee2")) kcal += COFFEE.kcal;
  return kcal;
}

/* ---------- rendering ---------- */

let activeTab = "today";

function render() {
  const view = $("#view");
  const renderers = { today: renderToday, training: renderTraining, progress: renderProgress, reminders: renderReminders, settings: renderSettings };
  view.innerHTML = renderers[activeTab]();
  bindView();
  renderHeader();
}

function renderHeader() {
  const d = new Date();
  $("#header-date").textContent =
    d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" }) +
    (state.startDate ? ` · Day ${dayOfPlan()}` : "");
  const plan = getPlan();
  const eaten = consumedKcal(plan);
  $("#ring-kcal").textContent = eaten;
  const pct = Math.min(1, eaten / state.calorieTarget);
  const circ = 2 * Math.PI * 19;
  const ring = $("#ring-fill");
  ring.style.strokeDasharray = `${circ}`;
  ring.style.strokeDashoffset = `${circ * (1 - pct)}`;
  ring.style.stroke = eaten > state.calorieTarget ? "#c0392b" : "#7fd4a8";
}

function mealCard(slot, recipe, emoji) {
  const done = doneToday(recipe.id);
  return `
  <article class="card meal ${done ? "done" : ""}">
    <div class="meal-head">
      <div>
        <span class="meal-slot">${emoji} ${esc(slot)}</span>
        <h3>${esc(recipe.name)}</h3>
        <p class="meta">${recipe.kcal} kcal · ${recipe.protein} g protein · ⏱ ${recipe.time} min</p>
      </div>
      <div class="meal-actions">
        <button class="chip" data-swap="${slotKeyFor(slot)}">↺ Swap</button>
        <button class="chip primary" data-done="${recipe.id}">${done ? "✓ Eaten" : "Mark eaten"}</button>
      </div>
    </div>
    <details>
      <summary>Recipe & strict instructions</summary>
      <h4>Ingredients — exact amounts, no improvising</h4>
      <ul>${recipe.ingredients.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
      <h4>Steps</h4>
      <ol>${recipe.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
    </details>
    <div class="mindful"><span>🧘 Mindful moment</span><p>${esc(recipe.mindful)}</p></div>
  </article>`;
}

function slotKeyFor(slot) {
  const map = { Breakfast: "breakfast", Lunch: "lunch", Dinner: "dinner", "Snack 1": "snack1", "Snack 2": "snack2", Snack: "snack1" };
  return map[slot] || slot.toLowerCase();
}

function coffeeCard(n) {
  const id = `coffee${n}`;
  const done = doneToday(id);
  return `
  <article class="card coffee ${done ? "done" : ""}">
    <div class="meal-head">
      <div>
        <span class="meal-slot">☕ Coffee #${n}</span>
        <h3>${esc(COFFEE.name)}</h3>
        <p class="meta">${COFFEE.kcal} kcal · your daily non-negotiable</p>
      </div>
      <div class="meal-actions">
        <button class="chip primary" data-done="${id}">${done ? "✓ Enjoyed" : "Mark done"}</button>
      </div>
    </div>
    <p class="coffee-note">${esc(COFFEE.note)}</p>
  </article>`;
}

function renderToday() {
  const plan = getPlan();
  const eaten = consumedKcal(plan);
  const left = state.calorieTarget - eaten;
  return `
  ${state.startDate ? "" : `
  <section class="card welcome">
    <h2>Welcome! 2 quick steps 👋</h2>
    <p>1️⃣ Go to <b>Settings</b> and pick your daily calorie target and start weight.<br/>
       2️⃣ Go to <b>Reminders</b> and enable notifications.<br/>
       Then this page becomes your entire diet — one day at a time.</p>
  </section>`}
  <section class="daybar card">
    <div><b>${plan.totalKcal}</b><small>planned kcal</small></div>
    <div><b>${eaten}</b><small>eaten</small></div>
    <div class="${left < 0 ? "over" : ""}"><b>${left}</b><small>${left < 0 ? "over target" : "remaining"}</small></div>
    <div><b>${state.calorieTarget}</b><small>target</small></div>
  </section>
  ${mealCard("Breakfast", plan.breakfast, "🍳")}
  ${coffeeCard(1)}
  ${plan.snacks[0] ? mealCard(plan.snacks.length > 1 ? "Snack 1" : "Snack", plan.snacks[0], "🍎") : ""}
  ${mealCard("Lunch", plan.lunch, "🥗")}
  ${coffeeCard(2)}
  ${plan.snacks[1] ? mealCard("Snack 2", plan.snacks[1], "🍎") : ""}
  ${mealCard("Dinner", plan.dinner, "🍽️")}
  <section class="card training-teaser ${doneToday("training") ? "done" : ""}">
    <div class="meal-head">
      <div>
        <span class="meal-slot">🚶 Today's training</span>
        <h3>${esc(plan.training.name)}</h3>
        <p class="meta">${plan.training.minutes} min · ~${plan.training.kcal} kcal · ${esc(plan.training.place)} · low intensity</p>
      </div>
      <div class="meal-actions">
        <button class="chip primary" data-done="training">${doneToday("training") ? "✓ Done" : "Mark done"}</button>
      </div>
    </div>
    <p class="meta">Full instructions in the <b>Training</b> tab.</p>
  </section>
  <section class="card rules">
    <h3>📏 Today's strict rules</h3>
    <ul>
      <li><b>No sugar</b> — no added sugar, honey, dates or syrups. Fruit in the plan is your sweetness.</li>
      <li><b>No gluten</b> — no bread, pasta, couscous, burghul, regular soy sauce or regular oats.</li>
      <li><b>Low cholesterol</b> — max 1 egg yolk a day, lean meats only, olive oil instead of butter.</li>
      <li><b>Water</b> — 8 glasses. Hunger between meals? Drink a glass first, wait 10 minutes.</li>
      <li><b>Coffee</b> — exactly 2, with regular milk, unsweetened. It's a pleasure, keep it one.</li>
      <li><b>Sleep 7+ hours</b> — short sleep slows a slow metabolism even further.</li>
    </ul>
  </section>`;
}

function renderTraining() {
  const plan = getPlan();
  return `
  <section class="card">
    <h2>Easy training — home or outside</h2>
    <p class="meta">Everything here is deliberately <b>low intensity</b>: no jumping, no sprinting, no straining.
    The rule: you should always be able to talk while doing it. Consistency over heroics — every single day something moves.</p>
  </section>
  ${TRAINING.map((t) => `
  <article class="card ${t.id === plan.training.id ? "today-train" : ""}">
    <div class="meal-head">
      <div>
        <span class="meal-slot">${t.id === plan.training.id ? "⭐ TODAY" : "🗓 In rotation"}</span>
        <h3>${esc(t.name)}</h3>
        <p class="meta">${t.minutes} min · ~${t.kcal} kcal · ${esc(t.place)}</p>
      </div>
      ${t.id === plan.training.id ? `<div class="meal-actions"><button class="chip primary" data-done="training">${doneToday("training") ? "✓ Done" : "Mark done"}</button></div>` : ""}
    </div>
    <details ${t.id === plan.training.id ? "open" : ""}>
      <summary>Instructions</summary>
      <ol>${t.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
      <p class="mindful-inline">💡 ${esc(t.tip)}</p>
    </details>
  </article>`).join("")}`;
}

function renderProgress() {
  const w = state.weights.slice().sort((a, b) => a.date.localeCompare(b.date));
  const start = state.startWeight ?? (w[0] ? w[0].kg : null);
  const goal = start != null ? +(start - state.goalLoss).toFixed(1) : null;
  const current = w.length ? w[w.length - 1].kg : start;
  const lost = start != null && current != null ? +(start - current).toFixed(1) : 0;
  const day = dayOfPlan();
  const weeks = Math.max(day / 7, 0.15);
  const pace = lost > 0 ? lost / weeks : 0;

  let paceMsg = "";
  if (start == null) {
    paceMsg = "Set your start weight in Settings, then log a weigh-in each morning.";
  } else if (w.length < 2) {
    paceMsg = "Log your weight every morning (after the bathroom, before coffee). Trends need at least a few points.";
  } else if (pace >= 1.2) {
    paceMsg = `You're losing ~${pace.toFixed(1)} kg/week — on track for the 2-month goal. Important: this is a very fast pace; make sure you're eating your full plan (never under 1,200 kcal) and check in with your doctor.`;
  } else if (pace >= 0.5) {
    paceMsg = `You're losing ~${pace.toFixed(1)} kg/week — a healthy, sustainable pace. Full honesty: 10 kg in 2 months needs ~1.2 kg/week, which is aggressive for almost anyone. At your current pace you'd reach −10 kg in ~${Math.ceil((state.goalLoss - lost) / pace)} more weeks — and you'd keep it off, which is the actual win.`;
  } else {
    paceMsg = "Progress is slow this week. Don't cut food below plan — instead: tighten portions with the scale, add 10 minutes to each walk, and protect your sleep. Weight loss is never a straight line, especially with a slow metabolism. Stay the course.";
  }

  return `
  <section class="card">
    <h2>Progress toward −${state.goalLoss} kg</h2>
    <div class="progress-stats">
      <div><b>${start ?? "—"}</b><small>start kg</small></div>
      <div><b>${current ?? "—"}</b><small>current kg</small></div>
      <div><b>${goal ?? "—"}</b><small>goal kg</small></div>
      <div class="${lost > 0 ? "good" : ""}"><b>${lost > 0 ? "−" + lost : lost === 0 ? "0" : "+" + Math.abs(lost)}</b><small>kg so far</small></div>
    </div>
    ${start != null ? `<div class="goalbar"><div class="goalbar-fill" style="width:${Math.min(100, Math.max(0, (lost / state.goalLoss) * 100))}%"></div></div>` : ""}
    <p class="meta">${esc(paceMsg)}</p>
  </section>
  <section class="card">
    <h3>⚖️ Log today's weight</h3>
    <div class="row">
      <input id="weight-input" type="number" step="0.1" min="30" max="250" placeholder="e.g. 82.4" inputmode="decimal" />
      <button class="chip primary" id="log-weight">Save</button>
    </div>
    <p class="meta">Same scale, same time every morning. One number a day — the trend is what matters, not any single morning.</p>
  </section>
  ${w.length ? `<section class="card"><h3>Weight chart</h3>${weightChart(w, start, goal)}</section>` : ""}
  ${w.length ? `<section class="card"><h3>History</h3><ul class="history">${w.slice(-14).reverse().map((e) => `<li><span>${e.date}</span><b>${e.kg} kg</b></li>`).join("")}</ul></section>` : ""}
  <section class="card safety">
    <h3>❤️ A word about the goal</h3>
    <p>10 kg in 2 months is an aggressive target — roughly 1.2 kg/week. This plan keeps you safe by never going below 1,200 kcal and keeping training gentle. If you lose 6–8 kg in these two months, that is a genuine success, and the plan simply continues. Please check in with your doctor before starting, especially for the "very slow metabolism" feeling — it's worth ruling out thyroid issues (a simple blood test).</p>
  </section>`;
}

function weightChart(w, start, goal) {
  const pts = w.slice(-30);
  const kgs = pts.map((p) => p.kg).concat(goal != null ? [goal] : []).concat(start != null ? [start] : []);
  const min = Math.min(...kgs) - 0.5, max = Math.max(...kgs) + 0.5;
  const W = 320, H = 140, padL = 34, padR = 8, padT = 10, padB = 20;
  const x = (i) => padL + (i / Math.max(1, pts.length - 1)) * (W - padL - padR);
  const y = (kg) => padT + (1 - (kg - min) / (max - min)) * (H - padT - padB);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.kg).toFixed(1)}`).join(" ");
  const goalY = goal != null ? y(goal) : null;
  return `
  <svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Weight chart">
    ${goalY != null ? `<line x1="${padL}" y1="${goalY}" x2="${W - padR}" y2="${goalY}" class="goal-line" /><text x="${W - padR}" y="${goalY - 4}" text-anchor="end" class="goal-text">goal ${goal}</text>` : ""}
    <path d="${line}" class="weight-line" />
    ${pts.map((p, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(p.kg).toFixed(1)}" r="3" class="dot" />`).join("")}
    <text x="4" y="${y(max - 0.5) + 4}" class="axis">${(max - 0.5).toFixed(1)}</text>
    <text x="4" y="${y(min + 0.5) + 4}" class="axis">${(min + 0.5).toFixed(1)}</text>
  </svg>`;
}

function renderReminders() {
  const perm = ("Notification" in window) ? Notification.permission : "unsupported";
  return `
  <section class="card">
    <h2>Reminders & notifications</h2>
    ${perm === "granted"
      ? `<p class="meta good">✅ Notifications are enabled on this device.</p>`
      : perm === "unsupported"
        ? `<p class="meta">⚠️ This browser doesn't support notifications — in-app banners will still appear while the app is open.</p>`
        : `<button class="chip primary" id="enable-notifs">🔔 Enable notifications</button>
           <p class="meta">Tip: on your phone, use “Add to Home Screen” to install this app — reminders work best when the app is installed and open.</p>`}
    <p class="meta">Reminders fire while the app is open (or installed and running). Times are editable below.</p>
  </section>
  ${state.reminders.map((r) => `
  <article class="card reminder-row ${r.on ? "" : "off"}">
    <span class="rem-emoji">${r.emoji}</span>
    <div class="rem-main">
      <b>${esc(r.label)}</b>
      <input type="time" value="${r.time}" data-rem-time="${r.id}" />
    </div>
    <label class="switch">
      <input type="checkbox" ${r.on ? "checked" : ""} data-rem-toggle="${r.id}" />
      <span></span>
    </label>
  </article>`).join("")}
  <section class="card">
    <button class="chip" id="test-notif">Send a test notification</button>
  </section>`;
}

function renderSettings() {
  return `
  <section class="card">
    <h2>Settings</h2>
    <label class="field">
      <span>Daily calorie target</span>
      <div class="row">
        <input id="cal-range" type="range" min="1200" max="1800" step="50" value="${state.calorieTarget}" />
        <b id="cal-value">${state.calorieTarget}</b>
      </div>
      <p class="meta">With a very slow metabolism, 1,300–1,400 kcal is a sensible strict target for steady loss. The app will not go below 1,200 — under that, your metabolism slows down even more and muscle is lost. The plan auto-fills your day (meals + 2 coffees + snacks) to match this number.</p>
    </label>
    <label class="field">
      <span>Start weight (kg)</span>
      <input id="start-weight" type="number" step="0.1" min="30" max="250" value="${state.startWeight ?? ""}" placeholder="e.g. 84.0" inputmode="decimal" />
    </label>
    <p class="meta">Goal is automatically start − 10 kg. Start date: <b>${state.startDate ?? "not started"}</b></p>
    <div class="row">
      <button class="chip primary" id="save-settings">Save</button>
      ${state.startDate ? "" : `<button class="chip" id="start-plan">🚀 Start my plan today</button>`}
    </div>
  </section>
  <section class="card">
    <h3>Your profile</h3>
    <ul class="meta-list">
      <li>Age 39 · goal −10 kg · slow metabolism mode: <b>on</b> (protein-forward meals, daily movement, strict portions, sleep rule)</li>
      <li>Strict exclusions: added sugar ✕ · gluten ✕ · high-cholesterol foods ✕</li>
      <li>Fixed daily: 2 × coffee with regular milk (${COFFEE.kcal} kcal each, already counted)</li>
    </ul>
  </section>
  <section class="card safety">
    <h3>Medical note</h3>
    <p>This app is a planning tool, not medical advice. Before starting — and especially because you describe a very slow metabolism — a quick doctor visit and a thyroid (TSH) blood test are strongly recommended. Stop and consult if you feel dizzy, unusually weak, or unwell.</p>
  </section>`;
}

/* ---------- event binding ---------- */

function bindView() {
  $$("[data-done]").forEach((b) => b.addEventListener("click", () => toggleDone(b.dataset.done)));
  $$("[data-swap]").forEach((b) => b.addEventListener("click", () => swapMeal(b.dataset.swap)));

  const logBtn = $("#log-weight");
  if (logBtn) logBtn.addEventListener("click", () => {
    const v = parseFloat($("#weight-input").value);
    if (!v || v < 30 || v > 250) return toast("Enter a realistic weight in kg 🙂");
    const k = todayKey();
    state.weights = state.weights.filter((e) => e.date !== k);
    state.weights.push({ date: k, kg: +v.toFixed(1) });
    if (state.startWeight == null) state.startWeight = +v.toFixed(1);
    saveState();
    render();
    toast("Weight logged. See you tomorrow morning ⚖️");
  });

  const calRange = $("#cal-range");
  if (calRange) calRange.addEventListener("input", () => ($("#cal-value").textContent = calRange.value));

  const saveBtn = $("#save-settings");
  if (saveBtn) saveBtn.addEventListener("click", () => {
    state.calorieTarget = Math.max(1200, parseInt($("#cal-range").value, 10));
    const sw = parseFloat($("#start-weight").value);
    if (sw >= 30 && sw <= 250) state.startWeight = +sw.toFixed(1);
    saveState();
    render();
    toast("Saved. Your daily plan updated to match.");
  });

  const startBtn = $("#start-plan");
  if (startBtn) startBtn.addEventListener("click", () => {
    state.startDate = todayKey();
    saveState();
    render();
    toast("Day 1 starts now. One day at a time 💪");
  });

  const enableBtn = $("#enable-notifs");
  if (enableBtn) enableBtn.addEventListener("click", async () => {
    const p = await Notification.requestPermission();
    render();
    if (p === "granted") notify("MyPlan", "Notifications are on. I'll nudge you for meals, coffee and training 🔔");
  });

  const testBtn = $("#test-notif");
  if (testBtn) testBtn.addEventListener("click", () => notify("MyPlan test", "This is how your reminders will look. ☕🥗🚶"));

  $$("[data-rem-time]").forEach((inp) => inp.addEventListener("change", () => {
    const r = state.reminders.find((x) => x.id === inp.dataset.remTime);
    if (r && /^\d{2}:\d{2}$/.test(inp.value)) { r.time = inp.value; saveState(); toast("Reminder time updated."); }
  }));
  $$("[data-rem-toggle]").forEach((inp) => inp.addEventListener("change", () => {
    const r = state.reminders.find((x) => x.id === inp.dataset.remToggle);
    if (r) { r.on = inp.checked; saveState(); render(); }
  }));
}

$$(".tab").forEach((t) =>
  t.addEventListener("click", () => {
    $$(".tab").forEach((x) => x.classList.toggle("active", x === t));
    activeTab = t.dataset.tab;
    render();
    window.scrollTo({ top: 0 });
  })
);

/* ---------- notifications engine ---------- */

async function notify(title, body) {
  if (!("Notification" in window)) return toast(`${title}: ${body}`);
  if (Notification.permission !== "granted") return toast(`${title}: ${body}`);
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) {
      reg.showNotification(title, { body, icon: "icon.png", badge: "icon.png", tag: title });
    } else {
      new Notification(title, { body });
    }
  } catch {
    toast(`${title}: ${body}`);
  }
}

const firedKey = () => `myplan-fired-${todayKey()}`;

function checkReminders() {
  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  let fired = {};
  try { fired = JSON.parse(sessionStorage.getItem(firedKey()) || "{}"); } catch { /* ignore */ }
  for (const r of state.reminders) {
    if (!r.on || fired[r.id]) continue;
    if (r.time === hhmm) {
      fired[r.id] = true;
      const msg = REMINDER_MESSAGES[r.id] || r.label;
      notify(`${r.emoji} ${r.label}`, msg);
      toast(`${r.emoji} ${msg}`);
    }
  }
  sessionStorage.setItem(firedKey(), JSON.stringify(fired));
}

setInterval(checkReminders, 20000);

/* ---------- boot ---------- */

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => { /* offline features unavailable */ });
}

render();
