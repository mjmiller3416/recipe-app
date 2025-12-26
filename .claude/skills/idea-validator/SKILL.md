---
name: idea-validator
description: Evaluate app ideas with brutal honesty before investing time building them. Use when assessing new product concepts or deciding whether an idea is worth pursuing.
---

# Idea Validator

Evaluate app ideas with brutal honesty before investing time building them.

## Usage

```
/idea-validator [your app idea]
```

## Instructions

When evaluating an app idea, perform a rapid but thorough analysis. **Use web search to research competitors, market data, and existing solutions.**Be brutally honest—it's better to kill a bad idea early than waste a month building something nobody wants.

### Evaluation Framework

**1. Market Analysis**
- Search for existing products solving this problem
- Identify the top 3-5 competitors
- Assess market saturation (empty, growing, crowded, oversaturated)
- Determine what would make this meaningfully different

**2. Demand Validation**
- Distinguish between "people say they want this" vs "people pay for this"
- Look for evidence: Reddit complaints, Twitter threads, forum posts, review complaints on competitor products
- Check if people are hacking together solutions (strong signal)
- Identify the target user and whether they have budget/willingness to pay

**3. Solo Builder Feasibility (2-4 week scope)**
- Can an MVP be built by one person in 2-4 weeks?
- What's the core feature that delivers value?
- What integrations or dependencies add risk?
- Rate complexity: Low / Medium / High / Unrealistic

**4. Monetization Reality Check**
- How would this make money? (SaaS, one-time, freemium, ads, etc.)
- Are people paying for similar solutions? At what price points?
- Is the target market known to pay for software?
- What's a realistic revenue ceiling for a solo product?

**5. Interest Factor**
- Is this genuinely compelling or just "meh"?
- Would you personally be excited to use this?
- Does it have any viral/word-of-mouth potential?
- Is there a unique angle that makes it memorable?

### Output Format

Always structure your response exactly like this:

---

## Quick Verdict: [BUILD IT | MAYBE | SKIP IT]

### Why
[2-3 sentences summarizing the core reasoning. Be direct.]

### Similar Existing Products
- **[Product 1]** - [one-line description, price point if known]
- **[Product 2]** - [one-line description, price point if known]
- **[Product 3]** - [one-line description, price point if known]

### Detailed Breakdown

| Criteria | Rating | Notes |
|----------|--------|-------|
| Market | [Empty/Growing/Crowded/Oversaturated] | [brief note] |
| Demand | [Weak/Moderate/Strong/Proven] | [brief note] |
| Feasibility | [Easy/Moderate/Hard/Unrealistic] | [brief note] |
| Monetization | [Unclear/Possible/Viable/Proven] | [brief note] |
| Interest | [Boring/Meh/Interesting/Compelling] | [brief note] |

### What Would Make This Stronger
1. [Specific suggestion to improve the idea]
2. [Another concrete improvement]
3. [A pivot or niche that might work better]

### Red Flags (if any)
- [Things that could kill this idea]

### Green Flags (if any)
- [Things that make this promising]

---

### Verdict Guidelines

**BUILD IT** - Clear demand, achievable scope, viable monetization, and you'd have a meaningful edge.

**MAYBE** - Has potential but needs refinement. Could work with a tighter niche, better differentiation, or simpler scope.

**SKIP IT** - Oversaturated market, unclear demand, unrealistic scope for solo builder, or no viable path to revenue.

### Honesty Rules

1. Never sugarcoat. A polite "skip it" today beats a failed launch in 6 weeks.
2. "Interesting idea" is not validation. Look for evidence of willingness to pay.
3. If you can't find competitors, that's often a red flag (no market), not a green flag.
4. Ideas that require network effects, viral growth, or massive scale to work = SKIP for solo builders.
5. "I would use this" from friends/family means nothing. Look for strangers paying money.

---

## Related Skills

- **After BUILD IT verdict** → Use `/launch-planner prd [idea]` to create a lean PRD
- **After MAYBE verdict** → Refine the idea based on feedback, then re-evaluate
- **Post-launch prioritization** → Use `/roadmap-builder` to decide what to build next
