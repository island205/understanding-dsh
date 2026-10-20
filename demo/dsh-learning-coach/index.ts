import type { Context } from 'cordis';
import { CoachStore } from './src/state-store';
import { defaultTeachingPolicy } from './src/teaching-policy';
import { buildCoachPrompt } from './src/prompt';
import { createCoachTools } from './src/tools';
import { registerCoachCommands } from './src/commands';
import { registerCoachLifecycle } from './src/lifecycle';

export const name = 'dsh-learning-coach';
export const description = '为 DSH Agent 增加持续、个性化、可追踪的教学能力';

export const inject = [
  'commands',
  'tools',
  'systemPrompt',
  'sessions',
] as const;

export function apply(ctx: Context) {
  const store = new CoachStore();
  ctx.logger('learning-coach').info('dsh-learning-coach v0.1.0 初始化');

  // 会话事件监听器由 ctx.on() 绑定到当前插件 Fiber，卸载时自动移除。
  registerCoachLifecycle(ctx, store);
  ctx.logger('learning-coach').info('会话生命周期监听已注册');

  ctx.effect(() => {
    const cleanup: Array<() => void> = [];

    // 1. 动态系统提示：每个新 step 组装请求前读取教学模式与学习档案
    if (ctx.systemPrompt?.section) {
      cleanup.push(
        ctx.systemPrompt.section({
          name: 'learning-coach:policy',
          order: 700,
          text: () => buildCoachPrompt(store, defaultTeachingPolicy),
        }),
      );
      ctx.logger('learning-coach').info('系统提示注入已注册');
    } else {
      ctx.logger('learning-coach').warn('systemPrompt 服务不可用，跳过提示注入');
    }

    // 2. 原生工具：Agent 可查询档案、记录概念、记录检查点
    if (ctx.tools?.register) {
      for (const tool of createCoachTools(store)) {
        cleanup.push(ctx.tools.register(tool));
      }
      ctx.logger('learning-coach').info('教练工具已注册');
    } else {
      ctx.logger('learning-coach').warn('tools 服务不可用，跳过工具注册');
    }

    // 3. 斜杠命令：用户可切换模式、查看进度、记录概念、重置
    const commands = ctx.commands || ctx.root?.get?.('commands');
    if (commands?.register) {
      cleanup.push(...registerCoachCommands(commands, store));
      ctx.logger('learning-coach').info('教练命令已注册');
    } else {
      ctx.logger('learning-coach').warn('commands 服务不可用，跳过命令注册');
    }

    return () => {
      for (const dispose of cleanup.reverse()) {
        try {
          dispose();
        } catch {
          /* ignore */
        }
      }
      ctx.logger('learning-coach').info('dsh-learning-coach 已卸载');
    };
  });
}
