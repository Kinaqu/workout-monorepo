export const navLinks = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "For You", href: "#for-you" },
  { label: "Results", href: "#results" },
  { label: "FAQ", href: "#faq" },
] as const;

export const heroHighlights = [
  "Starts from your real level",
  "Works at home, outdoors, or with minimal equipment",
  "Adjusts when life or recovery gets messy",
] as const;

export const trustItems = [
  "Adaptive progression instead of generic plans",
  "Bodyweight, minimal-equipment, and outdoor-ready",
  "Designed for beginners and returning athletes",
  "Structured weekly plans with clear next steps",
  "Recovery-aware adjustments that keep momentum alive",
  "Prelaunch early access for focused beta users",
] as const;

export const trustStats = [
  {
    label: "Plan style",
    value: "Adaptive weekly structure",
    detail: "Assessment-led and adjusted by session feedback",
  },
  {
    label: "Built for",
    value: "Home, outdoors, minimal equipment",
    detail: "No gym-first assumptions in the core flow",
  },
  {
    label: "Session rhythm",
    value: "20 to 45 minute training blocks",
    detail: "Made for real schedules instead of ideal ones",
  },
] as const;

export const flowSteps = [
  {
    number: "01",
    title: "Run a quick fit check",
    description:
      "Tell Kinova your current level, goals, available equipment, weekly schedule, and any movement limits.",
    detailLabel: "Assessment snapshot",
    detailValue: "Beginner, 3x per week, pull-up goal, bands + floor space",
  },
  {
    number: "02",
    title: "Get a weekly plan that fits now",
    description:
      "Kinova maps your training week with focused sessions, progression targets, and volume that matches your current capacity.",
    detailLabel: "Week example",
    detailValue: "Pull, lower body, mobility reset, optional outdoor conditioning",
  },
  {
    number: "03",
    title: "Train and log what actually happened",
    description:
      "Complete the session, mark what felt strong or heavy, and keep a useful record instead of vague notes you never revisit.",
    detailLabel: "Session note",
    detailValue: "Grip fatigue high, core felt strong, finished in 31 minutes",
  },
  {
    number: "04",
    title: "Let the next step adjust",
    description:
      "When you are ready, Kinova advances the path. If the week is rough, it regresses intelligently and keeps momentum alive.",
    detailLabel: "Adaptive update",
    detailValue: "Volume reduced, progression path preserved, next session still on track",
  },
] as const;

export const featureCards = [
  {
    title: "Adaptive difficulty",
    body: "Kinova raises the challenge when you are ready and scales intelligently when you are not, so progress stays sustainable.",
    eyebrow: "Core system",
    accent: "from-[#125bff]/30 via-[#125bff]/10 to-transparent",
    span: "lg:col-span-2 lg:row-span-2",
    bullets: [
      "Progression steps instead of all-or-nothing intensity",
      "Recovery-aware adjustments after difficult sessions",
    ],
  },
  {
    title: "Weekly structure with a clear purpose",
    body: "Every session connects to a bigger goal, so users always know what they are doing and why it matters.",
    eyebrow: "Training flow",
    accent: "from-white/14 via-white/6 to-transparent",
    span: "lg:col-span-2",
    bullets: [
      "Pull, push, lower body, mobility, conditioning",
      "No random workout roulette",
    ],
  },
  {
    title: "Built for real-world constraints",
    body: "Home setups, park sessions, small spaces, and limited time are treated as first-class inputs, not edge cases.",
    eyebrow: "Practical fit",
    accent: "from-[#8ab4ff]/25 via-[#8ab4ff]/8 to-transparent",
    span: "lg:col-span-1",
    bullets: ["Minimal-equipment friendly", "Short-session ready"],
  },
  {
    title: "Smarter regressions",
    body: "Missing a movement or struggling with a session does not break the plan. Kinova gives the next best step and keeps the line moving.",
    eyebrow: "Momentum",
    accent: "from-[#7cf2c8]/18 via-[#7cf2c8]/5 to-transparent",
    span: "lg:col-span-1",
    bullets: ["Treats setbacks as strategy", "Protects consistency"],
  },
  {
    title: "Guidance for normal people, not ideal athletes",
    body: "The system is made for beginners, returners, and people who need structure without being overpowered by a coach voice.",
    eyebrow: "Tone",
    accent: "from-[#ffd66b]/18 via-[#ffd66b]/6 to-transparent",
    span: "lg:col-span-2",
    bullets: [
      "Clear prompts instead of fitness jargon",
      "Designed for confidence as much as performance",
    ],
  },
] as const;

export const comparisonRows = [
  {
    generic: "Generic content libraries and random sessions",
    kinova: "One evolving plan shaped around your current level and target",
  },
  {
    generic: "Intensity that is too hard, too easy, or both",
    kinova: "Progression that adapts to performance and readiness",
  },
  {
    generic: "A missed week breaks the rhythm",
    kinova: "The route adjusts and keeps momentum alive",
  },
  {
    generic: "Gym-first assumptions",
    kinova: "Home, park, bodyweight, and minimal-equipment ready by default",
  },
] as const;

export const audienceCards = [
  {
    title: "New to training",
    description:
      "Start with accessible progressions, confident instructions, and sessions that teach you how to build the base correctly.",
  },
  {
    title: "Returning after a break",
    description:
      "Rebuild without rushing, using structure that respects where your body is now instead of where it used to be.",
  },
  {
    title: "Home training users",
    description:
      "Train in small spaces with simple tools, bodyweight variations, and weekly plans that do not assume a full gym.",
  },
  {
    title: "Outdoor and calisthenics users",
    description:
      "Use parks, bars, rings, and bodyweight patterns while still following a plan with clear progression logic.",
  },
  {
    title: "People short on time",
    description:
      "Keep sessions concise and useful, with 20 to 45 minute blocks that fit a real calendar instead of an aspirational one.",
  },
  {
    title: "People who need structure",
    description:
      "Stop guessing what to do next and follow a route that connects each session to a larger outcome.",
  },
] as const;

export const progressionStates = [
  {
    title: "Advance when the signal is strong",
    description:
      "Good form, stable volume, and strong session feedback unlock the next variation or load target gradually.",
  },
  {
    title: "Regress intelligently when a session is rough",
    description:
      "Kinova drops to a smarter step when needed, so users still complete productive work instead of forcing misses.",
  },
  {
    title: "Protect the streak after imperfect weeks",
    description:
      "Schedule breaks, life friction, and low-energy sessions do not reset everything. The plan bends and keeps moving forward.",
  },
] as const;

export const outcomeCards = [
  {
    title: "Consistency feels realistic",
    body: "Users stop negotiating with random workouts and start following a plan that fits the week they actually have.",
  },
  {
    title: "Progression stops feeling chaotic",
    body: "Strength, movement quality, and skill development build from one step to the next instead of stalling in place.",
  },
  {
    title: "Confidence increases with every session",
    body: "When the plan meets the level correctly, training feels less intimidating and more repeatable.",
  },
] as const;

export const testimonials = [
  {
    quote:
      "The biggest difference is that it does not punish an imperfect week. I still know what the next right step is.",
    name: "Early beta user",
    role: "Returning to training",
  },
  {
    quote:
      "It feels built for actual life. Small apartment, bands, pull-up bar, 30 minutes. The plan still makes sense.",
    name: "Pilot user",
    role: "Home and bodyweight training",
  },
  {
    quote:
      "Instead of telling me to push harder, it adjusts and keeps me progressing. That alone changes adherence.",
    name: "Coach feedback",
    role: "Movement and progression review",
  },
] as const;

export const methodologyPoints = [
  "Assessment-led planning before the first week starts",
  "Progression logic that respects readiness, not ego",
  "Movement quality, strength, and consistency treated as one system",
  "Designed for people without ideal schedules or ideal equipment",
] as const;

export const pricingTiers = [
  {
    name: "Early Access",
    price: "Free",
    description:
      "Join the first wave, shape the product, and get direct access to early Kinova updates.",
    points: [
      "Priority access to the adaptive planning beta",
      "Early product walkthrough and fit-check flow",
      "Feedback channel with the Kinova team",
    ],
    highlighted: true,
  },
  {
    name: "What happens next",
    price: "Fast follow-up",
    description:
      "After you apply, Kinova reviews fit, sends onboarding details, and shares next-step access as new slots open.",
    points: [
      "No generic mailing-list dead end",
      "Clear signal on timing and availability",
      "Built for focused early adopters, not mass signups",
    ],
    highlighted: false,
  },
] as const;

export const faqs = [
  {
    question: "Is Kinova for complete beginners?",
    answer:
      "Yes. The first step is a fit check that places users at a realistic starting point, so the plan begins with movements and volume they can actually handle.",
  },
  {
    question: "How does Kinova adapt difficulty?",
    answer:
      "Kinova uses training inputs like completed work, session feel, readiness, and progression state to decide whether to advance, hold, or regress the next step.",
  },
  {
    question: "What if I miss a week or have a rough session?",
    answer:
      "The plan does not assume perfect adherence. Kinova adjusts the route and protects momentum instead of treating a difficult week like failure.",
  },
  {
    question: "Do I need equipment?",
    answer:
      "No full gym is required. Kinova is designed to work with bodyweight, minimal equipment, and simple home or outdoor setups.",
  },
  {
    question: "How long are sessions?",
    answer:
      "Most sessions are designed to land in a practical range, typically around 20 to 45 minutes depending on the user profile and training block.",
  },
  {
    question: "Is this replacing a coach?",
    answer:
      "Kinova is closer to an adaptive planning system than a motivational coach feed. It gives users structure, progression, and next-step clarity they can actually follow.",
  },
  {
    question: "What happens after I request early access?",
    answer:
      "You land in the early-access flow, share your training context, and the team uses that signal to open beta spots with clearer product fit.",
  },
  {
    question: "What about privacy?",
    answer:
      "Only the information needed for onboarding and adaptive planning should be collected. Privacy and usage details are documented in the dedicated policy pages.",
  },
] as const;
