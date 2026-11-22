/**
 * chores-card / chores-mini-card: the household chores. The day's chores of each person in one checklist, ticked off
 * with a tap, the overdue ones first, a filter per person, and the kids' points and the reward in reach.
 * https://github.com/juju35/ha-chores-card
 */

// One loop of the banner's animations (s): the broom sweeps there and back while chores are left; the stars twinkle
// once everything is done.
const CH_LOOP = 2.4;
// How often the to-do lists are read again (ms), besides each change of a list.
const CH_REFRESH = 5 * 60 * 1000;
// A chore ticked off shows as done at once, until its source reports it (or for this long).
const CH_OPTIMISTIC = 8000;
// Where the day's undated to-do items seen open, and those ticked off since, are kept between reloads (see chTrack).
const CH_STORE = "chores-card:undated";
const CH_SVG = {
  check: "M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z",
  open: "M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z",
  late: "M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z",
};

// ── Banner ───────────────────────────────────────────────────────────────────
// The illustrated header's room: 200 × 80, drawn to the banner's right edge. A picture on the wall, a shelf of jars,
// the broom leaning on the wall, the laundry basket and two toys on the floor. While chores are left the broom sweeps;
// when all are done, three stars twinkle over the basket. By night (the dark theme), darker.
const chScene = ({ night, state, animate }) => {
  const frame = night ? ["#3a3150", "#4d4370"] : ["#ffffff", "#d6cdee"];
  const sweep =
    animate && (state === "left" || state === "overdue")
      ? `<animateTransform attributeName="transform" type="rotate" values="-8 38 80;8 38 80;-8 38 80" dur="${CH_LOOP}s" repeatCount="indefinite"/>`
      : "";
  const stars =
    state === "done"
      ? [
          [118, 36],
          [138, 26],
          [158, 38],
        ]
          .map(
            ([x, y], i) =>
              `<path d="M${x} ${y - 5}l1.4 3.6 3.6 1.4-3.6 1.4-1.4 3.6-1.4-3.6-3.6-1.4 3.6-1.4z" fill="#ffd43b">${animate ? `<animate attributeName="opacity" values="1;.25;1" dur="${CH_LOOP}s" begin="${((i * CH_LOOP) / 3).toFixed(2)}s" repeatCount="indefinite"/>` : ""}</path>`,
          )
          .join("")
      : "";
  return `<rect x="70" y="10" width="44" height="30" rx="3" fill="${frame[0]}" stroke="${frame[1]}"/><path d="M74 36 L86 22 L96 32 L102 26 L110 36Z" fill="${night ? "#6a5aa6" : "#b8a9e6"}"/><circle cx="102" cy="18" r="3" fill="#ffd43b"/>
    <rect x="128" y="30" width="56" height="3" fill="${night ? "#5a4f45" : "#b9a68a"}"/><rect x="132" y="20" width="10" height="10" rx="2" fill="#9775fa"/><rect x="146" y="22" width="14" height="8" rx="2" fill="#63e6be"/><rect x="164" y="18" width="8" height="12" rx="2" fill="#ffa94d"/>
    <g class="broom"><path d="M30 80 L44 20" stroke="${night ? "#6b4a33" : "#8a5a3b"}" stroke-width="3" stroke-linecap="round"/><path d="M24 70 L40 70 L46 80 L18 80Z" fill="#ffd43b"/><path d="M24 72 L22 80 M30 72 L29 80 M36 72 L37 80" stroke="#e0a800" stroke-width="1.2"/>${sweep}</g>
    <path d="M140 58 h34 l-4 22 h-26z" fill="${night ? "#5a4f45" : "#e9dcc6"}" stroke="${night ? "#7a6a5a" : "#c7b291"}"/><path d="M140 62 h34" stroke="${night ? "#7a6a5a" : "#c7b291"}"/><rect x="146" y="52" width="10" height="8" rx="2" fill="#4dabf7"/><rect x="158" y="50" width="10" height="10" rx="2" fill="#f783ac"/>
    <circle cx="100" cy="74" r="6" fill="#ff922b"/><rect x="108" y="68" width="12" height="12" rx="2" fill="#51cf66"/>${stars}`;
};

// The status pill's place, decided by measurement after each render and each new width (the same rule on every
// card): on the title row, right after the title, only when the whole title and the pill's whole label fit there;
// otherwise on its own line under the subtitle (clamped to one line). When the label is still cut there, or the text
// block leaves the banner or runs over its ground strip, the pill keeps its dot alone, on the title row (its label
// stays in title and aria-label). A card of 200 px or less shows the dot alone anyway (CSS), beside the title.
const chPlacePill = (head, row, ground) => {
  if (!head) return;
  head.removeAttribute("data-wrap");
  head.removeAttribute("data-dot");
  const pill = row.querySelector(":scope > .bpill, :scope > .pill");
  const text = pill?.querySelector(".bpt, .pt");
  if (!text?.getBoundingClientRect || text.getBoundingClientRect().width <= 1) return;
  const name = row.querySelector(".title");
  const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
  const title = name ? (name.scrollWidth > name.clientWidth ? name.scrollWidth : name.getBoundingClientRect().width) + gap : 0;
  if (title + pill.getBoundingClientRect().width <= row.getBoundingClientRect().width + 0.5) return;
  head.setAttribute("data-wrap", "");
  const box = row.parentElement.getBoundingClientRect();
  const frame = head.getBoundingClientRect();
  const out = ground && (box.bottom > ground.getBoundingClientRect().top + 0.5 || box.top < frame.top - 0.5);
  if (text.scrollWidth > text.clientWidth + 0.5 || out) {
    head.removeAttribute("data-wrap");
    head.setAttribute("data-dot", "");
  }
};

// ── Card ─────────────────────────────────────────────────────────────────────
class ChoresCard extends RcCard {
  static tag = "chores-card";
  static i18n = CH_I18N;
  static defaults = { illustration: true, illustration_theme: "auto", show_subtitle: true, show_points: true, show_done: true, animations: true };

  static getStubConfig() {
    return {};
  }

  getCardSize() {
    return 6;
  }

  connectedCallback() {
    super.connectedCallback?.();
    this._timer ??= setInterval(() => this._fetch(), CH_REFRESH);
    // A new width: the status pill is fitted again (in the next frame, and only for a new width).
    if (typeof ResizeObserver !== "function") return;
    this._resize ??= new ResizeObserver((entries) => {
      const w = Math.round(entries.at(-1).contentRect.width);
      if (w === this._fitWidth) return;
      this._fitWidth = w;
      cancelAnimationFrame(this._fitFrame);
      this._fitFrame = requestAnimationFrame(() => this._fitPill());
    });
    this._resize.observe(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();
    clearInterval(this._timer);
    this._timer = undefined;
    this._resize?.disconnect();
    this._fitWidth = undefined;
    if (this._fitFrame) cancelAnimationFrame(this._fitFrame);
  }

  // The items of every to-do list the card reads (todo/item/list), read again when a list changes.
  async _fetch() {
    const h = this._hass;
    const lists = this._lists || [];
    if (!h?.callWS || this._busy || !lists.length) return;
    this._busy = true;
    const todo = new Map();
    try {
      const answers = await Promise.all(lists.map((id) => h.callWS({ type: "todo/item/list", entity_id: id }).catch(() => null)));
      lists.forEach((id, i) => {
        todo.set(id, answers[i]?.items || []);
      });
      this._todo = todo;
      this._keep(chTrack(this._tracked(), todo, chMidnight(Date.now())));
    } finally {
      this._busy = false;
    }
    this._sig = null;
    this._render();
  }

  _collect() {
    const h = this._hass;
    const c = this._config;
    const now = Date.now();
    // The people and their lists: worked out again when a person or a to-do list changes (a new name or picture, a
    // list added), not at each state change of the home. Their ids are listed again only with the entity registry (a
    // list or a person added, or Home Assistant restarted).
    const memo = (this._memo ||= {});
    const ids = rcMemo(memo, "ids", [h.entities], () => Object.keys(h.states).filter((id) => id.startsWith("person.") || id.startsWith("todo.")));
    const people = rcMemo(memo, "people", [c.people, h.entities, ...ids.map((id) => h.states[id])], () => chPeople(h, c));
    this._lists = chTodoLists(people, c);
    // The lists are read again when one of them changes (its state is the number of items left).
    const sig = this._lists.map((id) => `${id}:${h.states[id]?.state}:${h.states[id]?.last_updated}`).join("|");
    if (sig !== this._listSig) {
      this._listSig = sig;
      this._fetch();
    }
    const asked = (this._asked ||= new Map());
    for (const [k, v] of asked) if (now - v.at > CH_OPTIMISTIC) asked.delete(k);
    const track = this._tracked();
    const doneUndated = track?.day === chMidnight(now) ? track.done : [];
    const chores = chCollect({ hass: h, config: c, people, todo: this._todo, now, doneUndated }).map((x) => {
      const a = asked.get(x.key);
      if (!a) return x;
      if (a.done === x.done) {
        asked.delete(x.key);
        return x;
      }
      return { ...x, done: a.done, doneToday: a.done, overdue: !a.done && x.overdue };
    });
    const mine = (x) => !this._filter || x.person === this._filter;
    const shown = chores.filter(mine);
    const overdue = shown.filter((x) => x.overdue);
    const todayList = shown.filter((x) => !x.overdue && (c.show_done !== false || !x.done));
    const total = shown.filter((x) => !x.overdue).length + overdue.length;
    const done = shown.filter((x) => x.done).length;
    const left = total - done;
    const state = !chores.length ? "empty" : overdue.length ? "overdue" : left ? "left" : "done";
    return { state, people, chores, overdue, today: todayList, total, done, left, now, name: c.title || this._t("title") };
  }

  // The day's record of the undated to-do items (chTrack), from the browser's storage at first.
  _tracked() {
    if (this._track === undefined) {
      try {
        this._track = JSON.parse(window.localStorage?.getItem(CH_STORE) || "null");
      } catch {
        this._track = null;
      }
    }
    return this._track;
  }

  _keep(track) {
    this._track = track;
    try {
      window.localStorage?.setItem(CH_STORE, JSON.stringify(track));
    } catch {}
  }

  _night() {
    const theme = this._config.illustration_theme;
    if (theme === "night" || theme === "day") return theme === "night";
    return !!this._hass.themes?.darkMode;
  }

  _animate() {
    if (this._config.animations === false) return false;
    try {
      return !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return true;
    }
  }

  _status(m) {
    if (m.state === "overdue") return this._t("st_overdue", { n: m.overdue.length });
    if (m.state === "left") return this._t("st_left", { n: m.left });
    return this._t(`st_${m.state}`);
  }

  // The illustrated header: the badge (a broom, in the state's colour), the title and `sub` on the wall at the left,
  // the room at the right, a 10 px wooden floor edge to edge. `badge`: the mini card's progress ring.
  _banner(m, sub, badge = "") {
    const c = this._config;
    const nav = c.navigation_path;
    const night = this._night();
    const pill = this._status(m);
    return `
      <div class="banner${night ? " night" : ""}">
        <div class="head${nav ? " nav" : ""}"${nav ? ' role="link" tabindex="0"' : ""}>
          <div class="badge">${badge || '<ha-icon icon="mdi:broom"></ha-icon>'}</div>
          <div class="tt"><div class="trow"><div class="title">${rcEsc(m.name)}</div><span class="bpill" title="${rcEsc(pill)}" aria-label="${rcEsc(pill)}"><span class="bdot"></span><span class="bpt">${rcEsc(pill)}</span></span></div>${sub}</div>
        </div>
        <svg class="room" viewBox="0 0 200 80" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">${chScene({ night, state: m.state, animate: this._animate() })}</svg>
        <div class="ground"></div>
      </div>`;
  }

  // The status pill's place, on the banner and on the classic header (see chPlacePill).
  _fitPill() {
    for (const row of this.shadowRoot?.querySelectorAll?.(".trow") || []) {
      const banner = row.closest(".banner");
      chPlacePill(banner || row.closest(".head"), row, banner?.querySelector(".ground"));
    }
  }

  _avatar(person, cls = "av") {
    if (!person) return "";
    return person.picture
      ? `<img class="${cls}" src="${rcEsc(person.picture)}" alt="${rcEsc(person.name)}" title="${rcEsc(person.name)}">`
      : `<span class="${cls}" style="background:${rcEsc(person.color)}" title="${rcEsc(person.name)}">${rcEsc(person.short)}</span>`;
  }

  _row(m, x) {
    const person = m.people.find((p) => p.id === x.person);
    const since = x.overdue ? chSince(x.due, m.now, this._lang()) : null;
    const when = x.overdue ? ` · ${since ? this._t("since", { d: since }) : this._t("since_yesterday")}` : "";
    const icon = x.done ? CH_SVG.check : x.overdue ? CH_SVG.late : CH_SVG.open;
    const label = this._t(x.done ? "mark_todo" : "mark_done");
    // A Chore Helper or Grocy chore done today cannot be undone from here.
    const locked = x.done && x.kind !== "todo";
    return `<button class="row${x.done ? " done" : ""}${x.overdue ? " late" : ""}" data-k="${rcEsc(x.key)}" aria-pressed="${x.done}" title="${rcEsc(`${x.name} — ${label}`)}"${locked ? " disabled" : ""}>
      <svg class="ck" viewBox="0 0 24 24" aria-hidden="true"><path d="${icon}"/></svg>
      <span class="nm">${rcEsc(x.name)}${when ? `<span class="wh">${rcEsc(when)}</span>` : ""}</span>
      <span class="rt">${x.points ? `<span class="pts">+${rcEsc(x.points)}</span>` : ""}${this._avatar(person)}</span>
    </button>`;
  }

  _filters(m) {
    if (m.people.length < 2) return "";
    const chip = (id, label, av) =>
      `<button class="fc${(this._filter || null) === id ? " on" : ""}" data-p="${rcEsc(id || "")}" aria-pressed="${(this._filter || null) === id}">${av}<span>${rcEsc(label)}</span></button>`;
    return `<div class="fs" role="group">${chip(null, this._t("all"), "")}${m.people.map((p) => chip(p.id, p.name, this._avatar(p, "av sm"))).join("")}</div>`;
  }

  // The kids' points: a person with a points sensor, its total and the reward in reach.
  _points(m) {
    if (this._config.show_points === false) return "";
    const h = this._hass;
    const kids = m.people.filter((p) => p.points && (!this._filter || p.id === this._filter));
    if (!kids.length) return "";
    const tile = (p) => {
      const v = Number(h.states[p.points]?.state);
      const pts = Number.isFinite(v) ? Math.round(v) : null;
      const goal = p.reward && p.rewardPoints && pts != null ? (pts >= p.rewardPoints ? this._t("reward_ready", { r: p.reward }) : this._t("reward_to", { n: p.rewardPoints - pts, r: p.reward })) : "";
      return `<button class="kp" data-id="${rcEsc(p.points)}">${this._avatar(p)}<span class="kv">${rcEsc(pts == null ? "—" : this._t("pts", { n: pts }))}</span>${goal ? `<span class="kg">${rcEsc(goal)}</span>` : ""}</button>`;
    };
    return `<div class="kids">${kids.map(tile).join("")}</div>`;
  }

  _draw(m) {
    const c = this._config;
    if (!this._changed([m.state, m.chores, m.people, this._filter || null, this._night(), m.total, m.done])) return;
    const sub = c.show_subtitle !== false && m.total ? `<div class="subt">${rcEsc(this._t("sub_done", { d: m.done, t: m.total }))}</div>` : "";
    const status = this._status(m);
    const head =
      c.illustration !== false
        ? this._banner(m, sub)
        : `<div class="head${c.navigation_path ? " nav" : ""}"${c.navigation_path ? ' role="link" tabindex="0"' : ""}>
            <div class="badge"><ha-icon icon="mdi:broom"></ha-icon></div>
            <div class="tt"><div class="trow"><div class="title">${rcEsc(m.name)}</div><span class="pill" title="${rcEsc(status)}" aria-label="${rcEsc(status)}"><span class="pt">${rcEsc(status)}</span></span></div>${sub}</div>
          </div>`;
    const late = m.overdue.length ? `<div class="box late"><div class="bh">${rcEsc(this._t("overdue"))}</div>${m.overdue.map((x) => this._row(m, x)).join("")}</div>` : "";
    const todays = m.chores.filter((x) => !x.overdue && (!this._filter || x.person === this._filter));
    const todayDone = todays.filter((x) => x.done).length;
    const todayAll = todays.length;
    const today = `<div class="box"><div class="bh"><span>${rcEsc(this._t("today"))}</span>${todayAll ? `<span>${rcEsc(this._t("done_of", { d: todayDone, t: todayAll }))}</span>` : ""}</div>${m.today.length ? m.today.map((x) => this._row(m, x)).join("") : `<div class="none">${rcEsc(this._t("empty"))}</div>`}</div>`;
    this._paint(m.state, head + this._filters(m) + late + today + this._points(m), "", this._hass.themes?.darkMode ? " dk" : "");
    this._fitPill();
  }

  // Tick off or back: the to-do item's status, Chore Helper's complete, Grocy's execute_chore; shown at once.
  _toggle(x) {
    const h = this._hass;
    const done = !x.done;
    if (x.kind === "todo") rcCall(h, "todo", "update_item", { entity_id: x.entity, item: x.uid, status: done ? "completed" : "needs_action" });
    else if (x.kind === "chore_helper" && done) rcCall(h, "chore_helper", "complete", { entity_id: x.entity });
    else if (x.kind === "grocy" && done) rcCall(h, "grocy", "execute_chore", { chore_id: x.choreId });
    else return;
    // An undated to-do item ticked off here is done today; ticked back, it is open again.
    if (x.kind === "todo" && x.due == null) {
      const today = chMidnight(Date.now());
      const t = chTrack(this._tracked(), new Map(), today);
      t.open = [...new Set([...t.open, x.key])];
      t.done = done ? [...new Set([...t.done, x.key])] : t.done.filter((k) => k !== x.key);
      this._keep(t);
    }
    this._asked.set(x.key, { done, at: Date.now() });
    this._sig = null;
    this._render();
  }

  _bindAfter(root) {
    const m = this._items;
    for (const b of root.querySelectorAll(".row") || [])
      b.addEventListener("click", () => {
        const x = m.chores.find((y) => y.key === b.dataset.k);
        if (x) this._toggle(x);
      });
    for (const b of root.querySelectorAll(".fc") || [])
      b.addEventListener("click", () => {
        this._filter = b.dataset.p || null;
        this._sig = null;
        this._render();
      });
    for (const b of root.querySelectorAll(".kp") || []) b.addEventListener("click", () => rcMoreInfo(this, b.dataset.id));
  }

  static styles = `
    ha-card.lvl-overdue { --c: #e03131; }
    ha-card.lvl-left { --c: #7048e8; }
    ha-card.lvl-done { --c: #2f9e44; }
    ha-card.lvl-empty { --c: var(--rc-idle); }
    :host { --ch-accent: #7048e8; --ch-late: #e03131; }
    .tt { flex: 1 1 0; min-width: 5ch; display: flex; flex-direction: column; }
    .tt .title { flex: none; }
    .subt { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    :host([hide-title]) .head .tt { visibility: hidden; }
    .fs { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
    .fc { all: unset; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; min-height: 30px; padding: 0 10px; border-radius: 999px; box-sizing: border-box;
          font-size: 13px; color: var(--primary-text-color); background: var(--secondary-background-color, rgba(127,127,127,.1)); }
    .fc:has(.av) { padding-left: 4px; }
    .fc.on { background: color-mix(in srgb, var(--ch-accent) 18%, transparent); color: color-mix(in srgb, var(--ch-accent) 55%, var(--primary-text-color, #212121)); font-weight: 500; }
    .fc:focus-visible, .row:focus-visible, .kp:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
    .box { margin-top: 10px; border-radius: 12px; padding: 8px 12px; background: var(--secondary-background-color, rgba(127,127,127,.08)); }
    .box.late { background: color-mix(in srgb, var(--ch-late) 9%, var(--card-background-color, #fff)); }
    .bh { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; font-weight: 500; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: .04em; margin-bottom: 2px; }
    .late .bh { color: color-mix(in srgb, var(--ch-late) 70%, var(--primary-text-color, #212121)); }
    .row { all: unset; box-sizing: border-box; cursor: pointer; display: flex; align-items: center; gap: 8px; width: 100%; min-height: 36px; padding: 4px 2px; min-width: 0; }
    .row[disabled] { cursor: default; }
    .ck { flex: none; width: 22px; height: 22px; fill: var(--disabled-color, #adb5bd); }
    .row.done .ck { fill: var(--ch-accent); }
    .row.late .ck { fill: var(--ch-late); }
    .nm { min-width: 0; font-size: 14px; color: var(--primary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .row.done .nm { text-decoration: line-through; color: var(--secondary-text-color); }
    .row.late .nm { color: color-mix(in srgb, var(--ch-late) 70%, var(--primary-text-color, #212121)); }
    .wh { font-size: 13px; }
    .rt { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; flex: none; }
    .pts { font-size: 11px; font-weight: 500; padding: 2px 6px; border-radius: 999px; color: color-mix(in srgb, var(--ch-accent) 60%, var(--primary-text-color, #212121));
          background: color-mix(in srgb, var(--ch-accent) 14%, transparent); }
    .av { flex: none; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; object-fit: cover;
          font-size: 9px; font-weight: 700; color: #fff; }
    .av.sm { width: 22px; height: 22px; font-size: 8px; }
    .none { padding: 8px 2px; font-size: 13px; color: var(--secondary-text-color); }
    .kids { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; margin-top: 10px; }
    .kp { all: unset; cursor: pointer; box-sizing: border-box; display: flex; align-items: center; gap: 8px; min-width: 0; padding: 8px 12px; border-radius: 12px;
          background: var(--secondary-background-color, rgba(127,127,127,.08)); }
    .kv { font-size: 14px; font-weight: 500; white-space: nowrap; color: var(--primary-text-color); }
    .kg { margin-left: auto; min-width: 0; font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    ha-card.dk { --ch-accent: #9775fa; --ch-late: #ff6b6b; }
    /* Illustrated header (banner): 90 px, edge to edge, the title on the wall, the room at the right, a 10 px wooden
       floor at the bottom. The badge's icon is in the state's colour, grey when idle, by day and night. */
    .banner { position: relative; display: flex; height: 90px; margin: -12px -12px 0; overflow: hidden;
              background: linear-gradient(180deg, #f3f0fb 0%, #e7e1f7 100%);
              --bt: #0d2a45; --bs: #3b5b78; --ic: color-mix(in srgb, var(--c) 85%, #10283f); --sw: min(200px, 56%); }
    .banner.night { background: linear-gradient(180deg, #231c3a 0%, #2c2447 100%); --bt: #fff; --bs: rgba(255,255,255,.78); --ic: color-mix(in srgb, var(--c) 72%, #fff); }
    .lvl-empty .banner { --ic: #6b7680; }
    .lvl-empty .banner.night { --ic: #a7b0b8; }
    .banner .head { position: relative; z-index: 1; flex: 1; min-width: 0; height: 80px; box-sizing: border-box;
                    padding: 0 calc(var(--sw) + 4px) 0 14px; flex-wrap: nowrap; }
    .banner .head::after { content: none; }
    .banner .badge { position: relative; color: var(--ic); background: rgba(255,255,255,.62); box-shadow: inset 0 0 0 1px rgba(13,42,69,.12); }
    .banner.night .badge { background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.14); }
    .banner .title { color: var(--bt); }
    .banner .subt { color: var(--bs); font-size: 13px; }
    .banner .room { position: absolute; right: 0; bottom: 10px; width: var(--sw); height: calc(80px * var(--sk, 1)); }
    .banner .ground { position: absolute; left: 0; right: 0; bottom: 0; height: 10px; background: repeating-linear-gradient(90deg, #c49a6c 0 36px, #b88d5f 36px 72px); }
    .banner.night .ground { background: repeating-linear-gradient(90deg, #4a3a2c 0 36px, #3f3125 36px 72px); }
    /* The mini card's expand / collapse button: 24 px, frosted, 5 px from the banner's top right corner. */
    .banner .zoom { position: absolute; z-index: 2; top: 5px; right: 5px; width: 24px; height: 24px; margin: 0; color: #33506b;
                    background: rgba(255,255,255,.55); box-shadow: inset 0 0 0 1px rgba(255,255,255,.7); backdrop-filter: blur(4px); }
    .banner.night .zoom { color: #fff; background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); }
    .banner .zoom:hover { background: rgba(255,255,255,.75); color: #33506b; }
    .banner.night .zoom:hover { background: rgba(255,255,255,.22); color: #fff; }
    .banner .tt { min-width: 0; flex: 1 1 auto; }
    /* Status pill right after the title (see chPlacePill). */
    .trow { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .trow > .title { flex: 0 1 auto; min-width: 0; }
    .trow > .bpill, .trow > .pill { flex: none; max-width: none; }
    :host([hide-title]) .trow .title { visibility: hidden; }
    .head:has(.trow) { flex-wrap: nowrap; }
    .head:has(.trow)::after { content: none; }
    .bpill { display: inline-flex; align-items: center; gap: 4px; min-width: 0; box-sizing: border-box; overflow: hidden;
             white-space: nowrap; padding: 1px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; line-height: 16px;
             background: color-mix(in srgb, var(--c) 18%, rgba(255,255,255,.78)); color: color-mix(in srgb, var(--c) 45%, #0d2a45); }
    .banner.night .bpill { background: color-mix(in srgb, var(--c) 30%, rgba(8,18,38,.55)); color: color-mix(in srgb, var(--c) 35%, #ffffff); }
    .bdot { width: 7px; height: 7px; border-radius: 50%; background: var(--c); flex: none; }
    .bpt { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
    [data-wrap] .trow { display: contents; }
    [data-wrap] .trow > .bpill, [data-wrap] .trow > .pill { order: 9; align-self: flex-start; max-width: 100%; margin-top: 3px; }
    .banner[data-wrap] .trow > .bpill { max-width: calc(100cqw - 80px); }
    [data-wrap] .subt { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    [data-dot] .bpill { padding: 0; background: none; }
    [data-dot] .bpt, [data-dot] .trow > .pill .pt { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
    [data-dot] .trow > .pill { padding: 0; width: 18px; height: 18px; justify-content: center; background: none; }
    [data-dot] .trow > .pill::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--c); }
    @container (max-width: 200px) {
      .bpill { padding: 0; background: none; }
      .bpt, .trow > .pill .pt { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
      .trow > .pill { padding: 0; width: 18px; height: 18px; justify-content: center; background: none; }
      .trow > .pill::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--c); }
    }
    /* The mini card: the banner alone, its readings as chips on the wall. */
    ha-card.bn { padding: 0; }
    ha-card.bn > .banner { margin: 0; --sw: min(200px, 46%); }
    /* Narrower cards: the room is drawn smaller (75 %, 62 %, then 50 % of its height, its left part cropped). */
    @container (max-width: 420px) { .banner, ha-card.bn > .banner { --sw: 150px; --sk: .75; } }
    @container (max-width: 340px) { .banner, ha-card.bn > .banner { --sw: 112px; --sk: .62; } }
    @container (max-width: 260px) { .banner, ha-card.bn > .banner { --sw: 70px; --sk: .5; } }
    /* The chips that do not fit wrap to a second line, hidden: never a chip cut to "R…". */
    .banner .rs { display: flex; flex-wrap: wrap; gap: 4px; height: 20px; margin: 3px 0 0 -2px; min-width: 0; overflow: hidden; }
    .banner .r { flex: none; line-height: 20px; padding: 0 7px; color: var(--bt); background: rgba(255,255,255,.62); }
    .banner.night .r { background: rgba(10,20,40,.4); }
    .banner .ringb { position: absolute; inset: 0; }
    /* The mini card's badge: the progress ring and the count inside. */
    .badge .cnt { position: relative; font-size: 12px; font-weight: 700; color: var(--ic, var(--c)); }
  `;
}

// ── Editor ───────────────────────────────────────────────────────────────────
const chSchema = (booleans) => (lang) => [
  { name: "title", selector: { text: {} } },
  { name: "navigation_path", selector: { navigation: {} } },
  { name: "todo", selector: { entity: { domain: "todo", multiple: true } } },
  ...rcBooleans(...booleans),
  {
    name: "illustration_theme",
    selector: { select: { mode: "dropdown", options: ["auto", "day", "night"].map((value) => ({ value, label: rcT(CH_I18N, lang, `ed_theme_${value}`) })) } },
  },
  ...rcAdvanced(CH_I18N, lang, "people", "chores", "language"),
];

const CH_HELPERS = ["title", "todo", "people", "chores", "zoom", "language"];

const ChoresCardEditor = rcEditor({
  card: ChoresCard,
  helpers: CH_HELPERS,
  schema: chSchema(["show_title", "show_subtitle", "show_done", "show_points", "illustration", "animations"]),
});

rcRegister(ChoresCard, ChoresCardEditor, "Chores Card", "The household chores: the day's chores of each person, ticked off with a tap, the overdue ones first, and the kids' points");

// ── Mini card ────────────────────────────────────────────────────────────────
// The chores on two lines: a ring with the day's chores done as the badge, the count inside, the title and the state,
// then the chores left and the overdue ones as chips; the zoom button opens the full card in place.
class ChoresMiniCard extends rcMini(
  ChoresCard,
  "chores-mini-card",
  `
    .mini > .badge { background: none; }
    .ringb { width: 40px; height: 40px; }
  `,
) {
  getCardSize() {
    return this._zoomed ? super.getCardSize() : 1;
  }

  _drawMini(m) {
    if (!this._changed(["mini", m.state, m.total, m.done, m.left, m.overdue.length, this._night()])) return;
    // The overdue ones are the status pill already: the chip says what is left besides them.
    const rest = m.left - m.overdue.length;
    const chips = rest > 0 ? `<span class="r" title="${rcEsc(this._t("chip_left", { n: rest }))}"><span>${rcEsc(this._t("chip_left", { n: rest }))}</span></span>` : "";
    const pct = m.total ? (m.done / m.total) * 100 : 0;
    const L = 2 * Math.PI * 17;
    const badge = `<svg class="ringb" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="none" stroke="color-mix(in srgb, var(--c) 18%, transparent)" stroke-width="4"/><circle cx="20" cy="20" r="17" fill="none" stroke="var(--c)" stroke-width="4" stroke-linecap="round" stroke-dasharray="${((L * pct) / 100).toFixed(1)} 999" transform="rotate(-90 20 20)"/></svg>${m.total ? `<span class="cnt">${m.done}/${m.total}</span>` : '<ha-icon icon="mdi:broom"></ha-icon>'}`;
    const c = this._config;
    this.shadowRoot.innerHTML = `<style>${RC_BASE_STYLES}${this.constructor.styles}</style>
      <ha-card class="lvl-${m.state} bn${this._hass.themes?.darkMode ? " dk" : ""}">${this._banner(m, chips ? `<div class="rs">${chips}</div>` : "", badge)}</ha-card>`;
    if (c.navigation_path) rcBindNav(this.shadowRoot.querySelector(".head"), c.navigation_path);
    this._fitPill();
  }
}

const ChoresMiniCardEditor = rcEditor({
  card: ChoresMiniCard,
  helpers: CH_HELPERS,
  schema: chSchema(["show_title", "show_subtitle", "show_done", "show_points", "illustration", "animations", "zoom"]),
});

rcRegister(ChoresMiniCard, ChoresMiniCardEditor, "Chores Mini Card", "The chores on two lines: a progress ring, the chores left and the overdue ones, with a zoom to the full card");
