# dsh-learning-coach · MVP 使用与验证

本文档说明如何运行、使用并验证 `dsh-learning-coach` 的最小可用闭环
（模式切换 → Agent 行为变化 → 工具调用可见 → 跨会话档案持久化）。

## 1. 构建插件

```bash
cd demo/dsh-learning-coach
npm ci               # 按 lockfile 安装
npm run check
npm run build         # 编译到 dist/
```

构建产物在 `dist/`，插件入口是 `dist/index.js`。

## 2. 安装到独立 profile

首次使用时，在仓库根目录从官方 Web 模板初始化专属 Profile：

```bash
npx @deepseek-ai/dsh --profile learning-coach --from-default-profile web
```

初始化会立即启动；按 `Ctrl-C` 停止。`--from-default-profile` 会替换已存在的同名自定义 Profile，后续普通启动不要再次携带它。

然后在仓库根目录把插件作为本地 Bundle 加入：

```bash
npx @deepseek-ai/dsh plugin --profile learning-coach add ./demo/dsh-learning-coach
```

确认 profile 组合配置中包含插件（非破坏性检查）：

```bash
npx @deepseek-ai/dsh --profile learning-coach --dump-config | grep -A2 "learning-coach"
```

预期看到：

```yaml
# == dsh-learning-coach
- id: learning-coach
  name: dsh-learning-coach
```

## 3. 启动

在仓库根目录执行：

```bash
npx @deepseek-ai/dsh --profile learning-coach --no-open --port 3666
```

启动日志应显示服务地址，且没有 learning-coach 激活错误。使用 Standard Agent Preset 和受限 Permission Preset 作为验证基线。

## 4. 建议验证流程

1. `/coach-mode guided` —— 切换到引导式教学。
2. `/coach-know learning Python` —— 手动记录概念。
3. 让 Agent 完成一个与记录概念相关的任务，例如：
   `请帮我用 Python 实现交叉验证，并说明为什么不能只看训练集准确率。`
4. 观察系统提示是否按“已掌握 / 学习中 / 不确定”调整了解释策略。
5. 观察 Agent 是否在相关处调用 `coach_record_concept`（工具调用会出现在 DSH UI）。
6. `/coach-progress` —— 查看持久化档案、检查点，以及会话/轮次统计。
7. 重启 DSH 后再执行 `/coach-progress`，确认档案在跨会话后仍然存在。

状态文件默认在：

```text
~/.dsh/learning-coach/state.json
```

可用环境变量覆盖路径：`DSH_LEARNING_COACH_STATE`。

## 5. 命令

| 命令 | 作用 |
|------|------|
| `/coach-mode direct` | 直接模式（默认，专注任务） |
| `/coach-mode guided`  | 引导式——完成任务同时轻量教学 |
| `/coach-mode socratic` | 苏格拉底式引导 |
| `/coach-mode review`  | 复习、检查与纠错 |
| `/coach-progress` | 查看学习档案与检查点 |
| `/coach-know <status> <concept>` | 手动记录概念掌握状态 |
| `/coach-reset` | 清空档案并恢复 direct 模式 |

## 6. 原生工具

| 工具 | 用途 |
|------|------|
| `coach_profile` | 读取模式、偏好与概念档案，用于个性化解释 |
| `coach_record_concept` | 记录当前任务关键概念及掌握状态 |
| `coach_checkpoint` | 在用户真实回答后记录检查点与结论 |

这三个工具通过 DSH 的原生工具协议注册，工具调用过程会在 DSH UI 中可见，
是插件“持续可感知”的核心证据。

## 7. 会话生命周期统计

插件监听 DSH 的 `session/created` 与 `session/event`：

- 新会话发布时增加 `sessionsStarted`；
- 已提交的 `turn/end` 且原因是 `completed` 时增加 `turnsCompleted`；
- 统计写入同一 `state.json`，但不会向 Session 日志追加模型可见内容。

`ctx.on()` 产生的监听器由 Cordis Fiber 管理，插件卸载时自动移除。

## 8. 实现边界与后续阶段

MVP 只覆盖“单 Agent、单会话、轻量教学”的最短闭环，并刻意不伪造
子 agent、Teams、LSP 或沙箱等重能力。

后续可在“确有教学需求”的前提下按阶段接入：

- **阶段 A**：跨会话复习计划（按遗忘曲线触发检查点）。
- **阶段 B**：子 agent / Team 分工——一个 agent 记录档案、一个 agent 出题检查。
- **阶段 C**：LSP / 沙箱感知——结合真实代码与运行验证概念掌握。
