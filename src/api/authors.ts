import client from './client';
import type { Author, AuthorCreateRequest, AuthorUpdateRequest } from './types';

export const authorsApi = {
  list: (limit: number, offset: number) =>
    client.get<Author[]>('/authors', { params: { limit, offset } }).then((r) => r.data),

  create: (body: AuthorCreateRequest) =>
    client.post<Author>('/authors', body).then((r) => r.data),

  update: (id: string, body: AuthorUpdateRequest) =>
    client.patch<Author>(`/authors/${id}`, body).then((r) => r.data),

  remove: (id: string) => client.delete(`/authors/${id}`).then(() => undefined),
};
