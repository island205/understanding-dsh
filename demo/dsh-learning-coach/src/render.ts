import type { CoachState } from './types';

export function renderProgress(state: CoachState): string {
  const groups = {
    mastered: Object.values(state.concepts).filter((x) => x.status === 'mastered'),
    learning: Object.values(state.concepts).filter((x) => x.status === 'learning'),
    uncertain: Object.values(state.concepts).filter((x) => x.status === 'uncertain'),
  };
  const passed = state.checkpoints.filter((x) => x.passed).length;

  return [
    '# Learning Coach 进度',
    '',
    `- 当前模式：${state.mode}`,
    `- 已掌握：${groups.mastered.length}`,
    `- 正在学习：${groups.learning.length}`,
    `- 不确定：${groups.uncertain.length}`,
    `- 检查点：${passed}/${state.checkpoints.length} 通过`,
    `- 已观察会话：${state.stats.sessionsStarted}`,
    `- 已完成轮次：${state.stats.turnsCompleted}`,
    '',
    section('已掌握', groups.mastered),
    section('正在学习', groups.learning),
    section('需要复习', groups.uncertain),
    '## 最近检查点',
    ...(state.checkpoints.length
      ? state.checkpoints.slice(-5).reverse().map((x) =>
        `- ${x.passed ? '通过' : '未通过'}：${x.concept}${x.note ? `（${x.note}）` : ''}`,
      )
      : ['- 尚无记录']),
  ].join('\n');
}

function section(title: string, items: CoachState['concepts'][string][]): string {
  const lines = [`## ${title}`];
  if (!items.length) return `${lines[0]}\n- 尚无记录`;
  for (const item of items.sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt))) {
    lines.push(`- ${item.name}：置信度 ${Math.round(item.confidence * 100)}%，复习 ${item.reviewCount} 次`);
  }
  return lines.join('\n');
}

export function renderProfileForModel(state: CoachState): string {
  const compact = Object.values(state.concepts).map((item) => ({
    concept: item.name,
    status: item.status,
    confidence: item.confidence,
  }));
  return JSON.stringify(
    {
      mode: state.mode,
      preferences: state.preferences,
      concepts: compact,
      checkpointCount: state.checkpoints.length,
      lifecycle: {
        sessionsStarted: state.stats.sessionsStarted,
        turnsCompleted: state.stats.turnsCompleted,
      },
    },
    null,
    2,
  );
}
