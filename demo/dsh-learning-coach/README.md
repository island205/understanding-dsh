# dsh-learning-coach

为任意 DSH Agent 增加持续、个性化、可追踪的教学能力。

它不是一次性的课程生成器。插件通过 DSH 的系统提示注册表影响每一次 Agent 推理，通过原生工具让 Agent 读取和更新学习档案，通过斜杠命令提供用户控制面，并监听已提交的会话生命周期事件维护使用统计。

## 用户可感知变化

安装前，Agent 通常只完成任务。安装后，Agent 会在不妨碍交付的前提下：

- 根据已掌握概念调整解释深度；
- 识别与当前任务紧密相关的知识缺口；
- 通过 DSH 工具调用记录概念和检查结果；
- 在后续会话中继续使用学习档案。

## 构建

```bash
cd demo/dsh-learning-coach
npx tsc
```

## 配套 Skill（可选：让 Agent 更会用这套能力）

`skills/learning-coach/SKILL.md` 是一份面向模型的能力说明书。它和插件是互补关系：

- **插件（Plugin）** 在运行时注册命令与工具（`/coach-mode`、`coach_profile` 等）——这是「通道」。
- **Skill（本文档）** 教 Agent 何时、为何、如何驱动这些通道——这是「说明书」。

插件不加载本 skill 时功能完整，但 Agent 默认只知道提示词里的行为规则；加载本 skill 后，Agent 能更精确地在任务里调用工具、遵守掌握检查纪律。

想启用时，把 `skills/learning-coach/` 目录复制到 DSH 的 skills 目录（随 DSH 版本与配置而定），由 DSH 在会话中加载即可。它是增强项，不阻塞插件核心用法。

## 安装到专属 Profile

在本书配套仓库根目录（`demo` 所在的上级目录，即含 `demo/dsh-learning-coach` 的那一层）下执行：

```bash
npx @deepseek-ai/dsh plugin --profile learning-coach add ./demo/dsh-learning-coach
```

启动：

```bash
npx @deepseek-ai/dsh --profile learning-coach --no-open
```

> 注：旧项目 `dsh-curriculum-builder` 已废弃并删除，其 `curriculum` profile 也已归档。若本地仍存在旧 profile，可将其中的 bundle 移除，仅保留 `dsh-base`、`dsh-web-app` 与 `dsh-learning-coach`。

## 命令

```text
/coach-mode direct
/coach-mode guided
/coach-mode socratic
/coach-mode review
/coach-progress
/coach-know Python
/coach-reset
```

## 原生工具

- `coach_profile`
- `coach_record_concept`
- `coach_checkpoint`

工具调用会出现在 DSH UI 中。状态保存在：

```text
~/.dsh/learning-coach/state.json
```

## 建议验证流程

1. 执行 `/coach-mode guided`。
2. 执行 `/coach-know Python`。
3. 问 Agent：`请帮我用 Python 实现交叉验证，并说明为什么不能只看训练集准确率。`
4. 观察系统回答是否根据 Python 已掌握状态跳过语法教学，并解释交叉验证。
5. 观察 Agent 是否调用 `coach_record_concept`。
6. 执行 `/coach-progress` 检查档案，以及“已观察会话/已完成轮次”统计。
7. 重启 DSH，再次执行 `/coach-progress` 验证持久化。

## 实现边界

首版没有伪造子 agent、Teams、LSP 或沙箱。它们将在确有教学需求时按后续阶段接入。

## 下一步

端到端使用、验证流程与后续扩展阶段见 `MVP_USAGE.md`。
