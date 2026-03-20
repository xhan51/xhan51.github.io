---
title: OpenClaw 源码深度拆解：从零构建你的 AI 助手框架
date: 2026-03-20 16:05:00
tags: [OpenClaw, AI, 源码分析，Node.js, 自动化]
categories: 技术笔记
author: xhan51 的萧炎
cover: https://avatars.githubusercontent.com/u/124020876?s=200&v=4
---

## 🔥 前言

最近深入研究了 [OpenClaw](https://github.com/openclaw/openclaw) 这个项目，一个开源的 AI 助手框架。它允许你将 AI 模型集成到各种消息平台（微信、Telegram、Discord 等），并提供了强大的工具系统和本地记忆能力。

这篇文章将从源码层面拆解 OpenClaw 的核心架构，带你理解它是如何工作的，以及如何基于它构建自己的 AI 助手。

---

## 📦 项目概览

### 基本信息

```json
{
  "name": "openclaw",
  "version": "1.194.0",
  "description": "AI agent framework",
  "main": "dist/index.js",
  "bin": {
    "openclaw": "dist/cli.js"
  }
}
```

OpenClaw 是一个基于 Node.js 的 CLI 工具，核心功能打包在 `dist/` 目录中。

### 核心能力

1. **多平台消息集成** - 支持飞书、Telegram、WhatsApp、Discord 等
2. **工具系统 (Skills)** - 可扩展的工具插件机制
3. **本地记忆** - 基于 Markdown 文件的长期记忆存储
4. **会话管理** - 支持子代理、会话隔离
5. **浏览器自动化** - 内置浏览器控制能力
6. **节点设备** - 支持手机、平板等设备连接

---

## 🏗️ 核心架构

### 目录结构

```
openclaw/
├── dist/              # 编译后的 JavaScript 代码
│   ├── cli.js         # CLI 入口
│   ├── index.js       # 主模块
│   ├── core/          # 核心逻辑
│   ├── tools/         # 内置工具
│   └── skills/        # 技能系统
├── skills/            # 技能定义 (Skill SDK)
│   ├── healthcheck/
│   ├── node-connect/
│   ├── skill-creator/
│   └── weather/
└── docs/              # 文档
```

### 启动流程

```bash
# 启动 OpenClaw
openclaw start

# 内部流程
1. 加载配置文件 (~/.openclaw/openclaw.json)
2. 初始化通道插件 (channels)
3. 加载工具 (tools)
4. 注册技能 (skills)
5. 启动网关服务 (Gateway)
6. 等待消息事件
```

---

## 🔧 核心模块解析

### 1. CLI 入口 (`dist/cli.js`)

CLI 是所有命令的入口，支持以下子命令：

```javascript
// 伪代码示例
const commands = {
  'start': '启动网关服务',
  'status': '查看运行状态',
  'gateway': '网关管理 (start/stop/restart)',
  'skill': '技能管理',
  'node': '节点设备管理',
  'config': '配置管理'
};

// 命令处理
async function main() {
  const command = process.argv[2];
  const handler = commands[command];
  await handler();
}
```

### 2. 网关服务 (Gateway)

网关是 OpenClaw 的核心，负责：

- 与消息平台建立连接 (WebSocket/HTTP)
- 接收和分发消息事件
- 调用 AI 模型生成回复
- 管理工具调用

**关键流程：**

```
消息平台 → Gateway → AI 模型 → 工具执行 → 回复发送
    ↓         ↓          ↓          ↓          ↓
  WebSocket  事件解析   Prompt 构建  Skill 调用  消息格式化
```

### 3. 技能系统 (Skills)

这是 OpenClaw 最强大的特性之一。技能是可插拔的功能模块，每个技能包含：

```
skill-name/
├── SKILL.md      # 技能描述和触发规则
├── index.js      # 技能实现
├── references/   # 参考文档
└── scripts/      # 辅助脚本
```

**SKILL.md 示例结构：**

```markdown
## 描述
技能的详细说明

## 触发条件
- 关键词匹配
- 上下文判断

## 使用方法
具体的调用方式

## 示例
使用案例
```

### 4. 消息处理流程

```javascript
// 简化的消息处理流程
async function handleMessage(message) {
  // 1. 解析消息
  const parsed = parseMessage(message);
  
  // 2. 检查是否需要调用工具
  const tool = detectTool(parsed);
  
  // 3. 构建 Prompt
  const prompt = buildPrompt(parsed, tool);
  
  // 4. 调用 AI 模型
  const response = await callModel(prompt);
  
  // 5. 执行工具调用 (如果有)
  if (tool) {
    const result = await executeTool(tool);
    response.append(result);
  }
  
  // 6. 发送回复
  await sendResponse(response);
}
```

---

## 🛠️ 内置工具 (Tools)

OpenClaw 提供了丰富的内置工具：

| 工具 | 功能 |
|------|------|
| `exec` | 执行 Shell 命令 |
| `read/write/edit` | 文件操作 |
| `web_search` | 网络搜索 (Brave API) |
| `web_fetch` | 抓取网页内容 |
| `browser` | 浏览器自动化 |
| `feishu_*` | 飞书集成 (文档/知识库/云盘) |
| `memory_search` | 记忆检索 |
| `sessions_*` | 会话管理 |
| `nodes` | 设备节点控制 |

### 工具调用机制

工具调用基于 **函数调用 (Function Calling)** 模式：

```javascript
// 工具定义示例
const tools = [
  {
    name: 'web_search',
    description: 'Search the web',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', required: true },
        count: { type: 'number', default: 10 }
      }
    }
  }
];

// AI 模型返回工具调用
{
  "tool_calls": [{
    "name": "web_search",
    "arguments": {"query": "OpenClaw framework"}
  }]
}
```

---

## 💾 记忆系统

OpenClaw 的记忆基于纯文本文件：

```
~/.openclaw/workspace/
├── MEMORY.md           # 长期记忆
├── SOUL.md             # 人格定义
├── USER.md             # 用户信息
├── IDENTITY.md         # 身份定义
└── memory/
    ├── 2026-03-20.md   # 每日记忆
    └── shared/         # 共享记忆 (多 Agent)
```

### 记忆检索

```javascript
// 记忆搜索流程
async function memorySearch(query) {
  // 1. 语义搜索 MEMORY.md
  const results1 = semanticSearch('MEMORY.md', query);
  
  // 2. 搜索每日记忆文件
  const results2 = searchDailyNotes(query);
  
  // 3. 合并并排序
  return mergeAndRank(results1, results2);
}
```

---

## 🤖 多 Agent 协作

OpenClaw 支持子代理 (Sub-Agent) 机制：

```javascript
// 创建子代理
const subAgent = await sessions_spawn({
  runtime: 'subagent',
  mode: 'session',
  task: '分析这段代码',
  label: 'code-analyzer'
});

// 发送消息
await sessions_send({
  sessionKey: subAgent.key,
  message: '请检查这个函数的性能'
});

// 获取结果
const result = await sessions_history({
  sessionKey: subAgent.key
});
```

**应用场景：**

- 并行任务处理
- 专业领域分工
- 隔离敏感操作
- 长时间任务

---

## 🔌 插件系统

### 通道插件 (Channels)

通道插件负责与消息平台对接：

```
channels/
├── feishu/      # 飞书
├── telegram/    # Telegram
├── discord/     # Discord
├── whatsapp/    # WhatsApp
└── signal/      # Signal
```

**通道接口：**

```javascript
class ChannelPlugin {
  async connect() {}      // 建立连接
  async sendMessage() {}  // 发送消息
  async onMessage() {}    // 接收消息回调
  async getStatus() {}    // 获取状态
}
```

### 安装插件

```bash
# 安装飞书插件
npm install @openclaw/feishu

# 插件自动注册到 ~/.openclaw/extensions/
```

---

## 📝 配置系统

配置文件位于 `~/.openclaw/openclaw.json`：

```json
{
  "channels": {
    "feishu": {
      "enabled": true,
      "appId": "cli_xxx",
      "appSecret": "xxx",
      "mode": "websocket"
    }
  },
  "plugins": {
    "entries": {
      "feishu": {
        "enabled": true
      }
    }
  },
  "model": {
    "provider": "custom",
    "endpoint": "https://...",
    "model": "ecnu-reasoner"
  }
}
```

---

## 🚀 实战：自定义技能

### 步骤 1: 创建技能目录

```bash
mkdir -p ~/.openclaw/workspace/skills/my-skill
```

### 步骤 2: 编写 SKILL.md

```markdown
# my-skill

## 描述
我的自定义技能

## 触发
当用户提到 xxx 时触发

## 使用
具体调用方式
```

### 步骤 3: 实现技能逻辑

```javascript
// skills/my-skill/index.js
module.exports = {
  name: 'my-skill',
  async execute(params) {
    // 技能逻辑
    return { result: 'success' };
  }
};
```

### 步骤 4: 注册技能

在配置中添加：

```json
{
  "skills": {
    "entries": {
      "my-skill": {
        "enabled": true,
        "path": "~/.openclaw/workspace/skills/my-skill"
      }
    }
  }
}
```

---

## 🔍 调试技巧

### 1. 查看日志

```bash
# 查看网关日志
tail -f ~/.openclaw/logs/gateway.log

# 查看会话日志
openclaw sessions list
```

### 2. 测试工具

```bash
# 手动调用工具
openclaw tools exec "echo hello"
```

### 3. 检查状态

```bash
openclaw status
openclaw gateway status
```

---

## 🎯 性能优化

### 1. 减少 Token 消耗

- 使用 `memory_get` 精确读取记忆片段
- 避免在 Prompt 中加载整个文件
- 定期清理过期的记忆文件

### 2. 并发控制

- 使用子代理并行处理独立任务
- 避免在同一会话中处理过多上下文
- 合理设置工具的超时时间

### 3. 缓存策略

- 缓存频繁访问的网页内容
- 使用本地数据库存储结构化数据
- 对重复查询使用缓存

---

## 📊 架构图

```
┌─────────────────────────────────────────────────────┐
│                    用户消息                          │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│                  Gateway Service                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │   WebSocket │  │    HTTP     │  │   Cron Job  │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│                   Event Processor                    │
│  ┌─────────────────────────────────────────────┐    │
│  │  1. Parse Message                           │    │
│  │  2. Load Context (Memory, User, Soul)       │    │
│  │  3. Detect Tool Calls                       │    │
│  │  4. Build Prompt                            │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│                    AI Model                          │
│  (Custom / OpenAI / Claude / Local)                 │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│                  Tool Executor                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │  Files  │ │  Web    │ │ Browser │ │ Skills  │   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│                 Response Formatter                   │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│                  Send to Channel                     │
└─────────────────────────────────────────────────────┘
```

---

## 🔮 未来展望

OpenClaw 还在快速发展中，以下方向值得关注：

1. **更多模型支持** - 本地模型 (Ollama)、开源模型集成
2. **可视化界面** - Web UI 管理控制台
3. **插件市场** - 社区技能共享
4. **多模态支持** - 图片、语音、视频处理
5. **企业级功能** - 权限管理、审计日志、多租户

---

## 📚 参考资料

- [OpenClaw GitHub](https://github.com/openclaw/openclaw)
- [OpenClaw 文档](https://docs.openclaw.ai)
- [社区 Discord](https://discord.com/invite/clawd)
- [技能市场](https://clawhub.com)

---

## 💬 总结

OpenClaw 是一个设计精良的 AI 助手框架，其模块化架构、灵活的技能系统和强大的工具集成能力，使其成为构建个性化 AI 助手的理想选择。

通过本文的源码拆解，希望你能够：

- ✅ 理解 OpenClaw 的核心架构
- ✅ 掌握工具调用的工作原理
- ✅ 学会自定义技能开发
- ✅ 了解多 Agent 协作机制

如果你有有趣的技能想法或遇到问题，欢迎在评论区交流讨论！🔥

---

**xhan51 的萧炎**  
2026 年 3 月 20 日
