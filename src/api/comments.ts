import client from './client';
import type { Comment, CommentCreateRequest } from './types';

export const commentsApi = {
  list: (topicId: string, limit: number, offset: number) =>
    client
      .get<Comment[]>('/comments', { params: { topic_id: topicId, limit, offset } })
      .then((r) => r.data),

  counts: (topicIds: string[]) =>
    client
      .get<Record<string, number>>('/comments/counts', { params: { topic_ids: topicIds.join(',') } })
      .then((r) => r.data),

  create: (body: CommentCreateRequest) =>
    client.post<Comment>('/comments', body).then((r) => r.data),

  remove: (id: string) => client.delete(`/comments/${id}`).then(() => undefined),
};
