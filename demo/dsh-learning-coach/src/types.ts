export type CoachMode = 'direct' | 'guided' | 'socratic' | 'review';
export type ConceptStatus = 'learning' | 'uncertain' | 'mastered';

export interface ConceptRecord {
  name: string;
  status: ConceptStatus;
  confidence: number;
  evidence: string[];
  firstSeenAt: string;
  lastSeenAt: string;
  reviewCount: number;
}

export interface CheckpointRecord {
  concept: string;
  passed: boolean;
  score?: number;
  note?: string;
  sessionId?: string;
  createdAt: string;
}

export interface CoachPreferences {
  explanationDepth: 'beginner' | 'intermediate' | 'advanced';
  style: 'example-first' | 'concept-first' | 'hands-on';
  checkpointFrequency: 'low' | 'medium' | 'high';
}

export interface CoachState {
  version: 1;
  mode: CoachMode;
  preferences: CoachPreferences;
  concepts: Record<string, ConceptRecord>;
  checkpoints: CheckpointRecord[];
  stats: {
    toolCallsObserved: number;
    coachToolCalls: number;
    sessionsStarted: number;
    turnsCompleted: number;
    lastSessionId?: string;
    updatedAt: string;
  };
}

export interface CommandInvocation {
  rawInput: string;
  agent?: { id?: string };
}

export interface CommandResult {
  kind: 'success' | 'error';
  text: string;
}
