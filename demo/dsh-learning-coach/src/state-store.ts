import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import type {
  CheckpointRecord,
  CoachMode,
  CoachState,
  ConceptStatus,
} from './types';

function now(): string {
  return new Date().toISOString();
}

function defaultState(): CoachState {
  return {
    version: 1,
    mode: 'direct',
    preferences: {
      explanationDepth: 'intermediate',
      style: 'example-first',
      checkpointFrequency: 'medium',
    },
    concepts: {},
    checkpoints: [],
    stats: {
      toolCallsObserved: 0,
      coachToolCalls: 0,
      sessionsStarted: 0,
      turnsCompleted: 0,
      updatedAt: now(),
    },
  };
}

export class CoachStore {
  private state: CoachState;

  constructor(
    readonly filePath: string =
      process.env.DSH_LEARNING_COACH_STATE ||
      join(homedir(), '.dsh', 'learning-coach', 'state.json'),
  ) {
    this.state = this.load();
  }

  snapshot(): CoachState {
    return structuredClone(this.state);
  }

  setMode(mode: CoachMode): CoachState {
    this.state.mode = mode;
    return this.commit();
  }

  recordConcept(
    name: string,
    status: ConceptStatus,
    confidence?: number,
    evidence?: string,
  ): CoachState {
    const key = normalizeConcept(name);
    if (!key) throw new Error('concept must not be empty');

    const existing = this.state.concepts[key];
    const timestamp = now();
    const resolvedConfidence =
      confidence ?? defaultConfidence(status, existing?.confidence);

    this.state.concepts[key] = {
      name: name.trim(),
      status,
      confidence: clamp(resolvedConfidence),
      evidence: evidence
        ? [...(existing?.evidence || []), evidence].slice(-10)
        : existing?.evidence || [],
      firstSeenAt: existing?.firstSeenAt || timestamp,
      lastSeenAt: timestamp,
      reviewCount: (existing?.reviewCount || 0) + 1,
    };
    return this.commit();
  }

  recordCheckpoint(record: Omit<CheckpointRecord, 'createdAt'>): CoachState {
    this.state.checkpoints.push({ ...record, createdAt: now() });
    this.state.checkpoints = this.state.checkpoints.slice(-100);

    this.recordConcept(
      record.concept,
      record.passed ? 'mastered' : 'uncertain',
      record.score ?? (record.passed ? 0.85 : 0.35),
      record.note || `checkpoint: ${record.passed ? 'passed' : 'failed'}`,
    );
    return this.commit();
  }

  observeToolCall(isCoachTool: boolean): void {
    this.state.stats.toolCallsObserved += 1;
    if (isCoachTool) this.state.stats.coachToolCalls += 1;
    this.commit();
  }

  recordSessionStarted(sessionId: string): CoachState {
    this.state.stats.sessionsStarted += 1;
    this.state.stats.lastSessionId = sessionId;
    return this.commit();
  }

  recordTurnCompleted(sessionId: string): CoachState {
    this.state.stats.turnsCompleted += 1;
    this.state.stats.lastSessionId = sessionId;
    return this.commit();
  }

  reset(): CoachState {
    this.state = defaultState();
    return this.commit();
  }

  private load(): CoachState {
    try {
      const parsed = JSON.parse(readFileSync(this.filePath, 'utf8')) as CoachState;
      if (parsed?.version !== 1) return defaultState();
      const fallback = defaultState();
      return {
        ...fallback,
        ...parsed,
        stats: { ...fallback.stats, ...parsed.stats },
      };
    } catch {
      return defaultState();
    }
  }

  private commit(): CoachState {
    this.state.stats.updatedAt = now();
    mkdirSync(dirname(this.filePath), { recursive: true });
    const tmp = `${this.filePath}.${process.pid}.tmp`;
    writeFileSync(tmp, `${JSON.stringify(this.state, null, 2)}\n`, 'utf8');
    renameSync(tmp, this.filePath);
    return this.snapshot();
  }
}

function normalizeConcept(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function defaultConfidence(
  status: ConceptStatus,
  previous?: number,
): number {
  if (status === 'mastered') return Math.max(previous ?? 0, 0.85);
  if (status === 'uncertain') return Math.min(previous ?? 1, 0.35);
  return previous ?? 0.5;
}

function clamp(value: number): number {
  if (!Number.isFinite(value)) return 0.5;
  return Math.min(1, Math.max(0, value));
}
