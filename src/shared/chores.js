// ── Chores ───────────────────────────────────────────────────────────────────
// The chores come from to-do lists (each person's own, as `people[].todo` or a list named after them, and the shared
// ones in `todo`; Donetick's lists are to-do lists too), from Chore Helper's sensors and from Grocy's chores sensor.
// A chore is kept when it is due today, overdue, undated and not done, or done today (an undated to-do item: ticked
// off since the card saw it open today, see chTrack). Points: a `+N` in a to-do item
// (`Make bed +5`) or `points` in `chores`; each kid's total comes from a sensor (KidsChores, ChoreOps, an
// input_number) set in `people[].points`.
// The avatars' colours: none of the card's violet accent, nor the meal card's orange (the two often side by side).
export const CH_COLORS = ["#4263eb", "#0ca678", "#d6336c", "#1098ad", "#e8590c", "#5c940d"];
// A colour for an avatar: a hex colour, rgb()/hsl() or a CSS variable; anything else is left out (the palette's).
export const chColor = (v) => (/^(#[0-9a-f]{3,8}|(rgb|hsl)a?\([\d\s.,%/+-]+\)|var\(--[\w-]+\))$/i.test(String(v ?? "").trim()) ? String(v).trim() : null);
export const CH_DAY = 24 * 3.6e6;

export const chNorm = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

// Midnight of the day holding `t` (ms), in the browser's time zone.
export const chMidnight = (t) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
// A due date or time ("2026-11-22", an ISO date-time) as the midnight of its day; null when there is none.
export const chDueDay = (v) => {
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v));
  const t = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime() : new Date(v).getTime();
  return Number.isFinite(t) ? chMidnight(t) : null;
};
// "Make bed +5": the name and its points.
export const chPoints = (text) => {
  const m = /(?:^|\s)\+(\d{1,4})(?:\s*(?:pts?|points?))?\s*$/i.exec(String(text ?? ""));
  return m ? { name: String(text).slice(0, m.index).trim(), points: Number(m[1]) } : { name: String(text ?? "").trim(), points: null };
};
// "Kid 1" → "K1", "Alex Martin" → "AM", "Sam" → "S".
export const chInitials = (name) =>
  String(name ?? "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => (/^\d/.test(w) ? w : w[0]?.toUpperCase() || ""))
    .join("") || "?";

// The people of the card: `people` (person entities, or { person, todo, points, reward, reward_points, name }), else
// every person of the home. A person's to-do list, when not set, is the one named after them.
export const chPeople = (hass, config) => {
  const listed = config.people?.length ? config.people : Object.keys(hass.states || {}).filter((id) => id.startsWith("person."));
  const todos = Object.keys(hass.states || {}).filter((id) => id.startsWith("todo."));
  return listed.map((p, i) => {
    const o = typeof p === "string" ? { person: p } : p || {};
    const st = o.person ? hass.states[o.person] : undefined;
    const name = o.name || st?.attributes.friendly_name || o.person?.replace(/^person\./, "") || "?";
    // The list named after the person: their whole name first ("Kid 1" → todo.kid_1), else their first name.
    const full = chNorm(name);
    const first = chNorm(name.split(/\s+/)[0]);
    const slugs = (id) => [chNorm(id.slice(5)), chNorm(hass.states[id]?.attributes.friendly_name)];
    const todo =
      o.todo ??
      (full ? todos.find((id) => slugs(id).some((s) => s === full || s.endsWith(`_${full}`) || s.startsWith(`${full}_`))) : undefined) ??
      (first && !/\d/.test(full) ? todos.find((id) => slugs(id).some((s) => s.split("_").includes(first))) : undefined);
    return {
      id: o.person || `p${i}`,
      name,
      short: chInitials(name),
      picture: st?.attributes.entity_picture || null,
      color: chColor(o.color) || CH_COLORS[i % CH_COLORS.length],
      todo: todo || null,
      points: o.points || null,
      reward: o.reward || null,
      rewardPoints: Number(o.reward_points) || null,
    };
  });
};

// Every to-do list the card reads: the people's, and the shared ones (`todo`).
export const chTodoLists = (people, config) => [...new Set([...people.map((p) => p.todo).filter(Boolean), ...[].concat(config.todo || [])])];

// The undated to-do items seen open today, and those of them completed since. A to-do list does not say when an item
// was completed, so an undated item counts as done today only when the card saw it open today (or ticked it off);
// one completed before stays out. `store` is the day's record (kept by the card between reloads), `todo` the items.
export const chTrack = (store, todo, today) => {
  const fresh = store?.day === today;
  const open = new Set(fresh ? store.open : []);
  const done = new Set(fresh ? store.done : []);
  for (const [list, items] of todo)
    for (const i of items) {
      if (chDueDay(i.due) != null) continue;
      const key = `todo:${list}:${i.uid}`;
      if (i.status !== "completed") {
        open.add(key);
        done.delete(key);
      } else if (open.has(key)) done.add(key);
    }
  return { day: today, open: [...open], done: [...done] };
};

// The chores of the day, from every source (`todo`: the items of each to-do list, from todo/item/list; `doneUndated`:
// the keys of the undated items completed today, from chTrack).
export const chCollect = ({ hass, config, people, todo = new Map(), now, doneUndated = [] }) => {
  const today = chMidnight(now);
  const out = [];
  const byName = (name) => people.find((p) => chNorm(p.name) === chNorm(name) || chNorm(p.name.split(/\s+/)[0]) === chNorm(name))?.id || null;
  // `due`: the day it is due; `done`: done today (or completed, for a to-do item due today).
  const add = (c) => {
    const overdue = !c.done && c.due != null && c.due < today;
    const keep = overdue || (c.due != null && c.due === today) || (c.due == null && !c.done) || c.doneToday;
    if (keep) out.push({ ...c, overdue });
  };
  for (const list of chTodoLists(people, config)) {
    const owner = people.find((p) => p.todo === list)?.id || null;
    for (const item of todo.get(list) || []) {
      const { name, points } = chPoints(item.summary);
      const due = chDueDay(item.due);
      const done = item.status === "completed";
      const key = `todo:${list}:${item.uid}`;
      if (done && due !== today && !(due == null && doneUndated.includes(key))) continue;
      add({ key, kind: "todo", entity: list, uid: item.uid, name, points, person: owner, due, done, doneToday: done });
    }
  }
  const extra = Object.fromEntries((config.chores || []).map((c) => [typeof c === "string" ? c : c.entity, typeof c === "string" ? {} : c]));
  const helpers = Object.keys(hass.entities || {}).filter((id) => hass.entities[id].platform === "chore_helper" && hass.states[id]);
  for (const id of new Set([...helpers, ...Object.keys(extra).filter((id) => hass.states[id]?.attributes.next_due_date !== undefined)])) {
    const st = hass.states[id];
    const o = extra[id] || {};
    const last = st.attributes.last_completed ? new Date(st.attributes.last_completed).getTime() : null;
    const doneToday = last != null && chMidnight(last) === today;
    add({
      key: `helper:${id}`,
      kind: "chore_helper",
      entity: id,
      name: o.name || st.attributes.friendly_name || id,
      points: o.points ?? null,
      person: o.person || null,
      due: chDueDay(st.attributes.next_due_date),
      done: doneToday,
      doneToday,
    });
  }
  // Grocy: a sensor whose `chores` attribute lists them.
  const grocy = Object.keys(hass.states || {}).filter((id) => id.startsWith("sensor.") && Array.isArray(hass.states[id].attributes.chores));
  for (const id of grocy)
    for (const c of hass.states[id].attributes.chores) {
      const last = c.last_tracked_time ? new Date(c.last_tracked_time).getTime() : null;
      const doneToday = last != null && chMidnight(last) === today;
      const o = extra[`grocy:${c.id}`] || {};
      add({
        key: `grocy:${c.id}`,
        kind: "grocy",
        entity: id,
        choreId: c.id,
        name: o.name || c.name,
        points: o.points ?? null,
        person: o.person || byName(c.next_execution_assigned_user?.display_name) || null,
        due: chDueDay(c.next_estimated_execution_time),
        done: doneToday,
        doneToday,
      });
    }
  // Overdue first (the oldest first), then the day's undone, then the done; by name within each.
  const rank = (c) => (c.overdue ? 0 : c.done ? 2 : 1);
  return out.sort((a, b) => rank(a) - rank(b) || (a.overdue ? a.due - b.due : 0) || a.name.localeCompare(b.name));
};

// How long a chore has been overdue: "yesterday", a weekday within the week, else a date.
export const chSince = (due, now, lang) => {
  const days = Math.round((chMidnight(now) - due) / CH_DAY);
  if (days <= 1) return null;
  try {
    return days < 7 ? new Intl.DateTimeFormat(lang, { weekday: "long" }).format(new Date(due)) : new Intl.DateTimeFormat(lang, { day: "numeric", month: "short" }).format(new Date(due));
  } catch {
    return new Date(due).toDateString();
  }
};
