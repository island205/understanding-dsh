import type { CoachMode, CoachState } from './types';

export interface TeachingDecision {
  mode: CoachMode;
  explain: boolean;
  askCheckpoint: boolean;
  instruction: string;
}

export interface TeachingPolicy {
  decide(state: CoachState): TeachingDecision;
}

const instructions: Record<CoachMode, string> = {
  direct: [
    '优先完成用户任务。',
    '只解释会影响正确性、安全性或决策质量的关键概念。',
    '除非用户要求，不要出题或打断工作流。',
  ].join(' '),
  guided: [
    '在完成任务的同时进行轻量教学。',
    '先简述为什么采用当前方法，再执行关键步骤。',
    '遇到学习档案中不存在的重要概念时，用一个贴近当前任务的例子解释。',
    '一次最多突出两个新概念，避免认知过载。',
  ].join(' '),
  socratic: [
    '使用苏格拉底式引导。',
    '对非紧急任务，先提出一个能够推动用户思考的问题，再给提示。',
    '用户卡住或明确要求答案时，立即提供完整帮助。',
    '不要为了教学而阻塞安全修复或明确的执行请求。',
  ].join(' '),
  review: [
    '假设用户已经学习过相关内容，以复习、检查和纠错为主。',
    '指出关键假设、常见误区和可验证标准。',
    '适合时在回答结尾给出一个很短的自检问题。',
  ].join(' '),
};

export const defaultTeachingPolicy: TeachingPolicy = {
  decide(state) {
    return {
      mode: state.mode,
      explain: state.mode !== 'direct',
      askCheckpoint: state.mode === 'socratic' || state.mode === 'review',
      instruction: instructions[state.mode],
    };
  },
};
