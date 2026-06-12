export const navLinks = [
  { label: "Free Routine", href: "#daily-minimum" },
  { label: "Progression", href: "#pro" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
] as const;

export type DecisionKind = "start" | "advance" | "hold" | "regress";

export type HeroDemoRow = {
  target: string;
  decision: { kind: DecisionKind; label: string };
};

export type HeroDemoWeek = {
  week: number;
  note: string;
  rows: readonly HeroDemoRow[];
};

export const heroDemoExercises = [
  "Push-ups",
  "Side plank",
  "Split squats",
] as const;

// Scripted, deterministic 8-week run for the hero decision-log demo.
// Week 5 is the honest beat: a short week bends targets without a reset.
export const heroDemoWeeks: readonly HeroDemoWeek[] = [
  {
    week: 1,
    note: "Baseline set from your profile. Nothing heroic on day one.",
    rows: [
      { target: "8 reps", decision: { kind: "start", label: "Start" } },
      { target: "30s", decision: { kind: "start", label: "Start" } },
      { target: "8 reps", decision: { kind: "start", label: "Start" } },
    ],
  },
  {
    week: 2,
    note: "Clean sessions logged. Every target steps up.",
    rows: [
      { target: "9 reps", decision: { kind: "advance", label: "Advance +1" } },
      { target: "32s", decision: { kind: "advance", label: "Advance +2s" } },
      { target: "9 reps", decision: { kind: "advance", label: "Advance +1" } },
    ],
  },
  {
    week: 3,
    note: "Split squats felt heavy — one target holds, two move.",
    rows: [
      { target: "10 reps", decision: { kind: "advance", label: "Advance +1" } },
      { target: "35s", decision: { kind: "advance", label: "Advance +3s" } },
      { target: "9 reps", decision: { kind: "hold", label: "Hold" } },
    ],
  },
  {
    week: 4,
    note: "Push-ups stay put while form catches up.",
    rows: [
      { target: "10 reps", decision: { kind: "hold", label: "Hold" } },
      { target: "38s", decision: { kind: "advance", label: "Advance +3s" } },
      { target: "10 reps", decision: { kind: "advance", label: "Advance +1" } },
    ],
  },
  {
    week: 5,
    note: "Short week logged. Targets bend — the direction doesn't.",
    rows: [
      { target: "9 reps", decision: { kind: "regress", label: "Regress −1" } },
      { target: "38s", decision: { kind: "hold", label: "Hold" } },
      { target: "10 reps", decision: { kind: "hold", label: "Hold" } },
    ],
  },
  {
    week: 6,
    note: "Back on route. The regression cost nothing.",
    rows: [
      { target: "10 reps", decision: { kind: "advance", label: "Advance +1" } },
      { target: "40s", decision: { kind: "advance", label: "Advance +2s" } },
      { target: "11 reps", decision: { kind: "advance", label: "Advance +1" } },
    ],
  },
  {
    week: 7,
    note: "Two up, one holds. Progress without roulette.",
    rows: [
      { target: "11 reps", decision: { kind: "advance", label: "Advance +1" } },
      { target: "42s", decision: { kind: "advance", label: "Advance +2s" } },
      { target: "11 reps", decision: { kind: "hold", label: "Hold" } },
    ],
  },
  {
    week: 8,
    note: "Eight weeks: +4 push-ups, +15s plank. No reset needed.",
    rows: [
      { target: "12 reps", decision: { kind: "advance", label: "Advance +1" } },
      { target: "45s", decision: { kind: "advance", label: "Advance +3s" } },
      { target: "12 reps", decision: { kind: "advance", label: "Advance +1" } },
    ],
  },
];

export const catalogTicker = [
  "Push-ups · 8–12",
  "Bodyweight squats · 12–15",
  "Dips · 10–15",
  "Bulgarian split squats · 8–12",
  "Side plank · 30–45s",
  "Hollow body hold · 20–40s",
  "Dead bug · 12–16",
  "Bird dog · 10–14",
  "Single-leg balance · 40–60s",
  "Mobility day",
] as const;

export const maintenanceRoutine = [
  { name: "Push-ups", dose: "10 reps" },
  { name: "Bodyweight squats", dose: "10 reps" },
  { name: "Dips", dose: "10 reps" },
  { name: "Plank", dose: "30 seconds" },
] as const;

export const proLedger = {
  weekCount: 8,
  rows: [
    {
      name: "Push-ups",
      values: ["8", "9", "10", "10", "9", "10", "11", "12"],
    },
    {
      name: "Side plank",
      values: ["30s", "32s", "35s", "38s", "38s", "40s", "42s", "45s"],
    },
    {
      name: "Split squats",
      values: ["8", "9", "9", "10", "10", "11", "11", "12"],
    },
  ],
  marks: [
    { week: 4, kind: "hold", label: "Hold" },
    { week: 5, kind: "regress", label: "Regress — short week" },
    { week: 8, kind: "advance", label: "Advance" },
  ],
  caption: "Week 5 was rough. The plan bent. The direction didn't.",
} as const;

export const proPillars = [
  { label: "Signal", value: "Your logged sessions" },
  { label: "Decision", value: "Advance · hold · regress" },
  { label: "Output", value: "Next week's exact targets" },
] as const;

export const proTracks = [
  "Push-up milestones",
  "Plank endurance",
  "Lower-body strength",
] as const;

export const flowSteps = [
  {
    number: "01",
    title: "Profile in",
    description: "Set your level, gear, schedule, and movement limits.",
  },
  {
    number: "02",
    title: "Week out",
    description: "Get this week's plan, built for your actual capacity.",
  },
  {
    number: "03",
    title: "Signal back",
    description: "Train, then log how it actually went.",
  },
  {
    number: "04",
    title: "Targets adjust",
    description: "Advance, hold, or regress — next week is already written.",
  },
] as const;

export type PricingTier = {
  name: string;
  tagline: string;
  priceLabel: string;
  badge?: string;
  description: string;
  points: readonly string[];
  ctaLabel: string;
  ctaHref: string;
  footnote?: string;
  highlighted: boolean;
};

export const pricingTiers: readonly PricingTier[] = [
  {
    name: "Free",
    tagline: "The Daily Minimum",
    priceLabel: "Free, forever",
    description:
      "One fixed routine to hold your baseline on the days nothing else happens.",
    points: [
      "The fixed daily routine: push-ups, squats, dips, plank",
      "Daily check-off and streak",
      "Same targets every day — maintenance, not progression",
    ],
    ctaLabel: "Start free",
    ctaHref: "/early-access",
    highlighted: false,
  },
  {
    name: "Pro",
    tagline: "The Progression Engine",
    priceLabel: "Founding pricing soon",
    badge: "Early access",
    description:
      "An adaptive week that moves with how training actually goes.",
    points: [
      "Adaptive weekly plan built from your level, gear, and schedule",
      "Advance / hold / regress decision after every logged session",
      "Goal plans for specific milestones",
      "Direct feedback line with the team",
    ],
    ctaLabel: "Get Pro early access",
    ctaHref: "/early-access?plan=pro",
    footnote: "Free while in early access. Founding members lock the launch price.",
    highlighted: true,
  },
];

export const faqs = [
  {
    question: "What do I get for free?",
    answer:
      "The daily minimum: ten push-ups, ten squats, ten dips, and a plank, with a daily check-off and streak. It keeps your baseline. It does not get harder.",
  },
  {
    question: "What does Pro actually do?",
    answer:
      "Pro builds your week from your level, gear, and schedule, then adjusts after every logged session. If push-ups feel solid at 8, next week asks for 9 — and an eight-week block can take you from 8 to 12.",
  },
  {
    question: "How much will Pro cost?",
    answer:
      "There is no price yet. Early access is free, and founding pricing is announced to the waitlist before launch — members lock it in.",
  },
  {
    question: "What happens after a rough week?",
    answer:
      "The engine holds or regresses your targets instead of pretending the week didn't happen. The direction stays; only the next step changes.",
  },
  {
    question: "Do I need a gym, or experience?",
    answer:
      "No. Everything is built for bodyweight and minimal gear, and targets start where you are — eight push-ups is a fine week one.",
  },
  {
    question: "What happens after I apply?",
    answer:
      "You share your training context, the team reviews fit, and new spots open in small batches with a clear email follow-up.",
  },
] as const;
