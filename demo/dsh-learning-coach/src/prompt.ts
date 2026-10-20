import type { CoachStore } from './state-store';
import type { TeachingPolicy } from './teaching-policy';
import type { CoachState } from './types';

export function buildCoachPrompt(
  store: CoachStore,
  policy: TeachingPolicy,
): string {
  const state = store.snapshot();
  const decision = policy.decide(state);
  const mastered = conceptsByStatus(state, 'mastered');
  const learning = conceptsByStatus(state, 'learning');
  const uncertain = conceptsByStatus(state, 'uncertain');

  return [
    '# Learning Coach',
    '',
    `当前教学模式：${decision.mode}`,
    decision.instruction,
    '',
    '## 学习者档案',
    `- 已掌握：${mastered || '尚无记录'}`,
    `- 正在学习：${learning || '尚无记录'}`,
    `- 不确定：${uncertain || '尚无记录'}`,
    `- 偏好：${state.preferences.style}，解释深度 ${state.preferences.explanationDepth}`,
    '',
    '## 行为规则',
    '1. 先完成用户的真实任务，教学是增强层，不得喧宾夺主。',
    '2. 不要重复讲解“已掌握”概念；发现可能误解时才重新说明。',
    '3. 遇到对当前任务重要的新概念，可调用 coach_record_concept 记录为 learning。',
    '4. 只有获得用户回答或明确证据时，才把概念标记为 mastered。',
    '5. 需要掌握检查时调用 coach_checkpoint；不要声称已经记录但不调用工具。',
    '6. 用户可通过 /coach-mode 切换模式，通过 /coach-progress 查看进度。',
  ].join('\n');
}

function conceptsByStatus(
  state: CoachState,
  status: 'mastered' | 'learning' | 'uncertain',
): string {
  return Object.values(state.concepts)
    .filter((item) => item.status === status)
    .sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt))
    .slice(0, 12)
    .map((item) => `${item.name}(${Math.round(item.confidence * 100)}%)`)
    .join('、');
}
