// The mock home of the screenshots and animations: four people (Alex, Sam, Kid 1, Kid 2) with a to-do list each, a
// Chore Helper chore, a Grocy chore, the kids' points and their rewards, and the answers of todo/item/list. The clock is
// fixed (a Wednesday, 17:30), so that a capture only changes when the card does.
const st = (entity_id, state, attributes = {}) => ({ entity_id, state, attributes, last_changed: "2026-06-17T00:00:00Z", last_updated: "2026-06-17T00:00:00Z" });

const DAY = [2026, 5, 17];
const NOW = new Date(DAY[0], DAY[1], DAY[2], 17, 30).getTime();
const ymd = (offset) => {
  const d = new Date(DAY[0], DAY[1], DAY[2] + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// `scene`: overdue (two chores late), done (everything ticked off), plain (no overdue chore, two left).
const LISTS = {
  overdue: {
    "todo.alex": [
      { uid: "a1", summary: "Empty dishwasher", status: "completed", due: ymd(0) },
      { uid: "a2", summary: "Laundry", status: "needs_action", due: ymd(0) },
    ],
    "todo.sam": [
      { uid: "s1", summary: "Take out bins", status: "needs_action", due: ymd(-1) },
      { uid: "s2", summary: "Vacuum living room", status: "needs_action" },
    ],
    "todo.kid_1": [
      { uid: "k1", summary: "Make bed +5", status: "completed", due: ymd(0) },
      { uid: "k2", summary: "Feed the cat +5", status: "needs_action", due: ymd(0) },
    ],
    "todo.kid_2": [
      { uid: "k3", summary: "Tidy toys +10", status: "needs_action", due: ymd(-1 - 1) },
      { uid: "k4", summary: "Set the table +5", status: "needs_action", due: ymd(0) },
    ],
  },
};
LISTS.plain = {
  ...LISTS.overdue,
  "todo.sam": [{ uid: "s2", summary: "Vacuum living room", status: "completed", due: ymd(0) }],
  "todo.kid_2": [{ uid: "k4", summary: "Set the table +5", status: "completed", due: ymd(0) }],
};
LISTS.done = Object.fromEntries(Object.entries(LISTS.overdue).map(([id, items]) => [id, items.map((i) => ({ ...i, status: "completed", due: ymd(0) }))]));

export const pageScript = () => `(() => {
  const N = ${NOW};
  const R = Date;
  window.Date = class extends R {
    constructor(...a) { super(...(a.length ? a : [N])); }
    static now() { return N; }
  };
  window.__ws = async function (msg) {
    if (msg.type === "todo/item/list") return { items: (this.__lists || {})[msg.entity_id] || [] };
    return null;
  };
})();`;

export const setup = (s) => {
  const scene = s.scene || "overdue";
  const lists = LISTS[scene];
  const people = { "person.alex": "Alex", "person.sam": "Sam", "person.kid_1": "Kid 1", "person.kid_2": "Kid 2" };
  const states = {};
  for (const [id, name] of Object.entries(people)) states[id] = st(id, "home", { friendly_name: name });
  for (const id of Object.keys(lists)) states[id] = st(id, String(lists[id].filter((i) => i.status === "needs_action").length), { friendly_name: id.slice(5).replace(/_/g, " ") });
  states["sensor.kid_1_points"] = st("sensor.kid_1_points", scene === "done" ? "60" : "45", { unit_of_measurement: "pts" });
  states["sensor.kid_2_points"] = st("sensor.kid_2_points", scene === "done" ? "45" : "30", { unit_of_measurement: "pts" });
  const done = scene !== "overdue";
  states["sensor.water_plants"] = st("sensor.water_plants", "0", {
    friendly_name: "Water the plants",
    next_due_date: done ? ymd(3) : ymd(0),
    last_completed: done ? new Date(NOW - 3.6e6).toISOString() : new Date(NOW - 3 * 24 * 3.6e6).toISOString(),
  });
  return {
    hass: {
      language: "en",
      locale: { language: "en" },
      entities: { "sensor.water_plants": { entity_id: "sensor.water_plants", platform: "chore_helper" } },
      states,
      __lists: lists,
    },
    config: {
      people: [
        "person.alex",
        "person.sam",
        { person: "person.kid_1", points: "sensor.kid_1_points", reward: "Cinema trip", reward_points: 60 },
        { person: "person.kid_2", points: "sensor.kid_2_points", reward: "Screen time", reward_points: 50 },
      ],
      chores: [{ entity: "sensor.water_plants", person: "person.alex" }],
      ...s.config,
    },
    open: s.open,
  };
};
