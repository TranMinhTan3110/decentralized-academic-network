import { useCallback } from 'react';

export interface SocialActivity {
  id?: string;
  documentId: string;
  type: 'view' | 'like' | 'save' | 'comment' | 'upload';
  text?: string;
  createdAt?: string | number;
}

export interface DraftData {
  title: string;
  school: string;
  subject: string;
  kind: string;
  year: string;
}

const activities: SocialActivity[] = [];
const localDrafts: DraftData[] = [];

// Module-level snapshot để hook đọc được trạng thái mới nhất giữa các lần render
let uploadedIdsSnapshot: string[] = [];

export function useSocial() {
  const recordActivity = useCallback((activity: SocialActivity) => {
    activities.push(activity);
    if (activity.type === 'upload') {
      uploadedIdsSnapshot = activities
        .filter((a) => a.type === 'upload')
        .map((a) => a.documentId);
    }
  }, []);

  const publishLocalDraft = useCallback((draft: DraftData): string => {
    const id = `draft-${Date.now()}`;
    localDrafts.push(draft);
    activities.push({ documentId: id, type: 'view' });
    return id;
  }, []);

  const uploadedDocumentIds = uploadedIdsSnapshot;

  return {
    recordActivity,
    publishLocalDraft,
    activities,
    localDrafts,
    uploadedDocumentIds,
  };
}

