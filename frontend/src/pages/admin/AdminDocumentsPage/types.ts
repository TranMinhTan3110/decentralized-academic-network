export type DocumentStatus = 'PENDING' | 'FLAGGED' | 'PUBLISHED' | 'REJECTED' | 'DELETED';

export interface AdminDocument {
    id: string;
    title: string;
    cid: string;
    size: string;
    faculty: string;
    univ: string;
    author: string;
    authorTitle: string;
    reads: number;
    likes: number;
    comments: number;
    bookmarks: number;
    createdAt?: string;
    reports?: number;
    status?: DocumentStatus;
    fileExtension?: string;
    totalPages?: number;
    ok?: number;
    total?: number;
    peer?: string;
}

export type DocTabType = 'ALL' | 'REVIEW' | 'PUBLISHED' | 'REJECTED' | 'DELETED';
