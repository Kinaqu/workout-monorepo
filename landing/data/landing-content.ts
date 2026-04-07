export const navLinks = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Who It's For", href: "#for-you" },
  { label: "Early Access", href: "#early-access" },
  { label: "FAQ", href: "#faq" },
] as const;

export const heroHighlights = [
  "Starts from your current level",
  "Works at home, outdoors, or with minimal equipment",
  "Adjusts after missed sessions or low-recovery weeks",
] as const;

export const trustItems = [
  "Built for bodyweight, bands, rings, bars, and compact home setups",
  "Structured around 20 to 45 minute sessions",
  "Designed for beginners and returning athletes",
] as const;

export const trustStats = [
  {
    label: "Session length",
    value: "20 to 45 minutes",
    detail: "Short enough for weekdays, structured enough to matter.",
  },
  {
    label: "Setup fit",
    value: "Home, park, or minimal gear",
    detail: "No gym-first assumptions in the core plan.",
  },
  {
    label: "Plan response",
    value: "Advance, hold, or scale back",
    detail: "The next session reacts to what actually happened.",
  },
] as const;

export const flowSteps = [
  {
    number: "01",
    title: "Start with a fast fit check",
    description:
      "Tell Kinova your level, goal, available equipment, schedule, and any movement limits.",
    detailLabel: "Example input",
    detailValue: "Beginner, 3x per week, pull-up goal, bands + floor space",
  },
  {
    number: "02",
    title: "Get a plan that fits this week",
    description:
      "Kinova maps a week of focused sessions around your actual capacity instead of an ideal routine.",
    detailLabel: "Week view",
    detailValue: "Pull, lower body, mobility reset, optional outdoor conditioning",
  },
  {
    number: "03",
    title: "Train and log the signal",
    description:
      "Complete the session and note what felt smooth, heavy, or incomplete so the plan stays useful.",
    detailLabel: "Session signal",
    detailValue: "Grip fatigue high, core strong, finished in 31 minutes",
  },
  {
    number: "04",
    title: "Let the next step adapt",
    description:
      "Strong sessions move you forward. Rough weeks trigger smarter regressions without breaking momentum.",
    detailLabel: "Adaptive update",
    detailValue: "Volume trimmed, progression path preserved, next workout still clear",
  },
] as const;

export const featureCards = [
  {
    title: "Progression that meets the day",
    body: "Kinova raises difficulty when the signal is good and scales back when recovery, adherence, or form says it should.",
    eyebrow: "Adaptive engine",
    accent: "from-[#125bff]/30 via-[#125bff]/10 to-transparent",
    span: "lg:col-span-2 lg:row-span-2",
    bullets: [
      "Advance, hold, or regress with purpose",
      "Protects consistency after rough sessions",
    ],
  },
  {
    title: "A real weekly structure",
    body: "Every session has a job inside the week, so users stop guessing what to do next.",
    eyebrow: "Weekly plan",
    accent: "from-white/14 via-white/6 to-transparent",
    span: "lg:col-span-2",
    bullets: ["Clear training split", "No workout roulette"],
  },
  {
    title: "Constraint-aware by default",
    body: "Small spaces, simple tools, and uneven schedules are built into the plan from the start.",
    eyebrow: "Practical fit",
    accent: "from-[#8ab4ff]/25 via-[#8ab4ff]/8 to-transparent",
    span: "lg:col-span-1",
    bullets: ["Minimal-equipment friendly", "Short-session ready"],
  },
  {
    title: "Useful feedback, not noise",
    body: "A few honest session signals are enough to keep the route moving in the right direction.",
    eyebrow: "Feedback loop",
    accent: "from-[#7cf2c8]/18 via-[#7cf2c8]/5 to-transparent",
    span: "lg:col-span-1",
    bullets: ["Logs what matters", "Keeps the next step clear"],
  },
] as const;

export const comparisonRows = [
  {
    generic: "Random workouts picked session by session",
    kinova: "One weekly plan shaped around your current level and goal",
  },
  {
    generic: "Gym-first defaults",
    kinova: "Home, park, bodyweight, and minimal-equipment ready",
  },
  {
    generic: "A rough week breaks the rhythm",
    kinova: "The route adapts and keeps momentum alive",
  },
  {
    generic: "Progression feels unclear",
    kinova: "Each next step reacts to performance and readiness",
  },
] as const;

export const audienceCards = [
  {
    title: "Beginners",
    description:
      "Start from progressions you can actually complete instead of plans that overshoot day one.",
  },
  {
    title: "Returning after a break",
    description:
      "Rebuild with structure that respects your current capacity instead of your old numbers.",
  },
  {
    title: "Home training users",
    description:
      "Use bodyweight, bands, a pull-up bar, or a compact setup without losing plan quality.",
  },
  {
    title: "Outdoor and calisthenics users",
    description:
      "Train with bars, rings, and park sessions while still following a progression-based weekly plan.",
  },
] as const;

export const progressionStates = [
  {
    title: "Advance when the signal is strong",
    description:
      "Good form, stable volume, and strong session feedback unlock the next progression step.",
  },
  {
    title: "Hold or scale back when needed",
    description:
      "Kinova can reduce load or complexity without making the user feel like they lost the whole week.",
  },
  {
    title: "Protect momentum after imperfect weeks",
    description:
      "Schedule breaks and uneven recovery change the route, not the overall direction.",
  },
] as const;

export const outcomeCards = [
  {
    title: "Training feels easier to stick to",
    body: "The plan fits the week you actually have, so consistency stops feeling fragile.",
  },
  {
    title: "Progression stops feeling random",
    body: "Users can see why a session moved forward, stayed steady, or scaled back.",
  },
  {
    title: "Confidence grows session by session",
    body: "Better fit means less second-guessing and more useful reps over time.",
  },
] as const;

export const testimonials = [
  {
    quote:
      "The biggest change is that a rough week no longer breaks the plan. I still know what to do next.",
    name: "Pilot user",
    role: "Returning to training",
  },
  {
    quote:
      "Small apartment, bands, pull-up bar, 30 minutes. It still feels like a real program instead of a compromise.",
    name: "Early access applicant",
    role: "Home training setup",
  },
  {
    quote:
      "The logic is clear. It adapts without turning every session into a negotiation.",
    name: "Coach review",
    role: "Movement and progression feedback",
  },
] as const;

export const methodologyPoints = [
  "Assessment-led planning before week one starts",
  "Progression logic tied to readiness and session signal",
  "Movement quality, strength, and consistency treated as one system",
  "Designed for limited time and limited equipment",
] as const;

export const pricingTiers = [
  {
    name: "Early Access",
    price: "Free",
    description:
      "Join the first Kinova cohort and help shape the adaptive planning experience from the start.",
    points: [
      "Access to the early planning flow",
      "Product updates as new capabilities ship",
      "Direct feedback channel with the Kinova team",
    ],
    highlighted: true,
  },
  {
    name: "What to expect",
    price: "Small batch onboarding",
    description:
      "Apply once, share your setup, and get a clear follow-up instead of disappearing into a generic waitlist.",
    points: [
      "We review goal, setup, and current fit",
      "You get a clear next step by email",
      "New users are invited in focused batches",
    ],
    highlighted: false,
  },
] as const;

export const faqs = [
  {
    question: "Is Kinova for complete beginners?",
    answer:
      "Yes. The fit check places you at a realistic starting point so the plan begins with work you can handle.",
  },
  {
    question: "Do I need a full gym?",
    answer:
      "No. Kinova is designed for bodyweight, minimal equipment, and simple home or outdoor setups.",
  },
  {
    question: "What happens after a rough week?",
    answer:
      "The plan adapts. Kinova can hold or scale back the next step without erasing momentum.",
  },
  {
    question: "How long are sessions?",
    answer:
      "Most sessions are built to land in a practical 20 to 45 minute range.",
  },
  {
    question: "Is this replacing a coach?",
    answer:
      "No. Kinova is an adaptive planning system for people who want structure and a clear next step.",
  },
  {
    question: "What happens after I request access?",
    answer:
      "You share your training context, the team reviews fit, and new spots open in small batches.",
  },
] as const;
