export interface School {
  id: string;
  name: string;
  short: string;
  city?: string;
}

export interface Subject {
  id: string;
  name: string;
  area?: string;
  code?: string;
}

export interface DocumentPage {
  heading: string;
  paragraphs: string[];
}

export interface DocumentItem {
  id: string;
  title: string;
  category: string;
  school?: string;
  subject?: string;
  kind?: string;
  year?: string | number;
  gradient?: string;
  author: {
    name: string;
    initials?: string;
    role?: string;
    school?: string;
    followersCount?: string;
    avatar?: string;
  };
  pages?: number | string | DocumentPage[];
  fileSize?: string;
  description?: string;
  sharedAt?: string;
  createdAt?: string;
  postText?: string;
  document?: {
    title: string;
    typeLabel: string;
    category: string;
    year: string;
    pagesText: string;
    gradient: string;
  };
  likes: number;
  views?: number;
  comments?: number;
  saves: number;
  tabCategory: 'for-you' | 'following' | 'trending';
  tags?: string[];
  updated?: string;
}

/**
 * @deprecated Runtime mock documents have been removed in favor of backend API endpoints.
 * Use mockTestDocuments from src/tests/fixtures/documents.fixture.ts for unit tests.
 */
export const documents: DocumentItem[] = [];
