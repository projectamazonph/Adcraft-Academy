# AdCraft Content Production Kit

> Master content production reference. Translates the curriculum blueprint from the PRD into actionable, atomic content assets. Includes the Universal Lesson Template, Module 0 & 1 full drafts, Simulation Scenario Specifications, and AI Agent System Prompts.

> **Source**: Qwen chat — "AdCraft Product Development Gaps" (2026-06-03)

---

## 1. Universal Lesson Template (The "Do The Thing" Standard)

Every lesson in AdCraft must follow this structure to maintain pedagogical consistency.

| Section | Purpose | Content Requirement | Format |
|---------|---------|-------------------|--------|
| **The Hook** | Grab attention with a real pain point | 1-2 sentences max. No definitions yet. | Text + Visual Metaphor |
| **The Rule** | The core SOP/formula/threshold | Cite source doc version. Be explicit. | Formula Box / Decision Tree |
| **The Example** | Correct application in context | Realistic numbers. Show the math. | Annotated Screenshot / Table |
| **The Trap** | Common mistake or edge case | Why smart people get this wrong. | ⚠️ Warning Callout |
| **The Decision** | Interactive "Do The Thing" moment | Scored action with consequences. | Simulator / Quiz / Drag-Drop |
| **The Debrief** | Explain why based on rules | Cite triggered rule ID. Link to SOP. | AI Feedback + Rule Reference |
| **The Tool** | Practical takeaway | Downloadable template/checklist. | PDF / Sheet / Calculator |

---

## 2. Module 0: PPC Game Onboarding — "Choose Your ASIN"

Full content draft ready for implementation.

### Screen 1: Role Selection

**Headline:** Who Are You in the Arena?
**Subhead:** Your journey adapts to your experience level and goals.

| Card | Title | Description | Best For | Icon |
|------|-------|-------------|----------|------|
| A | Junior Specialist | Learn SOPs, build confidence, avoid breaking accounts | New hires, career switchers | 🌱 Sprout |
| B | Brand Owner | Understand agency work, spot waste, judge ROI | Founders, marketing managers | 🏪 Storefront |
| C | Agency AM | Master client comms, reporting, triage under pressure | Account managers, freelancers | 🤝 Handshake |
| D | PPC Strategist | Build governance, audit teams, design automation | Team leads, consultants | 🧭 Compass |

**Interaction:** Single click selects. Triggers personalized learning path + difficulty recommendation.

### Screen 2: Difficulty Mode

**Headline:** Set Your Challenge Level
**Copy:** This controls feedback density, hint availability, and consequence severity. You can change this anytime in settings.

| Mode | Feedback | Hints | Consequences | Recommended For |
|------|----------|-------|-------------|----------------|
| Beginner | Detailed explanations after every decision | Unlimited AI hints | Gentle warnings before errors | Junior Specialists, Brand Owners |
| Agency | Concise feedback citing rule IDs | 3 hints per simulation | Immediate scoring penalties | Agency AMs, experienced specialists |
| Savage | Minimal feedback. You figure it out. | Zero hints | Budget burns, rank drops, client anger | PPC Strategists, masochists |

**Visual:** Each mode has a distinct color treatment (Green/Amber/Red). Hover shows preview of feedback style.

### Screen 3: Product Selector

**Headline:** Pick Your Battleground
**Copy:** Choose a simulated product to personalize your entire learning journey. All scenarios, data, and benchmarks will adapt to this choice.

| Product Card | Category | Price | Reviews | Inventory | Competitiveness | Lifecycle |
|-------------|----------|-------|---------|-----------|----------------|-----------|
| Nova Insulated Cooler | Outdoor/Gear | $45 | 4.3★ (892) | 62 days | High | Launch |
| Pawsome Dog Shampoo | Pet Supplies | $18 | 4.7★ (2,341) | 28 days | Medium | Optimize |
| HydroFlask Clone | Kitchen | $22 | 3.9★ (156) | 90 days | Very High | Scale |
| VitaBoost Supplement | Health | $32 | 4.1★ (567) | 14 days | Medium | Defend |
| Custom ASIN | Any | User input | User input | User input | Auto-detected | Auto-detected |

**Interaction:** Click to select. "Custom ASIN" opens upload flow with sanitization status indicator.

### Screen 4: Goal Alignment (AI Mentor Chat)

**AI Mentor Avatar:** Appears bottom-right with speech bubble.
**Opening Message:** "Hey! I'm your PPC Mentor. Before we dive in, what's your primary business goal right now?"

**Quick Reply Chips:**
- 🚀 Launch a new product
- ⚙️ Optimize existing campaigns
- 📈 Scale profitable growth
- 🛡️ Defend brand/rank

**AI Response Logic:**
- If "Launch": Emphasize Modules 0-5, prioritize research/defense content
- If "Optimize": Emphasize Modules 6-8, prioritize triage/bidding content
- If "Scale": Emphasize Modules 8-9, prioritize budget/creative content
- If "Defend": Emphasize Modules 9-10, prioritize branded/troubleshooting content

### Screen 5: KPI Setup Worksheet (Interactive Calculator)

**Headline:** Define Your Success Metrics
**Copy:** Let's calculate your safe bidding ceiling before you spend a dollar.

**Inputs:**
- Product Price: [Auto-filled from selection] $45.00
- Target ACoS: [Slider + Input] 25%
- Estimated CVR: [Slider + Input] 12%
- Profit Margin: [Input] 35%

**Live Outputs:**
- CPC_max = Price × Target ACoS × CVR = $1.35
- Break-even ACoS = Profit Margin = 35%
- Safe Bid Range = $0.80 – $1.35
- Daily Budget Recommendation = CPC_max × 20 clicks = $27.00

**CTA Button:** "Download My KPI Setup Sheet" → Generates personalized PDF with these values pre-filled.

**Completion Trigger:** Unlocks Module 1. Awards "First Steps" badge. Streak counter starts.

---

## 3. Module 1: Amazon PPC Foundations — "The Map Before the Maze"

Gold-standard lesson demonstrating the universal template.

### Lesson 1.2: ACoS vs ROAS vs TACoS

#### The Hook
"ACoS tells you if your ads are efficient. TACoS tells you if your business is healthy. Confusing them is how brands celebrate 'great ACoS' while going bankrupt."

#### The Rule

```
ACoS = Ad Spend ÷ Ad Sales
ROAS = Ad Sales ÷ Ad Spend  
TACoS = Ad Spend ÷ Total Revenue (Organic + Paid)
```

📖 Source: Operations Playbook v7.6 §2.1 | Rule ID: METRIC_FOUNDATIONS_002

#### The Example

| Metric | Value | What It Means |
|--------|-------|---------------|
| Ad Spend | $500 | Money invested in ads |
| Ad Sales | $2,000 | Revenue directly from ads |
| Total Revenue | $8,000 | Includes organic sales |
| ACoS | 25% | Ads are efficient ($0.25 spend per $1 ad sale) |
| ROAS | 4.0 | $4 return per $1 spent |
| TACoS | 6.25% | Ads are only 6.25% of total business (healthy!) |

⚡ **Key Insight:** If ACoS is 25% but TACoS is rising month-over-month, your ads aren't driving organic growth. You're addicted to paid traffic.

#### The Trap
⚠️ **The ACoS Vanity Trap**
Pausing high-ACoS keywords that drive top-of-funnel awareness can tank organic rank. Always check TACoS trend and keyword intent before cutting spend. A 40% ACoS on a branded defense campaign might be protecting $10K in organic revenue.

#### The Decision (Metric Mixer Mini-Game)
Learner drags formula components into correct arrangement.

| Drag Component | Drop Zone | Correct Pairing | Wrong Pairing Consequence |
|---------------|-----------|----------------|--------------------------|
| Ad Spend | Numerator | ACoS numerator | Shows "You just calculated inverse ROAS. In real life, this makes you think losing campaigns are winners." |
| Ad Sales | Denominator | ACoS denominator | Shows "Now you're calculating spend as % of total revenue... wait, that's TACoS! Different metric entirely." |
| Total Revenue | Denominator | TACoS denominator | Shows "ACoS using total revenue? That hides how dependent you are on ads." |

**Scoring:** 3/3 correct = Pass. 2/3 = Retry with explanation. 1/3 = Forced review of Rule section.

#### The Debrief
✅ Correct! You've built the three core efficiency metrics. Remember:
- ACoS = Campaign-level efficiency
- ROAS = Media buyer's shorthand (inverse of ACoS)
- TACoS = Business health & organic leverage

📎 Rule Reference: METRIC_FOUNDATIONS_002 | Next up: When each metric matters most

#### The Tool
📥 **Download: PPC Metrics Cheat Sheet**
- One-page reference with all formulas
- "When to Use Which Metric" decision tree
- Benchmark ranges by category
- Print-friendly + digital versions

---

## 4. Simulation Scenario Specifications

Atomic specs for the three core simulators. Hand directly to engineers + content team.

### A. Search Term Triage Arena — Scenario Pack 1: "Launch Phase Electronics"

| Parameter | Value | Notes |
|-----------|-------|-------|
| Category | Consumer Electronics | Competitive thresholds apply |
| Lifecycle Stage | Launch (Week 3) | Research-heavy, tolerance for higher ACoS |
| Target ACoS | 30% | Aggressive for indexing |
| Account Median CVR | 9% | Baseline for promotion threshold |
| Promotion Threshold | 25 clicks + 1 conversion OR CVR ≥ 7.2% | Competitive category adjustment |
| Negation Threshold | 35 clicks + 0 conversions | Higher than standard due to launch phase |
| Dataset Size | 40 search terms | Mix of winners, losers, edge cases |
| Edge Cases Included | Cannibalization cluster (3 terms), bot click pattern (1 term), seasonal spike (2 terms), low-impression high-CVR gem (1 term) | |
| Boss Challenge | "The ACoS Spike" — ACoS jumped 15pts overnight. Diagnose root cause before taking action. | Tests troubleshooting before optimization |

### B. Campaign Architecture Builder — Scenario Pack 1: "Nova Cooler Launch"

| Parameter | Value | Notes |
|-----------|-------|-------|
| Brand | NOVA | Pre-defined brand assets |
| Marketplace | US | Standard naming convention |
| Lifecycle Stage | Launch | Phase 1-2 campaigns only |
| Budget | $1,500/month | Forces prioritization |
| Required Campaigns | SP_AUTO_RESEARCH, SP_BROAD_RESEARCH, SP_EXACT_BRANDED, SB_VIDEO_AWARENESS | Minimum viable launch structure |
| Naming Convention | [BRAND][COUNTRY][STAGE][TYPE][MATCH][THEME][YYYYMM] | Strict validation |
| Validation Rules | No intent mixing, no duplicate targeting, portfolio grouping required, budget allocation sums to 100% | |
| Edge Cases | Learner tries to add SD remarketing (blocked: "No traffic yet"), learner creates SKAG with no data (warning: "Vibes-based targeting") | |
| Export | Generates Amazon-ready bulk upload CSV | Bridges simulation to real world |

### C. Bid Lab — Scenario Pack 1: "CPC Ceiling Discipline"

| Parameter | Value | Notes |
|-----------|-------|-------|
| Product Price | $45 | Fixed for scenario |
| Target ACoS | 25% | User calculates CPC_max = $1.35 |
| Current Bid | $1.80 | Above ceiling — learner must identify |
| Scenario Cards | 10 cards with varying metrics | Mix of increase/decrease/hold/investigate decisions |
| Rank Push Card | Explicitly labeled "Approved Rank Push — 7 Day Window" | Only card where exceeding CPC_max is correct |
| Inventory Risk Card | 12 days cover + maxing budget | Correct action: throttle, NOT increase bid |
| Feedback Latency SLA | <3 seconds p95 | Fallback to cached template if exceeded |
| Scoring Weight | Data sufficiency check = 30%, Action correctness = 50%, Explanation quality = 20% | Rewards process over outcome |

---

## 5. AI Agent System Prompts (Production-Ready)

Paste directly into your LLM orchestration layer. These include guardrails, citation requirements, and latency-aware instructions.

### Agent 1: PPC Mentor (System Prompt)

```
You are the PPC Mentor for AdCraft, an Amazon PPC training simulator. 
YOUR ROLE: Teach concepts clearly, practically, and interactively using ONLY approved playbooks.
SOURCE OF TRUTH: Internal PPC Decision Matrix, Operations Playbook v7.6, Campaign Launch Prioritization Strategy. Always cite rule IDs when explaining decisions.

RULES:
1. NEVER make performance guarantees. Say "based on historical benchmarks" not "you will achieve."
2. NEVER recommend unsafe tactics, review manipulation, trademark abuse, or policy evasion.
3. When asked for action recommendations, ALWAYS ask for or infer: price, target ACoS, CVR, clicks, orders, spend, sales, lifecycle stage, inventory, category competitiveness.
4. If data is insufficient, say "INSUFFICIENT DATA" and recommend what to monitor next. Do NOT guess.
5. Keep responses under 150 words unless learner asks for deep dive.
6. Use plain English first, then technical terms. Define acronyms on first use.
7. Tone: Clear, practical, slightly playful. Not corporate oatmeal.

RESPONSE FORMAT:
- Direct answer (1 sentence)
- Rule citation [Rule ID]
- Example or analogy
- Next step or practice question

LATENCY PROTOCOL: If generating takes >2s, system will serve cached template. Your full response will stream in asynchronously. Do not acknowledge this process.

SAFETY: If user asks about black-hat tactics, respond: "I can't help with that. Here's a sustainable alternative aligned with Amazon policy: [safe option]." Log incident.
```

### Agent 2: Search Term Coach (System Prompt)

```
You are the Search Term Coach for AdCraft's Triage Arena simulator.
YOUR ROLE: Evaluate search terms using deterministic promotion/negation rules. You EXPLAIN decisions made by the scoring engine. You do NOT make independent judgments.

INPUT: You receive ScoreResult JSON from the deterministic engine containing: triggered_rules[], score, pass_fail, confidence, user_decision, search_term_data.

RULES:
1. ONLY explain the triggered rules. Do NOT invent new thresholds or contradict the ScoreResult.
2. Standard promotion: sufficient clicks + conversion evidence OR CVR ≥ 0.8× median. Cite [STR_PROMOTE_STD] or variant.
3. Standard negation: sufficient clicks + zero sales. Cite [STR_NEGATE_STD]. Note competitive category adjustments.
4. ALWAYS distinguish exact vs phrase negatives. Warn about cannibalization when promoting from research to exact.
5. NEVER advise negating without checking data sufficiency and relevance.
6. Confidence levels: HIGH (clear rule match), MEDIUM (edge case/threshold boundary), LOW (insufficient data/conflicting signals). State explicitly.

RESPONSE FORMAT:
"[✅/❌] [User Decision] was [correct/incorrect/partially correct]."
"Rule triggered: [RULE_ID] because [specific conditions met/not met]."
"Risk: [cannibalization/data loss/wasted spend/none]"
"Next step: [specific actionable recommendation]"

LATENCY PROTOCOL: Serve cached explanation template if >2s. Full personalized response streams asynchronously.
SAFETY: If ScoreResult and your analysis conflict, defer to ScoreResult and log discrepancy. Never override deterministic scoring.
```

### Agent 5: Client Roleplay Agent (System Prompt)

```
You are a skeptical but fair Amazon PPC client in AdCraft's roleplay simulator.
YOUR ROLE: Ask realistic questions about spend, ACoS, sales, rank, wasted spend, and campaign changes. Challenge vague answers. Reward clarity, evidence, and next steps.
PERSONALITY: Professional, data-driven, slightly impatient with jargon. Not hostile, but not easily satisfied. Think "CFO who reads every invoice."

RULES:
1. Open with a specific, pointed question based on simulated account state.
2. If learner uses jargon without explanation, ask "What does that mean in dollars?"
3. If learner overpromises ("ACoS will drop next week"), challenge: "What's your confidence level and what happens if it doesn't?"
4. If learner provides evidence + clear next steps, acknowledge and ask thoughtful follow-up.
5. NEVER accept guarantees. ALWAYS ask for risk mitigation.
6. Heat Gauge Integration: Your skepticism level maps to learner's vagueness score. Vague = hotter. Evidence-based = cooler.

OPENING PROMPTS (rotate based on scenario):
- "ACoS increased 15pts this week. Walk me through why and what you're doing about it."
- "We spent $800 on research campaigns with $0 sales. Justify this spend."
- "You paused our top-converting keyword. Explain your reasoning with data."
- "Organic rank dropped 3 positions since you started ads. Coincidence or causation?"

SCORING SIGNALS TO APP: Return JSON {accuracy: 0-10, clarity: 0-10, evidence_quality: 0-10, overpromise_flag: boolean, heat_delta: -5 to +5} after each learner response.

LATENCY PROTOCOL: Pre-canned skeptical follow-ups available for timeout fallback. Personalized response streams async.
```

---

## 6. Content Production Workflow Checklist

For instructional designers creating new modules/scenarios.

Before publishing any content asset, verify:

- [ ] Follows Universal Lesson Template (Hook → Rule → Example → Trap → Decision → Debrief → Tool)
- [ ] All rules cite source document + version + Rule ID
- [ ] Numbers are realistic (no round numbers, appropriate ranges for category)
- [ ] Edge cases included (cannibalization, inventory risk, seasonal anomalies)
- [ ] Downloadable is functional, branded, and matches current best practices
- [ ] AI system prompt references updated rules
- [ ] Accessibility: Keyboard navigable, color-blind safe, screen reader tested
- [ ] Legal: No guarantees, disclaimers present where needed
- [ ] Marketplace config applied (currency, thresholds adjust per selected market)
- [ ] Peer-reviewed by second PPC SME + passed QA checklist

### Next Steps

1. Implement Module 0 + 1.2 as pilot content. Test with 5 beta learners. Measure completion rate, time-on-task, and decision accuracy.
2. Generate Scenario Pack 1 datasets using synthetic STR generator. Validate statistical realism before building UI.
3. Deploy AI agents in sandbox with production prompts. Run 50 test conversations per agent. Flag hallucinations, latency issues, tone mismatches.
4. Create Author Onboarding Deck using this kit as reference. Train first 2-3 content creators before scaling.
5. Build Content QA Automation — script that scans lessons for missing rule citations, broken download links, accessibility violations.

---

*Source: Qwen chat "AdCraft Product Development Gaps" — 2026-06-03*
*Last updated: 2026-06-04*
