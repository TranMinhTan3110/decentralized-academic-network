import { useState } from 'react';
import { MessageSquare, Trash2, CornerDownRight, Send } from 'lucide-react';
import type { CommentItemDto } from '../../types';

export interface CommentItemProps {
  comment: CommentItemDto;
  currentUserId?: string;
  onReply: (parentId: string, content: string) => Promise<void>;
  onDelete?: (commentId: string) => Promise<void>;
}

export function CommentItemComponent({
  comment,
  currentUserId,
  onReply,
  onDelete,
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const authorName = comment.author?.fullName || (comment.author as any)?.name || 'Thành viên';
  const authorInitials = authorName.slice(0, 2).toUpperCase();
  const isAuthor = Boolean(currentUserId && (comment.author?.userId === currentUserId || (comment.author as any)?.id === currentUserId));

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      await onReply(comment.id, replyText.trim());
      setReplyText('');
      setShowReplyForm(false);
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <div className="comment-item flex flex-col gap-2 p-3 bg-white border border-[#E2E8F0] rounded-xl text-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {comment.author?.avatarUrl ? (
            <img
              src={comment.author.avatarUrl}
              alt={authorName}
              className="w-7 h-7 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-[#0284C7] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
              {authorInitials}
            </div>
          )}
          <div className="min-w-0">
            <span className="font-bold text-[#0F172A] block truncate">{authorName}</span>
            <span className="text-[10px] text-[#94A3B8]">
              {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString('vi-VN') : 'Vừa xong'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {comment.pageNumber && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-[#E0F2FE] text-[#0369A1] rounded-md">
              Trang {comment.pageNumber}
            </span>
          )}
          {isAuthor && onDelete && (
            <button
              onClick={() => onDelete(comment.id)}
              className="p-1 text-[#94A3B8] hover:text-[#EF4444] transition-colors cursor-pointer"
              title="Xóa bình luận"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      <p className="text-[#334155] leading-relaxed text-xs">{comment.content}</p>

      {/* ACTION BAR */}
      <div className="flex items-center gap-3 pt-1 border-t border-[#F1F5F9]">
        <button
          onClick={() => setShowReplyForm(!showReplyForm)}
          className="text-[#0284C7] hover:underline flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
        >
          <MessageSquare size={12} />
          <span>{showReplyForm ? 'Hủy' : 'Trả lời'}</span>
        </button>
      </div>

      {/* REPLY INPUT FORM */}
      {showReplyForm && (
        <form onSubmit={handleSendReply} className="flex items-center gap-2 mt-1">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Viết phản hồi..."
            className="flex-1 px-3 py-1.5 rounded-lg border border-[#CBD5E1] text-xs focus:outline-none focus:ring-1 focus:ring-[#0284C7] bg-[#F8FAFC]"
          />
          <button
            type="submit"
            disabled={!replyText.trim() || submittingReply}
            className="px-3 py-1.5 bg-[#0284C7] hover:bg-[#0369A1] disabled:opacity-50 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
          >
            <Send size={12} />
          </button>
        </form>
      )}

      {/* NESTED REPLIES */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="pl-3 border-l-2 border-[#CBD5E1] space-y-2 mt-2">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="p-2 bg-[#F8FAFC] rounded-lg">
              <div className="flex items-center gap-1.5 mb-1">
                <CornerDownRight size={12} className="text-[#94A3B8]" />
                <span className="font-bold text-[#0F172A] text-[11px]">
                  {reply.author?.fullName || reply.author?.name || 'Thành viên'}
                </span>
                <span className="text-[10px] text-[#94A3B8]">
                  {reply.createdAt ? new Date(reply.createdAt).toLocaleDateString('vi-VN') : ''}
                </span>
              </div>
              <p className="text-xs text-[#334155]">{reply.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
