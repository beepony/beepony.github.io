---
author: Beepony
title: "A Plain-English Guide to LLM Caching: Why Changing One Character Can Cost You 10x (No Coding Required)"
pubDatetime: 2026-10-12T12:00:00+08:00
description: "Twelve sections that explain Context, KV Cache, Prefix Cache, and Prompt Cache: why changing one character in a prompt can cost 10x more, plus five practical ways to get more cache hits."
tags:
  - AI
  - LLM
  - Cache
  - Performance Optimization
  - Explainers
timezone: Asia/Shanghai
---

## A Plain-English Guide to LLM Caching

> The core in one sentence: **LLMs get faster by "not recomputing things"; changing one character and wasting all that earlier work is the price of this design.**

---

## Reading Map

| Section | Content | What it answers |
| --- | --- | --- |
| 1. The Bottom Line First | LLMs don't recompute every time; they use caching to save time | What the whole guide is about |
| 2. Why You Should Care | Changing one character can cost more; cache hits can be 5-10x faster | Why read to the end |
| 3. What Is Context | History the model can see ≠ a cache hit | Don't confuse "seeing" with "taking notes" |
| 4. What Is a Token | Models don't read words, only ID numbers | The foundation for everything that follows |
| 5. What the Model Computes | Token → a big pile of numbers | Why caching saves work |
| 6. KV Cache | The model's finished "reading notes" | Cache within a session |
| 7. Prefix Cache | Upgrading the notes to "shared with the class" | Cache across requests |
| 8. Prompt Cache | Past results saved proactively by the provider | Cache at the API business layer |
| 9. How to Verify a Hit | Check the `cached_tokens` number | Is your money well spent? |
| 10. Why One Changed Character Breaks It | Apple → Huawei, a train switching tracks | Visualizing why the cache breaks |
| 11. 5 Lessons for Writing Prompts | How to get more cache hits | Practical cheat sheet |
| 12. Summary in One Sentence | 4 concepts + the main analogy | For review |

---

## 1. The Bottom Line First

Many people think:

> Every time an LLM answers a question, it has to reread the entire chat history.

That's not entirely true.

Modern LLMs usually use various caching mechanisms to avoid recomputing content they've already processed.

The most common are:

1. **Context**
2. **KV Cache** (inference cache)
3. **Prefix Cache**
4. **Prompt Cache**

How the four concepts relate:

| Concept | Scope | Analogy |
| --- | --- | --- |
| **Context** | The conversation history the model can see | The whole textbook the teacher hands to the student |
| **KV Cache** | Reused within a single session | The reading notes the student has made |
| **Prefix Cache** | Reuses identical prefixes across requests/sessions | A notebook shared by the whole class |
| **Prompt Cache** | Past computation results saved proactively by the provider | The school library system |

**In one sentence**: all four do the same thing, **keeping the model from recomputing what it has already computed**; they just cover a bigger and bigger "area."

---

## 2. Why Should You Care?

The biggest reason to read this guide isn't technical curiosity; it's **money and speed**.

- ✅ For the same question, **changing one character in the prompt can cost 10x more** (changes near the start cost the most)
- ✅ The same reply can differ in speed by **5-10x** (hit vs. miss)
- ✅ Understanding the `cached_tokens` returned by the API **helps you judge whether your money is well spent**

> Every concept that follows serves these three points.

---

## 3. What Is Context?

Suppose you ask a series of questions:

```
A: What's the capital of France?
A1: What's its population?
A2: What's its GDP?
A3: How big is it?
A4: What's the official language?
A5: Which city is the most famous?
```

When you ask A5, what the model actually receives **usually** includes the earlier conversation, so A5 can "see" A through A4. This is called **context**.

But note:

> **Seen ≠ noted down**

>

> Having a textbook in front of a student (context) doesn't mean they've looked at their notes.  
> A teacher handing out a textbook (context) doesn't mean the student has taken notes (KV Cache).

>

> **Being able to see past content ≠ a cache hit**.

This distinction is the key to understanding the whole guide. KV Cache and Prefix Cache are about what's "already noted down," not what's "already seen."

---

## 4. What Is a Token? (The Foundation for Everything Above)

Models don't read words; they only recognize ID numbers.

For example:

```
"France"
```

might be ID `3847` to the model, and "I like Apple" might be `[127, 8034, 5217]`.

A sentence gets split into many IDs, and each ID is called a **token**.

> **Sending the model 10,000 words ≈ sending it 10,000 IDs.**

>

> That's why "length" matters so much for LLMs: **more tokens means slower and more expensive.**

---

## 5. What Is the Model Actually Computing?

Each token is turned into a string of numbers, for example:

```
"France"  →  [0.12, -0.34, 0.78, -0.05, ...]
```

These numbers aren't random; they **encode**:

- Meaning ("France" is the name of a country)
- Grammatical role (it's the subject in this sentence)
- Contextual relationships (it pairs with "capital")
- Position (which word it is)

> **You don't need to understand how these numbers are computed**; just know:  
> **behind every token is a big pile of numbers.**

>

> The first time the model sees a new token, it has to compute that whole pile of numbers, and **this step is expensive**.

And the essence of caching is: **don't make the model compute the same numbers twice**.

---

## 6. KV Cache: The Model's "Reading Notes"

> **Think of KV Cache as the reading notes an LLM has already made.**

KV = Key + Value. After the model analyzes earlier content, it saves **the important intermediate results needed for later reasoning**.

The next time it sees the same prefix, it uses those notes directly instead of rereading the whole passage.

### Round 1 vs. Round 2

```
Round 1
─────────────────────────────────
Read 10000 words → compute 10000 tokens → answer
              ↑
       everything from scratch

Round 2
─────────────────────────────────
Read 10000 + 100 words
         ↑
     this part just uses the notes (KV Cache)
              ↓
Compute only the 100 new tokens → answer
              ↑
       actually computed only 1%
```

**That's why speed can differ by 5-10x**. The gap you see isn't from optimization; it's from "skipping 99% of the work."

---

## 7. Prefix Cache: Upgrading the Notes to "Shared with the Whole Class"

**The limit of KV Cache**: the notes stay only in **this conversation** and are gone in the next session.

**What Prefix Cache is**: upgrading the notes to a "notebook shared by the whole class," **usable across requests and sessions**.

```
A → A1 → A2 → A3 → A4  ← computed before

Now a new request comes in:
A → A1 → A2 → A3 → A4 → A5
                            ↑
                    compute only A5
```

> **The upgraded analogy**:  
> - KV Cache = notes in your desk drawer (only you use them)  
> - Prefix Cache = a notebook shared by the class (anyone with the same prefix can borrow it)

Note: the prefix must be **exactly the same** to hit. Change one character in the prefix and the whole set of notes is void.

---

## 8. Prompt Cache: Results Saved Proactively by the Provider

If KV Cache is like temporary notes in the current session, **Prompt Cache is past computation results the provider saves separately**.

For example, take this long system prompt:

```
A + A1 + A2 + A3 + A4   ← already computed by some user
```

Later, when **any user** submits the same prefix again, the provider **may** reuse the earlier results directly.

| API provider | Cache type | Pricing |
| --- | --- | --- |
| OpenAI | Prompt Caching | Cache-hit tokens at half price |
| Anthropic | Prompt Caching | Cache writes 1.25x, hits 0.1x |
| Gemini | Context Caching | Charged by cache duration |

> **How it differs from Prefix Cache**:  
> Prefix Cache is usually a **server-side mechanism** (invisible to users), while Prompt Cache is **a feature the provider actively sells** (optional for users, with pricing rules).

>

> For most people, just remember one thing: **don't make the model recompute what it has already computed**.

---

## 9. How Do You Verify a Cache Hit?

Some APIs return something like this:

```
{
  "input_tokens": 10000,
  "cached_tokens": 9500
}
```

What it means:

```
Total input tokens: 10000
Cache-hit tokens:   9500   ← the part that doesn't need recomputing
Recomputed tokens:  500    ← what actually used compute
```

**How to use this number**:

- A high `cached_tokens` share (>80%) → your prompt structure is stable and **your money is well spent**
- `cached_tokens` is always 0 → your prompt keeps changing, and **you're probably wasting money**

---

## 10. Why Does Changing One Character Break It?

Because the Transformer is an **autoregressive** structure:

> **How later tokens are understood depends strictly on earlier tokens.**

### Example 1: Apple → Huawei

Original:

```
I like Apple phones
```

Change it to:

```
I like Huawei phones
```

From "Apple" onward, every later semantic state changes.

### Example 2: The Train Model

```
Before
🚃 A → 🚃 B → 🚃 C → 🚃 D → 🚃 E

After
🚃 A → 🚃 B → 🚃 X → 🚃 D → 🚃 E
              ↑      ↑      ↑
          recouple recouple recouple

The later cars have to be recoupled
because they used to hang behind C;
now they hang behind X, so the coupling changed.
```

### Example 3: Changing the Start Hurts Most

```
Original: I like Apple phones
Changed:  He likes Apple phones
```

Even though only one word changed, **the computation for every later token may be affected**.

> **The earlier the change, the bigger the impact; the later the change, the easier it is to hit the cache.**

---

## 11. 5 Lessons for Writing Prompts (Pitfall Cheat Sheet)

> [!tip] Practical rules for more cache hits

>

> 1. **Put the system prompt first**: once it's stable, don't touch it; changing it = losing everything  
> 2. **Put fixed, rarely changed parts in the prefix**: this maximizes hits  
> 3. **Put the parts that change every time at the end**: user questions / variables → go last  
> 4. **Want to add a new constraint? Append it after the fixed section** rather than cutting in line  
> 5. **Check the `cached_tokens` returned by the API**: if it's always 0, your prompt structure keeps changing

---

## 12. Summary in One Sentence

### Context

```
The conversation history the model sees
```

### KV Cache

```
The reading notes the model has already made
```

### Prefix Cache

```
Reuse identical prefixes directly
```

### Prompt Cache

```
Past computation results saved by the provider
```

### Why can changing one character break it?

```
Later understanding builds on earlier content.

The earlier the change, the bigger the impact;
the later the change, the easier it is to hit the cache.
```

---

## The Most Memorable Way to Remember It

```
Context
= the whole textbook the teacher hands out

KV Cache
= the reading notes the student made

Cache hit
= flipping straight to the notes

Cache miss
= rereading the textbook

Prompt Cache
= shared notes kept in the school library
```

---

## References

- Original Copilot first draft: `/Users/bw/.hermes/cache/documents/doc_460c26220db8_LLM-Cache-Guide.md`
- Hermes review focus: add a token primer, distinguish the three cache layers, add a "why should I care" hook, move the cached\_tokens section earlier, upgrade the train model, add a pitfall cheat sheet
