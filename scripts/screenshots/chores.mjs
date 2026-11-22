// Renders the chores cards with mock chores and saves the README screenshots.
// Usage: npm install && npm run build && node scripts/screenshots/chores.mjs
import { pair, shoot } from "./harness.mjs";
import { pageScript, setup } from "./mock.mjs";

// Stills: animations: false stops the broom and the stars, so a capture only changes when the card does.
const still = (file, s) => pair(file, { ...s, config: { animations: false, ...s.config } });
const ws = pageScript();
await shoot({
  prefix: "chores",
  tag: "chores-card",
  shots: [
    ...still("overdue", { scene: "overdue" }),
    ...still("kid", { scene: "overdue", open: '.fc[data-p="person.kid_2"]' }),
    ...still("plain", { scene: "plain" }),
    ...still("done", { scene: "done" }),
    ...still("classic", { scene: "overdue", config: { illustration: false, show_done: false } }),
    ...still("narrow", { scene: "overdue", width: 300 }),
  ],
  setup,
  ws,
});
await shoot({
  prefix: "chores-mini",
  tag: "chores-mini-card",
  shots: [...still("overdue", { scene: "overdue" }), ...still("done", { scene: "done" }), ...still("zoom", { scene: "overdue", open: ".zoom" })],
  setup,
  ws,
});
