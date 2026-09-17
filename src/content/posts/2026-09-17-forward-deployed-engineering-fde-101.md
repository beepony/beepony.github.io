---
author: Beepony
title: "Forward Deployed Engineering 101 — Palantir FDE 模型的起源、本质与 AI 时代的再生"
pubDatetime: 2026-09-17T12:00:00+08:00
description: Kevin（Anthropic MTS, ex-Palantir / Rippling）讲 FDE 101：什么是 FDE、为什么 Palantir 选 FDE 做 GTM、2026 年 AI 时代为什么所有 agentic 平台都被迫变成"Palantir"。
tags:
  - FDE
  - Forward Deployed Engineering
  - Palantir
  - Anthropic
  - AI Agent
  - GTM
  - 平台策略
timezone: Asia/Shanghai
---

# Forward Deployed Engineering 101

> 把工程师派到客户现场，不是为了"做咨询"，而是**替客户解决业务问题**。
> FDE 的核心，是"卖结果"，不是"卖软件"或"卖人"。

> **出处**：本笔记整理自 Kevin 在 Anthropic 公开演讲《Forward Deployed Engineering 101》（YouTube, 2026），全长约 17 分钟（含 Q&A）。Kevin 是 Anthropic Member of Technical Staff, Applied AI 团队；此前为 Palantir 早期员工，并在 Rippling 担任 FDE 团队第 1 号员工，一年内将团队扩展到约 25 人。
> 视频链接：https://youtu.be/KwhgfwOSToQ

---

## 一、核心命题：FDE 只解决一种特定场景

Kevin 画了一个 2×2 矩阵：

| 卖的东西 \ 买家 | **技术买家**（CTO/CIO/工程师） | **非技术买家**（业务负责人） |
|---|---|---|
| **复杂产品**（GitHub、Datadog） | ✅ DevRel / 开发者生态 | ⚠️ **Palantir 处境** → FDE |
| **简单/可配置产品**（Slack、Jira、Rippling） | ✅ 销售主导 SLG | ✅ 销售主导 SLG |

**只有当你的产品高度复杂、买家却完全技术门外汉时，FDE 才是答案。**

> 投行、石油天然气、政府、大型企业客户——他们雇不到、留不住深度工程师，但他们要的是「货架再多摆 10%」「销售吞吐更高」，**他们不在乎数据怎么组织，更不该在乎**。

---

## 二、Palantir 的破局思路：从"卖软件"到"卖结果"

纯软件生意的两个死结：

1. **价值解释成本高** — "我帮你把数据组织好了"，但业务方不买账
2. **客户成功全靠他自己** — 客户不仅付费，还要培训自己团队，才能用起来 → **这是糟糕的生意模型**

Palantir 的解法：**产品和服务的捆绑销售**。

> 客户买的既不是软件，也不是某人的工时。
> 客户买的是 **outcome**。
> 你派过去的是懂 Foundry 平台的工程师，他深入客户业务，搞清楚问题，然后在 Foundry 上**直接搭出解决方案**。

类比：**高级餐厅的服务员**——客户不需要懂后厨，服务员负责"为你搞定一切"。

**验证数据**：Fortune 500 公开 SaaS 公司按 ACV 排名

- Palantir：**$4M**
- ServiceNow：$1.2M
- Workday：$600K
- 其余**没有任何一家** ACV 过 $500K

数人头也很离谱：**几千人公司做到荒谬估值**。

---

## 三、FDE 的本质：把"设计伙伴关系"工业化到企业级

**FDE = Design Partnership × Enterprise Scale**

早期 B2B startup 找 PMF 的方式就是设计伙伴（design partnership）：

- 创始人和客户一起工作
- 创始人花时间、花精力、花技术、花资源
- 客户只需要提供问题上下文
- 创始人交付一个真正贴合需求的方案

Palantir 的断言：**谁说设计伙伴关系只能用在 startup 早期？把它 scale 到 enterprise 就行了。**

### 但你必须有平台

⚠️ **FDE 不是 dev shop**

如果你让每个 FDE 从零写代码给客户：

- 你会有 55 个 repo，没人想接
- 维护成本吃光利润
- 工程师跑光

> FDE 的关键特征：**永远在平台之上构建，不写 from-scratch 代码**。
> 平台提供 primitives，FDE 用 primitives 拼装出 workflow / app / solution。

---

## 四、要不要建 FDE 团队？先问自己两个问题

### 问题 1：我的业务是否处在"卖复杂产品给非技术买家"这个象限？

- 如果不是 → FDE **不适合你**
  - 复杂产品 + 技术买家 → DevRel
  - 简单产品 + 非技术买家 → SLG 销售

### 问题 2：我有没有平台（或愿意投一个）？

- 没有平台 → **别动**
- 有平台但 primitives 不够 → FDE 是你探路的眼睛
- 有强平台 → 可以开干

> Kevin 原话："I could not begin to stress the amount of maintenance burden that will be on your team even if you have a robust platform, never mind if you don't."

---

## 五、AI 时代为什么所有人都"被迫"变成 Palantir

2026 年的范式转移：**几乎所有平台都在变 agentic = 几乎所有平台都在变得可定制**。

后果：

1. **你卖的所有产品**，客户都不知道你到底在卖什么
2. **客户成功完全寄托在客户的实施能力上**——他们根本没有
3. 无论你要往上游卖（upsell），还是横向/纵向扩张（land-and-expand），**纯靠客户自己上手是行不通的**

> Kevin 的判断：这不是"大家突然发现 FDE 好然后抄"，而是**做生意这件事本身变了**——平台变 agentic = 每个平台都需要实施伙伴，而 FDE 就是规模化版本的实施伙伴。

---

## 六、Q&A 关键问答

### Q1：Primitives 该有多"原子"？

**答：看场景**。

- 一种极端：app 已经 60% 做好，用户只定制 40% → primitives 粗
- 另一种极端：极度细粒度配置、面向广泛客户 → 像 AWS 的 DynamoDB 那样给你最底层的拼图
- **判断标准：你的用户群跨度有多广**

### Q2：多个 FDE 在同一个项目上协作怎么搞？

**答：强烈鼓励**。

- 防止单点故障——一个人度假，项目就瘫
- 跨公司协作的，**本质就是承包商关系**，要明确谁负责什么

### Q3：FDE 写的代码 vs 平台团队写的代码怎么划分？

**答：黄金法则**：

- **客户专属 → 留在 FDE 侧**
- **可泛化 → 长期要吸收回平台**

FDE 早期 primitives 不全？**没关系**。FDE 本身是"探针"——你用它发现客户反复需要什么，反过来定义平台下一阶段该造什么。

### Q4：完美 FDE 画像是什么？

**答：**

> "FDE is nothing more than a customer-facing software engineer."

- 你会招他当软件工程师（技术过关）
- 你也会把他放在客户面前（沟通+业务过关）
- **其余细节，得你自己在实践中磨出来**

---

## 参考

- **视频原文**：Kevin, *Forward Deployed Engineering 101*, YouTube, 2026.
  https://youtu.be/KwhgfwOSToQ
- **演讲者**：Anthropic Applied AI · Member of Technical Staff；前 Palantir / Rippling FDE

> 本笔记由 Hermes Agent 根据视频 transcript 整理，去除了「给作者个人延伸思考」等主观内容，仅保留演讲者的核心观点、框架与 Q&A 关键问答。
