---
author: Beepony
title: "Forward Deployed Engineering 101: The Origins and Essence of Palantir's FDE Model, and Its Rebirth in the AI Era"
pubDatetime: 2026-09-17T12:00:00+08:00
description: "Kevin (Anthropic MTS, ex-Palantir / Rippling) on FDE 101: what an FDE is, why Palantir chose FDE for go-to-market, and why in the 2026 AI era every agentic platform is being forced to become \"Palantir.\""
tags:
  - FDE
  - Forward Deployed Engineering
  - Palantir
  - Anthropic
  - AI Agent
  - GTM
  - Platform Strategy
timezone: Asia/Shanghai
---

## Forward Deployed Engineering 101

> Sending engineers to the customer site isn't about "consulting"; it's about \*\*solving business problems for the customer\*\*.

> The core of FDE is "selling outcomes," not "selling software" or "selling people."

> \*\*Source\*\*: These notes are based on Kevin's public talk at Anthropic, "Forward Deployed Engineering 101" (YouTube, 2026), about 17 minutes long (including Q&A). Kevin is a Member of Technical Staff on Anthropic's Applied AI team; previously he was an early Palantir employee and employee No. 1 on Rippling's FDE team, which he grew to about 25 people within a year.

> Video link: https://youtu.be/KwhgfwOSToQ

---

## 1. The Core Thesis: FDE Solves Only One Specific Scenario

Kevin draws a 2×2 matrix:

| What you sell \ Buyer | \*\*Technical buyer\*\* (CTO/CIO/engineers) | \*\*Non-technical buyer\*\* (business owner) |
| --- | --- | --- |
| \*\*Complex product\*\* (GitHub, Datadog) | ✅ DevRel / developer ecosystem | ⚠️ \*\*Palantir's situation\*\* → FDE |
| \*\*Simple/configurable product\*\* (Slack, Jira, Rippling) | ✅ Sales-led growth (SLG) | ✅ Sales-led growth (SLG) |

**FDE is the answer only when your product is highly complex and your buyer is completely non-technical.**

> Investment banks, oil and gas, government, large enterprises: they can't hire or retain deep engineering talent, but what they want is "10% more on the shelves" or "higher sales throughput." \*\*They don't care how the data is organized, and they shouldn't have to.\*\*

---

## 2. Palantir's Breakthrough: From "Selling Software" to "Selling Outcomes"

Two dead ends of a pure software business:

1. **Explaining value is expensive**: "I organized your data for you," but the business side isn't buying it
2. **Customer success depends entirely on the customer**: the customer not only pays but also has to train their own team before they can use it → **a terrible business model**

Palantir's solution: **bundle the product and the service**.

> The customer isn't buying software, or someone's hours.

> The customer is buying an \*\*outcome\*\*.

> You send an engineer who knows the Foundry platform; they dig into the customer's business, figure out the problem, and then \*\*build the solution directly\*\* on Foundry.

Analogy: **a waiter at a fine-dining restaurant**. The customer doesn't need to understand the kitchen; the waiter "takes care of everything for you."

**The data**: Fortune 500 public SaaS companies ranked by ACV

- Palantir: **$4M**
- ServiceNow: $1.2M
- Workday: $600K
- **None of the others** has an ACV above $500K

The headcount is wild too: **a company of a few thousand people reached an absurd valuation**.

---

## 3. The Essence of FDE: Industrializing "Design Partnerships" at Enterprise Scale

**FDE = Design Partnership × Enterprise Scale**

Early-stage B2B startups find product-market fit through design partnerships:

- The founder works side by side with the customer
- The founder invests time, effort, technology, and resources
- The customer only provides context on the problem
- The founder delivers a solution that truly fits the need

Palantir's claim: **who says design partnerships are only for early-stage startups? Just scale them to the enterprise.**

### But You Must Have a Platform

⚠️ **FDE is not a dev shop**

If every FDE writes code from scratch for customers:

- You end up with 55 repos nobody wants to take over
- Maintenance costs eat all your profit
- Your engineers quit

> The defining trait of FDE: \*\*always build on top of the platform; never write from-scratch code\*\*.

> The platform provides primitives, and FDEs assemble those primitives into workflows / apps / solutions.

---

## 4. Should You Build an FDE Team? Ask Yourself Two Questions First

### Question 1: Is my business in the "selling a complex product to non-technical buyers" quadrant?

- If not → FDE **isn't for you**
- Complex product + technical buyer → DevRel
- Simple product + non-technical buyer → sales-led growth

### Question 2: Do I have a platform (or am I willing to invest in one)?

- No platform → **don't do it**
- A platform with insufficient primitives → FDEs are your scouts
- A strong platform → go for it

> Kevin's words: "I could not begin to stress the amount of maintenance burden that will be on your team even if you have a robust platform, never mind if you don't."

---

## 5. Why Everyone Is "Forced" to Become Palantir in the AI Era

The 2026 paradigm shift: **almost every platform is becoming agentic = almost every platform is becoming customizable**.

The consequences:

1. **For every product you sell**, customers don't really know what you're selling
2. **Customer success depends entirely on the customer's ability to implement**, which they simply don't have
3. Whether you're trying to upsell or land-and-expand, **relying on customers to get started on their own doesn't work**

> Kevin's take: this isn't "everyone suddenly realized FDE is great and copied it." Rather, \*\*the business itself has changed\*\*: platforms becoming agentic = every platform needs an implementation partner, and FDE is the scaled version of an implementation partner.

---

## 6. Key Q&A

### Q1: How "atomic" should primitives be?

**A: It depends**.

- One extreme: the app is 60% done and users customize only 40% → coarse primitives
- The other extreme: highly granular configuration for a broad range of customers → like AWS DynamoDB, which gives you the lowest-level puzzle pieces
- **The deciding factor: how broad your user base is**

### Q2: How should multiple FDEs collaborate on the same project?

**A: Strongly encouraged**.

- It prevents a single point of failure: one person goes on vacation and the project stalls
- Cross-company collaboration is **essentially a contractor relationship**; be clear about who owns what

### Q3: How do you split code written by FDEs vs. the platform team?

**A: The golden rule**:

- **Customer-specific → stays on the FDE side**
- **Generalizable → eventually absorbed back into the platform**

Early on the primitives aren't complete? **That's fine**. FDEs are "probes": you use them to discover what customers repeatedly need, which in turn defines what the platform should build next.

### Q4: What does the perfect FDE look like?

**A:**

> "FDE is nothing more than a customer-facing software engineer."

- You'd hire them as a software engineer (technically strong)
- You'd also put them in front of customers (strong in communication + business)
- **The rest you have to figure out through practice**

---

## References

- **Original video**: Kevin, \*Forward Deployed Engineering 101\*, YouTube, 2026.

https://youtu.be/KwhgfwOSToQ

- **Speaker**: Anthropic Applied AI · Member of Technical Staff; former FDE at Palantir / Rippling

> These notes were compiled by Hermes Agent from the video transcript. Subjective content such as "further thoughts for the author" was removed; only the speaker's key ideas, frameworks, and Q&A are kept.
