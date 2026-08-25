---
layout: post
title: "Kindle Paperwhite 一代越狱、修复与 KOReader 恢复手册"
date: 2026-08-25 09:00:00 +0800
description: "PW1（5.6.1.1）从 5.4.4 Legacy Jailbreak、BRIDGE+、Universal Hotfix 到 KUAL 与 KOReader 的实机验证恢复流程。"
tags: [Kindle, Paperwhite, KOReader, 越狱, 电子阅读]
---

# 结论与适用范围

这是一台 **Kindle Paperwhite 一代（PW1，2012）**，最终运行 `Kindle 5.6.1.1 (268989 035)`。本次已经实机验证以下结果：

- Legacy K5 Jailbreak 可在官方固件 `5.4.4` 上安装；
- 再升级到官方 `5.6.1.1` 时，开机出现 `BRIDGE+`，说明越狱桥接仍存活；
- 安装 **Universal Hotfix** 并运行 `Run Hotfix` 后，KUAL 的“未经授权开发人员签名”错误消失；
- KUAL 可启动，且 KOReader 可从 KUAL 中启动。

本手册只适用于 **PW1 + 5.6.1.1**。不要把其中的 `.bin` 更新包用于其他型号；即便名称很像也不行。

## 最终推荐的恢复顺序

```text
备份 USB 存储区
  → 降级至 5.4.4
  → Legacy K5 Jailbreak
  → 升级回官方 5.6.1.1（看到 BRIDGE+）
  → Universal Hotfix + Run Hotfix
  → 安装 KUAL KDK 与 KOReader
  → 从 KUAL 启动 KOReader
```

这是本机最终证实可行的顺序。不要在 `5.4.4` 阶段因为 KUAL 报签名错误而反复重装或刷别的包；直接按照“升级 5.6.1.1 → Hotfix”的修复路径处理。

# 0. 总原则（必须遵守）

1. **始终开启飞行模式。** 避免 Amazon 自动 OTA 更新覆盖越狱环境。
2. Kindle 根目录一次只能放 **一个** 用于“更新 Kindle”的 `.bin` 文件。更新前用电脑确认；其余 `.bin` 全部移走。
3. 每次复制后必须安全弹出；不要在 Kindle 更新、重启或显示进度条时拔线/按电源。
4. 只使用下面列出的来源和型号匹配的文件。不要用 PW2/PW3/新款 Paperwhite 的包。
5. 每一个关键文件在电脑端和 Kindle 端各算一次 SHA-256；两者必须一致。
6. 更新界面卡住、出现非预期错误、或“更新 Kindle”不可点时，**不要连续重试**。先拍照记录、拔线并停在当前状态，再排查。
7. 电量建议至少 50%，并接上可靠 USB 线。强制重启（长按电源约 40 秒）只用于设备真正无响应，不是正常安装步骤。

> [!warning]
> 越狱、降级和非官方更新均有风险。最常见的可避免风险不是文件本身，而是拿错机型、根目录混有多个更新包、拷贝未完成就拔线、或在设备正在写系统时中断。

# 1. 识别设备与备份

连接 USB 后，确认 Kindle 作为磁盘挂载。macOS 通常是 `/Volumes/Kindle`。

读取版本文件：

```sh
sed -n '1,5p' /Volumes/Kindle/system/version.txt
```

本机应显示：

```text
Kindle 5.6.1.1 (268989 035)
```

先完整备份 Kindle 用户可见的 USB 存储区，至少保留：

- `documents/`（图书、KUAL 文件）
- `extensions/`（KOReader 扩展）
- `koreader/`（KOReader 主程序与设置）
- `system/`（仅作状态记录；不要手工覆盖回去）

本次操作已有两份本地备份：

- `device-backups/pw1-pre-jailbreak-20260823`
- `device-backups/pw1-pre-5.6.1.1-20260823`

恢复图书、KOReader 设置时只从备份还原用户目录，**不要**把旧的 `system/` 整个覆盖回 Kindle。

# 2. 已验证的关键文件清单

下表记录本次实际使用并校验过的文件。未来重新下载时，若上游发布新版本，哈希可能变化；此时应停下，确认来源与新版本说明，不能仅凭文件名继续。

| 用途 | 文件/来源 | 本次已验证的大小与 SHA-256 |
|---|---|---|
| 降级到 5.4.4 | [Amazon 官方 5.4.4](https://s3.amazonaws.com/G7G_FirmwareUpdates_WebDownloads/update_kindle_5.4.4.bin) | SHA-256 `a423c81903fcba48b0b9f9d5b9ce06503dc00eab468c02d0cf6adb05d2ade3a8` |
| Legacy 越狱 | [K5 Jailbreak](https://kindlemodding.org/jailbreaking/Legacy/K5-Jailbreak/kindle-5.4-jailbreak.zip) | ZIP SHA-256 `b4bb064df53eb708c762364a55cc9478648ea347c11c92e2e771f5a0b20d1824` |
| 回升 5.6.1.1 | [Amazon 官方 5.6.1.1](https://s3.amazonaws.com/G7G_FirmwareUpdates_WebDownloads/update_kindle_5.6.1.1.bin) | 217,523,739 字节；SHA-256 `6be62d30df26894b08083dbc55d23774756710c3a44c9a1d0075dd02d12090c9` |
| 更新后修复 | [Universal Hotfix（官方 Releases）](https://github.com/KindleModding/Hotfix/releases/latest) 的 `Update_hotfix_universal.bin` | 本次：3,743,762 字节；SHA-256 `94d5c05254b70c4905392515411f620168ac238db62c7dcbc48a1e31d5de6c59` |
| KUAL | [KUAL 官方快照](https://storage.gra.cloud.ovh.net/v1/AUTH_2ac4bfee353948ec8ea7fd1710574097/mr-public/KUAL/KUAL-v2.7.37-gfcb45b5-20250419.tar.xz) 中的 `KUAL-KDK-2.0.azw2` | 文件 SHA-256 `1d7cf02741be9e8f9c541af4eb5e1a97c00ab158819236749dba9250ad1fd4a9` |
| KOReader | [KOReader Kindle 版 v2026.07.1](https://github.com/koreader/koreader/releases/download/v2026.07.1/koreader-kindle-v2026.07.1.zip) | ZIP SHA-256 `1fa9cc2784ffa42eaa309445d4e81661f825614c9c32349554fed6e4c8757a1d` |

检查命令：

```sh
shasum -a 256 文件名
shasum -a 256 /Volumes/Kindle/文件名
```

`.bin` 文件的前 4 个字节应为 `SP01`，但这只能说明其为 Kindle 更新包格式，**不能代替型号与哈希校验**：

```sh
xxd -l 16 文件名.bin
```

# 3. 完整重建流程

## 3.1 降级到官方 5.4.4

目的：Legacy K5 Jailbreak 的已验证入口在 5.4.4。

1. 保持飞行模式，完成第 1 节备份。
2. 下载并校验 `update_kindle_5.4.4.bin`。
3. Kindle 根目录确认没有其他 `.bin`：

   ```sh
   find /Volumes/Kindle -maxdepth 1 -type f -name '*.bin' -print
   ```

4. 将该文件直接复制到 Kindle 根目录，**不要**放进 `documents` 或子文件夹。
5. 重新计算 Kindle 上该文件的 SHA-256，一致后安全弹出。
6. 在 Kindle 上：设置 → 菜单 → **更新 Kindle**。
7. 等待它自动重启；重新连接后，在 `system/version.txt` 确认：

   ```text
   Kindle 5.4.4 (225838 026)
   ```

若版本没有变更，先确认更新包是否仍在根目录、是否完整、菜单是否确实执行了更新。不要用不明“强刷”工具或其他机型包补救。

## 3.2 在 5.4.4 安装 Legacy K5 Jailbreak

1. 下载并校验 `kindle-5.4-jailbreak.zip`。
2. 解压后，将压缩包内的内容直接复制到 Kindle 根目录。必须包含这 7 个条目：

   ```text
   Update_jb_$(cd mnt && cd us && sh jb.sh).bin
   bridge.conf
   bridge.sh
   developer.keystore
   gandalf
   jb.sh
   json_simple-1.1.jar
   ```

   > [!important]
   > `Update_jb_$(cd mnt && cd us && sh jb.sh).bin` 的文件名含 `$()`；它是正常文件名，不能改名、不能让 Shell 展开，也不能套进额外目录。

3. macOS 向 FAT 格式 Kindle 拷贝时可能生成 `._` 文件。删除这些 AppleDouble 附属文件后再继续；真正的 7 个文件内容不能删。
4. 再次确认根目录只有这个越狱 `.bin`，安全弹出。
5. Kindle：设置 → 菜单 → **更新 Kindle**。安装画面会出现 `**** JAILBREAK ****`。
6. 等自动重启，并重新连接检查 USB 根目录已被清理。这表示本次越狱安装阶段正常结束。

## 3.3 立即升级回官方 5.6.1.1，保留越狱桥接

这是修复 PW1 新版 KUAL 开发者签名兼容性的关键步骤，不是可省略的“普通升级”。

1. 在 5.4.4 越狱完成后，再做一次 USB 存储区备份。
2. 下载、校验官方 `update_kindle_5.6.1.1.bin`。本次文件大小必须为 217,523,739 字节，且哈希见第 2 节。
3. Kindle 根目录只留这一个官方升级 `.bin`，从 Kindle 端再校验哈希。
4. 安全弹出后执行：设置 → 菜单 → **更新 Kindle**。
5. 等待自动更新、重启。启动中看到 **`BRIDGE+`** 是本机所需的成功信号：系统升级成功，而且越狱桥接跨过了升级。
6. 重连 USB，确认版本为 `Kindle 5.6.1.1 (268989 035)`。

> [!warning]
> 看到 `BRIDGE+` 后不要再继续升级任何系统固件，也不要联网让系统自动更新。接下来立刻安装 Hotfix。

## 3.4 安装 Universal Hotfix 并运行 Run Hotfix

目的：在 5.6.1.1 上恢复/安装更新后的热修复和开发者证书，使 KUAL 能被系统授权。

1. 下载官方 Releases 中的 `Update_hotfix_universal.bin`，并核对版本、大小、哈希。本次安装的哈希见第 2 节。
2. Kindle 根目录只放这个 `.bin`；完整复制、在设备端重新算 SHA-256 后安全弹出。
3. Kindle：设置 → 菜单 → **更新 Kindle**。
4. 等它完成并重启。
5. 图书馆会出现 **Run Hotfix**。打开它，让操作完成。不要在它运行期间重启。

这一步完成后，原本显示“本内容未经授权开发人员签名，请联系开发人员”的 KUAL 应能正常打开。

## 3.5 安装 KUAL 与 KOReader

建议在 Hotfix 完成后再安装；若这些文件在此前已存在，官方升级通常会保留它们，但仍应重新核对目录。

### KUAL

将 `KUAL-KDK-2.0.azw2` 直接放到：

```text
/Volumes/Kindle/documents/KUAL-KDK-2.0.azw2
```

不要使用先前尝试过的 PEKI 版 `KUAL.jar` / `KUAL.sh`；在本机 PW1 + 5.4.4 上它没有提供可用的启动路径。

### KOReader

下载 Kindle 版 KOReader ZIP，解压后将其根目录内容合并到 Kindle 根目录。最终必须同时存在：

```text
/Volumes/Kindle/extensions/koreader/
/Volumes/Kindle/koreader/
```

不要把外层 ZIP 解压文件夹再套一层，例如不要形成 `koreader-kindle-v.../koreader/`。复制完成后可比较目录，确保文件齐全；本次完整程序约 85 MB。

安全弹出、拔线、等待 Kindle 索引。打开 Kindle Launcher 时，启动菜单会显示：

```text
1. KUAL
2. KOReader
3. Quit
```

首次验证请选择 **KUAL**，确认能进入 KUAL；随后从 KUAL 中选择 KOReader。若只是日常阅读，菜单中的 **KOReader** 可直启。

# 4. 本次故障经过与正确修复方式

## 症状

在 `5.4.4` 越狱后直接打开 KUAL，出现：

> 本内容未经授权开发人员签名，请联系开发人员

这不是 KOReader 文件损坏，也不表示 Legacy Jailbreak 一定失败。PW1 上存在旧固件与当前 KUAL/开发者证书兼容性问题。

## 已验证的修复

```text
保留 5.4.4 上完成的 Jailbreak
→ 官方升级 5.6.1.1（启动显示 BRIDGE+）
→ Universal Hotfix
→ 打开 Run Hotfix
→ KUAL 正常启动
```

这个流程与 PW1 用户的相同问题及修复记录相符：[MobileRead 的 PW1 报错/升级后修复记录](https://www.mobileread.com/forums/showthread.php?page=191&t=186645)、[PW1 使用 5.6.1.1 与 BRIDGE+ 的记录](https://www.mobileread.com/forums/showpost.php?p=4507344)。

# 5. 日常使用与传书

- 通过 USB 将已合法获得的书籍复制到 `documents/`；Kindle 原生阅读器可识别兼容格式。
- 用 KOReader 阅读时，常用 EPUB、PDF、DJVU、CBZ 等；将文件放在 `documents/` 下即可在 KOReader 文件浏览器中打开。
- 每次拷书后安全弹出，让 Kindle 完成索引。首次扫描大书库或 KOReader 首次建立缓存需要几分钟。
- 需要管理或转换自有电子书时，可用 Calibre 在电脑上转换、整理并通过 USB 传输。

# 6. 故障分流表

| 现象 | 先做什么 | 不要做什么 |
|---|---|---|
| KUAL 提示“未经授权开发人员签名” | 确认当前为 5.6.1.1、曾看到 `BRIDGE+`，重新按第 3.4 节安装/运行 Hotfix | 不要反复安装 PEKI 文件或刷其他型号包 |
| KUAL 看得到、KOReader 不见 | 检查 `extensions/koreader/` 和 `koreader/` 是否都存在且未多套一层目录 | 不要只复制 `extensions` 或只复制 `koreader` |
| “更新 Kindle”灰色不可点 | 检查根目录是否有且仅有正确、完整的 `.bin`；确认型号/版本匹配 | 不要随意强制重启或放多个 `.bin` 试错 |
| 更新后没有 `BRIDGE+` | 停止后续 Hotfix/KUAL 操作，记录版本和启动画面 | 不要继续升级固件或恢复出厂设置 |
| USB 文件拷贝后异常 | 重新连接，删除仅以 `._` 开头的 macOS 附属文件，重算哈希 | 不要删除真实安装文件或在写入中拔线 |
| Kindle 卡死无响应 | 先等待至少 10 分钟；仅在确认无进度且设备无响应时才长按电源约 40 秒 | 不要在正常系统更新进度中强制关机 |

# 7. 恢复与重置的边界

- “重新安装 KOReader/KUAL”通常只需要重做第 3.4 和 3.5 节，**无需**重做降级和越狱。
- 若系统被官方更新覆盖、`BRIDGE+` 不再出现或做了恢复出厂设置，则从第 1 节开始走完整流程。
- 书籍、KOReader 设置可从 USB 备份恢复；系统目录不要整包回写。
- 在重新开始前，先保留当前 `/documents`、`/extensions`、`/koreader` 的副本，以免丢失阅读进度与自定义配置。

# 8. 本次完成状态（2026-08-23）

- [x] 已确认设备为 PW1。
- [x] 已在 5.4.4 完成 Legacy K5 Jailbreak。
- [x] 已升级至官方 5.6.1.1，启动出现 `BRIDGE+`。
- [x] 已安装 Universal Hotfix 并运行 Run Hotfix。
- [x] KUAL 已恢复可启动。
- [x] KOReader 已安装，并可从 Kindle Launcher / KUAL 启动。
- [ ] 保持飞行模式；后续如需联网，先研究并部署适用于 PW1 的 OTA 阻止方案。
