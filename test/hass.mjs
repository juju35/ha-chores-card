// A mock Home Assistant with four people (Alex, Sam, Kid 1, Kid 2), a to-do list each and a shared one, a Chore Helper
// chore, a Grocy chores sensor, the kids' points, and callWS answering todo/item/list. The day is the machine's today.
export const st = (entity_id, state, attributes = {}) => ({ entity_id, state, attributes, last_changed: "2026-01-01T00:00:00Z", last_updated: "2026-01-01T00:00:00Z" });

export const day = (offset = 0) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
};
export const ymd = (offset) => {
  const d = day(offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const LISTS = () => ({
  "todo.alex": [
    { uid: "a1", summary: "Empty dishwasher", status: "completed", due: ymd(0) },
    { uid: "a2", summary: "Laundry", status: "needs_action", due: ymd(0) },
    { uid: "a3", summary: "Old done thing", status: "completed", due: ymd(-3) },
    { uid: "a4", summary: "Next week", status: "needs_action", due: ymd(5) },
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
    { uid: "k3", summary: "Tidy toys +10", status: "needs_action", due: ymd(-4) },
    { uid: "k4", summary: "Set the table +5", status: "needs_action", due: ymd(0) },
  ],
});

export const makeHass = ({ ws = true, lists = LISTS(), ...overrides } = {}) => {
  const people = { "person.alex": "Alex", "person.sam": "Sam", "person.kid_1": "Kid 1", "person.kid_2": "Kid 2" };
  const states = {};
  for (const [id, name] of Object.entries(people)) states[id] = st(id, "home", { friendly_name: name });
  for (const id of Object.keys(lists)) states[id] = st(id, String(lists[id].filter((i) => i.status === "needs_action").length), { friendly_name: id.slice(5).replace(/_/g, " ") });
  states["sensor.kid_1_points"] = st("sensor.kid_1_points", "45", { unit_of_measurement: "pts" });
  states["sensor.kid_2_points"] = st("sensor.kid_2_points", "30", { unit_of_measurement: "pts" });
  states["sensor.water_plants"] = st("sensor.water_plants", "0", { friendly_name: "Water the plants", next_due_date: ymd(0), last_completed: new Date(day(-3)).toISOString() });
  states["sensor.grocy_chores"] = st("sensor.grocy_chores", "1", {
    chores: [{ id: 7, name: "Clean the fridge", next_estimated_execution_time: `${ymd(0)}T18:00:00`, last_tracked_time: null, next_execution_assigned_user: { display_name: "Sam" } }],
  });
  const hass = {
    language: "en",
    locale: { language: "en" },
    themes: { darkMode: false },
    entities: { "sensor.water_plants": { platform: "chore_helper" }, "sensor.grocy_chores": { platform: "grocy" } },
    states,
    calls: [],
    ws: [],
    callService(domain, service, data) {
      this.calls.push([domain, service, data]);
    },
    ...overrides,
  };
  if (ws)
    hass.callWS = async (msg) => {
      hass.ws.push(msg);
      if (msg.type === "todo/item/list") return { items: lists[msg.entity_id] || [] };
      return null;
    };
  return hass;
};

export const PEOPLE = [
  "person.alex",
  "person.sam",
  { person: "person.kid_1", points: "sensor.kid_1_points", reward: "Cinema trip", reward_points: 60 },
  { person: "person.kid_2", points: "sensor.kid_2_points", reward: "Screen time", reward_points: 50 },
];
