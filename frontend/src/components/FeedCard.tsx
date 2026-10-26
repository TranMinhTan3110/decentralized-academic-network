import { useState, useEffect, useRef } from 'react';
import { Heart, Bookmark, FileText, MessageSquare, Send, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { documents, type DocumentItem } from '../data/documents';
import { documentService } from '../services/documentService';
import type { DocumentFeedItem } from '../types';
import { docTypeLabel as formatDocType } from '../lib/docTypes';
import { DocumentThumbnail } from './ui/DocumentThumbnail';
import { useAuth } from '../lib/authStore';
import {
  fetchTrendingRecommendations,
  mapTrendingToDocumentItems,
  fetchPersonalRecommendations,
  mapPersonalToDocumentItems,
} from '../services/recommendationService';

interface FeedCardProps {
  document: DocumentItem | DocumentFeedItem | any;
}

interface CommentItem {
  id: string;
  author: string;
  time: string;
  text: string;
}

export function FeedCard({ document: item }: FeedCardProps) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState<boolean>(item.hasLiked ?? item.isLiked ?? false);
  const [saved, setSaved] = useState<boolean>(item.hasBookmarked ?? item.isBookmarked ?? false);
  const [likesCount, setLikesCount] = useState<number>(item.likeCount ?? item.likes ?? 0);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [showComments, setShowComments] = useState<boolean>(false);
  const [commentInput, setCommentInput] = useState<string>('');
  const [commentsList, setCommentsList] = useState<CommentItem[]>([]);

  useEffect(() => {
    setLiked(item.hasLiked ?? item.isLiked ?? false);
    setSaved(item.hasBookmarked ?? item.isBookmarked ?? false);
    setLikesCount(item.likeCount ?? item.likes ?? 0);
  }, [item.id, item.hasLiked, item.isLiked, item.hasBookmarked, item.isBookmarked, item.likeCount, item.likes]);

  const handleLike = async () => {
    const nextState = !liked;
    const baseCount = likesCount;
    setLiked(nextState);
    setLikesCount(nextState ? baseCount + 1 : Math.max(0, baseCount - 1));
    try {
      const serverLiked = await documentService.toggleLike(item.id);
      if (typeof serverLiked === 'boolean' && serverLiked !== nextState) {
        setLiked(serverLiked);
        setLikesCount(serverLiked ? baseCount + 1 : Math.max(0, baseCount - 1));
      }
    } catch {
      setLiked(!nextState);
      setLikesCount(baseCount);
    }
  };

  const handleBookmark = async () => {
    const nextState = !saved;
    setSaved(nextState);
    try {
      const serverSaved = await documentService.toggleBookmark(item.id);
      if (typeof serverSaved === 'boolean' && serverSaved !== nextState) {
        setSaved(serverSaved);
      }
    } catch {
      setSaved(!nextState);
    }
  };

  const loadComments = async () => {
    try {
      const res = await documentService.getComments(item.id, 0, 20);
      const raw = Array.isArray(res) ? res : res?.content || [];
      const mapped: CommentItem[] = raw.map((c: any) => ({
        id: c.id,
        author: c.author?.fullName || c.author?.name || 'Thành viên',
        time: c.createdAt ? new Date(c.createdAt).toLocaleDateString('vi-VN') : 'Vừa xong',
        text: c.content || '',
      }));
      setCommentsList(mapped);
    } catch {
      // Keep whatever is already shown
    }
  };

  const handleToggleComments = () => {
    const next = !showComments;
    setShowComments(next);
    if (next && commentsList.length === 0) {
      loadComments();
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    const text = commentInput.trim();
    setCommentInput('');
    try {
      const created = await documentService.addComment(item.id, text);
      setCommentsList((prev) => [
        ...prev,
        {
          id: created?.id || `comment-${Date.now()}`,
          author: created?.author?.fullName || created?.author?.name || 'Bạn',
          time: 'Vừa xong',
          text,
        },
      ]);
    } catch (err: any) {
      toast.error(err?.message || 'Không thể gửi bình luận. Vui lòng thử lại.');
      setCommentInput(text);
    }
  };

  const postContent = item.postText || item.description;
  const timeText = item.sharedAt
    ? item.sharedAt.replace(/^Đã chia sẻ\s*/i, '')
    : item.createdAt || 'Vừa xong';

  const docTitle = item.title || item.document?.title || 'Tài liệu học tập';
  const docCategory = item.courseName || item.facultyName || item.document?.category || item.category || 'Học thuật';
  const docYear = item.academicYear || item.document?.year || (item.year ? String(item.year) : '');
  const docTypeText = formatDocType(item.docType || item.documentType || item.kind);
  const pageCountVal = item.totalPages || item.pageCount || (Array.isArray(item.pages) ? item.pages.length : item.pages);
  const docPagesText = item.document?.pagesText || (pageCountVal ? `${pageCountVal} trang` : 'Tài liệu');

  const authorName = item.author?.fullName || item.author?.name || 'Tác giả';
  const authorAvatar = item.author?.avatarUrl || item.author?.avatar || '';
  const authorInitials = item.author?.initials || item.author?.avatarText || authorName.slice(0, 2).toUpperCase() || 'TL';
  const authorSubtext = item.author?.school || item.author?.role || 'Thành viên';

  return (
    <article className="feed-card bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow duration-200 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            {authorAvatar ? (
              <img
                src={authorAvatar}
                alt={authorName}
                className="w-10 h-10 rounded-full object-cover border border-[#E2E8F0] shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#DBEAFE] text-[#1D4ED8] font-bold text-sm flex items-center justify-center shrink-0 border border-[#BFDBFE]">
                {authorInitials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="text-sm sm:text-base font-bold text-[#0F172A] leading-tight truncate">{authorName}</h4>
              <p className="text-xs text-[#64748B] leading-tight mt-0.5 truncate">
                {authorSubtext}
                {item.author?.followersCount ? ` • ${item.author.followersCount}` : ''}
              </p>
            </div>
          </div>

          <span className="text-xs text-[#94A3B8] shrink-0 font-normal">
            {timeText}
          </span>
        </div>

        {postContent && (
          <div className="mb-4 text-sm text-[#334155] leading-relaxed font-normal">
            <p
              onClick={() => setIsExpanded(!isExpanded)}
              className={`cursor-pointer ${isExpanded ? '' : 'line-clamp-2'}`}
              title={isExpanded ? 'Bấm để thu gọn' : 'Bấm để xem đầy đủ'}
            >
              {postContent}
            </p>
          </div>
        )}

        <div
          onClick={() => navigate(`/detail/${item.id}`)}
          className="document-preview-box bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-3 sm:p-4 flex items-center gap-3.5 mb-4 hover:bg-[#F1F5F9] transition-colors cursor-pointer group"
        >
          <DocumentThumbnail
            thumbnailUrl={item.thumbnailUrl}
            title={docTitle}
            label={docTypeText}
            className="w-20 h-20 sm:w-22 sm:h-22 rounded-xl group-hover:scale-[1.02] transition-transform"
          />

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-[#E0F2FE] text-[#0369A1] rounded-md">
                {docCategory}
              </span>
              <span className="px-2.5 py-0.5 text-xs font-medium bg-[#F1F5F9] text-[#475569] rounded-md border border-[#E2E8F0]">
                {docYear}
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-bold text-[#0F172A] leading-snug line-clamp-2 group-hover:text-[#0284C7] transition-colors mb-1" title={docTitle}>
              {docTitle}
            </h3>

            <p className="text-xs text-[#64748B] flex items-center gap-1 font-medium">
              <FileText size={14} className="text-[#64748B] shrink-0" /> {docPagesText}
            </p>
          </div>
        </div>
      </div>

      <div>
        <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs text-[#64748B]">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 border-none bg-transparent cursor-pointer text-xs font-medium transition-colors ${
                liked ? 'text-[#EF4444]' : 'hover:text-[#EF4444]'
              }`}
              aria-label="Thả tim bài viết"
            >
              <Heart size={18} fill={liked ? '#EF4444' : 'none'} stroke={liked ? '#EF4444' : 'currentColor'} />
              <span>{likesCount}</span>
            </button>

            <button
              onClick={handleToggleComments}
              className={`flex items-center gap-1.5 border-none cursor-pointer text-xs font-medium transition-colors ${
                showComments
                  ? 'bg-[#EFF6FF] text-[#0284C7] px-2.5 py-1 rounded-lg'
                  : 'text-[#64748B] hover:text-[#0284C7] bg-transparent'
              }`}
              aria-label="Bình luận"
            >
              <MessageSquare size={18} />
              <span>{(item.commentCount ?? item.comments ?? 0) + commentsList.length}</span>
            </button>
          </div>

          <button
            onClick={handleBookmark}
            className={`flex items-center border-none bg-transparent cursor-pointer transition-colors ${
              saved ? 'text-[#0284C7]' : 'text-[#64748B] hover:text-[#0284C7]'
            }`}
            aria-label="Lưu bài viết"
          >
            <Bookmark size={18} fill={saved ? '#0284C7' : 'none'} />
          </button>
        </div>

        {showComments && (
          <div className="mt-3 pt-3 border-t border-[#F1F5F9] space-y-3">
            <p className="text-xs font-semibold text-[#475569]">Viết bình luận</p>

            <form onSubmit={handleSendComment} className="flex items-center gap-2">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Chia sẻ một mẹo học..."
                className="flex-1 text-xs border border-[#CBD5E1] rounded-xl px-3 py-2 focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7] bg-white text-[#0F172A]"
              />
              <button
                type="submit"
                disabled={!commentInput.trim()}
                className="p-2 text-[#0284C7] hover:bg-[#F0F9FF] disabled:opacity-40 disabled:hover:bg-transparent rounded-lg border-none bg-transparent cursor-pointer transition-colors shrink-0"
                aria-label="Gửi bình luận"
              >
                <Send size={18} />
              </button>
            </form>

            {commentsList.length > 0 && (
              <div className="space-y-2 mt-2 max-h-48 overflow-y-auto pr-1">
                {commentsList.map((comment) => (
                  <div key={comment.id} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[#0F172A]">{comment.author}</span>
                      <span className="text-[10px] text-[#94A3B8]">{comment.time}</span>
                    </div>
                    <p className="text-[#334155] leading-relaxed">{comment.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

interface FeedGridProps {
  activeTab?: 'for-you' | 'following' | 'trending';
  limit?: number;
  page?: number;
  onDataLoaded?: (meta: { last: boolean; totalElements: number }) => void;
}

/**
 * AI recommendation service không trả thumbnailUrl — enrich từ document-service
 * theo document_id. Id không tồn tại (dữ liệu mẫu) sẽ 404 và giữ nguyên fallback ô xanh.
 */
async function enrichThumbnails(items: any[]): Promise<any[]> {
  const missing = items.filter((it) => it && !it.thumbnailUrl && it.id);
  if (missing.length === 0) return items;

  const results = await Promise.allSettled(
    missing.map((it) => documentService.getDetail(it.id))
  );
  // Id AI trả về có thể là template/cold-start (không tồn tại trong DB) —
  // item không resolve được bị LOẠI BỎ thay vì hiện metadata mẫu;
  // item resolve được được đè toàn bộ bằng dữ liệu thật.
  const detailById = new Map<string, any>();
  results.forEach((r) => {
    if (r.status === 'fulfilled' && r.value?.id) {
      detailById.set(r.value.id, r.value);
    }
  });

  const missingSet = new Set(missing);
  const kept = items.filter((it) => !missingSet.has(it) || detailById.has(it.id ?? ''));
  if (kept.length === 0) return kept;

  return kept.map((it) => {
    const detail = detailById.get(it.id);
    if (!detail) return it;
    return {
      ...it,
      thumbnailUrl: detail.thumbnailUrl || it.thumbnailUrl,
      title: detail.title || it.title,
      docType: detail.docType || it.docType,
      courseName: detail.courseName || it.courseName,
      category: detail.courseName || it.category,
      universityName: detail.universityName || it.universityName,
      academicYear: detail.academicYear || it.academicYear,
      totalPages: detail.totalPages || it.totalPages,
      author: detail.author?.fullName
        ? {
            ...it.author,
            name: detail.author.fullName,
            avatar: detail.author.avatarUrl || it.author?.avatar,
          }
        : it.author,
    };
  });
}

export function FeedGrid({ activeTab = 'for-you', limit = 4, page = 0, onDataLoaded }: FeedGridProps) {
  const { currentUser, isAuthenticated } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const onDataLoadedRef = useRef(onDataLoaded);
  onDataLoadedRef.current = onDataLoaded;

  useEffect(() => {
    let active = true;
    setLoading(true);

    const loadFeed = async () => {
      try {
        // 1. DÀNH CHO BẠN (FOR-YOU)
        if (activeTab === 'for-you') {
          if (page === 0) {
            try {
              const aiRes = await fetchPersonalRecommendations(
                (currentUser as any)?.universityId,
                (currentUser as any)?.major,
                limit
              );
              if (active && aiRes?.items && aiRes.items.length > 0) {
                const mapped = await enrichThumbnails(mapPersonalToDocumentItems(aiRes.items));
                // Sau khi loại item giả mà vẫn còn item thật → dùng; rỗng thì rơi xuống DB feed
                if (mapped.length > 0) {
                  if (active) {
                    setItems(mapped);
                    setLoading(false);
                    onDataLoadedRef.current?.({ last: true, totalElements: mapped.length });
                  }
                  return;
                }
              }
            } catch {
              // Fallback to database
            }
          }

          const res = await documentService.getFeed({
            filter: 'for-you',
            page,
            size: limit,
          });

          if (active && res) {
            const list = Array.isArray(res) ? res : (res.content || []);
            const isLast = Array.isArray(res) ? true : (res.last ?? (list.length < limit));
            const total = Array.isArray(res) ? list.length : (res.totalElements ?? list.length);

            if (list.length > 0 || page > 0) {
              setItems((prev) => (page === 0 ? list : [...prev, ...list]));
              setLoading(false);
              onDataLoadedRef.current?.({ last: isLast, totalElements: total });
              return;
            }
          }

          if (active && page === 0) {
            const fallbackList = documents.slice(0, limit);
            setItems(fallbackList);
            setLoading(false);
            onDataLoadedRef.current?.({ last: true, totalElements: fallbackList.length });
            return;
          }
        }

        // 2. ĐANG THỊNH HÀNH (TRENDING)
        else if (activeTab === 'trending') {
          try {
            const aiRes = await fetchTrendingRecommendations(limit);
            if (active && aiRes?.items && aiRes.items.length > 0) {
              let mapped = await enrichThumbnails(mapTrendingToDocumentItems(aiRes.items));
              if (mapped.length > 0) {
                const hasCppDoc = mapped.some((d) => d.title.includes('Cấu Trúc Dữ Liệu'));
                if (!hasCppDoc) {
                  const defaultCpp = documents.find((d) => d.id === 'doc-3');
                  if (defaultCpp) mapped = [...mapped, defaultCpp];
                }
                if (active) {
                  setItems(mapped);
                  setLoading(false);
                  onDataLoadedRef.current?.({ last: true, totalElements: mapped.length });
                }
                return;
              }
            }
          } catch {
            // Fallback to database
          }

          const res = await documentService.getTrending(limit);
          if (active && res) {
            const list = Array.isArray(res) ? res : ((res as any)?.content || []);
            if (list.length > 0) {
              setItems(list);
              setLoading(false);
              onDataLoadedRef.current?.({ last: true, totalElements: list.length });
              return;
            }
          }

          if (active) {
            const trendingDocs = documents.filter((doc) => doc.tabCategory === 'trending');
            const fallbackList = trendingDocs.slice(0, limit);
            setItems(fallbackList);
            setLoading(false);
            onDataLoadedRef.current?.({ last: true, totalElements: fallbackList.length });
            return;
          }
        }

        // 3. ĐANG THEO DÕI (FOLLOWING) & CÁC TAB KHÁC
        else {
          const res = await documentService.getFeed({
            filter: activeTab,
            page,
            size: limit,
          });

          if (active && res) {
            const list = Array.isArray(res) ? res : (res.content || []);
            const isLast = Array.isArray(res) ? true : (res.last ?? (list.length < limit));
            const total = Array.isArray(res) ? list.length : (res.totalElements ?? list.length);

            setItems((prev) => (page === 0 ? list : [...prev, ...list]));
            setLoading(false);
            onDataLoadedRef.current?.({ last: isLast, totalElements: total });
            return;
          }
        }
      } catch {
        if (active) {
          if (page === 0) {
            const fallbackDocs = documents.filter((doc) => {
              if (activeTab === 'for-you') return true;
              return doc.tabCategory === activeTab;
            });
            const displayFallback = limit ? fallbackDocs.slice(0, limit) : fallbackDocs;
            setItems(displayFallback);
            setLoading(false);
            onDataLoadedRef.current?.({ last: true, totalElements: displayFallback.length });
            return;
          }

          setItems([]);
          setLoading(false);
          onDataLoadedRef.current?.({ last: true, totalElements: 0 });
        }
        return;
      }

      if (active) {
        setItems([]);
        setLoading(false);
        onDataLoadedRef.current?.({ last: true, totalElements: 0 });
      }
    };

    loadFeed();

    return () => {
      active = false;
    };
  }, [activeTab, limit, page, currentUser?.id, isAuthenticated]);

  if (loading && items.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-3 text-[#64748B]">
        <Loader2 size={24} className="animate-spin text-[#0284C7]" />
        <p className="text-sm">Đang tải dòng chia sẻ học tập...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-[#64748B]">
        <p className="text-base font-medium">Chưa có bài viết nào trong mục này.</p>
        <p className="text-sm mt-1">Hãy khám phá các mục khác hoặc theo dõi thêm người dùng mới!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5">
      {items.map((doc) => (
        <FeedCard key={`${currentUser?.id || 'guest'}-${doc.id}`} document={doc} />
      ))}
    </div>
  );
}
