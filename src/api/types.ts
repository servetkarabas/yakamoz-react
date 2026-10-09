export type AuthorStatus = 'active' | 'suspended';
export type AuthorRole = 'author' | 'reviewer' | 'admin';

export interface Author {
  id: string;
  nickname: string;
  email: string;
  bio: string;
  preferred_language: string;
  role: AuthorRole;
  status: AuthorStatus;
  created_at: string;
  updated_at: string;
}

export interface AuthorCreateRequest {
  nickname: string;
  email: string;
  bio: string;
  preferred_language: string;
  role: AuthorRole;
}

export interface AuthorUpdateRequest {
  bio?: string;
  preferred_language?: string;
  role?: AuthorRole;
}

export type TopicStatus = 'draft' | 'published' | 'archived';

export type ReactionTarget = 'topic' | 'comment';
export type ReactionKind = 'like' | 'dislike';

export interface ReactionSummary {
  likes: number;
  dislikes: number;
  user_reaction: ReactionKind | '';
}

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

export interface TopicTranslation {
  language: string;
  title: string;
  description: string;
  source: 'human' | 'ai';
  translated_at: string;
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
