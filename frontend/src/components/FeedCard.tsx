import { useState, useEffect, useRef } from 'react';
import { Heart, Bookmark, FileText, MessageSquare, Send, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { type DocumentItem } from '../data/documents';
import { documentService } from '../services/documentService';
import type { DocumentFeedItem } from '../types';
import { useAuth } from '../lib/authStore';

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
    setLiked(nextState);
    setLikesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));
    try {
      const serverLiked = await documentService.toggleLike(item.id);
      if (typeof serverLiked === 'boolean' && serverLiked !== nextState) {
        setLiked(serverLiked);
        setLikesCount((prev) => (serverLiked ? prev + 1 : Math.max(0, prev - 1)));
      }
    } catch {
      // Revert optimistic update on failure
      setLiked(!nextState);
      setLikesCount((prev) => (!nextState ? prev + 1 : Math.max(0, prev - 1)));
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
      // Revert optimistic update on failure
      setSaved(!nextState);
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    const text = commentInput.trim();
    const newComment: CommentItem = {
      id: `comment-${Date.now()}`,
      author: 'Bạn (Người dùng)',
      time: 'Vừa xong',
      text,
    };
    setCommentsList((prev) => [...prev, newComment]);
    setCommentInput('');
    try {
      await documentService.addComment(item.id, text);
    } catch {
      // Local addition remains
    }
  };

  // Field extraction compatible with both legacy DocumentItem and backend DocumentFeedItem
  const postContent = item.postText || item.description;
  const timeText = item.sharedAt
    ? item.sharedAt.replace(/^Đã chia sẻ\s*/i, '')
    : item.createdAt || 'Vừa xong';

  const docTitle = item.title || item.document?.title || 'Tài liệu học tập';
  const docCategory = item.courseName || item.facultyName || item.document?.category || item.category || 'Học thuật';
  const docYear = item.academicYear || item.document?.year || (item.year ? String(item.year) : '2026');
  const docTypeLabel = item.documentType || item.document?.typeLabel || item.kind || 'Tài liệu';
  const pageCountVal = item.pageCount || (Array.isArray(item.pages) ? item.pages.length : item.pages);
  const docPagesText = item.document?.pagesText || (pageCountVal ? `${pageCountVal} trang` : 'Tài liệu');

  const authorName = item.author?.fullName || item.author?.name || 'Tác giả';
  const authorAvatar = item.author?.avatarUrl || item.author?.avatar || '';
  const authorInitials = item.author?.initials || item.author?.avatarText || authorName.slice(0, 2).toUpperCase() || 'TL';
  const authorSubtext = item.author?.school || item.author?.role || 'Thành viên';

  return (
    <article className="feed-card bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow duration-200 flex flex-col justify-between h-full">
      {/* 1. HEADER: AUTHOR INFO */}
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

        {/* 2. POST CAPTION / TEXT */}
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

        {/* 3. INNER DOCUMENT PREVIEW CARD */}
        <div
          onClick={() => navigate(`/detail/${item.id}`)}
          className="document-preview-box bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-3 sm:p-4 flex items-center gap-3.5 mb-4 hover:bg-[#F1F5F9] transition-colors cursor-pointer group"
        >
          {/* Solid Thumbnail Square */}
          <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-xl bg-[#0284c7] flex flex-col items-center justify-center text-white shrink-0 shadow-xs group-hover:scale-[1.02] transition-transform p-1.5 text-center">
            <FileText size={28} className="mb-1 stroke-[1.75]" />
            <span className="text-xs font-semibold tracking-wide leading-tight line-clamp-1">{docTypeLabel}</span>
          </div>

          {/* Right Document Info */}
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

      {/* 4. FOOTER ACTION BAR */}
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
              onClick={() => setShowComments(!showComments)}
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

        {/* 5. COMMENTS SECTION */}
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
  onDataLoaded?: (meta: { last: boolean; totalElements: number }) => void;
}

export function FeedGrid({ activeTab = 'for-you', limit = 4, onDataLoaded }: FeedGridProps) {
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
        let res;
        if (activeTab === 'trending') {
          res = await documentService.getTrending(limit);
        } else {
          res = await documentService.getFeed({
            filter: activeTab,
            page: 0,
            size: limit,
          });
        }

        if (active && res) {
          const list = Array.isArray(res) ? res : (res.content || []);
          const isLast = Array.isArray(res) ? true : (res.last ?? (list.length < limit));
          const total = Array.isArray(res) ? list.length : (res.totalElements ?? list.length);
          setItems(list);
          setLoading(false);
          onDataLoadedRef.current?.({ last: isLast, totalElements: total });
          return;
        }
      } catch {
        if (active) {
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
  }, [activeTab, limit, currentUser?.id, isAuthenticated]);

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
