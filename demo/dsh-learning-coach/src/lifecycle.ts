import type { Context } from 'cordis';
import { CoachStore } from './state-store';

interface SessionLike {
  id: string;
}

interface SessionEventLike {
  type: string;
  data?: {
    reason?: { kind?: string };
  };
}

/**
 * Observe DSH's durable session lifecycle without changing model-visible history.
 *
 * session/created initializes the coach's cross-session counters. session/event
 * is post-commit; only clean turn/end records count as completed turns.
 */
export function registerCoachLifecycle(ctx: Context, store: CoachStore): void {
  const logger = ctx.logger('learning-coach');

  ctx.on('session/created', (session: SessionLike) => {
    try {
      store.recordSessionStarted(String(session.id));
      logger.debug(`学习档案已为会话 ${session.id} 就绪`);
    } catch (error) {
      // session/created is a synchronous boundary: optional coach statistics
      // must fail open instead of vetoing Session publication.
      logger.warn(`无法记录会话启动统计：${errorMessage(error)}`);
    }
  });

  ctx.on(
    'session/event',
    (session: SessionLike, event: SessionEventLike) => {
      if (
        event.type === 'turn/end' &&
        event.data?.reason?.kind === 'completed'
      ) {
        try {
          store.recordTurnCompleted(String(session.id));
        } catch (error) {
          logger.warn(`无法记录轮次完成统计：${errorMessage(error)}`);
        }
      }
    },
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
