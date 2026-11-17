// Default 9x9 matrix: 1 core goal, 8 directions, 64 items (8 per direction).
// The user's own edits are stored in the database and layered on top of these defaults.

export type ItemType = "Habit" | "Mini-Goal" | "Quality";

export interface Direction {
  id: number;
  name: string;
  short: string;
}

export interface MatrixItem {
  id: number; // 1-64
  directionId: number; // 1-8
  type: ItemType;
  text: string;
}

export type CellKind = "core" | "compass" | "hub" | "item";

export interface Cell {
  index: number; // 0-80, row-major
  row: number; // 1-9
  col: number; // 1-9
  block: number; // 0-8, row-major 3x3 block
  kind: CellKind;
  directionId?: number;
  itemId?: number;
}

export const CORE_GOAL =
  "Land a 10,000 PLN/mo full-stack role (.NET + React/TS), reach 65 kg of lean muscle, finish the CS degree, and lead by disciplined action.";

export const DIRECTIONS: Direction[] = [
  { id: 1, name: "Backend (.NET / C#)", short: "Backend" },
  { id: 2, name: "Frontend (React / TS)", short: "Frontend" },
  { id: 3, name: "Career (10k PLN)", short: "Career" },
  { id: 4, name: "University (Sem 7)", short: "University" },
  { id: 5, name: "Physique (59 → 65 kg)", short: "Physique" },
  { id: 6, name: "Dopamine & Digital Hygiene", short: "Dopamine" },
  { id: 7, name: "Reading & Deep Focus", short: "Focus" },
  { id: 8, name: "Character & Faith", short: "Character" },
];

const H: ItemType = "Habit";
const M: ItemType = "Mini-Goal";
const Q: ItemType = "Quality";

// 8 items per direction, in the order they fill the direction's 3x3 block
// (row by row, skipping the center hub).
const ITEMS_BY_DIRECTION: [ItemType, string][][] = [
  // 1. Backend
  [
    [H, "Write or debug C# / ASP.NET Core code for at least 2 Pomodoros (40 min) on 5 days/week."],
    [H, "Write automated unit or integration tests (xUnit) for every new endpoint built."],
    [M, "Build a production-ready multi-tenant REST API with ASP.NET Core, EF Core, and PostgreSQL."],
    [M, "Implement JWT authentication, role-based access control, and refresh tokens in the flagship API."],
    [M, "Containerize the backend and PostgreSQL database with Docker Compose for one-command setup."],
    [M, "Master 30 core .NET interview topics (LINQ, async/await, DI lifetimes, EF tracking, SQL indexing)."],
    [Q, "Trace how data and queries execute under the hood before accepting any AI-generated code."],
    [Q, "Keep controllers thin and isolate business rules cleanly inside service layers."],
  ],
  // 2. Frontend
  [
    [H, "Build or refactor React + TypeScript UI components for at least 2 Pomodoros (40 min) on 4 days/week."],
    [H, "Enforce strict TypeScript typing (zero 'any' shortcuts) across all personal frontend code."],
    [M, "Complete the remaining 32% of The Odin Project JavaScript course."],
    [M, "Complete the remaining 68% of The Odin Project React course."],
    [M, "Build a full-featured React + TypeScript client connected to your ASP.NET Core API."],
    [M, "Implement clean state management, form validation, and proper loading/error states across all views."],
    [Q, "Apply the component architecture and testing discipline used at EY rather than hacking quick demos."],
    [Q, "Verify responsive layout on both desktop and mobile screens before marking any feature complete."],
  ],
  // 3. Career
  [
    [H, "Send 3-4 tailored full-stack applications or recruiter messages per day (20-30 per week)."],
    [H, "Practice 15 minutes of spoken technical English / architecture explanations 3 times per week."],
    [M, "Replace beginner GitHub pins with 2-3 full-stack .NET + React repos with live demos and clear READMEs."],
    [M, "Rewrite CV and LinkedIn to highlight measurable engineering impact from EY (6 mos) and Akvelon (3 mos)."],
    [M, "Prepare a crisp 2-minute walkthrough covering architecture decisions, trade-offs, and debugging wins from past work."],
    [M, "Complete 5 full mock interviews (live coding + system design + behavioral) before peak interviewing."],
    [Q, "Present yourself as a full-stack engineer who ships business outcomes, not a passive junior asking what to do."],
    [Q, "Treat every rejection or coding challenge as diagnostic feedback rather than a trigger to doom-scroll."],
  ],
  // 4. University
  [
    [H, "Dedicate 2 Pomodoros (40 min) Monday-Thursday to thesis work or coursework between/after classes."],
    [H, "Stay actively engaged during all remote lectures (zaj. zdalne) with social media and games closed."],
    [M, "Submit every milestone and chapter of projekt inżynierski ahead of advisor deadlines."],
    [M, "Complete all Sem 7 lab deliverables (Wzorce Projektowe, Kryptografia, PZSI, IAD, TO) on time."],
    [M, "Build a condensed revision guide for egzamin inżynierski and review 2 topics every week."],
    [M, "Freeze a complete, tested build and documentation of your engineering project 3 weeks before defense."],
    [Q, "Finish the degree cleanly on the first attempt while protecting your strong GPA."],
    [Q, "Prevent last-minute academic emergencies by breaking assignments into weekly chunks early."],
  ],
  // 5. Physique
  [
    [H, "Complete 4 structured home calisthenics workouts per week focused on hypertrophy (6-12 hard reps per set)."],
    [H, "Hit a daily calorie surplus (~2,700-2,900 kcal) and 120-130 g of protein every day."],
    [H, "Weigh in every Sunday morning under identical conditions and log the weekly average."],
    [M, "Shift from endurance reps to weighted/hard progressions (loaded backpack pull-ups, dips, archer/pike push-ups)."],
    [M, "Reach 61 kg lean bodyweight by Month 3 while maintaining strict pull-up form."],
    [M, "Reach 63 kg lean bodyweight by Month 7 with measurable upper-body and leg progression."],
    [M, "Reach 65 kg balanced, muscular physique by Month 12."],
    [Q, "Eat on schedule for growth even when appetite is low. Never skip post-workout nutrition."],
  ],
  // 6. Dopamine & digital hygiene
  [
    [H, "Zero Instagram Reels, Shorts, or AI apocalypse commentary channels during the week."],
    [H, "Keep a daily no-PMO standard, tracked on a visible streak counter."],
    [H, "Keep phone and laptop out of bed. Charge devices away from the sleeping area every night."],
    [M, "Remove Instagram from phone and block algorithmic feeds/recommendations on desktop browsers."],
    [M, "Cap Chess and Clash Royale to one strict 20-minute timer, only after all daily Pomodoros are finished."],
    [M, "Replace compulsive LinkedIn checking with a single scheduled 15-minute job-board check per day."],
    [Q, "When FOMO or anxiety spikes, interrupt it with 10 push-ups, cold water, or a short walk instead of screens."],
    [Q, "Open tech media only to solve an active engineering problem, never as passive entertainment."],
  ],
  // 7. Reading & deep focus
  [
    [H, "Read 10-15 pages per day (non-fiction, engineering, or spiritual) without breaking the daily chain."],
    [H, "Complete 9-10 clean 20-minute Pomodoro blocks daily (3 hours of real output) before any leisure."],
    [H, "Spend 5 minutes every evening reviewing today's output and locking in tomorrow's 3 tasks."],
    [M, "Rebuild a 30-day unbroken reading streak, scaling to 100 and 365 days (~4,000-5,500 pages/year)."],
    [M, "Read 4 high-leverage software engineering books (clean architecture, design patterns, system design, C# depth)."],
    [M, "Read 6 books on discipline, history, psychology, or Islamic self-mastery over the next 12 months."],
    [Q, "Single-task during every 20-minute Pomodoro: one active window, phone on Do Not Disturb."],
    [Q, "Judge your day by finished Pomodoros and shipped commits, never by hours spent sitting at a laptop."],
  ],
  // 8. Character & faith
  [
    [H, "Pray all 5 daily prayers on time and keep daily istighfar dhikr as the non-negotiable anchor of your day."],
    [H, "Protect your 1,780+ day Duolingo streak as a daily reminder of what unbroken consistency looks like."],
    [H, "Perform one concrete act of help, generosity, or knowledge-sharing for family, peers, or community each week."],
    [M, "Build a 6-month personal emergency fund once your 10k PLN salary begins so you depend on no one."],
    [M, "Mentor or assist at least 2 younger students or peers with code reviews, CV feedback, or study prep."],
    [M, "Lock in a consistent sleep/wake window (7.5-8 hours) at least 6 nights per week."],
    [Q, "Live out Amr bil Ma'ruf wa Nahy anil Munkar through quiet competence, strength, and reliability, not empty preaching."],
    [Q, "Eliminate the post-goal comfort crash: the day one milestone is hit, immediately set the next standard."],
  ],
];

export const ITEMS: MatrixItem[] = ITEMS_BY_DIRECTION.flatMap((items, d) =>
  items.map(([type, text], i) => ({
    id: d * 8 + i + 1,
    directionId: d + 1,
    type,
    text,
  })),
);

// Which direction lives in which 3x3 position. The same map places the 8 outer
// blocks around the center and the 8 compass cells around the core goal.
const POSITION_TO_DIRECTION: Record<string, number> = {
  "0,0": 1,
  "0,1": 2,
  "0,2": 3,
  "1,2": 4,
  "2,2": 5,
  "2,1": 6,
  "2,0": 7,
  "1,0": 8,
};

export const DIRECTION_TO_BLOCK: Record<number, number> = Object.fromEntries(
  Object.entries(POSITION_TO_DIRECTION).map(([pos, dir]) => {
    const [r, c] = pos.split(",").map(Number);
    return [dir, r * 3 + c];
  }),
);

export const CENTER_BLOCK = 4;

function buildCells(): Cell[] {
  const cells: Cell[] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const br = Math.floor(r / 3);
      const bc = Math.floor(c / 3);
      const lr = r % 3;
      const lc = c % 3;
      const base = { index: r * 9 + c, row: r + 1, col: c + 1, block: br * 3 + bc };
      const isCenterOfBlock = lr === 1 && lc === 1;

      if (br === 1 && bc === 1) {
        cells.push(
          isCenterOfBlock
            ? { ...base, kind: "core" }
            : { ...base, kind: "compass", directionId: POSITION_TO_DIRECTION[`${lr},${lc}`] },
        );
        continue;
      }

      const directionId = POSITION_TO_DIRECTION[`${br},${bc}`];
      if (isCenterOfBlock) {
        cells.push({ ...base, kind: "hub", directionId });
      } else {
        const pos = lr * 3 + lc;
        const slot = pos > 4 ? pos - 1 : pos;
        cells.push({ ...base, kind: "item", directionId, itemId: (directionId - 1) * 8 + slot + 1 });
      }
    }
  }
  return cells;
}

export const CELLS: Cell[] = buildCells();

export const ITEM_CELL_INDEX: Record<number, number> = Object.fromEntries(
  CELLS.filter((c) => c.itemId).map((c) => [c.itemId!, c.index]),
);

export function directionById(id: number | null | undefined): Direction | undefined {
  return DIRECTIONS.find((d) => d.id === id);
}

export function itemById(id: number | null | undefined): MatrixItem | undefined {
  return ITEMS.find((i) => i.id === id);
}

export function defaultCellText(cell: Cell): string {
  switch (cell.kind) {
    case "core":
      return CORE_GOAL;
    case "compass":
    case "hub":
      return directionById(cell.directionId)!.name;
    case "item":
      return itemById(cell.itemId)!.text;
  }
}

export const DEFAULT_CELL_TEXTS: string[] = CELLS.map(defaultCellText);
