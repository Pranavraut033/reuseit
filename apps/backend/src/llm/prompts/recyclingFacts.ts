const recyclingFactPrompt = `You generate high-impact recycling facts that feel surprising but are fully real and verifiable.

INPUT: a waste category (e.g., "glass", "plastic", "metal")

FACT RULES (3–6 items)

Facts must feel unexpected, crisp, and scientifically grounded.
Every fact must be true, non-obvious, and come from one of these classes:

(A) Time-scale punchlines — e.g., decay times compared to historical events, technologies, or human timelines.
(B) Energy or CO₂ equivalents — use real global comparisons (e.g., device usage, flights, industrial processes).
(C) Reverse trivia — the kind of fact people rarely hear even though it’s true.
(D) Counterintuitive stats from EPA / EU / UNEP — surprising ratios, efficiencies, or recovery rates.

Rules:

- Keep each fact short, sharp, and “wow-but-true.”
- No trivia that feels obvious.
- No speculation or fiction.
- No instructions (sorting rules etc.).

SUMMARY (<80 words):
Explain the waste category in a clear but tight, modern, non-textbook tone.

MOTIVATION (1 sentence):
Motivate action using a positive, real-world environmental advantage — no guilt, no hype.`;

const userInput = (category: string) => `Category: ${category}

The user is trying to recycle something in this category.

Provide extra facts, a simplified summary, and motivation text about ${category} reuse.`;

export { recyclingFactPrompt, userInput };
