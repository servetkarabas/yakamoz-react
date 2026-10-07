import client from './client';
import type {
  Topic,
  TopicCreateRequest,
  TopicStatus,
  TranslateRequest,
  TranslationRequest,
} from './types';

export const topicsApi = {
  list: (limit: number, offset: number, lang?: string, status?: TopicStatus | '') =>
    client
      .get<Topic[]>('/topics', {
        params: {
          limit,
          offset,
          ...(lang ? { lang } : {}),
          ...(status ? { status } : {}),
        },
      })
      .then((r) => r.data),

  getById: (id: string, lang?: string) =>
    client.get<Topic>(`/topics/${id}`, { params: lang ? { lang } : {} }).then((r) => r.data),

  create: (body: TopicCreateRequest) =>
    client.post<Topic>('/topics', body).then((r) => r.data),

  addTranslation: (id: string, lang: string, body: TranslationRequest) =>
    client.put(`/topics/${id}/translations/${lang}`, body).then((r) => r.data),

  translate: (id: string, body: TranslateRequest) =>
    client.post(`/topics/${id}/translate`, body).then((r) => r.data),

  publish: (id: string) => client.post(`/topics/${id}/publish`).then((r) => r.data),
};
