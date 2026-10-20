import type { CoachStore } from './state-store';
import { renderProfileForModel } from './render';
import type { ConceptStatus } from './types';

const textOutput = {
  schema: { type: 'string' },
  render(_args: unknown, value: string) {
    return [{ type: 'text', text: value }];
  },
};

function argsRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('工具参数必须是对象');
  }
  return value as Record<string, unknown>;
}

function requiredString(
  args: Record<string, unknown>,
  key: string,
): string {
  const value = args[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${key} 必须是非空字符串`);
  }
  return value.trim();
}

function optionalString(
  args: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = args[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'string') throw new Error(`${key} 必须是字符串`);
  return value;
}

function optionalUnitNumber(
  args: Record<string, unknown>,
  key: string,
): number | undefined {
  const value = args[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${key} 必须是 0 到 1 之间的有限数字`);
  }
  return value;
}

function conceptStatus(args: Record<string, unknown>): ConceptStatus {
  const value = args.status;
  if (value !== 'learning' && value !== 'uncertain' && value !== 'mastered') {
    throw new Error('status 必须是 learning、uncertain 或 mastered');
  }
  return value;
}

export function createCoachTools(store: CoachStore): any[] {
  return [
    {
      name: 'coach_profile',
      description:
        '读取学习者的教学模式、已掌握概念、学习中概念和不确定概念。准备个性化解释前使用。',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      output: textOutput,
      isConcurrencySafe: () => true,
      async execute(args: unknown) {
        argsRecord(args);
        return renderProfileForModel(store.snapshot());
      },
    },
    {
      name: 'coach_record_concept',
      description:
        '记录当前任务涉及的关键学习概念。只有概念确实影响当前任务时使用；不要记录普通名词。',
      parameters: {
        type: 'object',
        properties: {
          concept: { type: 'string', description: '具体知识概念' },
          status: {
            type: 'string',
            enum: ['learning', 'uncertain', 'mastered'],
            description: '当前掌握状态',
          },
          confidence: { type: 'number', description: '0 到 1 的置信度' },
          evidence: { type: 'string', description: '从本轮对话得到的简短证据' },
        },
        required: ['concept', 'status'],
        additionalProperties: false,
      },
      output: textOutput,
      async execute(value: unknown) {
        const args = argsRecord(value);
        const concept = requiredString(args, 'concept');
        const state = store.recordConcept(
          concept,
          conceptStatus(args),
          optionalUnitNumber(args, 'confidence'),
          optionalString(args, 'evidence'),
        );
        const record = state.concepts[concept.toLocaleLowerCase()];
        return `已记录：${record.name} -> ${record.status}（置信度 ${Math.round(record.confidence * 100)}%）`;
      },
    },
    {
      name: 'coach_checkpoint',
      description:
        '在用户回答了一个真实掌握检查后记录结果。不能在尚未获得用户回答时调用。',
      parameters: {
        type: 'object',
        properties: {
          concept: { type: 'string', description: '被检查的概念' },
          passed: { type: 'boolean', description: '用户是否通过' },
          score: { type: 'number', description: '可选的 0 到 1 分数' },
          note: { type: 'string', description: '回答表现或误区摘要' },
        },
        required: ['concept', 'passed'],
        additionalProperties: false,
      },
      output: textOutput,
      async execute(value: unknown) {
        const args = argsRecord(value);
        const concept = requiredString(args, 'concept');
        if (typeof args.passed !== 'boolean') throw new Error('passed 必须是布尔值');
        const passed = args.passed;
        store.recordCheckpoint({
          concept,
          passed,
          score: optionalUnitNumber(args, 'score'),
          note: optionalString(args, 'note'),
        });
        return `检查点已记录：${concept} -> ${passed ? '通过' : '需要复习'}`;
      },
    },
  ];
}
