---
layout: post
title: "Hermes Agent 接入飞书完整指南"
date: 2026-08-22 09:00:00 +0800
description: "从 0 到 1 把 Hermes Agent 接入飞书私聊和群聊：模型配置、Feishu WebSocket、allowlist、配对机制与真实排错。"
tags: [Hermes, 飞书]
---

这是一份给第一次使用 Hermes Agent、并希望通过飞书和 Hermes 对话的用户准备的实战文档。

文档目标：

- 帮你先把 Hermes 的 MiniMax 中国区模型配置正确
- 帮你从 0 到 1 完成 Hermes Agent 接入飞书
- 解释每一步为什么要这么配
- 记录常见报错和对应解决办法
- 尽量避免第一次接入时反复踩坑

本文基于一次真实接入过程整理而成，已经验证过可行。

## 一、最终效果

配置完成后，你可以做到：

- 使用 MiniMax 中国区模型作为 Hermes 的默认模型
- 在飞书私聊 Hermes Agent 机器人直接对话
- 在飞书群里 `@机器人` 和 Hermes 对话
- 使用 Hermes 现有模型配置作为飞书消息通道背后的推理模型
- 将当前飞书会话配置成 Hermes 的 `home channel`
- 通过 allowlist 和 pairing 机制限制只有指定账号可用

## 二、整体架构理解

这套配置推荐按下面顺序理解：

1. 先把 Hermes 的模型配置正确
2. 再把飞书作为消息通道接入
3. 最后补安全和体验配置

Hermes Agent 的飞书接入，本质上是：

1. Hermes Gateway 作为后台消息网关进程运行
2. 飞书开放平台 App 作为消息入口
3. 飞书 Bot 将消息送到 Hermes Gateway
4. Hermes 调用你配置好的模型
5. Hermes 再把结果回发到飞书会话

飞书接入推荐使用：

- `websocket` 模式

这是官方推荐模式，优点是：

- 不需要公网回调地址
- 不需要自己部署 webhook 服务
- 本地开发和个人使用最省事

## 三、前置准备

开始前请先准备好以下内容。

### 1. 已安装 Hermes Agent

确认命令可用：

```bash
hermes version
```

### 2. 已配置一个可用模型

例如：

- `minimax-cn`
- `minimax`
- `openrouter`
- `anthropic`
- `openai`

如果模型本身没配通，飞书接上之后机器人仍然无法正常回复。

### 3. 已有飞书开放平台应用

你需要提前在飞书开放平台创建应用，并获得：

- `App ID`
- `App Secret`

飞书开放平台：

- https://open.feishu.cn/

### 4. 飞书应用已开启 Bot 能力

在应用里启用 Bot，否则 Hermes 即使连接成功，也无法按消息机器人方式工作。

## 四、先配置 MiniMax 中国区模型

如果你在中国大陆使用 Hermes，最推荐的起步方式之一，是先把模型配置成 MiniMax 中国区。

这是因为：

- 国内网络环境下通常更稳定
- Hermes 已经内建了 `minimax-cn` provider
- 配好后再接飞书，排查路径会清晰很多

### 1. 正确的 Hermes 配置方式

在 `~/.hermes/config.yaml` 中：

```yaml
model:
  default: MiniMax-M2.7
  provider: minimax-cn
```

在 `~/.hermes/.env` 中：

```bash
MINIMAX_CN_API_KEY=你的中国区MiniMax API Key
```

这就是推荐的最简配置。

### 2. 我们这次实际验证可用的配置

实际跑通后的关键配置如下。

`~/.hermes/config.yaml`

```yaml
model:
  default: MiniMax-M2.7
  provider: minimax-cn
```

`~/.hermes/.env`

```bash
MINIMAX_CN_API_KEY=你的中国区MiniMax API Key
```

### 3. 不推荐的错误配置方式

这次接入过程中，最先遇到的核心问题并不是飞书，而是模型配置方式不对。

错误示例：

```yaml
model:
  default: minimax 2.7
  provider: custom
  base_url: https://api.minimaxi.com/anthropic
```

这种配法容易导致：

- `404 Not Found`
- Hermes 实际请求路径不匹配
- 模型名不被识别

原因是：

- Hermes 对 MiniMax 已有内建 provider
- 不应该再把 MiniMax 中国区强行配成 `custom + anthropic`
- `minimax 2.7` 也不是 Hermes 这里应使用的正确模型 ID

### 4. 这次实际遇到的 MiniMax 报错

我们这次真实遇到过两类典型报错：

第一类：

```text
404 Not Found
```

这通常意味着：

- 请求 URL 错了
- provider 配错了
- `base_url` 指向了不适配的路径

第二类：

```text
Error code: 400 - {'error': {'message': 'minimax 2.7 is not a valid model ID', 'code': 400}}
```

这说明：

- 路由已经到 MiniMax 了
- 但模型名仍然是错的

### 5. 正确修复方法

把配置改成内建 provider：

```yaml
model:
  default: MiniMax-M2.7
  provider: minimax-cn
```

然后在 `.env` 中填好：

```bash
MINIMAX_CN_API_KEY=你的中国区MiniMax API Key
```

不要再保留这类旧写法：

- `provider: custom`
- `base_url: https://api.minimaxi.com/anthropic`
- `default: minimax 2.7`

### 6. 如何验证 MiniMax 中国区模型已经配通

可以直接运行：

```bash
hermes chat -Q -q "Reply with exactly: ok" --provider minimax-cn -m MiniMax-M2.7
```

如果返回：

```text
ok
```

就说明至少下面这条链路已经通了：

- Hermes 配置正确
- `MINIMAX_CN_API_KEY` 可用
- 模型名正确
- provider 正确

建议一定先把这一步做通，再继续配置飞书。

## 五、官方推荐的飞书配置方式

Hermes 对飞书的原生接入是支持的，不需要你自己写中间层。

官方关键配置项如下：

```bash
FEISHU_APP_ID=你的飞书AppID
FEISHU_APP_SECRET=你的飞书AppSecret
FEISHU_DOMAIN=feishu
FEISHU_CONNECTION_MODE=websocket
FEISHU_GROUP_POLICY=allowlist
FEISHU_ALLOWED_USERS=
FEISHU_HOME_CHANNEL=
```

说明：

- `FEISHU_DOMAIN=feishu` 表示中国区飞书
- 如果是国际版 Lark，用 `FEISHU_DOMAIN=lark`
- `FEISHU_CONNECTION_MODE=websocket` 是推荐方式
- `FEISHU_GROUP_POLICY=allowlist` 表示群里只允许白名单用户使用
- `FEISHU_ALLOWED_USERS` 建议第一次接入时只填自己
- `FEISHU_HOME_CHANNEL` 可以后面再补

## 六、推荐的最短配置路径

如果你是第一次接入，建议直接按下面流程做，不要一开始就追求把所有参数配满。

### 第一步：先把 MiniMax 中国区模型配通

先确保 Hermes 自己已经能正常调用模型，而不是一上来就配飞书。

例如可以测试：

```bash
hermes chat -Q -q "Reply with exactly: ok" --provider minimax-cn -m MiniMax-M2.7
```

如果这里都不能返回，就先不要继续飞书接入。

### 第二步：在 `~/.hermes/.env` 中加入飞书配置

编辑：

```bash
~/.hermes/.env
```

加入：

```bash
FEISHU_APP_ID=YOUR_FEISHU_APP_ID
FEISHU_APP_SECRET=YOUR_FEISHU_APP_SECRET
FEISHU_DOMAIN=feishu
FEISHU_CONNECTION_MODE=websocket
FEISHU_GROUP_POLICY=allowlist
FEISHU_ALLOWED_USERS=
FEISHU_HOME_CHANNEL=
```

第一次接入时，`FEISHU_ALLOWED_USERS` 和 `FEISHU_HOME_CHANNEL` 可以先空着。

### 第三步：确认 Hermes 运行飞书所需依赖已经安装

飞书 websocket 模式至少要有这些 Python 依赖：

- `lark-oapi`
- `websockets`

可以检查：

```bash
/Users/你的用户名/.hermes/hermes-agent/venv/bin/python3 - <<'PY'
import importlib
for m in ["lark_oapi", "websockets"]:
    try:
        importlib.import_module(m)
        print(m, "ok")
    except Exception as e:
        print(m, "missing", e)
PY
```

如果 Hermes 自己的 venv 里缺依赖，安装到 Hermes 的 venv：

```bash
/Users/你的用户名/.hermes/hermes-agent/venv/bin/python3 -m ensurepip --upgrade
/Users/你的用户名/.hermes/hermes-agent/venv/bin/python3 -m pip install lark-oapi websockets
```

注意：

- 要装到 Hermes 自己的 venv
- 不要只装到系统 Python

### 第四步：启动或重启 Hermes Gateway

```bash
hermes gateway start
```

如果已经在运行：

```bash
hermes gateway restart
```

### 第五步：检查 Gateway 日志

重点看：

- `~/.hermes/logs/gateway.log`
- `~/.hermes/logs/gateway.error.log`

如果接入成功，日志里通常会看到类似信息：

```text
Connecting to feishu...
Connected in websocket mode (feishu)
Gateway running with 2 platform(s)
```

如果看到这些，说明飞书通道已经连上。

### 第六步：去飞书里私聊 Bot

第一次建议先从私聊开始，不要一上来就在群里测。

私聊里发一条简单消息，例如：

```text
hello
```

## 七、第一次使用时一定会遇到的“配对”机制

很多人第一次看到 Hermes 的飞书回复会以为是报错，其实不是。

第一次私聊时，Hermes 很可能会返回类似信息：

```text
Hi~ I don't recognize you yet!
Here's your pairing code: XXXXXXXX
Ask the bot owner to run:
hermes pairing approve feishu XXXXXXXX
```

这表示：

- 飞书通道已经通了
- Hermes 收到了你的消息
- 但 Hermes 还没有把你这个飞书用户标记为已授权用户

### 正确处理方式

在 Hermes 所在机器上执行：

```bash
hermes pairing approve feishu 你的配对码
```

批准成功后，Hermes 会提示该用户下次消息自动识别。

### 如果命令报权限问题

有时会出现无法写入 `~/.hermes/pairing/` 的情况。

这通常不是 Hermes 配错，而是当前执行环境没有权限。

解决方式：

- 在有足够权限的本机终端执行
- 或者以允许 Hermes 访问 `~/.hermes/` 的方式执行

## 八、建议马上补上的安全配置

第一次能聊通之后，不建议就这样结束，至少还要再做两件事。

### 1. 把自己的飞书账号加入 allowlist

一旦你完成 pairing，可以把自己的 `open_id` 写进：

```bash
FEISHU_ALLOWED_USERS=你的open_id
```

这样以后：

- 只有你自己能先使用这个 bot
- 即使 bot 被别人发现，也不会随便可用

Hermes 日志里通常可以看到你的用户 ID，例如：

```text
user=ou_xxx
```

### 2. 设置 `FEISHU_HOME_CHANNEL`

这会告诉 Hermes：

- 以后通知往哪里发
- cron 任务结果往哪里发
- 某些默认输出往哪个飞书会话发

可以手动写入：

```bash
FEISHU_HOME_CHANNEL=oc_xxx
```

也可以在飞书会话里对 bot 发送：

```text
/sethome
```

## 九、群聊中的行为规则

飞书群聊和私聊行为不同。

### 私聊

- Hermes 会处理你发送的每条消息

### 群聊

- 必须 `@机器人`
- 没有 `@` 时 Hermes 不处理
- 如果 `FEISHU_GROUP_POLICY=allowlist`，还会检查你是否在白名单里

所以群里“机器人没反应”最常见的原因不是坏了，而是：

- 没有 `@bot`
- 不在 allowlist
- 群策略是 `disabled`

## 十、我们这次真实接入时遇到的问题与解决方案

下面这些问题都是真实发生过的，第一次接入很容易遇到。

### 问题 1：以为 Hermes 不支持飞书

表面现象：

- 文档没第一时间看到飞书入口
- 怀疑 Hermes 只支持 Telegram / Discord / Slack

实际原因：

- 飞书支持是内建的，只是需要看对应的 `Feishu / Lark` 文档页

解决办法：

- 确认本地 Hermes 版本包含 `gateway/platforms/feishu.py`
- 查阅官方 Feishu/Lark 配置文档

### 问题 2：MiniMax 被错误配置成 custom provider

表面现象：

- 日志里出现 `404 Not Found`
- 或者一直请求失败

实际原因：

- 把 MiniMax 错配成了：
  - `provider: custom`
  - `base_url: https://api.minimaxi.com/anthropic`

解决办法：

- 改回 Hermes 内建 provider：

```yaml
model:
  default: MiniMax-M2.7
  provider: minimax-cn
```

- 并在 `.env` 中使用：

```bash
MINIMAX_CN_API_KEY=你的中国区MiniMax API Key
```

### 问题 3：模型名写成 `minimax 2.7`

表面现象：

- 日志里出现：

```text
minimax 2.7 is not a valid model ID
```

实际原因：

- 模型路由已经到了 MiniMax
- 但模型名不是 Hermes 这里要用的合法 ID

解决办法：

- 改成：

```yaml
default: MiniMax-M2.7
```

### 问题 4：飞书依赖没装

表面现象：

- 飞书配置看起来没问题
- 但 Gateway 启不来，或者 websocket 模式不可用

实际原因：

- Hermes 的 venv 中缺少：
  - `lark-oapi`
  - `websockets`

解决办法：

```bash
/Users/你的用户名/.hermes/hermes-agent/venv/bin/python3 -m ensurepip --upgrade
/Users/你的用户名/.hermes/hermes-agent/venv/bin/python3 -m pip install lark-oapi websockets
```

### 问题 5：Hermes 的 venv 里连 pip 都没有

表面现象：

- 执行安装依赖时报：

```text
No module named pip
```

解决办法：

先执行：

```bash
/Users/你的用户名/.hermes/hermes-agent/venv/bin/python3 -m ensurepip --upgrade
```

然后再安装依赖。

### 问题 6：Gateway 状态看起来不一致

表面现象：

- `hermes gateway restart` 提示成功
- 但 `hermes gateway status` 一度显示没加载

实际原因：

- launchd 状态刷新有延迟
- 或者服务刚 reload 完，状态输出和日志未完全同步

解决办法：

- 不只看 `status`
- 同时看 `~/.hermes/logs/gateway.log`

日志里只要出现：

```text
Connected in websocket mode (feishu)
```

就说明飞书实际已经连上。

### 问题 7：第一次发消息返回 pairing code

表面现象：

- 机器人不是正常回复，而是返回一串 pairing code

实际原因：

- 这是安全机制，不是错误

解决办法：

```bash
hermes pairing approve feishu 你的配对码
```

### 问题 8：刚连上时被判定为 Unauthorized user

表面现象：

- 日志里出现：

```text
Unauthorized user
```

实际原因：

- 你还没完成 pairing
- 或者还没把自己的 `open_id` 放进 `FEISHU_ALLOWED_USERS`

解决办法：

1. 先完成 pairing
2. 再把自己的 `open_id` 填入 allowlist

### 问题 9：机器人能私聊，但群里不回复

实际原因通常是：

- 没有 `@机器人`
- 群策略限制
- 用户不在白名单

解决办法：

- 群里明确 `@bot`
- 检查 `FEISHU_GROUP_POLICY`
- 检查 `FEISHU_ALLOWED_USERS`

## 十一、推荐的最终稳定配置

下面是一套适合中国区飞书、个人先用起来的推荐配置。

`~/.hermes/config.yaml`

```yaml
model:
  default: MiniMax-M2.7
  provider: minimax-cn
```

`~/.hermes/.env`

```bash
MINIMAX_CN_API_KEY=你的中国区MiniMax API Key
FEISHU_APP_ID=你的AppID
FEISHU_APP_SECRET=你的AppSecret
FEISHU_DOMAIN=feishu
FEISHU_CONNECTION_MODE=websocket
FEISHU_GROUP_POLICY=allowlist
FEISHU_ALLOWED_USERS=你的open_id
FEISHU_HOME_CHANNEL=你的chat_id
```

它的特点是：

- 配置简单
- 不需要公网 webhook
- 只有你自己能先使用
- 后续再扩展群聊、通知、定时任务都比较顺

## 十二、推荐排查顺序

如果接入失败，建议永远按这个顺序排查。

### 第 1 步：先确认模型是否工作

不要一上来就怀疑飞书。

先确认 Hermes 本身能正常调用模型。

### 第 2 步：确认 `.env` 变量是否填对

重点检查：

- `provider` 是否是 `minimax-cn`
- `default` 是否是 `MiniMax-M2.7`
- `MINIMAX_CN_API_KEY`
- `FEISHU_APP_ID`
- `FEISHU_APP_SECRET`
- `FEISHU_DOMAIN`
- `FEISHU_CONNECTION_MODE`

### 第 3 步：确认依赖是否在 Hermes venv 里

重点检查：

- `lark-oapi`
- `websockets`

### 第 4 步：重启 Gateway

```bash
hermes gateway restart
```

### 第 5 步：看日志，不要只看命令返回

重点看：

- `~/.hermes/logs/gateway.log`
- `~/.hermes/logs/gateway.error.log`

### 第 6 步：私聊 Bot 测试

第一次不要先在群里测。

### 第 7 步：处理 pairing

如果出现 pairing code，就批准它，不要误判为失败。

## 十三、给第一次使用者的建议

如果你是第一次用 Hermes Agent，我建议你按下面顺序做：

1. 先把 MiniMax 中国区模型配通
2. 再接飞书
3. 先用私聊验证
4. 完成 pairing
5. 再把自己的 `open_id` 写进 allowlist
6. 再设置 `home channel`
7. 最后再去考虑群聊、cron、更多渠道

这样最不容易绕晕。

## 十四、常用命令速查

### 查看 Hermes 版本

```bash
hermes version
```

### 查看配置摘要

```bash
hermes dump
```

### 测试 MiniMax 中国区模型

```bash
hermes chat -Q -q "Reply with exactly: ok" --provider minimax-cn -m MiniMax-M2.7
```

### 检查环境

```bash
hermes doctor
```

### 启动 Gateway

```bash
hermes gateway start
```

### 重启 Gateway

```bash
hermes gateway restart
```

### 查看 Gateway 状态

```bash
hermes gateway status
```

### 审批飞书配对码

```bash
hermes pairing approve feishu 配对码
```

### 查看已批准用户

```bash
hermes pairing list
```

## 十五、文档结论

Hermes Agent 接入飞书并不复杂，但第一次配置最容易卡在以下几个点：

- MiniMax provider 配错成 custom
- 模型名写成 `minimax 2.7`
- 误以为 Hermes 不支持飞书
- 只配了 `.env`，却没装飞书依赖
- 依赖装错 Python 环境
- 收到 pairing code 时误判为错误
- 忘记设置 allowlist 和 home channel

只要你按本文步骤走，尤其是：

- 先把 `minimax-cn + MiniMax-M2.7 + MINIMAX_CN_API_KEY` 配通
- 用 `websocket`
- 依赖装到 Hermes 的 venv
- 先私聊
- 完成 pairing
- 再补 allowlist 和 home channel

通常都可以顺利接通。

如果你要把这份文档分享给团队成员，建议同时提醒他们：

- 不要在文档里保存真实 `App Secret`
- 不要把真实 `open_id`、`chat_id`、API Key 直接公开
- 分享时统一改成占位符
