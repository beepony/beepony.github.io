---
layout: post
title: "Pi Agent 极简使用指南"
date: 2026-09-11 11:20:00 +0800
description: "只讲怎么用得更高效：日常高频操作、上下文与分支管理、把重复劳动固化成 skills 与包，一份来自官方文档的精简指南。"
tags: [AI, Agent]
---

# Pi Agent 极简使用指南

---

## 1. 先建立一个正确认知

Pi 是一个 **minimal terminal coding harness（极简终端编码工具）**。

它的核心设计原则是：**核心保持最小，工作流交给你自己扩展**（`README.md > Philosophy`）。

官方明确说明它**不做**这些内置功能，以及对应的替代方案：

| 别人有的功能 | Pi 的态度 | 替代做法 |
|---|---|---|
| MCP | 不做 | 用 CLI 工具 + README（即 Skills），或写 extension 加 MCP |
| Sub-agents | 不做 | tmux 里起多个 pi、自己写 extension、或装第三方包 |
| 权限弹窗 | 不做 | 跑在容器里，或用 extension 自定义确认流程 |
| Plan mode | 不做 | 把计划写进文件，或用 extension / 包 |
| 内置 Todo | 不做 | 用 `TODO.md` 文件 |
| 后台 bash | 不做 | 用 tmux（可观测、可直接交互） |

**这意味着：不要等 Pi 给你工作流，直接把你要的工作流做成 skill / prompt / extension / package。**

默认只给模型 4 个工具：`read`、`write`、`edit`、`bash`；只读的 `grep`、`find`、`ls` 需要显式开启（`docs/quickstart.md`、`docs/usage.md`）。

---

## 2. 日常最高频的 6 个动作

来源：`README.md > Interactive Mode`、`docs/quickstart.md`

| 想干什么 | 怎么做 |
|---|---|
| 引用文件 | 编辑框里打 `@` 模糊搜索项目文件；命令行 `pi @src/app.ts "review this"` |
| 让模型看到命令输出 | `!command`（输出进上下文）；只想自己跑不想污染上下文用 `!!command` |
| 贴图 | Ctrl+V（Windows 是 Alt+V），或直接把图片拖进终端 |
| 多行输入 | Shift+Enter（Windows Terminal 用 Ctrl+Enter） |
| 用外部编辑器写长 prompt | Ctrl+G（走 `externalEditor` / `$VISUAL` / `$EDITOR`） |
| 复制上一条回复 | Ctrl+X |

一次性任务（不进交互界面）：

```bash
pi -p "Summarize this codebase"
cat README.md | pi -p "Summarize this text"   # stdin 会并入初始 prompt
pi -p @screenshot.png "What's in this image?"
```

---

## 3. 模型与思考等级：按任务难度切

来源：`README.md`、`docs/settings.md`

- `/model` 或 **Ctrl+L** 切模型；在选择器里按 **Ctrl+S** 把当前模型存为启动默认。
- `/thinking` 切思考等级；同样 Ctrl+S 存默认。**Shift+Tab** 快速循环。
- 等级：`off` / `minimal` / `low` / `medium` / `high` / `xhigh` / `max`。
- Ctrl+P / Shift+Ctrl+P 在「scoped models」之间循环（`/scoped-models` 或 `--models` 配置）。

命令行一次性指定：

```bash
pi --model sonnet:high "Solve this complex problem"   # provider/id + :thinking 简写
pi --thinking high "Solve this complex problem"
pi --models "claude-*,gpt-4o"                          # 限定可循环的模型
```

**省 token 的实用技巧**：简单改动用低思考等级 + 便宜模型，复杂重构再切 high。读多写少的审查类任务可以开只读模式：

```bash
pi --tools read,grep,find,ls -p "Review the code"   # 只读，物理上改不了文件
```

---

## 4. 让它「懂你的项目」：AGENTS.md 是投入产出比最高的一件事

来源：`README.md > Context Files`、`docs/quickstart.md`

Pi 启动时会自动加载这些文件并拼接：

1. `~/.pi/agent/AGENTS.md`（全局）
2. 从 cwd 向上逐级父目录的 `AGENTS.md` 或 `CLAUDE.md`
3. 当前目录的 `AGENTS.md` 或 `CLAUDE.md`

如果某目录有 `AGENTS.override.md`，该目录就只加载它、忽略 `AGENTS.md`/`CLAUDE.md`。

写什么：项目约定、常用命令、安全红线、偏好。

```markdown
# Project Instructions
- 改完代码跑 `npm run check`
- 不要在本地跑生产 migration
- 回复保持简洁
```

**要点**：

- 改完 context file 后要**重启 pi 或 `/reload`** 才生效。
- 想彻底替换系统提示词：`.pi/SYSTEM.md`（项目）或 `~/.pi/agent/SYSTEM.md`（全局）；只想追加用 `APPEND_SYSTEM.md`。
- 临时禁用加载：`--no-context-files` / `-nc`。

---

## 5. 上下文是会烧钱的：会话 / 分支 / compaction

来源：`docs/sessions.md`、`docs/compaction.md`

### 会话管理

- 会话自动存到 `~/.pi/agent/sessions/`，按工作目录组织，JSONL 树结构。
- `pi -c` 续最近会话；`pi -r` 浏览选择；`pi --no-session` 临时不留档；`pi --name "xxx"` 起名（方便以后在 `/resume` 里找）。
- `/new` 开新会话、`/session` 看当前会话信息（文件、ID、token、花费）、`/resume` 从历史里挑。

### 分支：不要因为「聊歪了」就重开

- **`/tree`**：在同一个文件里跳回任意历史节点继续（树结构，所有历史都保留）。选用户消息会把它放回编辑框供你改后重发，从而开出新分支；选非用户条目则直接从那继续。
- **`/fork`**：从某个早期用户消息开一个**新会话文件**。
- **`/clone`**：把当前分支复制成一个新会话文件。
- 从 `/tree` 切走分支时，Pi 可以把被放弃的分支**总结**后注入新位置，保留上下文。

一句话选择：想在原地比较多个方案 → `/tree`；想要独立文件 → `/fork` / `/clone`。

### Compaction（自动压缩）

- 触发条件：`contextTokens > contextWindow - reserveTokens`（默认 reserve 16384）。
- 保留最近 `keepRecentTokens`（默认 20000）不压缩，更早的交给 LLM 总结。
- 手动：`/compact` 或 `/compact <自定义指示>`。
- **重要**：compaction 是**有损的**。完整历史仍在 JSONL 里，可以用 `/tree` 回去看；但被总结掉的细节不会自动回到上下文。

```json
// ~/.pi/agent/settings.json 或 .pi/settings.json
{ "compaction": { "enabled": true, "reserveTokens": 16384, "keepRecentTokens": 20000 } }
```

### 换电脑 / 分享

- `/export [file]` 导出 HTML 或 JSONL；`/import <file>` 导入并续跑。
- `/share` 上传成私有 GitHub gist，得到可分享的 HTML 链接。

---

## 6. 把重复劳动固化下来（这是「高效 build」的关键）

来源：`docs/prompt-templates.md`、`docs/skills.md`、`README.md > Pi Packages`

### 6.1 Prompt Templates —— 固定话术

放在 `~/.pi/agent/prompts/*.md` 或 `.pi/prompts/*.md`，输入 `/文件名` 展开。

```markdown
<!-- ~/.pi/agent/prompts/review.md -->
---
description: Review staged git changes
argument-hint: "[focus]"
---
Review the staged changes (`git diff --cached`). Focus on: ${1:-bugs, security, error handling}
```

支持 `$1`、`$@`、`$ARGUMENTS`、`${1:-默认值}`、`${@:N:L}` 切片。

### 6.2 Skills —— 按需加载的能力包（渐进式披露）

**机制**：启动时只把 skill 的 `name` + `description` 放进系统提示词；任务匹配时模型才用 `read` 读完整 `SKILL.md`。所以写 skill 时，**`description` 决定它会不会被触发**。

```markdown
<!-- ~/.pi/agent/skills/my-skill/SKILL.md -->
---
name: my-skill
description: 具体说明做什么、以及什么场景下该用它。要具体。
---

# My Skill
## Steps
1. ...
```

- 位置：`~/.pi/agent/skills/`、`~/.agents/skills/`、`.pi/skills/`、`.agents/skills/`，或 package 里。
- 强制调用：`/skill:name`，可带参数 `/skill:pdf-tools extract`。
- 可以复用别的 harness 的 skills（写进 settings 即可）：

```json
{ "skills": ["~/.claude/skills", "~/.codex/skills"] }
```

### 6.3 Pi Packages —— 把上面这些打包分享 / 复用

```bash
pi install npm:@foo/pi-tools        # 也支持 git:github.com/user/repo、https://... 、ssh://...
pi install npm:@foo/pi-tools@1.2.3  # 锁版本
pi list
pi update --extensions              # 只更新包
pi update --all                     # 更新 pi + 所有包
pi config                           # 交互式启用/禁用包里的资源
```

`-l` 装到项目本地（`.pi/`）。包可以只启用其中部分资源（`packages` 的 object 形式，见 `docs/settings.md`）。

> **安全提醒（官方原文）**：Pi packages 拥有完整系统权限，扩展会执行任意代码，skills 也能指示模型执行任何操作。**安装第三方包前先看源码。**

---

## 7. 别打断它：消息队列

来源：`README.md > Message Queue`

Agent 干活时你可以继续输入：

| 操作 | 效果 |
|---|---|
| **Enter** | 排队成 *steering* 消息：当前 assistant 回合的工具调用跑完后送达（可以中途纠偏） |
| **Alt+Enter** | 排队成 *follow-up*：等 agent 全部干完才送达 |
| **Escape** | 中止，并把排队消息还原回编辑框 |
| **Alt+Up** | 把排队消息取回编辑框 |

`steeringMode` / `followUpMode` 可设为 `"one-at-a-time"`（默认，等回复）或 `"all"`（一起发）。

---

## 8. 非交互 & 脚本化：把 pi 塞进流水线

来源：`README.md > Programmatic Usage`、`docs/usage.md`

| 模式 | 用途 |
|---|---|
| 默认 | 交互式 |
| `-p` / `--print` | 打印结果就退出 |
| `--mode json` | 所有事件按 JSON Lines 输出 |
| `--mode rpc` | stdin/stdout 上的 RPC，给非 Node.js 进程集成（严格 LF 分帧，别用 Node `readline`） |
| SDK | `import { createAgentSession, ModelRuntime, SessionManager } from "@earendil-works/pi-coding-agent"` |

`bash` 工具执行时，命令会拿到这些环境变量，方便脚本反查上下文（`README.md > Environment Variables`）：

`PI_SESSION_ID`、`PI_SESSION_FILE`、`PI_PROVIDER`、`PI_MODEL`、`PI_REASONING_LEVEL`；
另外 CLI/RPC 入口会设 `AI_AGENT=pi`、`PI_CODING_AGENT=true` 供子进程识别。

---

## 9. 安全与信任边界（别跳过）

来源：`README.md`、`docs/usage.md > Project Trust`、`docs/security.md`

- **没有权限弹窗**——这是设计选择。默认它就能在你的 cwd 里改文件、跑任意命令。
- 用 git 或别的 checkpoint 机制兜底回滚。
- **Project Trust**：当一个项目目录含项目级 settings / 资源 / `.agents/skills` 且没有已保存的决定时，交互模式会先问你是否信任。信任后才加载 `.pi/settings.json`、`.pi` 资源和项目扩展。
  - 非交互模式（`-p`、`--mode json/rpc`）不弹框，按 `defaultProjectTrust` 处理：`ask`（默认）/ `never` 忽略这些项目资源，`always` 信任。
  - 单次覆盖：`-a` / `--approve`，或 `-na` / `--no-approve`。
  - `/trust` 写 `~/.pi/agent/trust.json`（**当前会话不重载，要重启**）。
- 危险场景建议：**容器里跑**，或用 extensions 自己实现确认流程；需要后台任务用 **tmux**。
- 隐私开关：`PI_OFFLINE=1` / `--offline` 关掉全部启动网络请求；`PI_SKIP_VERSION_CHECK=1` 只关版本检查；`enableInstallTelemetry: false` 或 `PI_TELEMETRY=0` 关安装遥测。

---

## 10. 常用命令速查

来源：`README.md > CLI Reference`

```bash
# 会话
pi -c                          # 续最近会话
pi -r                          # 浏览历史会话
pi --name "release audit" -p "Audit this repository"
pi --session <path|id>         # 打开指定会话
pi --fork <path|id>            # 从指定会话 fork

# 模型
pi --provider openai --model gpt-4o "..."
pi --list-models [search]

# 工具控制
pi --tools read,grep,find,ls -p "Review the code"   # 只读
pi --exclude-tools ask_question                     # 禁用单个工具
pi --no-builtin-tools                               # 关内置，保留扩展工具

# 资源控制（精确加载）
pi --no-extensions -e ./my-extension.ts
pi --no-skills
pi --no-context-files              # 或 -nc

# 包管理
pi install <source> [-l]
pi remove  <source> [-l]
pi update --all | --extensions | --models | --self
```

交互内常用：`/model` `/thinking` `/resume` `/new` `/tree` `/fork` `/clone` `/compact` `/session` `/reload` `/hotkeys` `/export` `/share` `/trust` `/settings` `/quit`。
按 `/hotkeys` 看全部快捷键；自定义写 `~/.pi/agent/keybindings.json`，改完 `/reload` 生效。

---

## 11. 一份「高效 build」检查清单

按官方能力拼出来的推荐姿势：

1. **项目根写 `AGENTS.md`**：命令、约定、红线。一次投入，长期省事。
2. **启动默认模型/思考等级用 Ctrl+S 存下来**，别每次重切。
3. **重复的 prompt 做成 prompt template**，别再手打。
4. **重复的多步流程做成 skill**，`description` 写清楚触发场景。
5. **大任务分阶段**：一个阶段一个会话；跑歪了用 `/tree` 回退而不是重开。
6. **长会话注意 compaction 是有损的**：关键结论让它落到文件里（`TODO.md`、设计文档），别只留在上下文。
7. **需要并行/后台**：tmux 起多个 pi，不要指望内置后台 bash。
8. **需要审批/护栏**：写 extension 或用 `--tools` 只读模式，官方不提供弹窗。
9. **装第三方包前读源码**——它们有完整系统权限。
10. **非交互流水线**用 `-p` / `--mode json` / `--mode rpc` / SDK。

---

## 官方文档索引

安装目录：`/opt/homebrew/lib/node_modules/@earendil-works/pi-coding-agent/`

| 想了解 | 看这个 |
|---|---|
| 总览 / 哲学 / CLI 全参数 | `README.md` |
| 上手流程 | `docs/quickstart.md` |
| 日常交互、slash 命令、CLI 参考 | `docs/usage.md` |
| 会话 / 分支 / 恢复 | `docs/sessions.md` |
| 上下文压缩原理与配置 | `docs/compaction.md` |
| Skills 规范与位置 | `docs/skills.md` |
| Prompt 模板语法 | `docs/prompt-templates.md` |
| 包管理与安全注意 | `docs/packages.md` |
| 全部 settings 项 | `docs/settings.md` |
| 全部快捷键与自定义 | `docs/keybindings.md` |
| 扩展开发（自定义工具/UI/子代理/权限） | `docs/extensions.md` |
| 自定义 provider / 模型 | `docs/custom-provider.md`、`docs/models.md` |
| 各种 provider 认证 | `docs/providers.md` |
| JSON / RPC / SDK 集成 | `docs/json.md`、`docs/rpc.md`、`docs/sdk.md` |
| 安全模型 | `docs/security.md` |
| 容器化 / tmux / 终端适配 | `docs/containerization.md`、`docs/tmux.md`、`docs/terminal-setup.md` |
| 环境变量 | `docs/environment-variables.md` |

Pi 自带能力：在 pi 里直接问「帮我做一个 skill / prompt template」，官方文档明确写了 `pi can create skills` / `pi can create prompt templates`。
