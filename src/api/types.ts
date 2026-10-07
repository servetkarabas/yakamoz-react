export type AuthorStatus = 'active' | 'suspended';

export interface Author {
  id: string;
  nickname: string;
  email: string;
  bio: string;
  preferred_language: string;
  status: AuthorStatus;
  created_at: string;
  updated_at: string;
}

export interface AuthorCreateRequest {
  nickname: string;
  email: string;
  bio: string;
  preferred_language: string;
}

export interface AuthorUpdateRequest {
  bio?: string;
  preferred_language?: string;
}

export type TopicStatus = 'draft' | 'published' | 'archived';

export interface Topic {
  id: string;
  slug: string;
  original_language: string;
  status: TopicStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  served_language: string;
}

export interface TopicCreateRequest {
  title: string;
  description: string;
  language: string;
  author_id: string;
}

export interface TranslationRequest {
  title: string;
  description: string;
}

export interface TranslateRequest {
  target_languages: string[];
  force: boolean;
}

export interface Comment {
  id: string;
  topic_id: string;
  author_id: string;
  language: string;
  body: string;
  created_at: string;
}

export interface CommentCreateRequest {
  topic_id: string;
  author_id: string;
  language: string;
  body: string;
}
