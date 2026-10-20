import type { CoachStore } from './state-store';
import { renderProgress } from './render';
import type { CoachMode, CommandInvocation, CommandResult, ConceptStatus } from './types';

const modes = new Set<CoachMode>(['direct', 'guided', 'socratic', 'review']);

export function registerCoachCommands(
  commands: any,
  store: CoachStore,
): Array<() => void> {
  return [
    commands.register({
      name: 'coach-mode',
      description: '切换 Learning Coach 模式：direct、guided、socratic 或 review',
      input: { hint: 'guided' },
      handler(invocation: CommandInvocation): CommandResult {
        const mode = invocation.rawInput.trim().toLowerCase() as CoachMode;
        if (!modes.has(mode)) {
          return { kind: 'error', text: '用法：/coach-mode direct|guided|socratic|review' };
        }
        store.setMode(mode);
        return {
          kind: 'success',
          text: `Learning Coach 已切换为 ${mode} 模式。下一次 Agent 请求将使用新的教学策略。`,
        };
      },
    }),
    commands.register({
      name: 'coach-progress',
      description: '查看 Learning Coach 的持久化学习档案和检查点',
      handler(): CommandResult {
        return { kind: 'success', text: renderProgress(store.snapshot()) };
      },
    }),
    commands.register({
      name: 'coach-know',
      description: '手动记录一个概念的掌握状态',
      input: { hint: 'mastered 交叉验证' },
      handler(invocation: CommandInvocation): CommandResult {
        const match = invocation.rawInput.trim().match(
          /^(learning|uncertain|mastered)\s+(.+)$/i,
        );
        if (!match) {
          return {
            kind: 'error',
            text: '用法：/coach-know learning|uncertain|mastered 概念名称',
          };
        }
        const status = match[1].toLowerCase() as ConceptStatus;
        const concept = match[2].trim();
        store.recordConcept(concept, status, undefined, '用户通过命令手动记录');
        return { kind: 'success', text: `已记录：${concept} -> ${status}` };
      },
    }),
    commands.register({
      name: 'coach-reset',
      description: '清空 Learning Coach 档案并恢复 direct 模式',
      handler(): CommandResult {
        store.reset();
        return { kind: 'success', text: 'Learning Coach 学习档案已重置。' };
      },
    }),
  ];
}
