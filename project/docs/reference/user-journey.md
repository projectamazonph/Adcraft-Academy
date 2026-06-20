# AdCraft User Journey & Path Specification

> Detailed user journey from landing page to certification. Defines every screen, interaction, and system response at each phase. Based on the PRD, UI/UX specs, and Content Production Kit.

> **Source**: Qwen chat — "AdCraft Product Development Gaps" (2026-06-03)

---

## Phase 1: The Landing Page (Pre-Auth)

**Goal**: Prove this isn't another video course. Demonstrate "Do The Thing" immediately.

| Section | Visual / Content | Interaction / Click Target | User Thought |
|---------|-----------------|---------------------------|-------------|
| Hero | Dark mode UI screenshot showing the STR Triage Arena with a glowing "Promote" button. Headline: "Stop Reading About PPC. Start Running It." Subhead: "The flight simulator for Amazon Ads operators." | Primary CTA: "Start Free Simulation" (No credit card). Secondary: "View Curriculum". | "This looks like a tool, not a textbook." |
| Interactive Teaser | Embedded mini-widget: A single search term row ("insulated cooler", 24 clicks, 3 orders). Three buttons: Promote, Negate, Hold. | User clicks a button. Instant feedback animation: Correct + Rule Citation OR Wrong + Consequence Toast. | "I can actually make decisions right now. I got one wrong; I need to learn why." |
| Social Proof | Logos of agencies/brands using AdCraft. Quote: "Our junior team's triage accuracy went from 60% to 92% in 3 weeks." | Hover over logos to see specific metric improvements. | "Real companies trust this for training." |
| Curriculum Map | Visual roadmap of the 5 Worlds (Listing Lab, Keyword Mine, Campaign Foundry, Optimization Arena, Scale Room). Locked/unlocked states shown. | Click any world to expand module list + preview first lesson. | "There's a clear path from zero to hero." |
| Pricing | 3-tier cards: Solo / Team / Enterprise. Feature comparison table. "Free Forever" tier highlighted. | Toggle Monthly/Annual. "Compare Plans" expands full feature matrix. | "I can start free and upgrade when my team needs it." |
| Footer | Legal links, AI Disclaimer badge, Amazon TM notice, Social links. | "Try Demo Account" link (pre-loaded progress). | "Low risk to explore further." |

---

## Phase 2: Onboarding & Personalization (Post-Signup)

**Goal**: Configure the simulation engine to the user's reality. No generic content.

| Step | Screen / Element | Interaction | System Response |
|------|-----------------|-------------|----------------|
| 1. Role Selection | 4 large illustrated cards: Junior Specialist, Brand Owner, Agency AM, PPC Strategist. | Single click selects card. Card glows; others fade. | Adjusts difficulty recommendation + learning path weighting. |
| 2. Difficulty Mode | Toggle switch with visual preview: Beginner (Guided) / Agency (Standard) / Savage (No Hints). | Slide toggle. Preview pane shows sample feedback density for each. | Sets hint limits, feedback verbosity, consequence severity. |
| 3. Product Picker | Grid of 5 product cards + "Upload Custom ASIN" button. Each shows Price, Reviews, Inventory, Competitiveness. | Click product card OR upload CSV. Upload triggers sanitization progress bar. | Generates personalized synthetic data profile. All future scenarios adapt. |
| 4. Goal Alignment | AI Mentor chat bubble appears bottom-right. "Hey! What's your primary goal right now?" Quick-reply chips: Launch / Optimize / Scale / Defend. | Click chip or type custom goal. | AI acknowledges + adjusts Module 5 launch sequence priority. |
| 5. KPI Setup | Interactive calculator embedded in flow. Inputs: Price, Target ACoS, CVR. Live outputs: CPC_max, Safe Bid Range, Daily Budget. | Adjust sliders/inputs. Watch numbers update in real-time. | "Download My KPI Sheet" button unlocks. First tangible value delivered. |
| 6. Legal Gate | Modal overlay: Terms of Service + AI Disclaimer + "Not Financial Advice". | Checkbox + "I Accept" button. Cannot proceed without acceptance. | Logs timestamp/IP/version. Unlocks app. |
| 7. Dashboard Entry | Welcome animation. Progress rail initializes at 0%. Streak counter starts at 1. | Auto-redirects to Module 0 Lesson 1. | Journey officially begins. |

---

## Phase 3: Core Learning Loop (Modules 0-6)

**Goal**: Build foundational knowledge through immediate application.

### Typical Lesson Flow (e.g., Module 1.2: ACoS vs ROAS vs TACoS)

| Stage | What User Sees | What User Does | Feedback / Reward |
|-------|---------------|----------------|-------------------|
| Hook | Bold statement with visual metaphor (speedometer vs fuel gauge). | Reads/scrolls. | Grabs attention. No interaction yet. |
| Rule | Formula box with cited source [METRIC_FOUNDATIONS_002]. Clear definitions. | Expands/collapses sections. Copies formula to clipboard. | Reference anchor for later. |
| Example | Annotated table showing real-looking numbers. Key insight callout. | Hovers over cells to see calculations. | Connects abstract formula to concrete data. |
| Trap | Amber warning box: "The ACoS Vanity Trap". Real-world failure story. | Clicks "Show Consequence" to reveal what happens if ignored. | Emotional hook. Prevents common mistake. |
| Decision | Metric Mixer Game: Drag formula components into correct slots. | Drags "Ad Spend" to Numerator, "Ad Sales" to Denominator. | Green glow + confetti OR Shake + explanation toast. |
| Debrief | AI-generated explanation citing triggered rule. Link to SOP. | Clicks rule ID to open side panel definition. | Reinforces why, not just what. |
| Tool | Locked download icon animates to unlocked state. | Clicks "Download PPC Metrics Cheat Sheet". PDF opens/downloads. | Tangible reward. Builds personal toolkit. |
| Progress | Progress rail advances. Streak flame pulses. Badge notification slides in. | Continues to next lesson or takes break. | Dopamine hit. Encourages consistency. |

---

## Phase 4: Simulation Deep Dive (Modules 7-11)

**Goal**: Muscle memory through high-fidelity practice. This is where AdCraft differentiates.

### Search Term Triage Arena (Module 7)

| Element | Visual / Layout | Interaction | System Behavior |
|---------|----------------|-------------|----------------|
| Data Grid | Dense Bloomberg-style table. Sticky headers. Conditional formatting. 40 rows of synthetic STR data. | Sort/filter columns. Multi-select rows via checkbox or Shift+Click. Keyboard nav (J/K/Space). | Virtualized rendering. URL updates with filter state for sharing. |
| Action Bar | Sticky bottom panel slides up on selection. Buttons: Promote, Negate, Hold, Reduce, Investigate. | Click action button. Disabled buttons show tooltip explaining why. | Validates data sufficiency before allowing action. Teaches discipline. |
| Confidence Meter | Circular gauge next to action bar. Fills based on data volume + rule alignment. | Hover to see contributing factors. Low confidence triggers AI hint offer. | Makes uncertainty visible. Discourages guessing. |
| Feedback Panel | Slide-over right panel after submission. Score, Rule Cited, Cannibalization Warning, "What If" link. | Click "What If" to see alternate outcome. Click rule ID to review SOP. | Separates grading from workflow. Enables safe exploration. |
| AI Mentor | Floating pill bottom-right. Proactive hint pulse if user stalls >60s. | Click to expand chat. Ask "Why is this hold instead of negate?" | Context-aware coaching. Latency fallback serves cached template if slow. |
| Synthetic Indicator | Subtle watermark: "Simulated Data - Electronics - US". | Always visible. | Maintains trust. Reminds user this is training. |

### Campaign Architecture Builder (Module 4)

| Element | Visual / Layout | Interaction | System Behavior |
|---------|----------------|-------------|----------------|
| Canvas (Phase 3+) | Infinite pan/zoom grid. Node-based campaign blocks color-coded by type. | Drag nodes from palette. Connect hierarchy edges. Pan/zoom with mouse/touch. | Spatial memory aids structural understanding. |
| Naming Validator | Real-time input field with segmented preview: [BRAND]_[COUNTRY]_[STAGE]... | Type name. Segments highlight red/green as typed. Auto-correct suggestion appears. | Teaches convention through guided input. Character counter warns at 45 chars. |
| Validation Feedback | Invalid connections snap back with red pulse. Valid connections glow green. | Attempt invalid connection, see error. Fix, see success. | Prevents bad habits through physical constraints. |
| Export | "Generate CSV" button. Preview modal shows first 5 rows. | Click export to download Amazon-ready bulk upload file. | Bridges simulation to real-world application. |

---

## Phase 5: Capstone & Certification (Module 12)

**Goal**: Prove operational readiness under pressure.

| Stage | Experience | Interaction | Outcome |
|-------|-----------|-------------|---------|
| Briefing | Full account dossier: 3 ASINs, 90 days history, client objectives, inventory risks. | Read brief. Download assets. Plan approach. | Sets stakes. Mirrors real agency onboarding. |
| Execution | Multi-day simulation. All tools available. Timer running (optional). AI Mentor in "Coach Only" mode. | Make 50+ decisions across listing, structure, bidding, triage, reporting. Save checkpoints. | Comprehensive skill test. Replay mode available post-submission. |
| Client Defense | AI Client Roleplay Agent asks 3 tough questions based on user's actual decisions. Heat Gauge visible. | Type/spoken responses. Cite evidence. Avoid overpromising. | Tests communication + emotional regulation. Scored on clarity/accuracy/calmness. |
| Grading | Automated rubric scoring. Pass threshold: 80%. | View detailed scorecard. See missed opportunities. Retry allowed after 24h cooldown. | Transparent evaluation. Growth mindset encouraged. |
| Certification | Digital badge + verification URL. LinkedIn share button. Delta update reminder set for 12 months. | Share credential. Download certificate PDF. | Career capital. Credential has expiry, drives renewal. |

---

## Phase 6: Team & Manager Journey (Persona 4 — Phase 3+)

| Touchpoint | What Manager Sees | Interaction | Value |
|-----------|-------------------|-------------|-------|
| Onboarding Wizard | Stepper: Invite CSV, Assign Paths, Set Cert Requirements, Configure Reports. | Bulk upload. Drag-drop path assignment. Preview report schedule. | Under 5 min setup. Reduces admin friction. |
| Team Dashboard | Card grid per learner: Avatar, Module, Streak, Cert Level, Health Status (Green/Amber/Red). | Click card for drilldown. Filter by status/path/cert. | At-a-glance team health. Identifies struggling learners instantly. |
| Skill Heatmap | Matrix: Learners x Skills. Cell intensity = proficiency. | Click cell for specific attempts/errors. Export to CSV. | Spots systemic gaps. Data-driven coaching conversations. |
| Cert Registry | Table with expiry dates, delta status, verification URLs. "Renew All Expiring" bulk action. | Click renew to assign delta module. Verify external hire certs. | Maintains credential value. Simplifies compliance. |
| AI Usage Monitor | Aggregated hint dependency, question topics, safety flags. | Filter by user/date. Flag concerning patterns. | Identifies content gaps or struggling individuals. |

---

## Phase 7: Retention & Re-engagement Loops

| Trigger | Mechanism | User Experience |
|---------|-----------|----------------|
| Daily Streak | Flame icon + streak freeze (1/week). Weekend grace period. | "You're on a 12-day streak! Don't lose it." Gentle nudge, not guilt. |
| Stuck Point | >40% fail rate on specific lesson detected. | AI Mentor proactive outreach: "Many learners struggle here. Want a 2-min refresher?" |
| Inactivity (14d) | Personalized email: "We miss you + here's what's new" + 1-click reactivation. | Low-friction return. Highlights new content/features. |
| Cert Expiry (90d) | In-app banner + email: "Your cert expires soon. Complete delta update to renew." | Delta module unlocked. Micro-learning, not full re-cert. |
| New Content | Changelog modal on login. "What's New" badge on nav. | Quick scan of updates. Jump-to-new-content button. |
| Community | Leaderboard (opt-in). Cohort challenges. Shareable achievements. | Friendly competition. Social accountability. |

---

## Critical UX Principles Across All Journeys

1. **Professional Playfulness**: Dark mode, monospace data, neon accents feel like a real SaaS tool — but game mechanics (streaks, badges, boss battles) maintain engagement. Never childish.

2. **Latency Transparency**: AI responses stream token-by-token. If >2s, cached template appears instantly with "Refining..." badge. User never stares at spinner.

3. **Error as Navigation**: Every mistake links back to relevant rule/SOP. No dead-end failures. "Wrong" is just another learning vector.

4. **Data Sufficiency First**: Actions disabled until enough data exists. Tooltips explain why. Teaches discipline passively through UI constraints.

5. **Marketplace Awareness**: Global selector always visible. Currency/thresholds adjust automatically. Prevents US-centric bias.

6. **Legal Safety Net**: Disclaimer badge always in footer. AI responses cite rules. Overpromises flagged. Trust is designed in, not bolted on.

---

*Source: Qwen chat "AdCraft Product Development Gaps" — 2026-06-03*
*Last updated: 2026-06-04*
