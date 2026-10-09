import client from './client';
import type { ReactionKind, ReactionSummary, ReactionTarget } from './types';

const VISITOR_ID_KEY = 'yakamoz-visitor-id';

function getVisitorId(): string {
  let value = localStorage.getItem(VISITOR_ID_KEY);
  if (!value) {
    value = crypto.randomUUID();
    localStorage.setItem(VISITOR_ID_KEY, value);
  }
  return value;
}

export const reactionsApi = {
  list: (target: ReactionTarget, targetIds: string[]) =>
    targetIds.length === 0
      ? Promise.resolve({} as Record<string, ReactionSummary>)
      : client
          .get<Record<string, ReactionSummary>>('/reactions', {
            params: { target, target_ids: targetIds.join(','), visitor_id: getVisitorId() },
          })
          .then((r) => r.data),

  set: (target: ReactionTarget, targetId: string, reaction: ReactionKind | '') =>
    client
      .put<ReactionSummary>('/reactions', {
        target,
        target_id: targetId,
        visitor_id: getVisitorId(),
        reaction,
      })
      .then((r) => r.data),
};
