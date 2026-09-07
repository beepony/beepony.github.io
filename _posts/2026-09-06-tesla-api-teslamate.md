---
layout: post
title: "Tesla 直连 API 的文档与资料源（官方 + 社区 + TeslaMate 里的逆向证据）"
date: 2026-09-06 09:00:00 +0800
description: |
  做自己的特斯拉 App 时，**TeslaMate 不能告诉你"怎么发命令给车"**——它只读数据 + 控制自家日志启停。要触发解锁、开空调、鸣笛等命令，或者拿到 TeslaMate 没暴露的字段，必须直连 Tesla API。
  下面把能找到 Tesla API 文档的**所有正规渠道**列清楚，每条都标了"能拿到什么 / 适合什么场景"。
tags: [tesla, api, fleet-api, owner-api, streaming, oauth, mqtt, teslamate]
---

# Tesla 直连 API 的文档与资料源

> 做自己的特斯拉 App 时，**TeslaMate 不能告诉你"怎么发命令给车"**——它只读数据 + 控制自家日志启停。要触发解锁、开空调、鸣笛等命令，或者拿到 TeslaMate 没暴露的字段，必须直连 Tesla API。
> 下面把能找到 Tesla API 文档的**所有正规渠道**列清楚，每条都标了"能拿到什么 / 适合什么场景"。

---

## 0. 顶层结论（先看这张表）

| 你想做的事 | 用哪个 API | 文档在哪里 |
| --- | --- | --- |
| 读车辆状态（电池/位置/温度/门窗…） | **Owner API**（默认）或 **Fleet API vehicle_data** | 见 §1 |
| **实时** 数据（秒级） | **Owner Streaming**（WebSocket，OAuth 模式）或 **Fleet Telemetry**（PubSub，最少 1 分钟） | 见 §2 |
| 触发命令（解锁/开空调/鸣笛/寻车/充电控制/召唤…） | **Owner API commands** 或 **Fleet API commands** | 见 §3 |
| 注册 App、申请 OAuth client_id | **Tesla Developer Portal** | §1.1 |
| OAuth 登录流程（PKCE / SSO） | `auth.tesla.com/oauth2/v3` | §1.2 |
| 不知道字段在哪、看不懂返回结构 | 逆向 TeslaMate 的 `tesla_api/` 目录 | 见 §5 |
| 想走捷径、不想自己搞 OAuth | **第三方代理**（MyTeslaMate、Teslemetry） | §4 |

---

## 1. 官方 API（最权威，但分散在三个地方）

### 1.1 Tesla Developer Portal（注册 + 文档总入口）

- **URL**：https://developer.tesla.com
- 注册一个 Tesla 账号，进入"Apps" 创建一个第三方应用，得到：
  - `client_id` / `client_secret`
  - 一个"tagged"应用，可申请 Fleet API / Telemetry 权限
- **文档中心**（登录后才能完整看）：https://developer.tesla.com/docs
  - **Fleet API**：https://developer.tesla.com/docs/fleet-api
    - 涵盖 OAuth、命令、车辆数据、`vehicle_data` 端点列表
  - **Fleet Telemetry**：https://developer.tesla.com/docs/fleet-telemetry
    - PubSub 模式，最低 1 分钟一次（不能秒级！）
  - **Vehicle Command Protocol**：https://developer.tesla.com/docs/vehicle-command/vehicle-command
    - 描述命令的底层 mTLS + HTTP 协议（Fleet API 命令最终走这个）
- **Membership Levels / 限流**：https://developer.tesla.com/docs/fleet-api#membership-levels
  - 关键：免费 tier 限制 `vehicle_data` 的轮询次数（一般几小时 1 次）；超过会被限流到 24h 1 次

### 1.2 OAuth 2.0 登录端点（Auth）

来自 TeslaMate 源码 `lib/tesla_api/auth.ex`，**官方文档写得非常隐晦**，这里整理出来：

| 端点 | 用途 |
| --- | --- |
| `https://auth.tesla.com/oauth2/v3` | 全球用户 OAuth 2.0 端点 |
| `https://auth.tesla.cn/oauth2/v3` | 中国用户（`TESLA_AUTH_HOST` 环境变量可切换） |
| `client_id = ownerapi` | Owner API 时代的"老" client_id，TeslaMate 还在用 |
| `redirect_uri = https://auth.tesla.com/void/callback` | TeslaMate 内部 OAuth 回调 |
| `scope = openid email offline_access vehicle_device_data vehicle_cmds vehicle_charging_cmds vehicle_location` | 必需 scope（具体见 Fleet API 文档） |

OAuth 流程：
1. **浏览器登录**（PKCE code flow）：`https://auth.tesla.com/oauth2/v3/authorize?...`
2. **回调拿到 code**，POST 到 `/oauth2/v3/token` 换 `access_token` + `refresh_token`
3. `access_token` 寿命约 **8 小时**；`refresh_token` 寿命约 **3 个月**
4. 过期前主动用 `refresh_token` POST `/oauth2/v3/token` 续期

> **注意**：Tesla 在 2023 年开始推 **Fleet API**，旧的 Owner API 客户端（`ownerapi`）**不再被新 App 注册**。但是已经有 token 的 App（包括 TeslaMate）可以继续用——这就是为什么 TeslaMate 同时支持两种模式（看 `lib/tesla_api/middleware/fleet_auth.ex`）。

### 1.3 官方 API 域名表（按区域）

来自 TeslaMate `lib/tesla_api/auth.ex` + `lib/tesla_api/vehicle.ex`：

| 区域 | Owner / Fleet API 主机 | Streaming WebSocket |
| --- | --- | --- |
| 全球（北美、欧、亚） | `https://owner-api.teslamotors.com` | `wss://streaming.vn.teslamotors.com/streaming/` |
| 中国 | `https://owner-api.vn.cloud.tesla.cn` | `wss://streaming.vn.cloud.tesla.cn/streaming/` |
| Fleet API（NA） | `https://fleet-api.prd.na.vn.cloud.tesla.com` | - |
| Fleet API（EU） | `https://fleet-api.prd.eu.vn.cloud.tesla.com` | - |
| Fleet API（CN） | `https://fleet-api.prd.cn.vn.cloud.tesla.cn` | - |

判断逻辑：解码 access_token 的 JWT，看 `iss`（issuer）的 TLD，是 `cn` 就是中国，否则全球。

---

## 2. Owner Streaming（WebSocket 秒级数据，**最值得用**）

> 这部分是 Tesla 官方文档**没完整写**的，但 TeslaMate 通过逆向工程稳定使用了 5+ 年，是**做"实时显示 App"的关键**。

### 2.1 WebSocket 端点

```
wss://streaming.vn.teslamotors.com/streaming/
```

### 2.2 协议（来自 TeslaMate `lib/tesla_api/stream.ex`，已确认可用）

**建立连接后**立刻发一帧订阅消息（JSON）：

```json
{
  "msg_type": "data:subscribe_oauth",
  "token": "<access_token>",
  "value": "speed,odometer,soc,elevation,est_heading,est_lat,est_lng,power,shift_state,range,est_range,heading",
  "tag": "<vehicle_id>"
}
```

订阅的列（**12 个字段**，顺序固定）：

| 列名 | 含义 | 单位 |
| --- | --- | --- |
| `speed` | 车速 | mph |
| `odometer` | 累计里程 | mi |
| `soc` | State of Charge（电池百分比） | % |
| `elevation` | 海拔 | m |
| `est_heading` | 估算航向（GPS 计算） | ° |
| `est_lat` | 估算纬度 | ° |
| `est_lng` | 估算经度 | ° |
| `power` | 实时功率（正=放电，负=充电） | kW |
| `shift_state` | 档位 | `P` / `D` / `N` / `R` / `""` |
| `range` | 标称续航（电池百分比对应的） | mi |
| `est_range` | 估算续航 | mi |
| `heading` | 罗盘航向 | ° |

> **注意单位**：streaming 返回的是 **英制**（mph/mi），而 Owner API 的 `vehicle_data` 是 **公制**（km/h/km）。两边都对得上，自己乘 `0.621371` / `1.60934` 即可。

**收到数据**：每帧格式是 `data: <csv>`，列顺序与订阅字符串一致，例如：

```
data: 45,12345.6,82,120,180,37.7749,-122.4194,-12,P,250,238,180
```

**TeslaMate 解析示例**（`lib/tesla_api/stream.ex` `decode_frame!/1`）：

```elixir
Enum.zip([:time | @columns], String.split(value, ","))
|> Enum.into(%Map{})
```

### 2.3 退订 + 心跳

- 退订：`{"msg_type": "data:unsubscribe", "tag": "<vid>"}`
- 心跳：服务端 `control:hello` 帧携带 `connection_timeout`（秒），客户端必须在此之前有任何动作（不然会被断）
- 错误帧：`data:error`，`error_type` ∈ `vehicle_disconnected` / `vehicle_error` / `client_error`

### 2.4 与 Fleet Telemetry 的取舍

| 维度 | Owner Streaming | Fleet Telemetry |
| --- | --- | --- |
| 频率 | **1 Hz**（实际 1-5 秒） | 最低 **1 分钟**（按你配置的字段） |
| 协议 | WebSocket（双向） | Google PubSub 推送（单向） |
| 部署复杂度 | 中（要保活 WebSocket） | 高（要 GCP PubSub + 公网回调） |
| Tesla 官方推荐 | 过渡方案 | 新方案 |
| **个人 App 推荐** | ✅ **是** | 跑路用 |
| 字段丰富度 | 12 个核心字段 | 可配置 100+ 个字段 |

→ **做手机 App / 个人项目首选 Owner Streaming**。Fleet Telemetry 适合"公司级 / 多车批量监控"。

---

## 3. Owner API 命令端点（解锁/开空调等）

> **Tesla 官方**：Fleet API 文档里"Commands" 章节（https://developer.tesla.com/docs/fleet-api#commands）——需要 Fleet API 注册 + 走 Vehicle Command Protocol（mTLS + 私钥签名）。
>
> **Owner API（TeslaMate 用的非官方接口）**：命令端点**没有官方文档**，是社区多年来从 Tesla App 反向工程出来的。

### 3.1 Owner API 命令端点（社区共识）

> 这些端点 Tesla 没明确文档化，随时可能改。但**至今（2026 年）仍在用**。

```
POST /api/1/vehicles/{id}/command/{command_name}
```

常见命令（来自 TeslaMate 之外的社区项目 `tesla-api` Python 库，以及多个 GitHub Issue 共识）：

| 命令 | 作用 | 必需参数 |
| --- | --- | --- |
| `wake_up` | 唤醒车辆 | - |
| `lock` / `unlock` | 锁车 | - |
| `honk_horn` | 鸣笛 | - |
| `flash_lights` | 闪灯 | - |
| `climate_start` / `climate_stop` | 开/关空调 | - |
| `set_temps` | 设置温度 | `driver_temp`, `passenger_temp` |
| `set_preconditioning_max` | "MAX" 模式 | - |
| `auto_conditioning_start` / `stop` | 自动空调 | - |
| `charge_start` / `charge_stop` | 开始/停止充电 | - |
| `set_charge_limit` | 设置充电上限 | `percent` |
| `set_charging_amp` | 设置充电电流 | `charging_amps` |
| `charge_port_door_open` / `close` | 充电口盖 | - |
| `actuate_trunk` | 打开后备箱（部分车型） | `which_trunk` |
| `remote_start_drive` | 远程启动 | `password` |
| `share` | 分享车机导航/数据 | - |
| `schedule_software_update` | 预约 OTA | `scheduled_time` |
| `cancel_software_update` | 取消预约 | - |
| `media_toggle_playback` / `next_track` / `prev_track` / `volume_up` / `volume_down` | 媒体控制 | - |
| `trigger_homelink` | 触发 Homelink（车库门） | `lat`, `lon` |
| `set_sentry_mode` | 哨兵模式 | `on` |
| `set_valet_mode` | 代客模式 | `on`, `password` |
| `reset_valet_pin` | 重置代客密码 | - |
| `speed_limit_set_limit` | 限速 | `limit_mph` |
| `speed_limit_activate` / `deactivate` / `clear_pin` | 限速控制 | - |
| `enable_calendar_sync` | 同步日历 | - |
| `add_favorite` / `remove_favorite` | 收藏点 | `id` (favorite id) |

> ⚠️ **警告**：这些端点**没有 SLA**。Tesla 可能随时改、删、限流。生产环境用 Fleet API 命令接口。

### 3.2 Fleet API 命令（官方但复杂）

走 **Vehicle Command Protocol**：
1. 生成 ECDSA P-256 密钥对，私钥自存
2. 在 Tesla Developer Portal 把公钥绑定到 App
3. 车主在 Tesla App 收到 "Pairing Request"，同意后产生 signed "vehicle command authorization"
4. 之后每个命令 = HTTP POST 到 `https://fleet-api.prd.<region>.vn.cloud.tesla.com/api/1/vehicles/{id}/command/<cmd>` + HTTP body 里包含 **经过私钥签名的 JWT 消息**

详细规范：https://developer.tesla.com/docs/vehicle-command/vehicle-command
参考实现：https://github.com/teslamotors/vehicle-command

---

## 4. 第三方代理（**最省事的方案**）

如果不想自己搞 OAuth + 命令签名 + 公网回调，第三方已经做完了：

### 4.1 MyTeslaMate（免费，最接近 TeslaMate 风格）

- 官网：https://www.myteslamate.com
- 注册后获得 `TOKEN`，直接调 `https://api.myteslamate.com/...`
- 它也把 Fleet Telemetry 重新打包成 Owner-style WebSocket（项目：https://github.com/MyTeslaMate/websocket）
- **优点**：免费、接口简单、和 TeslaMate 兼容
- **缺点**：依赖第三方服务可用性、自己数据被别人看到

### 4.2 Teslemetry（付费）

- 官网：https://teslemetry.com
- 按使用量付费（`vehicle_data` 是 pay-per-call）
- 提供**自己配的** Fleet API endpoint + 自家的 streaming
- ⚠️ **重要**：Teslemetry 的 streaming **不兼容 TeslaMate**，用了就得关掉 TeslaMate 自己的 streaming（见 `website/docs/configuration/api.md`）

---

## 5. TeslaMate 仓库里的"逆向证据"清单

> 这是**最关键的隐藏资源**。TeslaMate 把所有 Tesla API 调用都写在 `lib/tesla_api/` 里，**整个目录就是一份逆向文档**。

### 5.1 完整文件索引

| 文件 | 内容 | 用途 |
| --- | --- | --- |
| `lib/tesla_api.ex` | 基础 HTTP client（Tesla + Finch） | 看 User-Agent、base URL |
| `lib/tesla_api/auth.ex` | OAuth 客户端 + 区域判断 | 看 `auth.tesla.com` 端点、区域检测逻辑（JWT iss 解码） |
| `lib/tesla_api/auth/refresh.ex` | refresh_token 续期 | 看 `/oauth2/v3/token` 请求体 |
| `lib/tesla_api/stream.ex` | **WebSocket streaming 实现** | 看订阅协议、列名、心跳 |
| `lib/tesla_api/vehicle.ex` | `/api/1/products`、`/api/1/vehicles/{id}`、`/vehicle_data` | 看读数据端点 |
| `lib/tesla_api/vehicle/state.ex` | 车辆 state 字段定义 | **最完整的字段字典**——所有 Owner API 返回字段都在这里 |
| `lib/tesla_api/middleware/fleet_auth.ex` | Fleet API token 切换 | 看 `qts-`/`eu-`/`cn-` token 前缀的来源 |
| `lib/tesla_api/middleware/token_auth.ex` | Owner API bearer token | 看 `Authorization: Bearer ...` 怎么注入 |
| `lib/tesla_api/error.ex` | 错误码定义 | 看 `unauthorized` / `vehicle_not_found` / `vehicle_in_service` / `too_many_request` / `timeout` |

### 5.2 关键 State 字段表

`lib/tesla_api/vehicle/state.ex` 定义了 `Charge` / `Climate` / `Drive` / `VehicleConfig` / `VehicleState` 五个模块，每个模块就是一个字段表。**和 Owner API `/vehicle_data` 返回的字段一一对应**。

例如 `VehicleState.result/1` 包含：
- `api_version`、`autopark_state_v2`、`autopark_style`、`calendar_supported`、`car_version`、`car_type`、`center_display_state`、`dark_rims`、`df`/`dr`/`pf`/`pr`（门状态）、`driven_enforced`、`exterior_color`、`fd_window`/`fp_window`/`rd_window`/`rp_window`（车窗）、`ft`/`rt`（前后备箱）、`homelink_device_count`、`homelink_enabled`、`is_user_present`、`last_autopark_error`、`locked`、`media_state`、`notifications_supported`、`odometer`、`parsed_calendar_supported`、`perf_config`、`pin_to_drive_enabled`、`rt`/`ft`、`seat_heater_left`/`right`、`sentry_mode`、`service_mode`、`spoiler_type`、`sun_roof_installed`、`sun_roof_state`、`sun_roof_percent_open`、`third_row_seats`、`time_to_full_charge`、`tpms_pressure_fl/fr/rl/rr`、`tpms_soft_warning_*`、`valet_mode`、`vehicle_name`、`wheel_type`、`software_update.{status,version,download_perc,install_perc,...}`...

→ **完整字段表以这个文件为准**。一份文件抵 10 篇博客文章。

### 5.3 URL / 路径速查

来源：TeslaMate `lib/tesla_api/vehicle.ex` + 官方文档交叉验证：

| 用途 | 路径 |
| --- | --- |
| 列出所有产品（车 + 能源产品） | `GET /api/1/products` |
| 列出我的车 | `GET /api/1/vehicles`（从 `/products` 过滤 `vehicle_id` 字段） |
| 车辆基本信息 | `GET /api/1/vehicles/{id}` |
| 车辆完整状态（charge/climate/drive/vehicle_config/vehicle_state 等） | `GET /api/1/vehicles/{id}/vehicle_data?endpoints=charge_state;climate_state;closures_state;drive_state;gui_settings;location_data;vehicle_config;vehicle_state;vehicle_data_combo` |
| 单个端点（更快） | `GET /api/1/vehicles/{id}/data/{endpoint_name}` |
| 近距离数据 | `GET /api/1/vehicles/{id}/data_request/{nearby_sites,charge_history,...}` |
| 移动近场召唤 | `GET /api/1/vehicles/{id}/data_request/drive_state_v2` |
| 命令 | `POST /api/1/vehicles/{id}/command/{cmd_name}`（body 看 §3.1） |
| 分享 | `POST /api/1/vehicles/{id}/share` |
| 移动状态 | `GET /api/1/vehicles/{id}/mobile_enabled` |

---

## 6. 社区生态（看这里能"摸到"最新动态）

| 资源 | URL | 价值 |
| --- | --- | --- |
| **`teslamate-org/teslamate`** | https://github.com/teslamate-org/teslamate | 逆向实现的参考实现 |
| **`teslamotors/vehicle-command`** | https://github.com/teslamotors/vehicle-command | 官方命令协议 + Go SDK |
| **`teslamotors/fleet-telemetry`** | https://github.com/teslamotors/fleet-telemetry | 官方 telemetry 服务的 Go 实现（看 dispatchers） |
| **`MyTeslaMate/websocket`** | https://github.com/MyTeslaMate/websocket | 把 Fleet Telemetry 重新打包成 Owner streaming 协议的项目 |
| **`timdorr/tesla-api`** | https://github.com/timdorr/tesla-api | 经典的 Tesla API 文档（2020 年起，最全的"非官方文档"）——但 Tesla 改过多次，**部分已过时** |
| **`Python tesla-api` lib** | https://github.com/tdorssers/TeslaPy | Python 库，最近还在更新 |
| **`TeslaMate Discord / Forum`** | https://discord.gg/teslamate | 任何 API 变更，最早在这里有人贴 issue |
| **`developer.tesla.com forums`** | https://forums.tesla.com/categories/developer | 官方回复（慢） |

---

## 7. 给"做自己 App"的实操建议

### 7.1 最小可行方案（个人玩具）

```bash
# 1. 注册：https://developer.tesla.com → 创建 App，记下 client_id
# 2. 用 PKCE 流程登录（timdorr/tesla-api 文档有图解）
# 3. 拿 access_token 调：

curl -H "Authorization: Bearer $TOKEN" \
     "https://owner-api.teslamotors.com/api/1/vehicles"
# → 列出车

curl -H "Authorization: Bearer $TOKEN" \
     "https://owner-api.teslamotors.com/api/1/vehicles/$ID/data_request/charge_state"
# → 电池状态（最低频次 API，更宽松的限流）

# 4. 接 WebSocket：
wscat -c wss://streaming.vn.teslamotors.com/streaming/
# 发：{"msg_type":"data:subscribe_oauth","token":"...","value":"speed,soc,est_lat,est_lng","tag":"$VID"}
# 收：data: 0,12345.6,82,...,...
```

### 7.2 生产 App 选型

| 阶段 | 方案 | 原因 |
| --- | --- | --- |
| MVP / 个人 | **Owner API + Owner Streaming** | 直接、不绕弯、限流够用 |
| 付费产品 | **Fleet API + Fleet Telemetry** | 官方、稳定、有 SLA |
| 不愿意养基础设施 | **MyTeslaMate / Teslemetry 代理** | 直接拿 JSON，不用管 OAuth/mTLS/PubSub |
| 想监控**别人**的车（车队） | **Fleet API** + 自己署 Telemetry 服务器 | 唯一合法方案 |

### 7.3 必须看的"法律 / 风险" 红线

- Tesla **不正式支持**第三方 App 调用 Owner API（这是逆向的）——理论上 Token 随时可能失效。
- **不要**用 Tesla 账号干自动化营销 / 抓取所有用户数据。
- **不要**绕过命令签名（Vehicle Command Protocol 是为了防劫持）。
- Fleet API 有明确的 ToS，注册时仔细看。
- 流式 API 频率高了会被 429（限流），TeslaMate 内部做了指数退避（见 `lib/tesla_api/stream.ex` 的 `exp_backoff_ms/2`）——**自己的 App 一定要加这个**。

---

## 8. 速查：URL / 端点 / 库（粘到笔记里随时翻）

```text
─────────────────────────────────────────────
OAuth / Auth
  https://auth.tesla.com/oauth2/v3/authorize  (PKCE flow)
  https://auth.tesla.com/oauth2/v3/token      (token / refresh)
  client_id (Owner API, 老):  ownerapi
  client_id (Fleet API, 新):  <your-app-client-id>
  scopes: openid email offline_access vehicle_device_data vehicle_cmds vehicle_charging_cmds vehicle_location

─────────────────────────────────────────────
Owner / Fleet REST API hosts
  Global:  https://owner-api.teslamotors.com
  China:   https://owner-api.vn.cloud.tesla.cn
  Fleet NA: https://fleet-api.prd.na.vn.cloud.tesla.com
  Fleet EU: https://fleet-api.prd.eu.vn.cloud.tesla.com
  Fleet CN: https://fleet-api.prd.cn.vn.cloud.tesla.cn

─────────────────────────────────────────────
Read endpoints (Owner style)
  GET /api/1/products
  GET /api/1/vehicles
  GET /api/1/vehicles/{id}
  GET /api/1/vehicles/{id}/vehicle_data?endpoints=charge_state;...;vehicle_state
  GET /api/1/vehicles/{id}/data_request/{charge_state,climate_state,drive_state,vehicle_state,gui_settings,location_data,vehicle_config,closures_state,nearby_sites,...}

─────────────────────────────────────────────
Command endpoints (Owner style, undocumented, may break)
  POST /api/1/vehicles/{id}/command/{wake_up,lock,unlock,honk_horn,flash_lights,
       climate_start,climate_stop,set_temps,set_preconditioning_max,
       auto_conditioning_start,auto_conditioning_stop,
       charge_start,charge_stop,set_charge_limit,set_charging_amp,
       charge_port_door_open,charge_port_door_close,
       actuate_trunk,remote_start_drive,
       media_toggle_playback,media_next_track,media_prev_track,
       media_volume_up,media_volume_down,
       trigger_homelink,set_sentry_mode,set_valet_mode,reset_valet_pin,
       speed_limit_set_limit,speed_limit_activate,speed_limit_deactivate,
       schedule_software_update,cancel_software_update,
       share,add_favorite,remove_favorite,enable_calendar_sync}

─────────────────────────────────────────────
Streaming (Owner style, seconds-level)
  wss://streaming.vn.teslamotors.com/streaming/
  Send: {"msg_type":"data:subscribe_oauth","token":"<access_token>",
         "value":"speed,odometer,soc,elevation,est_heading,est_lat,est_lng,
                  power,shift_state,range,est_range,heading",
         "tag":"<vehicle_id>"}
  Recv: data: <csv with 12 values in same order, prefixed by timestamp>

─────────────────────────────────────────────
Telemetry (Fleet style, minutes-level)
  https://developer.tesla.com/docs/fleet-telemetry
  → GCP PubSub → 你的 webhook → 你的 App
─────────────────────────────────────────────
```

---

## 9. 参考源码位置（汇总）

| 内容 | 路径（TeslaMate 仓库） |
| --- | --- |
| HTTP client | `lib/tesla_api.ex` |
| OAuth 流程 | `lib/tesla_api/auth.ex`、`lib/tesla_api/auth/refresh.ex` |
| Fleet vs Owner 切换 | `lib/tesla_api/middleware/fleet_auth.ex`、`lib/tesla_api/middleware/token_auth.ex` |
| `/api/1/products`、`/vehicles`、`/vehicle_data` | `lib/tesla_api/vehicle.ex` |
| **完整字段字典（必看）** | `lib/tesla_api/vehicle/state.ex` |
| **Streaming 协议** | `lib/tesla_api/stream.ex` |
| 官方文档（中文翻译后的摘要） | `website/docs/configuration/api.md` |

