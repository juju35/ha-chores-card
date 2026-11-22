/**
 * Shared by the chores cards (its names are used by the other src/ files): the people and their chores, i18n helpers,
 * the base card (header, tiles, tap / hold), the mini card, the visual editor and the common styles. Same base as ha-room-card.
 * https://github.com/juju35/ha-chores-card
 */
const RC_VERSION = "__VERSION__";

const RC_HOLD_MS = 500;
const RC_MOVE_PX = 8;
// A held arrow key repeats some 30 times a second: one brightness step every RC_REPEAT_MS at most.
const RC_REPEAT_MS = 150;

// ── Overviews ────────────────────────────────────────────────────────────────
// Shared by room-overview-card and room-environment-overview-card.

// The zoom / detail button: the same icons on the overviews and the mini cards.
const rcZoomIcon = (card) => (card._zoomed ? "mdi:arrow-collapse" : "mdi:arrow-expand");

// Back to the compact view (mini card, or overview showing the rooms needing a look), when zoomed in.
const rcUnzoom = (card) => {
  if (!card._zoomed) return;
  card._zoomed = false;
  card._sig = null;
  card._render();
};

// True for a click outside `card` that is not in a dialog opened from it (more-info, say): it folds the card back.
const rcOutside = (card, ev) => !ev.composedPath().includes(card) && !rcInDialog(ev);

// "A click elsewhere" is caught on the pointer, not only on the click event: on iOS (Safari and the companion app)
// a tap on something that is not clickable (the background, an empty spot, a card with no action) sends no click to
// the page. The handler runs when the press and the release are both outside the card (a slider dragged out of the
// card does not count), and a scroll does not count (the browser cancels the pointer); keyboard clicks still go
// through the click event. The handler keeps its own checks (outside of the card, not in a dialog).
const watchOutside = (card, handler) => {
  let downOutside = false;
  const onDown = (ev) => {
    downOutside = !ev.composedPath().includes(card);
  };
  const onUp = (ev) => {
    if (downOutside) handler(ev);
    downOutside = false;
  };
  const onClick = (ev) => {
    if (ev.detail === 0) handler(ev);
  };
  return {
    on() {
      document.addEventListener("pointerdown", onDown, true);
      document.addEventListener("pointerup", onUp, true);
      document.addEventListener("click", onClick, true);
    },
    off() {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("click", onClick, true);
    },
    // A tap (press and release at the same spot), for the tests.
    tap(ev) {
      onDown(ev);
      onUp(ev);
    },
  };
};

// A click on the detail button: every room, or back to the rooms needing a look. True when handled.
const rcZoomClick = (card, ev) => {
  if (!ev.target.closest?.(".zoom")) return false;
  ev.stopPropagation();
  card._zoomed = !card._zoomed;
  card._sig = null;
  card._render();
  if (ev.detail === 0) card.shadowRoot.querySelector(".zoom")?.focus({ preventScroll: true });
  return true;
};

// ── i18n ─────────────────────────────────────────────────────────────────────
// Strings shared by the cards; a card's own dictionary wins over these.
const RC_I18N = {
  en: {
    turn_all_off: "Turn everything off",
    ed_title: "Title",
    ed_show_title: "Show title",
    ed_advanced: "Advanced",
    ed_language: "Language",
    ed_language_helper: "Empty: the Home Assistant language",
    ed_language_auto: "Automatic",
    ed_navigation_path: "Navigation path",
    err_config: "Set `area` or `entities`",
    zoom_in: "Show the full card",
    zoom_out: "Back to the compact view",
    ed_zoom: "Zoom button",
    ed_zoom_helper: "Switches the mini card to the full card and back",
  },
  fr: {
    turn_all_off: "Tout éteindre",
    ed_title: "Titre",
    ed_show_title: "Afficher le titre",
    ed_advanced: "Avancé",
    ed_language: "Langue",
    ed_language_helper: "Vide : la langue de Home Assistant",
    ed_language_auto: "Automatique",
    ed_navigation_path: "Chemin de navigation",
    err_config: "Définis `area` ou `entities`",
    zoom_in: "Afficher la carte complète",
    zoom_out: "Revenir à la vue compacte",
    ed_zoom: "Bouton zoom",
    ed_zoom_helper: "Bascule la mini-carte en carte complète, et inversement",
  },
  de: {
    turn_all_off: "Alles ausschalten",
    ed_title: "Titel",
    ed_show_title: "Titel anzeigen",
    ed_advanced: "Erweitert",
    ed_language: "Sprache",
    ed_language_helper: "Leer: die Sprache von Home Assistant",
    ed_language_auto: "Automatisch",
    ed_navigation_path: "Navigationspfad",
    err_config: "Lege `area` oder `entities` fest",
    zoom_in: "Vollständige Karte anzeigen",
    zoom_out: "Zurück zur kompakten Ansicht",
    ed_zoom: "Zoom-Schaltfläche",
    ed_zoom_helper: "Wechselt von der Mini-Karte zur vollständigen Karte und zurück",
  },
  es: {
    turn_all_off: "Apagar todo",
    ed_title: "Título",
    ed_show_title: "Mostrar el título",
    ed_advanced: "Avanzado",
    ed_language: "Idioma",
    ed_language_helper: "Vacío: el idioma de Home Assistant",
    ed_language_auto: "Automático",
    ed_navigation_path: "Ruta de navegación",
    err_config: "Define `area` o `entities`",
    zoom_in: "Mostrar la tarjeta completa",
    zoom_out: "Volver a la vista compacta",
    ed_zoom: "Botón de zoom",
    ed_zoom_helper: "Cambia de la minitarjeta a la tarjeta completa y viceversa",
  },
  sr: {
    turn_all_off: "Искључи све",
    ed_title: "Наслов",
    ed_show_title: "Прикажи наслов",
    ed_advanced: "Напредно",
    ed_language: "Језик",
    ed_language_helper: "Празно: језик Home Assistant-а",
    ed_language_auto: "Аутоматски",
    ed_navigation_path: "Путања за навигацију",
    err_config: "Подесите `area` или `entities`",
    zoom_in: "Прикажи целу картицу",
    zoom_out: "Назад на компактни приказ",
    ed_zoom: "Дугме за увећање",
    ed_zoom_helper: "Пребацује мини картицу на пун приказ и назад",
  },
  "sr-Latn": {
    turn_all_off: "Isključi sve",
    ed_title: "Naslov",
    ed_show_title: "Prikaži naslov",
    ed_advanced: "Napredno",
    ed_language: "Jezik",
    ed_language_helper: "Prazno: jezik Home Assistant-a",
    ed_language_auto: "Automatski",
    ed_navigation_path: "Putanja za navigaciju",
    err_config: "Podesite `area` ili `entities`",
    zoom_in: "Prikaži celu karticu",
    zoom_out: "Nazad na kompaktni prikaz",
    ed_zoom: "Dugme za uvećanje",
    ed_zoom_helper: "Prebacuje mini karticu na pun prikaz i nazad",
  },
  it: {
    turn_all_off: "Spegni tutto",
    ed_title: "Titolo",
    ed_show_title: "Mostra il titolo",
    ed_advanced: "Avanzate",
    ed_language: "Lingua",
    ed_language_helper: "Vuoto: la lingua di Home Assistant",
    ed_language_auto: "Automatica",
    ed_navigation_path: "Percorso di navigazione",
    err_config: "Imposta `area` o `entities`",
    zoom_in: "Mostra la scheda completa",
    zoom_out: "Torna alla vista compatta",
    ed_zoom: "Pulsante zoom",
    ed_zoom_helper: "Passa dalla mini scheda alla scheda completa e viceversa",
  },
  nl: {
    turn_all_off: "Alles uitschakelen",
    ed_title: "Titel",
    ed_show_title: "Titel tonen",
    ed_advanced: "Geavanceerd",
    ed_language: "Taal",
    ed_language_helper: "Leeg: de taal van Home Assistant",
    ed_language_auto: "Automatisch",
    ed_navigation_path: "Navigatiepad",
    err_config: "Stel `area` of `entities` in",
    zoom_in: "Volledige kaart tonen",
    zoom_out: "Terug naar de compacte weergave",
    ed_zoom: "Zoomknop",
    ed_zoom_helper: "Schakelt de minikaart naar de volledige kaart en terug",
  },
  pt: {
    turn_all_off: "Desligar tudo",
    ed_title: "Título",
    ed_show_title: "Mostrar o título",
    ed_advanced: "Avançado",
    ed_language: "Idioma",
    ed_language_helper: "Vazio: o idioma do Home Assistant",
    ed_language_auto: "Automático",
    ed_navigation_path: "Caminho de navegação",
    err_config: "Defina `area` ou `entities`",
    zoom_in: "Mostrar o cartão completo",
    zoom_out: "Voltar à vista compacta",
    ed_zoom: "Botão de zoom",
    ed_zoom_helper: "Alterna entre o minicartão e o cartão completo",
  },
  pl: {
    turn_all_off: "Wyłącz wszystko",
    ed_title: "Tytuł",
    ed_show_title: "Pokaż tytuł",
    ed_advanced: "Zaawansowane",
    ed_language: "Język",
    ed_language_helper: "Puste: język Home Assistanta",
    ed_language_auto: "Automatyczny",
    ed_navigation_path: "Ścieżka nawigacji",
    err_config: "Ustaw `area` lub `entities`",
    zoom_in: "Pokaż pełną kartę",
    zoom_out: "Wróć do widoku kompaktowego",
    ed_zoom: "Przycisk powiększenia",
    ed_zoom_helper: "Przełącza minikartę na pełną kartę i z powrotem",
  },
  ro: {
    turn_all_off: "Oprește tot",
    ed_title: "Titlu",
    ed_show_title: "Afișează titlul",
    ed_advanced: "Avansat",
    ed_language: "Limbă",
    ed_language_helper: "Gol: limba Home Assistant",
    ed_language_auto: "Automată",
    ed_navigation_path: "Cale de navigare",
    err_config: "Setează `area` sau `entities`",
    zoom_in: "Afișează cardul complet",
    zoom_out: "Înapoi la vizualizarea compactă",
    ed_zoom: "Buton de zoom",
    ed_zoom_helper: "Comută între mini-card și cardul complet",
  },
  da: {
    turn_all_off: "Sluk alt",
    ed_title: "Titel",
    ed_show_title: "Vis titel",
    ed_advanced: "Avanceret",
    ed_language: "Sprog",
    ed_language_helper: "Tomt: Home Assistants sprog",
    ed_language_auto: "Automatisk",
    ed_navigation_path: "Navigationssti",
    err_config: "Angiv `area` eller `entities`",
    zoom_in: "Vis hele kortet",
    zoom_out: "Tilbage til den kompakte visning",
    ed_zoom: "Zoomknap",
    ed_zoom_helper: "Skifter fra minikortet til hele kortet og tilbage",
  },
  sv: {
    turn_all_off: "Stäng av allt",
    ed_title: "Titel",
    ed_show_title: "Visa rubrik",
    ed_advanced: "Avancerat",
    ed_language: "Språk",
    ed_language_helper: "Tomt: Home Assistants språk",
    ed_language_auto: "Automatiskt",
    ed_navigation_path: "Navigeringssökväg",
    err_config: "Ange `area` eller `entities`",
    zoom_in: "Visa hela kortet",
    zoom_out: "Tillbaka till kompakt vy",
    ed_zoom: "Zoomknapp",
    ed_zoom_helper: "Växlar mellan minikortet och hela kortet",
  },
  bg: {
    turn_all_off: "Изключи всичко",
    ed_title: "Заглавие",
    ed_show_title: "Показване на заглавието",
    ed_advanced: "Разширени",
    ed_language: "Език",
    ed_language_helper: "Празно: езикът на Home Assistant",
    ed_language_auto: "Автоматично",
    ed_navigation_path: "Път за навигация",
    err_config: "Задайте `area` или `entities`",
    zoom_in: "Покажи пълната карта",
    zoom_out: "Обратно към компактния изглед",
    ed_zoom: "Бутон за увеличение",
    ed_zoom_helper: "Превключва от мини картата към пълната карта и обратно",
  },
  ru: {
    turn_all_off: "Выключить всё",
    ed_title: "Заголовок",
    ed_show_title: "Показывать заголовок",
    ed_advanced: "Дополнительно",
    ed_language: "Язык",
    ed_language_helper: "Пусто: язык Home Assistant",
    ed_language_auto: "Автоматически",
    ed_navigation_path: "Путь навигации",
    err_config: "Укажите `area` или `entities`",
    zoom_in: "Показать полную карточку",
    zoom_out: "Вернуться к компактному виду",
    ed_zoom: "Кнопка масштаба",
    ed_zoom_helper: "Переключает мини-карточку на полную карточку и обратно",
  },
  uk: {
    turn_all_off: "Вимкнути все",
    ed_title: "Заголовок",
    ed_show_title: "Показувати заголовок",
    ed_advanced: "Додатково",
    ed_language: "Мова",
    ed_language_helper: "Порожньо: мова Home Assistant",
    ed_language_auto: "Автоматично",
    ed_navigation_path: "Шлях навігації",
    err_config: "Вкажіть `area` або `entities`",
    zoom_in: "Показати повну картку",
    zoom_out: "Повернутися до компактного вигляду",
    ed_zoom: "Кнопка масштабу",
    ed_zoom_helper: "Перемикає міні-картку на повну картку й назад",
  },
  hu: {
    turn_all_off: "Minden kikapcsolása",
    ed_title: "Cím",
    ed_show_title: "Cím megjelenítése",
    ed_advanced: "Speciális",
    ed_language: "Nyelv",
    ed_language_helper: "Üres: a Home Assistant nyelve",
    ed_language_auto: "Automatikus",
    ed_navigation_path: "Navigációs útvonal",
    err_config: "Állítsd be az `area` vagy az `entities` értékét",
    zoom_in: "A teljes kártya megjelenítése",
    zoom_out: "Vissza a kompakt nézethez",
    ed_zoom: "Nagyítás gomb",
    ed_zoom_helper: "Vált a mini kártya és a teljes kártya között",
  },
  sk: {
    turn_all_off: "Vypnúť všetko",
    ed_title: "Názov",
    ed_show_title: "Zobraziť názov",
    ed_advanced: "Rozšírené",
    ed_language: "Jazyk",
    ed_language_helper: "Prázdne: jazyk Home Assistanta",
    ed_language_auto: "Automaticky",
    ed_navigation_path: "Navigačná cesta",
    err_config: "Nastavte `area` alebo `entities`",
    zoom_in: "Zobraziť celú kartu",
    zoom_out: "Späť na kompaktné zobrazenie",
    ed_zoom: "Tlačidlo priblíženia",
    ed_zoom_helper: "Prepína minikartu na celú kartu a späť",
  },
  cs: {
    turn_all_off: "Vypnout vše",
    ed_title: "Název",
    ed_show_title: "Zobrazit název",
    ed_advanced: "Pokročilé",
    ed_language: "Jazyk",
    ed_language_helper: "Prázdné: jazyk Home Assistanta",
    ed_language_auto: "Automaticky",
    ed_navigation_path: "Navigační cesta",
    err_config: "Nastavte `area` nebo `entities`",
    zoom_in: "Zobrazit celou kartu",
    zoom_out: "Zpět na kompaktní zobrazení",
    ed_zoom: "Tlačítko přiblížení",
    ed_zoom_helper: "Přepíná minikartu na celou kartu a zpět",
  },
  sl: {
    turn_all_off: "Izklopi vse",
    ed_title: "Naslov",
    ed_show_title: "Prikaži naslov",
    ed_advanced: "Napredno",
    ed_language: "Jezik",
    ed_language_helper: "Prazno: jezik Home Assistanta",
    ed_language_auto: "Samodejno",
    ed_navigation_path: "Navigacijska pot",
    err_config: "Nastavite `area` ali `entities`",
    zoom_in: "Prikaži celotno kartico",
    zoom_out: "Nazaj na strnjen pogled",
    ed_zoom: "Gumb za povečavo",
    ed_zoom_helper: "Preklopi mini kartico v celotno kartico in nazaj",
  },
  lv: {
    turn_all_off: "Izslēgt visu",
    ed_title: "Virsraksts",
    ed_show_title: "Rādīt virsrakstu",
    ed_advanced: "Papildu",
    ed_language: "Valoda",
    ed_language_helper: "Tukšs: Home Assistant valoda",
    ed_language_auto: "Automātiski",
    ed_navigation_path: "Navigācijas ceļš",
    err_config: "Iestatiet `area` vai `entities`",
    zoom_in: "Rādīt pilno karti",
    zoom_out: "Atpakaļ uz kompakto skatu",
    ed_zoom: "Tālummaiņas poga",
    ed_zoom_helper: "Pārslēdz mini karti uz pilno karti un atpakaļ",
  },
  el: {
    turn_all_off: "Απενεργοποίηση όλων",
    ed_title: "Τίτλος",
    ed_show_title: "Εμφάνιση τίτλου",
    ed_advanced: "Για προχωρημένους",
    ed_language: "Γλώσσα",
    ed_language_helper: "Κενό: η γλώσσα του Home Assistant",
    ed_language_auto: "Αυτόματα",
    ed_navigation_path: "Διαδρομή πλοήγησης",
    err_config: "Ορίστε `area` ή `entities`",
    zoom_in: "Εμφάνιση της πλήρους κάρτας",
    zoom_out: "Επιστροφή στη συμπαγή προβολή",
    ed_zoom: "Κουμπί ζουμ",
    ed_zoom_helper: "Εναλλάσσει τη μίνι κάρτα με την πλήρη κάρτα",
  },
};

// ── Chores ───────────────────────────────────────────────────────────────────
// The chores come from to-do lists (each person's own, as `people[].todo` or a list named after them, and the shared
// ones in `todo`; Donetick's lists are to-do lists too), from Chore Helper's sensors and from Grocy's chores sensor.
// A chore is kept when it is due today, overdue, undated and not done, or done today (an undated to-do item: ticked
// off since the card saw it open today, see chTrack). Points: a `+N` in a to-do item
// (`Make bed +5`) or `points` in `chores`; each kid's total comes from a sensor (KidsChores, ChoreOps, an
// input_number) set in `people[].points`.
// The avatars' colours: none of the card's violet accent, nor the meal card's orange (the two often side by side).
const CH_COLORS = ["#4263eb", "#0ca678", "#d6336c", "#1098ad", "#e8590c", "#5c940d"];
// A colour for an avatar: a hex colour, rgb()/hsl() or a CSS variable; anything else is left out (the palette's).
const chColor = (v) => (/^(#[0-9a-f]{3,8}|(rgb|hsl)a?\([\d\s.,%/+-]+\)|var\(--[\w-]+\))$/i.test(String(v ?? "").trim()) ? String(v).trim() : null);
const CH_DAY = 24 * 3.6e6;

const chNorm = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

// Midnight of the day holding `t` (ms), in the browser's time zone.
const chMidnight = (t) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
// A due date or time ("2026-11-22", an ISO date-time) as the midnight of its day; null when there is none.
const chDueDay = (v) => {
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v));
  const t = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime() : new Date(v).getTime();
  return Number.isFinite(t) ? chMidnight(t) : null;
};
// "Make bed +5": the name and its points.
const chPoints = (text) => {
  const m = /(?:^|\s)\+(\d{1,4})(?:\s*(?:pts?|points?))?\s*$/i.exec(String(text ?? ""));
  return m ? { name: String(text).slice(0, m.index).trim(), points: Number(m[1]) } : { name: String(text ?? "").trim(), points: null };
};
// "Kid 1" → "K1", "Alex Martin" → "AM", "Sam" → "S".
const chInitials = (name) =>
  String(name ?? "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => (/^\d/.test(w) ? w : w[0]?.toUpperCase() || ""))
    .join("") || "?";

// The people of the card: `people` (person entities, or { person, todo, points, reward, reward_points, name }), else
// every person of the home. A person's to-do list, when not set, is the one named after them.
const chPeople = (hass, config) => {
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
const chTodoLists = (people, config) => [...new Set([...people.map((p) => p.todo).filter(Boolean), ...[].concat(config.todo || [])])];

// The undated to-do items seen open today, and those of them completed since. A to-do list does not say when an item
// was completed, so an undated item counts as done today only when the card saw it open today (or ticked it off);
// one completed before stays out. `store` is the day's record (kept by the card between reloads), `todo` the items.
const chTrack = (store, todo, today) => {
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
const chCollect = ({ hass, config, people, todo = new Map(), now, doneUndated = [] }) => {
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
const chSince = (due, now, lang) => {
  const days = Math.round((chMidnight(now) - due) / CH_DAY);
  if (days <= 1) return null;
  try {
    return days < 7 ? new Intl.DateTimeFormat(lang, { weekday: "long" }).format(new Date(due)) : new Intl.DateTimeFormat(lang, { day: "numeric", month: "short" }).format(new Date(due));
  } catch {
    return new Date(due).toDateString();
  }
};

// Strings of the chores cards; the shared ones above (editor basics) complete them.
const CH_I18N = {
  en: {
    title: "Chores",
    st_overdue_one: "{n} overdue",
    st_overdue_many: "{n} overdue",
    st_left_one: "{n} left",
    st_left_many: "{n} left",
    st_done: "All done",
    st_empty: "Nothing today",
    sub_done: "{d} of {t} done today",
    all: "All",
    overdue: "Overdue",
    today: "Today",
    done_of: "{d} of {t} done",
    since: "since {d}",
    since_yesterday: "since yesterday",
    pts_one: "{n} pt",
    pts_many: "{n} pts",
    reward_to: "{n} to {r}",
    reward_ready: "{r}: ready!",
    chip_left_one: "{n} left today",
    chip_left_many: "{n} left today",
    empty: "No chores today",
    mark_done: "Mark as done",
    mark_todo: "Mark as not done",
    ed_people: "People (YAML)",
    ed_people_helper: "Person entities, or { person, todo, points, reward, reward_points }; empty: every person",
    ed_todo: "Shared to-do lists",
    ed_todo_helper: "To-do lists whose chores belong to no one in particular",
    ed_chores: "Chores (YAML)",
    ed_chores_helper: "Chore Helper sensors or Grocy chores (grocy:<id>) with their person and points",
    ed_show_points: "Kids' points",
    ed_show_done: "Done chores",
    ed_show_subtitle: "Show subtitle",
    ed_illustration: "Illustrated header",
    ed_illustration_theme: "Header theme",
    ed_theme_auto: "Automatic (follows the theme)",
    ed_theme_day: "Day",
    ed_theme_night: "Night",
    ed_animations: "Animations",
    ed_title_helper: "Empty: Chores",
  },
  fr: {
    title: "Tâches",
    st_overdue_one: "{n} en retard",
    st_overdue_many: "{n} en retard",
    st_left_one: "{n} restante",
    st_left_many: "{n} restantes",
    st_done: "Tout est fait",
    st_empty: "Rien aujourd'hui",
    sub_done: "{d} sur {t} faites aujourd'hui",
    all: "Tous",
    overdue: "En retard",
    today: "Aujourd'hui",
    done_of: "{d} sur {t} faites",
    since: "depuis {d}",
    since_yesterday: "depuis hier",
    pts_one: "{n} pt",
    pts_many: "{n} pts",
    reward_to: "{n} avant {r}",
    reward_ready: "{r} : c'est gagné !",
    chip_left_one: "{n} restante aujourd'hui",
    chip_left_many: "{n} restantes aujourd'hui",
    empty: "Aucune tâche aujourd'hui",
    mark_done: "Marquer comme faite",
    mark_todo: "Marquer comme à faire",
    ed_people: "Personnes (YAML)",
    ed_people_helper: "Entités person, ou { person, todo, points, reward, reward_points } ; vide : toutes les personnes",
    ed_todo: "Listes de tâches partagées",
    ed_todo_helper: "Listes dont les tâches ne sont à personne en particulier",
    ed_chores: "Tâches (YAML)",
    ed_chores_helper: "Capteurs Chore Helper ou tâches Grocy (grocy:<id>) avec leur personne et leurs points",
    ed_show_points: "Points des enfants",
    ed_show_done: "Tâches faites",
    ed_show_subtitle: "Afficher le sous-titre",
    ed_illustration: "En-tête illustré",
    ed_illustration_theme: "Thème de l'en-tête",
    ed_theme_auto: "Automatique (suit le thème)",
    ed_theme_day: "Jour",
    ed_theme_night: "Nuit",
    ed_animations: "Animations",
    ed_title_helper: "Vide : Tâches",
  },
  de: {
    title: "Aufgaben",
    st_overdue_one: "{n} überfällig",
    st_overdue_many: "{n} überfällig",
    st_left_one: "{n} offen",
    st_left_many: "{n} offen",
    st_done: "Alles erledigt",
    st_empty: "Heute nichts",
    sub_done: "{d} von {t} heute erledigt",
    all: "Alle",
    overdue: "Überfällig",
    today: "Heute",
    done_of: "{d} von {t} erledigt",
    since: "seit {d}",
    since_yesterday: "seit gestern",
    pts_one: "{n} Pkt.",
    pts_many: "{n} Pkt.",
    reward_to: "{n} bis {r}",
    reward_ready: "{r}: geschafft!",
    chip_left_one: "{n} heute offen",
    chip_left_many: "{n} heute offen",
    empty: "Heute keine Aufgaben",
    mark_done: "Als erledigt markieren",
    mark_todo: "Als offen markieren",
    ed_people: "Personen (YAML)",
    ed_people_helper: "Person-Entitäten oder { person, todo, points, reward, reward_points }; leer: alle Personen",
    ed_todo: "Gemeinsame To-do-Listen",
    ed_todo_helper: "Listen, deren Aufgaben niemandem bestimmten gehören",
    ed_chores: "Aufgaben (YAML)",
    ed_chores_helper: "Chore-Helper-Sensoren oder Grocy-Aufgaben (grocy:<id>) mit Person und Punkten",
    ed_show_points: "Punkte der Kinder",
    ed_show_done: "Erledigte Aufgaben",
    ed_show_subtitle: "Untertitel anzeigen",
    ed_illustration: "Illustrierte Kopfzeile",
    ed_illustration_theme: "Design der Kopfzeile",
    ed_theme_auto: "Automatisch (folgt dem Design)",
    ed_theme_day: "Tag",
    ed_theme_night: "Nacht",
    ed_animations: "Animationen",
    ed_title_helper: "Leer: Aufgaben",
  },
  es: {
    title: "Tareas",
    st_overdue_one: "{n} atrasada",
    st_overdue_many: "{n} atrasadas",
    st_left_one: "{n} pendiente",
    st_left_many: "{n} pendientes",
    st_done: "Todo hecho",
    st_empty: "Nada hoy",
    sub_done: "{d} de {t} hechas hoy",
    all: "Todos",
    overdue: "Atrasadas",
    today: "Hoy",
    done_of: "{d} de {t} hechas",
    since: "desde {d}",
    since_yesterday: "desde ayer",
    pts_one: "{n} pt",
    pts_many: "{n} pts",
    reward_to: "{n} para {r}",
    reward_ready: "{r}: ¡conseguido!",
    chip_left_one: "{n} pendiente hoy",
    chip_left_many: "{n} pendientes hoy",
    empty: "Ninguna tarea hoy",
    mark_done: "Marcar como hecha",
    mark_todo: "Marcar como pendiente",
    ed_people: "Personas (YAML)",
    ed_people_helper: "Entidades person, o { person, todo, points, reward, reward_points }; vacío: todas las personas",
    ed_todo: "Listas de tareas compartidas",
    ed_todo_helper: "Listas cuyas tareas no son de nadie en particular",
    ed_chores: "Tareas (YAML)",
    ed_chores_helper: "Sensores de Chore Helper o tareas de Grocy (grocy:<id>) con su persona y sus puntos",
    ed_show_points: "Puntos de los niños",
    ed_show_done: "Tareas hechas",
    ed_show_subtitle: "Mostrar subtítulo",
    ed_illustration: "Encabezado ilustrado",
    ed_illustration_theme: "Tema del encabezado",
    ed_theme_auto: "Automático (sigue el tema)",
    ed_theme_day: "Día",
    ed_theme_night: "Noche",
    ed_animations: "Animaciones",
    ed_title_helper: "Vacío: Tareas",
  },
  sr: {
    title: "Кућни послови",
    st_overdue_one: "Касни: {n}",
    st_overdue_many: "Касни: {n}",
    st_left_one: "Преостало: {n}",
    st_left_many: "Преостало: {n}",
    st_done: "Све је урађено",
    st_empty: "Данас ништа",
    sub_done: "Данас урађено {d} од {t}",
    all: "Сви",
    overdue: "Касни",
    today: "Данас",
    done_of: "Урађено {d} од {t}",
    since: "од {d}",
    since_yesterday: "од јуче",
    pts_one: "{n} поен",
    pts_few: "{n} поена",
    pts_many: "{n} поена",
    reward_to: "{n} до: {r}",
    reward_ready: "{r}: освојено!",
    chip_left_one: "Данас преостало: {n}",
    chip_left_many: "Данас преостало: {n}",
    empty: "Данас нема послова",
    mark_done: "Означи као урађено",
    mark_todo: "Означи као неурађено",
    ed_people: "Особе (YAML)",
    ed_people_helper: "Ентитети person, или { person, todo, points, reward, reward_points }; празно: све особе",
    ed_todo: "Заједничке листе задатака",
    ed_todo_helper: "Листе чији послови не припадају никоме посебно",
    ed_chores: "Послови (YAML)",
    ed_chores_helper: "Сензори Chore Helper или послови Grocy (grocy:<id>) са особом и поенима",
    ed_show_points: "Поени деце",
    ed_show_done: "Урађени послови",
    ed_show_subtitle: "Прикажи поднаслов",
    ed_illustration: "Илустровано заглавље",
    ed_illustration_theme: "Тема заглавља",
    ed_theme_auto: "Аутоматски (прати тему)",
    ed_theme_day: "Дан",
    ed_theme_night: "Ноћ",
    ed_animations: "Анимације",
    ed_title_helper: "Празно: Кућни послови",
  },
  "sr-Latn": {
    title: "Kućni poslovi",
    st_overdue_one: "Kasni: {n}",
    st_overdue_many: "Kasni: {n}",
    st_left_one: "Preostalo: {n}",
    st_left_many: "Preostalo: {n}",
    st_done: "Sve je urađeno",
    st_empty: "Danas ništa",
    sub_done: "Danas urađeno {d} od {t}",
    all: "Svi",
    overdue: "Kasni",
    today: "Danas",
    done_of: "Urađeno {d} od {t}",
    since: "od {d}",
    since_yesterday: "od juče",
    pts_one: "{n} poen",
    pts_few: "{n} poena",
    pts_many: "{n} poena",
    reward_to: "{n} do: {r}",
    reward_ready: "{r}: osvojeno!",
    chip_left_one: "Danas preostalo: {n}",
    chip_left_many: "Danas preostalo: {n}",
    empty: "Danas nema poslova",
    mark_done: "Označi kao urađeno",
    mark_todo: "Označi kao neurađeno",
    ed_people: "Osobe (YAML)",
    ed_people_helper: "Entiteti person, ili { person, todo, points, reward, reward_points }; prazno: sve osobe",
    ed_todo: "Zajedničke liste zadataka",
    ed_todo_helper: "Liste čiji poslovi ne pripadaju nikome posebno",
    ed_chores: "Poslovi (YAML)",
    ed_chores_helper: "Senzori Chore Helper ili poslovi Grocy (grocy:<id>) sa osobom i poenima",
    ed_show_points: "Poeni dece",
    ed_show_done: "Urađeni poslovi",
    ed_show_subtitle: "Prikaži podnaslov",
    ed_illustration: "Ilustrovano zaglavlje",
    ed_illustration_theme: "Tema zaglavlja",
    ed_theme_auto: "Automatski (prati temu)",
    ed_theme_day: "Dan",
    ed_theme_night: "Noć",
    ed_animations: "Animacije",
    ed_title_helper: "Prazno: Kućni poslovi",
  },
  it: {
    title: "Faccende",
    st_overdue_one: "{n} in ritardo",
    st_overdue_many: "{n} in ritardo",
    st_left_one: "{n} da fare",
    st_left_many: "{n} da fare",
    st_done: "Tutto fatto",
    st_empty: "Niente oggi",
    sub_done: "{d} di {t} fatte oggi",
    all: "Tutti",
    overdue: "In ritardo",
    today: "Oggi",
    done_of: "{d} di {t} fatte",
    since: "da {d}",
    since_yesterday: "da ieri",
    pts_one: "{n} pt",
    pts_many: "{n} pt",
    reward_to: "{n} a {r}",
    reward_ready: "{r}: ottenuto!",
    chip_left_one: "{n} da fare oggi",
    chip_left_many: "{n} da fare oggi",
    empty: "Nessuna faccenda oggi",
    mark_done: "Segna come fatta",
    mark_todo: "Segna come da fare",
    ed_people: "Persone (YAML)",
    ed_people_helper: "Entità person, oppure { person, todo, points, reward, reward_points }; vuoto: tutte le persone",
    ed_todo: "Liste di cose da fare condivise",
    ed_todo_helper: "Liste le cui faccende non sono di nessuno in particolare",
    ed_chores: "Faccende (YAML)",
    ed_chores_helper: "Sensori Chore Helper o faccende Grocy (grocy:<id>) con persona e punti",
    ed_show_points: "Punti dei bambini",
    ed_show_done: "Faccende fatte",
    ed_show_subtitle: "Mostra sottotitolo",
    ed_illustration: "Intestazione illustrata",
    ed_illustration_theme: "Tema dell'intestazione",
    ed_theme_auto: "Automatico (segue il tema)",
    ed_theme_day: "Giorno",
    ed_theme_night: "Notte",
    ed_animations: "Animazioni",
    ed_title_helper: "Vuoto: Faccende",
  },
  nl: {
    title: "Klusjes",
    st_overdue_one: "{n} te laat",
    st_overdue_many: "{n} te laat",
    st_left_one: "{n} te doen",
    st_left_many: "{n} te doen",
    st_done: "Alles gedaan",
    st_empty: "Niets vandaag",
    sub_done: "{d} van {t} vandaag gedaan",
    all: "Iedereen",
    overdue: "Te laat",
    today: "Vandaag",
    done_of: "{d} van {t} gedaan",
    since: "sinds {d}",
    since_yesterday: "sinds gisteren",
    pts_one: "{n} pt",
    pts_many: "{n} ptn",
    reward_to: "nog {n} tot {r}",
    reward_ready: "{r}: gehaald!",
    chip_left_one: "{n} vandaag te doen",
    chip_left_many: "{n} vandaag te doen",
    empty: "Vandaag geen klusjes",
    mark_done: "Markeren als gedaan",
    mark_todo: "Markeren als te doen",
    ed_people: "Personen (YAML)",
    ed_people_helper: "Persoon-entiteiten, of { person, todo, points, reward, reward_points }; leeg: alle personen",
    ed_todo: "Gedeelde takenlijsten",
    ed_todo_helper: "Lijsten waarvan de klusjes van niemand in het bijzonder zijn",
    ed_chores: "Klusjes (YAML)",
    ed_chores_helper: "Chore Helper-sensoren of Grocy-klusjes (grocy:<id>) met hun persoon en punten",
    ed_show_points: "Punten van de kinderen",
    ed_show_done: "Gedane klusjes",
    ed_show_subtitle: "Ondertitel tonen",
    ed_illustration: "Geïllustreerde koptekst",
    ed_illustration_theme: "Thema van de koptekst",
    ed_theme_auto: "Automatisch (volgt het thema)",
    ed_theme_day: "Dag",
    ed_theme_night: "Nacht",
    ed_animations: "Animaties",
    ed_title_helper: "Leeg: Klusjes",
  },
  pt: {
    title: "Tarefas",
    st_overdue_one: "{n} em atraso",
    st_overdue_many: "{n} em atraso",
    st_left_one: "{n} por fazer",
    st_left_many: "{n} por fazer",
    st_done: "Tudo feito",
    st_empty: "Nada hoje",
    sub_done: "{d} de {t} feitas hoje",
    all: "Todos",
    overdue: "Em atraso",
    today: "Hoje",
    done_of: "{d} de {t} feitas",
    since: "desde {d}",
    since_yesterday: "desde ontem",
    pts_one: "{n} pt",
    pts_many: "{n} pts",
    reward_to: "{n} para {r}",
    reward_ready: "{r}: conseguido!",
    chip_left_one: "{n} por fazer hoje",
    chip_left_many: "{n} por fazer hoje",
    empty: "Nenhuma tarefa hoje",
    mark_done: "Marcar como feita",
    mark_todo: "Marcar como por fazer",
    ed_people: "Pessoas (YAML)",
    ed_people_helper: "Entidades person, ou { person, todo, points, reward, reward_points }; vazio: todas as pessoas",
    ed_todo: "Listas de tarefas partilhadas",
    ed_todo_helper: "Listas cujas tarefas não são de ninguém em particular",
    ed_chores: "Tarefas (YAML)",
    ed_chores_helper: "Sensores Chore Helper ou tarefas Grocy (grocy:<id>) com a sua pessoa e pontos",
    ed_show_points: "Pontos das crianças",
    ed_show_done: "Tarefas feitas",
    ed_show_subtitle: "Mostrar subtítulo",
    ed_illustration: "Cabeçalho ilustrado",
    ed_illustration_theme: "Tema do cabeçalho",
    ed_theme_auto: "Automático (segue o tema)",
    ed_theme_day: "Dia",
    ed_theme_night: "Noite",
    ed_animations: "Animações",
    ed_title_helper: "Vazio: Tarefas",
  },
  pl: {
    title: "Obowiązki",
    st_overdue_one: "Zaległe: {n}",
    st_overdue_many: "Zaległe: {n}",
    st_left_one: "Do zrobienia: {n}",
    st_left_many: "Do zrobienia: {n}",
    st_done: "Wszystko zrobione",
    st_empty: "Dziś nic",
    sub_done: "Dziś zrobiono {d} z {t}",
    all: "Wszyscy",
    overdue: "Zaległe",
    today: "Dziś",
    done_of: "Zrobiono {d} z {t}",
    since: "od {d}",
    since_yesterday: "od wczoraj",
    pts_one: "{n} pkt",
    pts_many: "{n} pkt",
    reward_to: "{n} do: {r}",
    reward_ready: "{r}: zdobyte!",
    chip_left_one: "Dziś do zrobienia: {n}",
    chip_left_many: "Dziś do zrobienia: {n}",
    empty: "Dziś brak obowiązków",
    mark_done: "Oznacz jako zrobione",
    mark_todo: "Oznacz jako do zrobienia",
    ed_people: "Osoby (YAML)",
    ed_people_helper: "Encje person lub { person, todo, points, reward, reward_points }; puste: wszystkie osoby",
    ed_todo: "Wspólne listy zadań",
    ed_todo_helper: "Listy, których obowiązki nie należą do nikogo konkretnego",
    ed_chores: "Obowiązki (YAML)",
    ed_chores_helper: "Czujniki Chore Helper lub obowiązki Grocy (grocy:<id>) z osobą i punktami",
    ed_show_points: "Punkty dzieci",
    ed_show_done: "Zrobione obowiązki",
    ed_show_subtitle: "Pokaż podtytuł",
    ed_illustration: "Ilustrowany nagłówek",
    ed_illustration_theme: "Motyw nagłówka",
    ed_theme_auto: "Automatycznie (zgodnie z motywem)",
    ed_theme_day: "Dzień",
    ed_theme_night: "Noc",
    ed_animations: "Animacje",
    ed_title_helper: "Puste: Obowiązki",
  },
  ro: {
    title: "Treburi",
    st_overdue_one: "{n} întârziată",
    st_overdue_many: "{n} întârziate",
    st_left_one: "{n} rămasă",
    st_left_many: "{n} rămase",
    st_done: "Totul e gata",
    st_empty: "Nimic azi",
    sub_done: "{d} din {t} făcute azi",
    all: "Toți",
    overdue: "Întârziate",
    today: "Azi",
    done_of: "{d} din {t} făcute",
    since: "din {d}",
    since_yesterday: "de ieri",
    pts_one: "{n} pct",
    pts_many: "{n} pct",
    reward_to: "{n} până la {r}",
    reward_ready: "{r}: câștigat!",
    chip_left_one: "{n} rămasă azi",
    chip_left_many: "{n} rămase azi",
    empty: "Nicio treabă azi",
    mark_done: "Marchează ca făcută",
    mark_todo: "Marchează ca nefăcută",
    ed_people: "Persoane (YAML)",
    ed_people_helper: "Entități person sau { person, todo, points, reward, reward_points }; gol: toate persoanele",
    ed_todo: "Liste de sarcini comune",
    ed_todo_helper: "Liste ale căror treburi nu sunt ale nimănui anume",
    ed_chores: "Treburi (YAML)",
    ed_chores_helper: "Senzori Chore Helper sau treburi Grocy (grocy:<id>) cu persoana și punctele lor",
    ed_show_points: "Punctele copiilor",
    ed_show_done: "Treburi făcute",
    ed_show_subtitle: "Afișează subtitlul",
    ed_illustration: "Antet ilustrat",
    ed_illustration_theme: "Tema antetului",
    ed_theme_auto: "Automat (urmează tema)",
    ed_theme_day: "Zi",
    ed_theme_night: "Noapte",
    ed_animations: "Animații",
    ed_title_helper: "Gol: Treburi",
  },
  da: {
    title: "Pligter",
    st_overdue_one: "{n} forsinket",
    st_overdue_many: "{n} forsinket",
    st_left_one: "{n} tilbage",
    st_left_many: "{n} tilbage",
    st_done: "Alt er gjort",
    st_empty: "Intet i dag",
    sub_done: "{d} af {t} gjort i dag",
    all: "Alle",
    overdue: "Forsinket",
    today: "I dag",
    done_of: "{d} af {t} gjort",
    since: "siden {d}",
    since_yesterday: "siden i går",
    pts_one: "{n} point",
    pts_many: "{n} point",
    reward_to: "{n} til {r}",
    reward_ready: "{r}: klaret!",
    chip_left_one: "{n} tilbage i dag",
    chip_left_many: "{n} tilbage i dag",
    empty: "Ingen pligter i dag",
    mark_done: "Markér som gjort",
    mark_todo: "Markér som ikke gjort",
    ed_people: "Personer (YAML)",
    ed_people_helper: "Person-enheder eller { person, todo, points, reward, reward_points }; tom: alle personer",
    ed_todo: "Delte opgavelister",
    ed_todo_helper: "Lister, hvis pligter ikke tilhører nogen bestemt",
    ed_chores: "Pligter (YAML)",
    ed_chores_helper: "Chore Helper-sensorer eller Grocy-pligter (grocy:<id>) med deres person og point",
    ed_show_points: "Børnenes point",
    ed_show_done: "Udførte pligter",
    ed_show_subtitle: "Vis undertitel",
    ed_illustration: "Illustreret overskrift",
    ed_illustration_theme: "Overskriftens tema",
    ed_theme_auto: "Automatisk (følger temaet)",
    ed_theme_day: "Dag",
    ed_theme_night: "Nat",
    ed_animations: "Animationer",
    ed_title_helper: "Tom: Pligter",
  },
  sv: {
    title: "Sysslor",
    st_overdue_one: "{n} försenad",
    st_overdue_many: "{n} försenade",
    st_left_one: "{n} kvar",
    st_left_many: "{n} kvar",
    st_done: "Allt klart",
    st_empty: "Inget i dag",
    sub_done: "{d} av {t} klara i dag",
    all: "Alla",
    overdue: "Försenade",
    today: "I dag",
    done_of: "{d} av {t} klara",
    since: "sedan {d}",
    since_yesterday: "sedan i går",
    pts_one: "{n} poäng",
    pts_many: "{n} poäng",
    reward_to: "{n} till {r}",
    reward_ready: "{r}: klart!",
    chip_left_one: "{n} kvar i dag",
    chip_left_many: "{n} kvar i dag",
    empty: "Inga sysslor i dag",
    mark_done: "Markera som klar",
    mark_todo: "Markera som ej klar",
    ed_people: "Personer (YAML)",
    ed_people_helper: "Person-entiteter eller { person, todo, points, reward, reward_points }; tom: alla personer",
    ed_todo: "Delade att göra-listor",
    ed_todo_helper: "Listor vars sysslor inte tillhör någon särskild",
    ed_chores: "Sysslor (YAML)",
    ed_chores_helper: "Chore Helper-sensorer eller Grocy-sysslor (grocy:<id>) med person och poäng",
    ed_show_points: "Barnens poäng",
    ed_show_done: "Klara sysslor",
    ed_show_subtitle: "Visa underrubrik",
    ed_illustration: "Illustrerad rubrik",
    ed_illustration_theme: "Rubrikens tema",
    ed_theme_auto: "Automatiskt (följer temat)",
    ed_theme_day: "Dag",
    ed_theme_night: "Natt",
    ed_animations: "Animationer",
    ed_title_helper: "Tom: Sysslor",
  },
  bg: {
    title: "Домакински задачи",
    st_overdue_one: "{n} просрочена",
    st_overdue_many: "{n} просрочени",
    st_left_one: "{n} остава",
    st_left_many: "{n} остават",
    st_done: "Всичко е готово",
    st_empty: "Нищо днес",
    sub_done: "{d} от {t} готови днес",
    all: "Всички",
    overdue: "Просрочени",
    today: "Днес",
    done_of: "{d} от {t} готови",
    since: "от {d}",
    since_yesterday: "от вчера",
    pts_one: "{n} т.",
    pts_many: "{n} т.",
    reward_to: "{n} до {r}",
    reward_ready: "{r}: спечелено!",
    chip_left_one: "{n} остава днес",
    chip_left_many: "{n} остават днес",
    empty: "Няма задачи днес",
    mark_done: "Отбележи като готова",
    mark_todo: "Отбележи като неготова",
    ed_people: "Хора (YAML)",
    ed_people_helper: "Обекти person или { person, todo, points, reward, reward_points }; празно: всички хора",
    ed_todo: "Споделени списъци със задачи",
    ed_todo_helper: "Списъци, чиито задачи не са на никого конкретно",
    ed_chores: "Задачи (YAML)",
    ed_chores_helper: "Сензори на Chore Helper или задачи от Grocy (grocy:<id>) с човек и точки",
    ed_show_points: "Точки на децата",
    ed_show_done: "Изпълнени задачи",
    ed_show_subtitle: "Показване на подзаглавие",
    ed_illustration: "Илюстрирано заглавие",
    ed_illustration_theme: "Тема на заглавието",
    ed_theme_auto: "Автоматично (следва темата)",
    ed_theme_day: "Ден",
    ed_theme_night: "Нощ",
    ed_animations: "Анимации",
    ed_title_helper: "Празно: Домакински задачи",
  },
  ru: {
    title: "Домашние дела",
    st_overdue_one: "Просрочено: {n}",
    st_overdue_many: "Просрочено: {n}",
    st_left_one: "Осталось: {n}",
    st_left_many: "Осталось: {n}",
    st_done: "Всё сделано",
    st_empty: "Сегодня ничего",
    sub_done: "Сегодня сделано {d} из {t}",
    all: "Все",
    overdue: "Просрочено",
    today: "Сегодня",
    done_of: "Сделано {d} из {t}",
    since: "с {d}",
    since_yesterday: "со вчера",
    pts_one: "{n} очк.",
    pts_many: "{n} очк.",
    reward_to: "{n} до: {r}",
    reward_ready: "{r}: получено!",
    chip_left_one: "Осталось сегодня: {n}",
    chip_left_many: "Осталось сегодня: {n}",
    empty: "Сегодня дел нет",
    mark_done: "Отметить как сделанное",
    mark_todo: "Отметить как несделанное",
    ed_people: "Люди (YAML)",
    ed_people_helper: "Объекты person или { person, todo, points, reward, reward_points }; пусто: все люди",
    ed_todo: "Общие списки дел",
    ed_todo_helper: "Списки, дела которых ничьи в частности",
    ed_chores: "Дела (YAML)",
    ed_chores_helper: "Датчики Chore Helper или дела Grocy (grocy:<id>) с человеком и очками",
    ed_show_points: "Очки детей",
    ed_show_done: "Сделанные дела",
    ed_show_subtitle: "Показывать подзаголовок",
    ed_illustration: "Иллюстрированный заголовок",
    ed_illustration_theme: "Тема заголовка",
    ed_theme_auto: "Автоматически (по теме)",
    ed_theme_day: "День",
    ed_theme_night: "Ночь",
    ed_animations: "Анимации",
    ed_title_helper: "Пусто: Домашние дела",
  },
  uk: {
    title: "Хатні справи",
    st_overdue_one: "Прострочено: {n}",
    st_overdue_many: "Прострочено: {n}",
    st_left_one: "Залишилось: {n}",
    st_left_many: "Залишилось: {n}",
    st_done: "Усе зроблено",
    st_empty: "Сьогодні нічого",
    sub_done: "Сьогодні зроблено {d} з {t}",
    all: "Усі",
    overdue: "Прострочено",
    today: "Сьогодні",
    done_of: "Зроблено {d} з {t}",
    since: "з {d}",
    since_yesterday: "з учора",
    pts_one: "{n} бал.",
    pts_many: "{n} бал.",
    reward_to: "{n} до: {r}",
    reward_ready: "{r}: отримано!",
    chip_left_one: "Залишилось сьогодні: {n}",
    chip_left_many: "Залишилось сьогодні: {n}",
    empty: "Сьогодні справ немає",
    mark_done: "Позначити як зроблене",
    mark_todo: "Позначити як незроблене",
    ed_people: "Люди (YAML)",
    ed_people_helper: "Об'єкти person або { person, todo, points, reward, reward_points }; порожньо: усі люди",
    ed_todo: "Спільні списки справ",
    ed_todo_helper: "Списки, справи яких нічиї зокрема",
    ed_chores: "Справи (YAML)",
    ed_chores_helper: "Датчики Chore Helper або справи Grocy (grocy:<id>) з людиною та балами",
    ed_show_points: "Бали дітей",
    ed_show_done: "Зроблені справи",
    ed_show_subtitle: "Показувати підзаголовок",
    ed_illustration: "Ілюстрований заголовок",
    ed_illustration_theme: "Тема заголовка",
    ed_theme_auto: "Автоматично (за темою)",
    ed_theme_day: "День",
    ed_theme_night: "Ніч",
    ed_animations: "Анімації",
    ed_title_helper: "Порожньо: Хатні справи",
  },
  hu: {
    title: "Házimunka",
    st_overdue_one: "{n} késésben",
    st_overdue_many: "{n} késésben",
    st_left_one: "{n} hátra",
    st_left_many: "{n} hátra",
    st_done: "Minden kész",
    st_empty: "Ma semmi",
    sub_done: "Ma {d}/{t} kész",
    all: "Mind",
    overdue: "Késésben",
    today: "Ma",
    done_of: "{d}/{t} kész",
    since: "{d} óta",
    since_yesterday: "tegnap óta",
    pts_one: "{n} pont",
    pts_many: "{n} pont",
    reward_to: "{n} a következőig: {r}",
    reward_ready: "{r}: megvan!",
    chip_left_one: "Ma {n} hátra",
    chip_left_many: "Ma {n} hátra",
    empty: "Ma nincs házimunka",
    mark_done: "Megjelölés késznek",
    mark_todo: "Megjelölés nem késznek",
    ed_people: "Személyek (YAML)",
    ed_people_helper: "Person entitások vagy { person, todo, points, reward, reward_points }; üres: minden személy",
    ed_todo: "Megosztott teendőlisták",
    ed_todo_helper: "Listák, amelyek feladatai nem tartoznak senkihez",
    ed_chores: "Házimunkák (YAML)",
    ed_chores_helper: "Chore Helper érzékelők vagy Grocy feladatok (grocy:<id>) a személyükkel és pontjaikkal",
    ed_show_points: "A gyerekek pontjai",
    ed_show_done: "Kész házimunkák",
    ed_show_subtitle: "Alcím megjelenítése",
    ed_illustration: "Illusztrált fejléc",
    ed_illustration_theme: "Fejléc témája",
    ed_theme_auto: "Automatikus (követi a témát)",
    ed_theme_day: "Nappal",
    ed_theme_night: "Éjszaka",
    ed_animations: "Animációk",
    ed_title_helper: "Üres: Házimunka",
  },
  sk: {
    title: "Domáce práce",
    st_overdue_one: "Meškajúce: {n}",
    st_overdue_many: "Meškajúce: {n}",
    st_left_one: "Zostáva: {n}",
    st_left_many: "Zostáva: {n}",
    st_done: "Všetko hotové",
    st_empty: "Dnes nič",
    sub_done: "Dnes hotové {d} z {t}",
    all: "Všetci",
    overdue: "Meškajúce",
    today: "Dnes",
    done_of: "Hotové {d} z {t}",
    since: "od {d}",
    since_yesterday: "od včera",
    pts_one: "{n} b.",
    pts_many: "{n} b.",
    reward_to: "{n} do: {r}",
    reward_ready: "{r}: získané!",
    chip_left_one: "Dnes zostáva: {n}",
    chip_left_many: "Dnes zostáva: {n}",
    empty: "Dnes žiadne práce",
    mark_done: "Označiť ako hotové",
    mark_todo: "Označiť ako nehotové",
    ed_people: "Osoby (YAML)",
    ed_people_helper: "Entity person alebo { person, todo, points, reward, reward_points }; prázdne: všetky osoby",
    ed_todo: "Zdieľané zoznamy úloh",
    ed_todo_helper: "Zoznamy, ktorých práce nepatria nikomu konkrétnemu",
    ed_chores: "Práce (YAML)",
    ed_chores_helper: "Senzory Chore Helper alebo práce Grocy (grocy:<id>) s osobou a bodmi",
    ed_show_points: "Body detí",
    ed_show_done: "Hotové práce",
    ed_show_subtitle: "Zobraziť podnadpis",
    ed_illustration: "Ilustrovaná hlavička",
    ed_illustration_theme: "Téma hlavičky",
    ed_theme_auto: "Automaticky (podľa témy)",
    ed_theme_day: "Deň",
    ed_theme_night: "Noc",
    ed_animations: "Animácie",
    ed_title_helper: "Prázdne: Domáce práce",
  },
  cs: {
    title: "Domácí práce",
    st_overdue_one: "Zpožděné: {n}",
    st_overdue_many: "Zpožděné: {n}",
    st_left_one: "Zbývá: {n}",
    st_left_many: "Zbývá: {n}",
    st_done: "Vše hotovo",
    st_empty: "Dnes nic",
    sub_done: "Dnes hotovo {d} z {t}",
    all: "Všichni",
    overdue: "Zpožděné",
    today: "Dnes",
    done_of: "Hotovo {d} z {t}",
    since: "od {d}",
    since_yesterday: "od včera",
    pts_one: "{n} b.",
    pts_many: "{n} b.",
    reward_to: "{n} do: {r}",
    reward_ready: "{r}: získáno!",
    chip_left_one: "Dnes zbývá: {n}",
    chip_left_many: "Dnes zbývá: {n}",
    empty: "Dnes žádné práce",
    mark_done: "Označit jako hotové",
    mark_todo: "Označit jako nehotové",
    ed_people: "Osoby (YAML)",
    ed_people_helper: "Entity person nebo { person, todo, points, reward, reward_points }; prázdné: všechny osoby",
    ed_todo: "Sdílené seznamy úkolů",
    ed_todo_helper: "Seznamy, jejichž práce nepatří nikomu konkrétnímu",
    ed_chores: "Práce (YAML)",
    ed_chores_helper: "Senzory Chore Helper nebo práce Grocy (grocy:<id>) s osobou a body",
    ed_show_points: "Body dětí",
    ed_show_done: "Hotové práce",
    ed_show_subtitle: "Zobrazit podtitul",
    ed_illustration: "Ilustrovaná hlavička",
    ed_illustration_theme: "Motiv hlavičky",
    ed_theme_auto: "Automaticky (podle motivu)",
    ed_theme_day: "Den",
    ed_theme_night: "Noc",
    ed_animations: "Animace",
    ed_title_helper: "Prázdné: Domácí práce",
  },
  sl: {
    title: "Opravila",
    st_overdue_one: "Zamujena: {n}",
    st_overdue_many: "Zamujena: {n}",
    st_left_one: "Preostala: {n}",
    st_left_many: "Preostala: {n}",
    st_done: "Vse je narejeno",
    st_empty: "Danes nič",
    sub_done: "Danes narejenih {d} od {t}",
    all: "Vsi",
    overdue: "Zamujena",
    today: "Danes",
    done_of: "Narejenih {d} od {t}",
    since: "od {d}",
    since_yesterday: "od včeraj",
    pts_one: "{n} t.",
    pts_many: "{n} t.",
    reward_to: "{n} do: {r}",
    reward_ready: "{r}: osvojeno!",
    chip_left_one: "Danes preostala: {n}",
    chip_left_many: "Danes preostala: {n}",
    empty: "Danes ni opravil",
    mark_done: "Označi kot narejeno",
    mark_todo: "Označi kot nenarejeno",
    ed_people: "Osebe (YAML)",
    ed_people_helper: "Entitete person ali { person, todo, points, reward, reward_points }; prazno: vse osebe",
    ed_todo: "Skupni seznami opravil",
    ed_todo_helper: "Seznami, katerih opravila niso od nikogar posebej",
    ed_chores: "Opravila (YAML)",
    ed_chores_helper: "Senzorji Chore Helper ali opravila Grocy (grocy:<id>) z osebo in točkami",
    ed_show_points: "Točke otrok",
    ed_show_done: "Narejena opravila",
    ed_show_subtitle: "Prikaži podnaslov",
    ed_illustration: "Ilustrirana glava",
    ed_illustration_theme: "Tema glave",
    ed_theme_auto: "Samodejno (sledi temi)",
    ed_theme_day: "Dan",
    ed_theme_night: "Noč",
    ed_animations: "Animacije",
    ed_title_helper: "Prazno: Opravila",
  },
  lv: {
    title: "Mājas darbi",
    st_overdue_one: "Nokavēti: {n}",
    st_overdue_many: "Nokavēti: {n}",
    st_left_one: "Atlikuši: {n}",
    st_left_many: "Atlikuši: {n}",
    st_done: "Viss paveikts",
    st_empty: "Šodien nekas",
    sub_done: "Šodien paveikti {d} no {t}",
    all: "Visi",
    overdue: "Nokavēti",
    today: "Šodien",
    done_of: "Paveikti {d} no {t}",
    since: "kopš {d}",
    since_yesterday: "kopš vakardienas",
    pts_one: "{n} p.",
    pts_many: "{n} p.",
    reward_to: "{n} līdz: {r}",
    reward_ready: "{r}: iegūts!",
    chip_left_one: "Šodien atlikuši: {n}",
    chip_left_many: "Šodien atlikuši: {n}",
    empty: "Šodien nav darbu",
    mark_done: "Atzīmēt kā paveiktu",
    mark_todo: "Atzīmēt kā nepaveiktu",
    ed_people: "Personas (YAML)",
    ed_people_helper: "Person entītijas vai { person, todo, points, reward, reward_points }; tukšs: visas personas",
    ed_todo: "Kopīgi uzdevumu saraksti",
    ed_todo_helper: "Saraksti, kuru darbi nepieder nevienam konkrētam",
    ed_chores: "Darbi (YAML)",
    ed_chores_helper: "Chore Helper sensori vai Grocy darbi (grocy:<id>) ar personu un punktiem",
    ed_show_points: "Bērnu punkti",
    ed_show_done: "Paveiktie darbi",
    ed_show_subtitle: "Rādīt apakšvirsrakstu",
    ed_illustration: "Ilustrēta galvene",
    ed_illustration_theme: "Galvenes motīvs",
    ed_theme_auto: "Automātiski (pēc motīva)",
    ed_theme_day: "Diena",
    ed_theme_night: "Nakts",
    ed_animations: "Animācijas",
    ed_title_helper: "Tukšs: Mājas darbi",
  },
  el: {
    title: "Δουλειές",
    st_overdue_one: "{n} καθυστερεί",
    st_overdue_many: "{n} καθυστερούν",
    st_left_one: "{n} απομένει",
    st_left_many: "{n} απομένουν",
    st_done: "Όλα έγιναν",
    st_empty: "Τίποτα σήμερα",
    sub_done: "{d} από {t} έγιναν σήμερα",
    all: "Όλοι",
    overdue: "Καθυστερούν",
    today: "Σήμερα",
    done_of: "{d} από {t} έγιναν",
    since: "από {d}",
    since_yesterday: "από χθες",
    pts_one: "{n} πόντος",
    pts_many: "{n} πόντοι",
    reward_to: "{n} για {r}",
    reward_ready: "{r}: κερδήθηκε!",
    chip_left_one: "{n} απομένει σήμερα",
    chip_left_many: "{n} απομένουν σήμερα",
    empty: "Καμία δουλειά σήμερα",
    mark_done: "Σήμανση ως έγινε",
    mark_todo: "Σήμανση ως εκκρεμεί",
    ed_people: "Άτομα (YAML)",
    ed_people_helper: "Οντότητες person ή { person, todo, points, reward, reward_points }· κενό: όλα τα άτομα",
    ed_todo: "Κοινόχρηστες λίστες εργασιών",
    ed_todo_helper: "Λίστες που οι δουλειές τους δεν ανήκουν σε κανέναν συγκεκριμένα",
    ed_chores: "Δουλειές (YAML)",
    ed_chores_helper: "Αισθητήρες Chore Helper ή δουλειές Grocy (grocy:<id>) με το άτομο και τους πόντους τους",
    ed_show_points: "Πόντοι των παιδιών",
    ed_show_done: "Ολοκληρωμένες δουλειές",
    ed_show_subtitle: "Εμφάνιση υπότιτλου",
    ed_illustration: "Εικονογραφημένη κεφαλίδα",
    ed_illustration_theme: "Θέμα κεφαλίδας",
    ed_theme_auto: "Αυτόματο (ακολουθεί το θέμα)",
    ed_theme_day: "Ημέρα",
    ed_theme_night: "Νύχτα",
    ed_animations: "Κινούμενα σχέδια",
    ed_title_helper: "Κενό: Δουλειές",
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const rcLang = (i18n, hass, config) => {
  // The full tag when the card has it (sr-Latn), else its base language (fr-FR → fr, pt-BR → pt), else English.
  const l = config?.language || hass?.locale?.language || hass?.language || "en";
  const base = l.split("-")[0];
  return i18n[l] ? l : i18n[base] ? base : "en";
};

const rcT = (i18n, lang, key, vars = {}) => {
  const s = i18n[lang]?.[key] ?? RC_I18N[lang]?.[key] ?? i18n.en[key] ?? RC_I18N.en[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
};

// Plural key for `n` items: `<base>_one`, `<base>_two`, `<base>_few` or `<base>_many` (the "other" form), from the
// CLDR category of `n` in `lang` (Serbian 1 / 2-4 / 5+, Slovenian 1 / 2 / 3-4 / 5+). `_two` and `_few` are optional:
// without `_two`, `_few` is used, then `_many`. A `_one` text without {n} only means exactly one.
const rcPluralKey = (i18n, lang, base, n) => {
  let cat;
  try {
    cat = new Intl.PluralRules(lang).select(n);
  } catch {
    cat = n === 1 ? "one" : "other";
  }
  const text = (k) => i18n[lang]?.[k] ?? RC_I18N[lang]?.[k];
  if (cat === "one" && (n === 1 || text(`${base}_one`)?.includes("{n}"))) return `${base}_one`;
  if (cat === "two" && text(`${base}_two`) != null) return `${base}_two`;
  if ((cat === "two" || cat === "few") && text(`${base}_few`) != null) return `${base}_few`;
  return `${base}_many`;
};

const rcEsc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

const rcMoreInfo = (node, entityId) => {
  const ev = new Event("hass-more-info", { bubbles: true, composed: true });
  ev.detail = { entityId };
  node.dispatchEvent(ev);
};

const rcNavigate = (path) => {
  history.pushState(null, "", path);
  window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
};

// Wires a card header to its `navigation_path`: click, and Enter on the header itself.
const rcBindNav = (head, path) => {
  head.addEventListener("click", () => rcNavigate(path));
  head.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" && ev.target === head) rcNavigate(path);
  });
};

// HA's callService already shows a toast when the call fails, then rejects: the rejection is only swallowed here
// so that it does not end up as "Uncaught (in promise)".
const rcCall = (hass, domain, service, data) => Promise.resolve(hass.callService(domain, service, data)).catch(() => {});

// A click inside a dialog (more-info opened from the card, say) is not a click outside the card.
const rcInDialog = (ev) => ev.composedPath().some((n) => ["ha-more-info-dialog", "ha-dialog", "dialog"].includes(n.localName));

// `fn()`, computed again only when one of `deps` is no longer the same object (or value) as last time.
const rcMemo = (store, key, deps, fn) => {
  const hit = store[key];
  if (hit && hit.deps.length === deps.length && hit.deps.every((d, i) => d === deps[i])) return hit.value;
  const value = fn();
  store[key] = { deps, value };
  return value;
};

// ── Base card ────────────────────────────────────────────────────────────────
class RcCard extends HTMLElement {
  static getStubConfig(hass) {
    const areas = Object.keys(hass?.areas ?? {});
    return { area: areas[0] ?? "" };
  }

  // Subclasses set: static i18n, static defaults, static tag, static styles.
  static getConfigElement() {
    // biome-ignore lint/complexity/noThisInStatic: each subclass opens its own editor.
    return document.createElement(`${this.tag}-editor`);
  }

  setConfig(config) {
    if (this.constructor.needsArea && !config.area && !config.entities?.length && !config.include?.length) {
      throw new Error(rcT(this.constructor.i18n, rcLang(this.constructor.i18n, this._hass, config), "err_config"));
    }
    this._config = { ...this.constructor.defaults, ...config };
    // show_title: the header's title, hidden by the stylesheet
    this.toggleAttribute?.("hide-title", config.show_title === false);
    if (!this.shadowRoot) this._attach();
    this._sig = null;
    this._render();
  }

  // The shadow root, and no rewrite of the card between a press anywhere in it and the end of the click: Home
  // Assistant updates the card several times a second, and a rewrite under the pointer replaces the element pressed,
  // so that the click lands on the card itself and does nothing (the tiles already hold it, see _bindPress; this
  // covers the rest: header button, detail button, rows, popup). The pending update is rendered once released.
  _attach() {
    const root = this.attachShadow({ mode: "open" });
    this._onPressEnd = () => {
      window.removeEventListener("pointerup", this._onPressEnd, true);
      window.removeEventListener("pointercancel", this._onPressEnd, true);
      // After the click, which comes in the same task as the release.
      setTimeout(() => {
        if (this._pressing) this._released();
      }, 0);
    };
    root.addEventListener("pointerdown", (ev) => {
      this._byPointer = true;
      if (ev.button !== 0) return;
      this._pressing = true;
      window.addEventListener("pointerup", this._onPressEnd, true);
      window.addEventListener("pointercancel", this._onPressEnd, true);
    });
    // The focus is kept across rewrites for the keyboard only (no focus ring after a mouse click or a tap).
    root.addEventListener("keydown", () => {
      this._byPointer = false;
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();
    window.removeEventListener("pointerup", this._onPressEnd, true);
    window.removeEventListener("pointercancel", this._onPressEnd, true);
    // A press cut short by the detach never gets its release: rendered now, and the next updates too.
    if (this._pressing) this._released();
  }

  set hass(hass) {
    this._hass = hass;
    // No re-render during a drag or a press: it would replace the tile under the finger.
    if (this._dragging || this._pressing) this._deferred = true;
    else this._render();
  }

  // The tiles actually shown (`only_on` / `only_alerts` applied), nothing when the card is hidden.
  getCardSize() {
    if (this.style.display === "none") return 0;
    const n = this._shown ?? this._items?.length ?? 0;
    if (!n || !this._config) return 1;
    // A row of large tiles (`layout: tiles`) is about one and a half rows of compact ones.
    const rows = Math.ceil(n / this._cols());
    return 1 + (this._tiles() ? Math.ceil(rows * 1.5) : rows);
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: "auto" };
  }

  _lang() {
    return rcLang(this.constructor.i18n, this._hass, this._config);
  }

  _t(key, vars) {
    return rcT(this.constructor.i18n, this._lang(), key, vars);
  }

  // `<base>_one` / `_two` / `_few` / `_many` for `n`, with {n} filled in.
  _tn(base, n, vars) {
    return this._t(rcPluralKey(this.constructor.i18n, this._lang(), base, n), { ...vars, n });
  }

  _areaName() {
    const c = this._config;
    return c.area ? (this._hass.areas?.[c.area]?.name ?? c.area) : "";
  }

  // Re-render only when something visible changed.
  _changed(parts) {
    const sig = JSON.stringify([this._config, this._lang(), parts]);
    if (sig === this._sig) return false;
    this._sig = sig;
    return true;
  }

  // Subclasses implement `_collect()` (the tiles) and `_draw(items)`.
  _render() {
    if (!this._config || !this._hass || !this.shadowRoot) return;
    this._items = this._collect();
    this._draw(this._items);
  }

  _cols() {
    return Math.min(4, Math.max(1, Number(this._config.columns) || 2));
  }

  // `layout: tiles`: one large tile per entity, the size of Home Assistant's Tile card (easier to tap on a phone).
  _tiles() {
    return this._config?.layout === "tiles";
  }

  _paint(level, head, tiles, extraClass = "") {
    // The tile or control with the keyboard focus keeps it through the redraw (a toggle, a step or a two-tap
    // confirmation from the keyboard): tiles by their data-id, controls by their data-k.
    const active = this._byPointer ? null : this.shadowRoot.activeElement;
    const focused = active?.dataset?.id;
    const focusKey = active?.dataset?.k;
    this.shadowRoot.innerHTML = `
      <style>${RC_BASE_STYLES}${this.constructor.styles}</style>
      <ha-card class="lvl-${level}${extraClass}${this._tiles() ? " layout-tiles" : ""}">
        ${head}
        ${tiles ? `<div class="grid" style="--cols:${this._cols()}">${tiles}</div>` : ""}
        ${this._afterGrid()}
      </ha-card>`;
    const root = this.shadowRoot;
    root.querySelector(".pill.action")?.addEventListener("click", (ev) => this._allOff(ev));
    if (this._config.navigation_path) rcBindNav(root.querySelector(".head"), this._config.navigation_path);
    for (const el of root.querySelectorAll(".tile")) {
      this._bindTile(el, (this._items || []).find((i) => i.id === el.dataset.id));
      if (focused && el.dataset.id === focused) el.focus({ preventScroll: true });
    }
    this._bindAfter(root);
    if (focusKey) root.querySelector(`[data-k="${focusKey}"]`)?.focus({ preventScroll: true });
  }

  // What a card adds under its tiles (the Lights card's scenes), and its event wiring.
  _afterGrid() {
    return "";
  }

  _bindAfter() {}

  // The "turn everything off" button of the header (full card) or of the status (mini card).
  _allOff(ev) {
    ev.stopPropagation();
    const ids = (this._items || []).filter((i) => i.on).map((i) => i.id);
    if (!ids.length) return;
    // A host card may ask first (the Overview confirms before turning plugs off); otherwise off at once.
    if (this._confirmOff) this._confirmOff(ids);
    else rcCall(this._hass, "homeassistant", "turn_off", { entity_id: ids });
  }

  // Tap, hold for more-info, and an optional horizontal drag ({ move(x), end(x), step(delta), flush() }). From the
  // keyboard: Enter / Space tap, Shift+Enter or the context-menu key open the details, ←/→ step the drag by ∓/±10
  // (a held key at most every RC_REPEAT_MS), and releasing the arrow calls `flush`.
  _bindPress(el, { onTap, onHold, drag }) {
    let start = null;
    let mode = null; // null | "hold" | "drag"
    let timer = null;
    let lastStep = 0;
    el.addEventListener("pointerdown", (ev) => {
      if (ev.button !== 0) return;
      start = { x: ev.clientX, y: ev.clientY };
      mode = null;
      this._pressing = true;
      clearTimeout(timer);
      timer = setTimeout(() => {
        // The card may have been detached mid-press (nothing else clears this timer): no hold on a dead node.
        if (mode || !this.isConnected) return;
        mode = "hold";
        // The press is settled (no tap): the details may open over the tile, so its pointerup may never come.
        this._released();
        onHold();
      }, RC_HOLD_MS);
    });
    el.addEventListener("pointermove", (ev) => {
      if (!start || mode === "hold") return;
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      if (!mode && drag && Math.abs(dx) > RC_MOVE_PX && Math.abs(dx) > Math.abs(dy)) {
        mode = "drag";
        clearTimeout(timer);
        this._dragging = true;
        el.setPointerCapture(ev.pointerId);
        el.classList.add("dragging");
      } else if (!mode && (Math.abs(dx) > RC_MOVE_PX || Math.abs(dy) > RC_MOVE_PX)) {
        clearTimeout(timer); // scrolling, or dragging what cannot be dragged: not a tap
        start = null;
        this._released();
      }
      if (mode === "drag") drag.move(ev.clientX);
    });
    const end = (ev, cancelled) => {
      clearTimeout(timer);
      if (!start) return;
      const wasDrag = mode === "drag";
      if (wasDrag) {
        this._dragging = false;
        el.classList.remove("dragging");
        if (!cancelled) drag.end(ev.clientX);
        this._sig = null;
      } else if (!mode && !cancelled) {
        onTap();
      }
      start = null;
      mode = null;
      // After a drag, the next update redraws (the bar keeps the new level until the light reports it).
      this._released(!wasDrag);
    };
    // The mouse leaving the tile mid-press (no capture outside a drag) cancels it: neither a tap nor a hold.
    el.addEventListener("pointerleave", () => {
      if (!start || mode) return;
      clearTimeout(timer);
      start = null;
      this._released();
    });
    el.addEventListener("pointerup", (ev) => end(ev, false));
    el.addEventListener("pointercancel", (ev) => end(ev, true));
    el.addEventListener("contextmenu", (ev) => ev.preventDefault());
    el.addEventListener("keydown", (ev) => {
      if ((ev.key === "Enter" && ev.shiftKey) || ev.key === "ContextMenu") {
        ev.preventDefault();
        if (!ev.repeat) onHold();
      } else if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        if (!ev.repeat) onTap();
      } else if (drag?.step && (ev.key === "ArrowLeft" || ev.key === "ArrowRight")) {
        ev.preventDefault();
        if (ev.repeat && ev.timeStamp - lastStep < RC_REPEAT_MS) return;
        lastStep = ev.timeStamp;
        drag.step(ev.key === "ArrowRight" ? 10 : -10);
      }
    });
    // The arrow released: the stepped level goes out now rather than after the pause.
    el.addEventListener("keyup", (ev) => {
      if (ev.key === "ArrowLeft" || ev.key === "ArrowRight") drag?.flush?.();
    });
  }

  // End of a press: renders now what an update brought during it.
  _released(flush = true) {
    this._pressing = false;
    if (!this._deferred || this._dragging) return;
    this._deferred = false;
    if (flush) this._render();
  }

  // Default tile: tap toggles, hold opens the details.
  _bindTile(el, item) {
    this._bindPress(el, {
      onTap: () => !item?.unavailable && rcCall(this._hass, "homeassistant", "toggle", { entity_id: el.dataset.id }),
      onHold: () => rcMoreInfo(this, el.dataset.id),
    });
  }
}

// ── Mini cards ───────────────────────────────────────────────────────────────
// A mini card shows what its full card (`Base`) shows on two lines: the room badge, title and status, then one chip
// per entity. Its zoom button (top right, `zoom: false` removes it) switches it to the full card and back; a click
// anywhere else brings it back too.
// The subclass implements `_drawMini(items)`, which builds the chips and calls `_paintMini`.
// Zoomed in, everything is shown (`only_alerts` and `hide_when_clear` only apply to the compact view). With
// `alertsOnly`, the compact view always shows only what needs a look (no `only_alerts` option then): quiet entities
// show once zoomed in.
const rcMini = (Base, tag, styles, { alertsOnly = false } = {}) =>
  class extends Base {
    static tag = tag;
    static defaults = (({ only_alerts, ...rest }) => ({ ...rest, ...(alertsOnly ? {} : { only_alerts }), zoom: true }))(
      Base.defaults,
    );
    static styles = `${Base.styles}${RC_MINI_STYLES}${styles}`;

    constructor() {
      super();
      // A click anywhere else brings the card back to its compact view.
      this._onUnzoom = (ev) => {
        if (rcOutside(this, ev)) rcUnzoom(this);
      };
    }

    connectedCallback() {
      super.connectedCallback?.();
      this._unzoom ??= watchOutside(this, this._onUnzoom);
      this._unzoom.on();
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();
      this._unzoom?.off();
      // Left (another dashboard view, a conditional card hidden): back to the compact view.
      rcUnzoom(this);
    }

    getCardSize() {
      if (this._zoomed) return super.getCardSize();
      return this.style.display === "none" ? 0 : 1;
    }

    getGridOptions() {
      return { columns: 12, min_columns: 6, rows: "auto" };
    }

    _draw(items) {
      const config = this._config;
      // The base card's own filter does the work: off zoomed in, always on in an `alertsOnly` compact view.
      if (this._zoomed) this._config = { ...config, only_alerts: false, hide_when_clear: false };
      else if (alertsOnly) this._config = { ...config, only_alerts: true };
      try {
        if (this._zoomed) super._draw(items);
        else this._drawMini(items);
      } finally {
        this._config = config;
      }
      this._addZoom();
    }

    _paintMini({ level, icon, status, chips, cls = "", allOff = false }) {
      const c = this._config;
      const nav = c.navigation_path;
      // With `allOff` the status is the "turn everything off" button, like the full card's pill.
      const st = allOff
        ? `<button class="st action" title="${rcEsc(this._t("turn_all_off"))}"><ha-icon icon="mdi:power"></ha-icon><span class="pt">${rcEsc(status)}</span></button>`
        : `<span class="st" title="${rcEsc(status)}"><span class="pt">${rcEsc(status)}</span></span>`;
      this.shadowRoot.innerHTML = `
        <style>${RC_BASE_STYLES}${this.constructor.styles}</style>
        <ha-card class="lvl-${level}${cls}">
          <div class="mini">
            <div class="badge" title="${rcEsc(status)}"><ha-icon icon="${rcEsc(icon)}"></ha-icon></div>
            <div class="body">
              <div class="head${nav ? " nav" : ""}"${nav ? ' role="link" tabindex="0"' : ""}>
                <div class="title">${rcEsc(c.title || this._areaName() || this._t("title"))}</div>
                ${st}
              </div>
              <div class="rs">${chips}</div>
            </div>
          </div>
        </ha-card>`;
      const root = this.shadowRoot;
      if (nav) rcBindNav(root.querySelector(".head"), nav);
      root.querySelector(".st.action")?.addEventListener("click", (ev) => this._allOff(ev));
      for (const el of root.querySelectorAll(".r")) el.addEventListener("click", () => rcMoreInfo(this, el.dataset.id));
    }

    // Zoom button at the end of the header, top right in both views, added once per render.
    // Its click is the overviews' (rcZoomClick): stop the tap on the title (navigation_path), toggle, keep the
    // keyboard focus (Enter / Space: no click count) on the button that replaced this one.
    _addZoom() {
      const head = this._config.zoom && this.shadowRoot.querySelector(".head");
      if (!head || head.querySelector(".zoom")) return;
      const button = document.createElement("button");
      button.className = "zoom";
      button.title = this._t(this._zoomed ? "zoom_out" : "zoom_in");
      button.innerHTML = `<ha-icon icon="${rcZoomIcon(this)}"></ha-icon>`;
      button.addEventListener("click", (ev) => rcZoomClick(this, ev));
      head.appendChild(button);
    }
  };

const rcBooleans = (...names) => names.map((name) => ({ name, selector: { boolean: {} } }));

const rcAdvanced = (i18n, lang, ...names) => [
  {
    name: "advanced",
    type: "expandable",
    flatten: true,
    schema: names.map((name) =>
      name === "language"
        ? {
            name,
            selector: {
              select: {
                mode: "dropdown",
                options: [
                  { value: "", label: rcT(i18n, lang, "ed_language_auto") },
                  { value: "en", label: "English" },
                  { value: "fr", label: "Français" },
                  { value: "de", label: "Deutsch" },
                  { value: "es", label: "Español" },
                  { value: "sr", label: "Српски" },
                  { value: "sr-Latn", label: "Srpski (latinica)" },
                  { value: "it", label: "Italiano" },
                  { value: "nl", label: "Nederlands" },
                  { value: "pt", label: "Português (Portugal)" },
                  { value: "pl", label: "Polski" },
                  { value: "ro", label: "Română" },
                  { value: "da", label: "Dansk" },
                  { value: "sv", label: "Svenska" },
                  { value: "bg", label: "Български" },
                  { value: "ru", label: "Русский" },
                  { value: "uk", label: "Українська" },
                  { value: "hu", label: "Magyar" },
                  { value: "sk", label: "Slovenčina" },
                  { value: "cs", label: "Čeština" },
                  { value: "sl", label: "Slovenščina" },
                  { value: "lv", label: "Latviešu" },
                  { value: "el", label: "Ελληνικά" },
                ],
              },
            },
          }
        : { name, selector: { object: {} } },
    ),
  },
];
// `schema(lang, hass, config)` lists the fields; options left at the card's default are not written to the YAML
// (list defaults such as `exclude: []` are not shown in the form: an empty list is never written anyway).
// `autos` maps an option to its default worked out from the config (`(hass, config) => value`): shown in the form
// while unset, and kept out of the YAML when left at it.
// Entity lists the form edits with an entity picker (ids only): an item written `{ entity, name, icon }` in YAML shows as its entity,
// and gets its name and icon back when the form changes the list (ha-room-card#77).
const RC_ENTITY_LISTS = ["include"];
const rcListIds = (list) => (Array.isArray(list) ? list.map((e) => (typeof e === "string" ? e : e?.entity)).filter(Boolean) : list);
const rcListKeep = (ids, before) =>
  Array.isArray(ids) ? ids.map((id) => (Array.isArray(before) ? before.find((e) => typeof e === "object" && e?.entity === id) : undefined) ?? id) : ids;

const rcEditor = ({ card, helpers, schema, autos = {} }) => {
  const i18n = card.i18n;
  const defaults = { show_title: true, ...Object.fromEntries(Object.entries(card.defaults).filter(([, v]) => !Array.isArray(v))) };
  return class extends HTMLElement {
    setConfig(config) {
      this._config = config;
      this._update();
    }

    set hass(hass) {
      this._hass = hass;
      this._update();
    }

    _update() {
      if (!this._hass || !this._config) return;
      const lang = rcLang(i18n, this._hass, this._config);
      // Read by the label and helper callbacks, set once on the form: a language change must reach them too.
      this._lang = lang;
      if (!this._form) {
        this._form = document.createElement("ha-form");
        this._form.computeLabel = (s) => rcT(i18n, this._lang, `ed_${s.name}`);
        this._form.computeHelper = (s) =>
          helpers.includes(s.name) ? rcT(i18n, this._lang, `ed_${s.name}_helper`) : undefined;
        this._form.addEventListener("value-changed", (ev) => {
          const config = { ...ev.detail.value };
          for (const k of RC_ENTITY_LISTS) if (k in config) config[k] = rcListKeep(config[k], this._config[k]);
          for (const k of Object.keys(config)) {
            const v = config[k];
            if (v === "" || v == null || (Array.isArray(v) && !v.length) || defaults[k] === v) delete config[k];
          }
          for (const [k, auto] of Object.entries(autos)) {
            const untouched = this._config[k] === undefined && config[k] === auto(this._hass, this._config);
            if (untouched || config[k] === auto(this._hass, config)) delete config[k];
          }
          this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
        });
        this.appendChild(this._form);
      }
      this._form.hass = this._hass;
      // A new data or schema object re-renders the whole form, and the schema runs the card's discovery:
      // both only change with the config, the language or the registries.
      const memo = (this._memo ||= {});
      const h = this._hass;
      this._form.data = rcMemo(memo, "data", [this._config, h.areas], () => {
        const data = { ...defaults, ...this._config };
        for (const k of RC_ENTITY_LISTS) if (k in data) data[k] = rcListIds(data[k]);
        for (const [k, auto] of Object.entries(autos)) data[k] ??= auto(h, this._config);
        return data;
      });
      this._form.schema = rcMemo(memo, "schema", [lang, this._config, h.entities, h.devices, h.areas], () =>
        schema(lang, h, this._config),
      );
    }
  };
};

const rcRegister = (card, editor, name, description) => {
  if (customElements.get(card.tag)) return;
  customElements.define(card.tag, card);
  customElements.define(`${card.tag}-editor`, editor);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: card.tag,
    name,
    description,
    preview: false,
    documentationURL: "https://github.com/juju35/ha-chores-card",
  });
};

if (!customElements.get("chores-card")) {
  console.info(`%c HA-CHORES-CARD %c v${RC_VERSION} `, "background:#7048e8;color:#fff;font-weight:700", "");
}

// ── Common styles ────────────────────────────────────────────────────────────
const RC_BASE_STYLES = `
  :host {
    --rc-ok: var(--success-color, #43a047);
    --rc-warn: var(--warning-color, #ffa600);
    --rc-alert: var(--error-color, #db4437);
    --rc-info: var(--info-color, #039be5);
    --rc-light: var(--state-light-active-color, #ffb300);
    --rc-plug: var(--state-switch-on-color, var(--primary-color, #03a9f4));
    --rc-idle: var(--secondary-text-color, #9e9e9e);
    --rc-na: var(--disabled-color, #9e9e9e);
    display: block;
    min-width: 0;
  }
  /* The card answers its own width (container queries). That containment drops its content from its natural width: in
     a wrapper sized by its content (inline-block, a grid's auto column, a flex row: layout-card, button-card…) it would
     shrink to its padding. The empty grid below (no height) gives the host a natural width of 344 px there, as a
     preferred width only: its column is minmax(0, …), so the card still shrinks to its column in a grid card, a
     horizontal stack or a 1fr column, even wrapped in a <div> (hui-card in layout-card). contain-intrinsic-inline-size
     or a min-width in px would be a minimum there, and the card would overflow. */
  :host::before { content: ""; display: grid; grid-template-columns: minmax(0, 344px); height: 0; }
  ha-card { padding: 12px; overflow: hidden; container-type: inline-size; }
  ha-card.lvl-alert { box-shadow: 0 0 0 1px color-mix(in srgb, var(--rc-alert) 45%, transparent), var(--ha-card-box-shadow, none); }

  .head { display: flex; align-items: center; gap: 10px; }
  .head.nav { cursor: pointer; }
  .head.nav:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; border-radius: 4px; }
  .badge { flex: none; width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center;
           background: color-mix(in srgb, var(--c) 16%, transparent); color: var(--c); }
  .badge ha-icon { --mdc-icon-size: 24px; }
  .lvl-alert .badge { animation: rc-pulse 1.6s ease-in-out infinite; }
  /* Narrow header: the title keeps a few letters (never 0 px), the status pill shrinks and ellipsises, the icon buttons
     (zoom, power) never shrink; under 200 px the pill is only its coloured dot, its text kept for screen readers. */
  .title { flex: 1 1 0; min-width: 5ch; font-size: 16px; font-weight: 500; color: var(--primary-text-color);
           white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
           /* show_title: false keeps the title's room (the pill and buttons stay in place) */
  :host([hide-title]) .head > .title { visibility: hidden; }
  .pill { all: unset; flex: 0 1 auto; min-width: 0; box-sizing: border-box; position: relative;
          display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 500;
          padding: 1px 8px; border-radius: 999px; background: color-mix(in srgb, var(--c) 14%, transparent);
          /* Coloured text is half the accent, half the text colour: 4.5:1 on its tint in light and dark themes, where
             the bare accent (amber above all) is not. */
          color: color-mix(in srgb, var(--c) 50%, var(--primary-text-color, #212121)); }
  .pt { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pill ha-icon { flex: none; }
  /* A card this narrow (6 columns of the Sections view on a phone): the title is at its few letters already, so the
     status pill goes to a line of its own under it, where its whole label fits, rather than end with "…". */
  @container (max-width: 260px) {
    .head { flex-wrap: wrap; row-gap: 4px; }
    .head::after { content: ""; order: 1; flex: 1 0 100%; }
    .head > .pill { order: 2; margin-left: 50px; max-width: calc(100% - 50px); }
  }
  @container (max-width: 200px) {
    /* Under 200 px the pill is only its dot again: back on the title's line. */
    .head { flex-wrap: nowrap; }
    .head::after { content: none; }
    .head > .pill { order: 0; margin-left: 0; max-width: none; }
    .head > .pill .pt, .st .pt { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
    .head > .pill:not(.action), .st { flex: none; padding: 0; width: 18px; height: 18px; justify-content: center; background: none; }
    .head > .pill:not(.action)::before, .st::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--c); }
    .head > .pill.action { padding: 1px 4px; }
    /* A full card this narrow (6 columns of the Sections view on a phone): a smaller badge, no side chip in the header. */
    .head { gap: 6px; }
    .head > .badge { width: 32px; height: 32px; }
    .head > .badge ha-icon { --mdc-icon-size: 20px; }
    .head > .chip { display: none; }
  }
  .pill.action { cursor: pointer; }
  .pill.action:hover { background: color-mix(in srgb, var(--c) 24%, transparent); }
  .pill.action:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
  .pill ha-icon { --mdc-icon-size: 12px; margin-left: -2px; }

  .grid { display: grid; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); gap: 6px; margin-top: 8px; }
  .tile { all: unset; position: relative; overflow: hidden; box-sizing: border-box; cursor: pointer; min-width: 0;
          display: flex; align-items: center; gap: 8px; padding: 5px 8px 5px 5px; border-radius: 10px;
          touch-action: pan-y; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;
          background: color-mix(in srgb, var(--t) 9%, var(--secondary-background-color, transparent));
          border: 1px solid color-mix(in srgb, var(--t) 22%, transparent); transition: background .2s, border-color .2s; }
  .tile.off, .tile.na { background: var(--secondary-background-color, transparent); border-color: transparent; }
  .tile.na { --t: var(--rc-na); opacity: .7; }
  .tile:hover { background: color-mix(in srgb, var(--t) 15%, var(--secondary-background-color, transparent)); }
  .tile:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
  .ic, .txt { position: relative; }
  .ic { flex: none; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center;
        color: var(--t); background: color-mix(in srgb, var(--t) 20%, transparent); }
  .ic ha-icon { --mdc-icon-size: 16px; }
  .txt { display: flex; flex-direction: column; min-width: 0; }
  .name { font-size: 13px; font-weight: 500; line-height: 1.2; color: var(--primary-text-color);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  /* A reading is never cut: on a narrow tile it goes on to a second line (the name, a label, keeps its ellipsis). */
  .state { font-size: 11px; line-height: 1.2; color: var(--secondary-text-color); overflow-wrap: break-word; }
  /* A card this narrow (a phone, 6 columns of the Sections view): one tile per row, whatever the columns option. */
  @container (max-width: 260px) { .grid { grid-template-columns: minmax(0, 1fr); } }
  /* layout: tiles — the size of Home Assistant's Tile card — 56 px high, a 40 px icon, the name over the state. */
  .layout-tiles .grid { gap: 8px; }
  .layout-tiles .tile { min-height: 56px; gap: 10px; padding: 8px 10px 8px 8px; border-radius: 12px; }
  .layout-tiles .ic { width: 40px; height: 40px; }
  .layout-tiles .ic ha-icon { --mdc-icon-size: 24px; }
  .layout-tiles .txt { gap: 2px; }
  .layout-tiles .name { font-size: 14px; line-height: 1.25; }
  .layout-tiles .state { font-size: 12px; line-height: 1.25; }

  @keyframes rc-blink { 0%, 100% { opacity: 1 } 50% { opacity: .35 } }
  @keyframes rc-pulse { 0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--c) 45%, transparent) }
                        50% { box-shadow: 0 0 0 7px transparent } }
  @media (prefers-reduced-motion: reduce) { .tile, .lvl-alert .badge { animation: none; transition: none; } }
`;

// Mini cards: layout, chips and zoom button. A chip is plain (icon and text) until it needs a look: then a tinted pill.
// The zoom / detail button of the mini cards and the overviews.
const RC_ZOOM_STYLES = `
  /* 40 px to tap, laid out as the 24 px it looks (the negative margins). */
  .zoom { all: unset; flex: none; cursor: pointer; width: 40px; height: 40px; margin: -12px -12px -12px -8px; border-radius: 50%;
          display: grid; place-items: center; color: var(--secondary-text-color); }
  .zoom ha-icon { --mdc-icon-size: 16px; }
  .zoom:hover { background: color-mix(in srgb, var(--rc-idle) 16%, transparent); color: var(--primary-text-color); }
  .zoom:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 1px; }
`;

const RC_MINI_STYLES = `${RC_ZOOM_STYLES}
  /* The badge sits 12px from the card's top-left corner, like the other ha-* cards, beside the title and the readings. */
  ha-card:has(.mini) { padding: 12px; }
  .mini { display: flex; align-items: flex-start; gap: 10px; }
  /* The badge keeps the full card's size (40 px, icon 24 px): the body is at least as tall, a lone title line centred
     beside it. */
  .body { flex: 1; min-width: 0; min-height: 40px; display: flex; flex-direction: column; justify-content: center; gap: 4px; }
  .mini .head { gap: 8px; }
  .mini .title { line-height: 1.25; }
  .st { flex: 0 1 auto; min-width: 0; position: relative; display: inline-flex; align-items: center;
        margin-left: auto; font-size: 11px; font-weight: 500; color: var(--c); }
  .rs { display: flex; flex-wrap: wrap; gap: 2px 4px; margin-left: -4px; }
  .rs:empty { display: none; }
  /* A chip never runs past the card: a long name ends with an ellipsis. */
  .r { all: unset; cursor: pointer; display: inline-flex; align-items: baseline; gap: 1px; padding: 0 5px 0 4px;
       box-sizing: border-box; min-width: 0; max-width: 100%; overflow: hidden;
       border-radius: 999px; font-size: 12px; font-weight: 500; line-height: 24px; white-space: nowrap; --t: var(--rc-ok);
       color: var(--primary-text-color); }
  .r ha-icon { --mdc-icon-size: 13px; flex: none; color: var(--t); align-self: center; margin-right: 2px; }
  .r > span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .r.pill { color: color-mix(in srgb, var(--t) 50%, var(--primary-text-color, #212121)); background: color-mix(in srgb, var(--t) 14%, transparent); }
  .r:hover { background: color-mix(in srgb, var(--t) 20%, var(--secondary-background-color, transparent)); }
  .r:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
`;
