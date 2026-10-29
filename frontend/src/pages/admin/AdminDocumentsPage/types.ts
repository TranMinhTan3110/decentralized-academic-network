export type DocumentStatus = 'PENDING' | 'FLAGGED' | 'PUBLISHED' | 'REJECTED';

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
    reports: number;
    status: DocumentStatus;
    ok?: number;
    total?: number;
    peer?: string;
}

export type DocTabType = 'ALL' | 'REVIEW' | 'PUBLISHED' | 'REJECTED';
