import { useState, useEffect } from 'react';
import { MessageCircle, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { documentService } from '../../services/documentService';
import type { CommentItemDto } from '../../types';
import { CommentItemComponent } from './CommentItem';

export interface CommentSectionProps {
  documentId: string;
  currentPage?: number;
  isAuthenticated?: boolean;
  currentUserId?: string;
}

export function CommentSection({
  documentId,
  currentPage,
  isAuthenticated = false,
  currentUserId,
}: CommentSectionProps) {
  const [comments, setComments] = useState<CommentItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [attachCurrentPage, setAttachCurrentPage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadComments = async () => {
    if (!documentId) return;
    setLoading(true);
    try {
      const res = await documentService.getComments(documentId, 0, 50);
      if (res && res.content) {
        setComments(res.content);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [documentId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      const pageNum = attachCurrentPage && currentPage !== undefined ? currentPage + 1 : undefined;
      const newComment = await documentService.addComment(documentId, content.trim(), pageNum);
      toast.success('Đã đăng bình luận!');
      setContent('');
      setAttachCurrentPage(false);
      // Append to list optimistically or reload
      if (newComment && newComment.id) {
        setComments((prev) => [newComment, ...prev]);
      } else {
        await loadComments();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Không thể gửi bình luận. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId: string, replyText: string) => {
    try {
      const reply = await documentService.addComment(documentId, replyText, undefined, parentId);
      toast.success('Đã gửi phản hồi!');
      if (reply) {
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === parentId) {
              return {
                ...c,
                replies: [...(c.replies || []), reply],
              };
            }
            return c;
          })
        );
      } else {
        await loadComments();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Không thể gửi phản hồi.');
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await documentService.deleteComment(commentId);
      toast.success('Đã xóa bình luận.');
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err: any) {
      toast.error(err?.message || 'Không thể xóa bình luận.');
    }
  };

  return (
    <div className="comment-section bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0] flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
        <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
          <MessageCircle size={16} className="text-[#0284C7]" />
          <span>Bình luận thảo luận ({comments.length})</span>
        </h3>
      </div>

      {/* INPUT FORM */}
      <form onSubmit={handleAddComment} className="flex flex-col gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            isAuthenticated
              ? 'Chia sẻ ý kiến, thắc mắc hoặc ghi chú của bạn...'
              : 'Đăng nhập để tham gia thảo luận...'
          }
          className="w-full p-2.5 rounded-xl border border-[#CBD5E1] text-xs focus:outline-none focus:ring-2 focus:ring-[#0284C7] bg-white resize-y min-h-[64px]"
        />

        <div className="flex items-center justify-between gap-2">
          {currentPage !== undefined && (
            <label className="flex items-center gap-1.5 text-[11px] text-[#64748B] cursor-pointer">
              <input
                type="checkbox"
                checked={attachCurrentPage}
                onChange={(e) => setAttachCurrentPage(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-[#CBD5E1] text-[#0284C7] focus:ring-[#0284C7]"
              />
              <span>Gắn thẻ Trang {currentPage + 1}</span>
            </label>
          )}

          <button
            type="submit"
            disabled={!content.trim() || submitting}
            className="ml-auto px-4 py-2 bg-[#0284C7] hover:bg-[#0369A1] disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            {submitting ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Send size={13} />
            )}
            <span>Gửi</span>
          </button>
        </div>
      </form>

      {/* COMMENTS LIST */}
      {loading && comments.length === 0 ? (
        <div className="py-6 flex items-center justify-center gap-2 text-xs text-[#64748B]">
          <Loader2 size={16} className="animate-spin text-[#0284C7]" />
          <span>Đang tải bình luận...</span>
        </div>
      ) : comments.length === 0 ? (
        <div className="py-6 text-center text-xs text-[#94A3B8]">
          Chưa có bình luận nào. Hãy là người đầu tiên để lại ý kiến!
        </div>
      ) : (
        <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
          {comments.map((comment) => (
            <CommentItemComponent
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onReply={handleReply}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
