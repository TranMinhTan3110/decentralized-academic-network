import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Heart, Bookmark, FileText, Download } from 'lucide-react';
import { documents, type DocumentItem } from '../data/documents';

interface FeedCardProps {
  document: DocumentItem;
}

export function FeedCard({ document }: FeedCardProps) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(document.likes);

  const handleLike = () => {
    if (liked) {
      setLiked(false);
      setLikesCount((prev) => prev - 1);
    } else {
      setLiked(true);
      setLikesCount((prev) => prev + 1);
    }
  };

  return (
    <article className="feed-card bg-white border border-[#E2E8F0] rounded-xl p-5 hover:border-[#0284C7] hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-block px-2.5 py-1 text-xs font-semibold bg-[#F0F9FF] text-[#0284C7] rounded-md border border-[#BAE6FD]">
            {document.category}
          </span>
          <span className="text-xs text-[#64748B] flex items-center gap-1">
            <FileText size={14} /> {Array.isArray(document.pages) ? document.pages.length : document.pages} trang • {document.fileSize}
          </span>
        </div>

        <h3 className="text-lg font-bold text-[#0F172A] leading-snug mb-2 hover:text-[#0284C7] transition-colors cursor-pointer">
          <Link to={`/detail/${document.id}`}>{document.title}</Link>
        </h3>

        <p className="text-sm text-[#475569] mb-4 line-clamp-2 leading-relaxed">
          {document.description}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {document.tags.map((tag) => (
            <span key={tag} className="text-xs bg-[#F1F5F9] text-[#475569] px-2 py-0.5 rounded">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-[#F1F5F9] flex items-center justify-between text-xs text-[#64748B]">
        <div className="flex items-center gap-2.5">
          <img
            src={document.author.avatar}
            alt={document.author.name}
            className="w-7 h-7 rounded-full object-cover border border-[#E2E8F0]"
          />
          <div>
            <span className="font-semibold text-[#1E293B] block leading-none">{document.author.name}</span>
            <span className="text-[11px] text-[#94A3B8]">{document.author.role}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Eye size={14} /> {document.views}
          </span>

          <button
            onClick={handleLike}
            className={`flex items-center gap-1 border-none bg-transparent cursor-pointer transition-colors ${
              liked ? 'text-[#EF4444]' : 'hover:text-[#EF4444]'
            }`}
            aria-label="Yêu thích bài viết"
          >
            <Heart size={14} fill={liked ? '#EF4444' : 'none'} />
            <span>{likesCount}</span>
          </button>

          <button
            onClick={() => setSaved(!saved)}
            className={`flex items-center gap-1 border-none bg-transparent cursor-pointer transition-colors ${
              saved ? 'text-[#0284C7]' : 'hover:text-[#0284C7]'
            }`}
            aria-label="Lưu bài viết"
          >
            <Bookmark size={14} fill={saved ? '#0284C7' : 'none'} />
          </button>
        </div>
      </div>
    </article>
  );
}

interface FeedGridProps {
  activeTab?: 'for-you' | 'following' | 'trending';
  limit?: number;
}

export function FeedGrid({ activeTab = 'for-you', limit }: FeedGridProps) {
  const filteredDocs = documents.filter((doc) => {
    if (activeTab === 'for-you') return true;
    return doc.tabCategory === activeTab;
  });

  const displayDocs = limit ? filteredDocs.slice(0, limit) : filteredDocs;

  if (displayDocs.length === 0) {
    return (
      <div className="py-12 text-center text-[#64748B]">
        <p className="text-base font-medium">Chưa có bài viết nào trong mục này.</p>
        <p className="text-sm mt-1">Hãy khám phá các mục khác hoặc theo dõi thêm người dùng mới!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {displayDocs.map((doc) => (
        <FeedCard key={doc.id} document={doc} />
      ))}
    </div>
  );
}
