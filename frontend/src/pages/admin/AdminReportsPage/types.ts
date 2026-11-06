export type ReportStatus = 'OPEN' | 'CONFIRMED' | 'DISMISSED';

export type ReportReason = 'COPYRIGHT_INFRINGEMENT' | 'POOR_QUALITY' | 'INAPPROPRIATE' | 'SPAM';

export interface ReportItem {
    id: string;
    docId: string;
    docTitle: string;
    author: string;
    authorTitle?: string;
    faculty?: string;
    univ?: string;
    cid?: string;
    size?: string;
    reason: ReportReason;
    reporter: string;
    when: string;
    status: ReportStatus;
    note: string;
    peer?: string;
}
