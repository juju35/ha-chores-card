import assert from "node:assert/strict";
import { test } from "node:test";
import { day, makeHass, PEOPLE } from "./hass.mjs";
import { fakeNode, load } from "./load.mjs";

const NOW = day(0).getTime() + 15.5 * 3.6e6; // today, 15:30
const ch = load({ now: NOW });
const { cards } = ch;
const json = (v) => JSON.parse(JSON.stringify(v));
const settle = async () => {
  for (let i = 0; i < 6; i++) await new Promise((r) => setTimeout(r, 0));
};

// A card whose shadow root answers every selector with nodes recording their click listeners; the to-do lists read
// (callWS) before the test looks at it.
const make = async (tag, config, hass = makeHass()) => {
  const card = new cards[tag]();
  card.attachShadow();
  const nodes = {};
  card.shadowRoot.querySelector = (s) => (nodes[s] ||= fakeNode());
  card._nodes = nodes;
  card.setConfig({ type: `custom:${tag}`, ...config });
  card.hass = hass;
  await settle();
  return card;
};
const CONFIG = { people: PEOPLE };

test("both cards are registered, with their editors and a picker entry", () => {
  for (const tag of ["chores-card", "chores-mini-card"]) {
    assert.ok(ch.customElements.get(tag), tag);
    assert.ok(ch.customElements.get(`${tag}-editor`), `${tag}-editor`);
  }
  assert.deepEqual(json(ch.window.customCards.map((c) => c.type)), ["chores-card", "chores-mini-card"]);
});

test("people: every person by default, each with the to-do list named after them", () => {
  const h = makeHass();
  const p = ch.chPeople(h, {});
  assert.deepEqual(json(p.map((x) => [x.name, x.short, x.todo])), [
    ["Alex", "A", "todo.alex"],
    ["Sam", "S", "todo.sam"],
    ["Kid 1", "K1", "todo.kid_1"],
    ["Kid 2", "K2", "todo.kid_2"],
  ]);
  const k = ch.chPeople(h, CONFIG)[2];
  assert.deepEqual([k.points, k.reward, k.rewardPoints], ["sensor.kid_1_points", "Cinema trip", 60]);
});

test("chores: due today, overdue, undated and done today; not old done ones nor future ones; points from +N", async () => {
  const card = await make("chores-card", CONFIG);
  const m = card._items;
  const names = m.chores.map((x) => x.name);
  assert.deepEqual(json(m.overdue.map((x) => x.name)), ["Tidy toys", "Take out bins"], "the oldest first");
  assert.ok(names.includes("Vacuum living room"), "undated, not done");
  assert.ok(names.includes("Water the plants"), "Chore Helper, due today");
  assert.ok(names.includes("Clean the fridge"), "Grocy, due today");
  assert.ok(!names.includes("Old done thing") && !names.includes("Next week"));
  const bed = m.chores.find((x) => x.name === "Make bed");
  assert.equal(bed.points, 5);
  assert.equal(bed.done, true);
  assert.equal(m.chores.find((x) => x.name === "Clean the fridge").person, "person.sam", "Grocy's assigned user");
  assert.equal(m.state, "overdue");
  assert.deepEqual([m.total, m.done], [10, 2]);
});

test("an undated to-do item completed today counts as done, not as gone", async () => {
  const lists = { "todo.sam": [{ uid: "s2", summary: "Vacuum living room", status: "needs_action" }] };
  const hass = makeHass({ lists });
  const card = await make("chores-card", { people: ["person.sam"] }, hass);
  const total = card._items.total;
  assert.equal(card._items.done, 0);
  // Completed elsewhere (the Donetick app): the list reports it, still without a due date.
  lists["todo.sam"][0].status = "completed";
  card.hass = { ...hass, states: { ...hass.states, "todo.sam": { ...hass.states["todo.sam"], state: "0", last_updated: "2026-01-02T00:00:00Z" } } };
  await settle();
  const vacuum = card._items.chores.find((x) => x.name === "Vacuum living room");
  assert.ok(vacuum?.done, "kept, done");
  assert.deepEqual([card._items.total, card._items.done], [total, 1], "the total stays, one more done");
});

test("chTrack: open undated items are remembered for the day, completed ones only once seen open", () => {
  const today = new Date(2026, 5, 25).getTime();
  const todo = new Map([["todo.a", [{ uid: "1", status: "needs_action" }, { uid: "2", status: "completed" }, { uid: "3", status: "needs_action", due: "2026-06-25" }]]]);
  const t = ch.chTrack(null, todo, today);
  assert.deepEqual(json(t), { day: today, open: ["todo:todo.a:1"], done: [] }, "an item already completed is not known to be done today");
  todo.get("todo.a")[0].status = "completed";
  assert.deepEqual(json(ch.chTrack(t, todo, today).done), ["todo:todo.a:1"]);
  assert.deepEqual(json(ch.chTrack(t, new Map(), today + 864e5)), { day: today + 864e5, open: [], done: [] }, "a new day starts afresh");
});

test("an undated item ticked off from the card stays done once its list reports it", async () => {
  const lists = { "todo.sam": [{ uid: "s2", summary: "Vacuum living room", status: "needs_action" }] };
  const hass = makeHass({ lists });
  const card = await make("chores-card", { people: ["person.sam"] }, hass);
  const total = card._items.total;
  card._toggle(card._items.chores.find((x) => x.name === "Vacuum living room"));
  lists["todo.sam"][0].status = "completed";
  card._asked.clear();
  await card._fetch();
  assert.deepEqual([card._items.total, card._items.done], [total, 1]);
});

test("a person renamed or given a picture is shown so, without scanning the home at each update", async () => {
  const hass = makeHass();
  const card = await make("chores-card", { people: ["person.sam"] }, hass);
  assert.equal(card._items.people[0].name, "Sam");
  const sam = hass.states["person.sam"];
  card.hass = { ...hass, states: { ...hass.states, "person.sam": { ...sam, attributes: { ...sam.attributes, friendly_name: "Samuel", entity_picture: "/api/image/sam.png" } } } };
  assert.equal(card._items.people[0].name, "Samuel");
  assert.equal(card._items.people[0].picture, "/api/image/sam.png");
});

test("an avatar's colour is a colour, nothing else", () => {
  const h = makeHass();
  const p = (color) => ch.chPeople(h, { people: [{ person: "person.sam", color }] })[0].color;
  assert.equal(p("#ff8800"), "#ff8800");
  assert.equal(p("rgb(10, 20, 30)"), "rgb(10, 20, 30)");
  assert.equal(p("hsl(200 50% 40%)"), "hsl(200 50% 40%)");
  assert.equal(p("var(--accent-color)"), "var(--accent-color)");
  assert.equal(p("red;background-image:url(x)"), "#4263eb", "a CSS rule: the palette's colour");
  assert.equal(p(undefined), "#4263eb");
});

test("full card: the banner, the filters, overdue first, today's checklist and the kids' points", async () => {
  const card = await make("chores-card", CONFIG);
  const html = card.shadowRoot.innerHTML;
  assert.match(html, /class="banner"/);
  assert.match(html, /<span class="bpt">2 overdue<\/span>/);
  assert.match(html, /<div class="subt">2 of 10 done today<\/div>/);
  assert.equal((html.match(/class="fc/g) || []).length, 5, "All and the four people");
  assert.match(html, /<div class="box late"><div class="bh">Overdue<\/div>/);
  assert.match(html, /Take out bins<span class="wh"> · since yesterday<\/span>/);
  assert.match(html, /Tidy toys<span class="wh"> · since \w+day<\/span>/);
  assert.match(html, /<span class="pts">\+10<\/span>/);
  assert.match(html, /<span class="kv">45 pts<\/span><span class="kg">15 to Cinema trip<\/span>/);
  assert.match(html, /<span class="kv">30 pts<\/span><span class="kg">20 to Screen time<\/span>/);
});

test("the filter keeps one person's chores and points", async () => {
  const card = await make("chores-card", CONFIG);
  card._filter = "person.kid_2";
  card._sig = null;
  card._render();
  const m = card._items;
  assert.ok(m.chores.length > m.today.length + m.overdue.length - 1);
  assert.deepEqual(json([...m.overdue, ...m.today].map((x) => x.name)), ["Tidy toys", "Set the table"]);
  assert.doesNotMatch(card.shadowRoot.innerHTML, /Cinema trip/);
});

test("ticking off calls the source's action and shows it done at once", async () => {
  const hass = makeHass();
  const card = await make("chores-card", CONFIG, hass);
  const m = card._items;
  card._toggle(m.chores.find((x) => x.name === "Laundry"));
  card._toggle(m.chores.find((x) => x.name === "Make bed"));
  card._toggle(m.chores.find((x) => x.name === "Water the plants"));
  card._toggle(m.chores.find((x) => x.name === "Clean the fridge"));
  assert.deepEqual(json(hass.calls), [
    ["todo", "update_item", { entity_id: "todo.alex", item: "a2", status: "completed" }],
    ["todo", "update_item", { entity_id: "todo.kid_1", item: "k1", status: "needs_action" }],
    ["chore_helper", "complete", { entity_id: "sensor.water_plants" }],
    ["grocy", "execute_chore", { chore_id: 7 }],
  ]);
  assert.equal(card._items.chores.find((x) => x.name === "Laundry").done, true, "optimistic");
});

test("rows and filters are wired: a click toggles, a filter chip filters", async () => {
  const hass = makeHass();
  const card = await make("chores-card", CONFIG, hass);
  const rows = [{ dataset: { k: card._items.chores.find((x) => x.name === "Laundry").key }, addEventListener(_t, fn) { this.fn = fn; } }];
  const chips = [{ dataset: { p: "person.sam" }, addEventListener(_t, fn) { this.fn = fn; } }];
  const kids = [{ dataset: { id: "sensor.kid_1_points" }, addEventListener(_t, fn) { this.fn = fn; } }];
  const events = [];
  card.dispatchEvent = (e) => events.push(e.detail?.entityId);
  card._bindAfter({ querySelectorAll: (s) => ({ ".row": rows, ".fc": chips, ".kp": kids })[s] || [] });
  rows[0].fn();
  assert.equal(hass.calls.length, 1);
  chips[0].fn();
  assert.equal(card._filter, "person.sam");
  kids[0].fn();
  assert.deepEqual(events, ["sensor.kid_1_points"]);
});

test("all done, and nothing at all", async () => {
  const done = { "todo.alex": [{ uid: "a", summary: "Laundry", status: "completed", due: new Date(NOW).toISOString().slice(0, 10) }] };
  const h = makeHass({ lists: done, entities: {} });
  delete h.states["sensor.grocy_chores"];
  const card = await make("chores-card", { people: ["person.alex"] }, h);
  assert.equal(card._items.state, "done");
  assert.match(card.shadowRoot.innerHTML, /<span class="bpt">All done<\/span>/);
  const empty = await make("chores-card", { people: ["person.alex"] }, { ...makeHass({ lists: {}, entities: {} }), states: { "person.alex": { entity_id: "person.alex", state: "home", attributes: { friendly_name: "Alex" } } } });
  assert.equal(empty._items.state, "empty");
  assert.match(empty.shadowRoot.innerHTML, /No chores today/);
});

test("mini card: the ring with the count, the chips, and the zoom to the full card", async () => {
  const card = await make("chores-mini-card", CONFIG);
  const html = card.shadowRoot.innerHTML;
  assert.match(html, /<ha-card class="lvl-overdue bn">/);
  assert.match(html, /<span class="cnt">2\/10<\/span>/);
  assert.match(html, /6 left today/);
  assert.match(html, /<span class="bpt">2 overdue<\/span>/, "the overdue ones are the pill");
  card._zoomed = true;
  card._sig = null;
  card._render();
  assert.match(card.shadowRoot.innerHTML, /class="box late"/);
});

test("the dark theme", async () => {
  const card = await make("chores-card", CONFIG, makeHass({ themes: { darkMode: true } }));
  assert.match(card.shadowRoot.innerHTML, /<ha-card class="lvl-overdue dk">/);
  assert.match(card.shadowRoot.innerHTML, /class="banner night"/);
});

test("since: yesterday, a weekday within the week, else a date", () => {
  assert.equal(ch.chSince(day(-1).getTime(), NOW, "en"), null);
  assert.match(ch.chSince(day(-3).getTime(), NOW, "en"), /day$/);
  assert.match(ch.chSince(day(-10).getTime(), NOW, "en"), /\d/);
});

test("translations: every language has every English key", () => {
  const en = Object.keys(ch.CH_I18N.en);
  for (const [lang, table] of Object.entries(ch.CH_I18N)) assert.deepEqual(en.filter((k) => !(k in table)), [], lang);
  assert.equal(Object.keys(ch.CH_I18N).length, 22);
});

test("the editor writes only what differs from the defaults", () => {
  const ed = new (ch.customElements.get("chores-card-editor"))();
  ed.setConfig({ type: "custom:chores-card" });
  ed.hass = makeHass();
  const form = ed.children[0];
  const names = form.schema.flatMap((s) => (s.schema ? s.schema.map((x) => x.name) : [s.name]));
  for (const n of ["todo", "show_done", "show_points", "illustration_theme", "people", "chores", "language"]) assert.ok(names.includes(n), n);
  let out;
  ed.dispatchEvent = (e) => (out = e.detail.config);
  form.listeners["value-changed"]({ detail: { value: { type: "custom:chores-card", show_points: true, todo: ["todo.house"] } } });
  assert.deepEqual(json(out), { type: "custom:chores-card", todo: ["todo.house"] });
});
