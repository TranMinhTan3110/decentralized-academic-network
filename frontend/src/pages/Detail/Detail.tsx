import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Download, FileText, Minus, Plus, MessageCircle, UserPlus, UserCheck, Heart } from 'lucide-react';
import { documents, schoolName, subjectName } from '../../data/documents';
import { useLibrary } from '../../lib/store';
import { useSocial } from '../../lib/socialStore';
import { DocumentList, EmptyState, SaveButton } from '../../components';

function nfc(text: string): string {
  return text ? text.normalize('NFC') : text;
}

export interface CommentItem {
  id: string;
  name: string;
  time: string;
  text: string;
  avatarBg: string;
}

const initialCommentsMap: Record<string, CommentItem[]> = {
  'doc-1': [
    { id: 'c1-1', name: 'Minh Anh', time: '2 giờ trước', text: 'Tài liệu xịn quá, phần ví dụ rất dễ hiểu luôn.', avatarBg: '#E11D48' },
    { id: 'c1-2', name: 'Đức Minh', time: '1 ngày trước', text: 'Bạn có đề cương phần tiếp theo không share mình với?', avatarBg: '#16A34A' },
    { id: 'c1-3', name: 'Hoàng Nam', time: '2 ngày trước', text: 'Cảm ơn tác giả đã tổng hợp bài giảng NEU!', avatarBg: '#0284C7' },
    { id: 'c1-4', name: 'Thu Thảo', time: '3 ngày trước', text: 'Đã lưu lại để chuẩn bị cho kỳ thi giữa kỳ.', avatarBg: '#8B5CF6' },
    { id: 'c1-5', name: 'Vũ Hoàng', time: '3 ngày trước', text: 'Phần dịch chuyển đường cung cầu viết rất súc tích.', avatarBg: '#F59E0B' },
    { id: 'c1-6', name: 'Mai Phương', time: '4 ngày trước', text: 'Ví dụ tính Pe và Qe cực dễ áp dụng.', avatarBg: '#EC4899' },
    { id: 'c1-7', name: 'Quốc Anh', time: '5 ngày trước', text: 'Rất hữu ích cho sinh viên K66!', avatarBg: '#10B981' },
    { id: 'c1-8', name: 'Ngọc Bích', time: '5 ngày trước', text: 'Cho mình hỏi thêm bài tập chương 2 nhé.', avatarBg: '#6366F1' },
    { id: 'c1-9', name: 'Bảo Long', time: '6 ngày trước', text: 'Tài liệu chuẩn mực chất lượng cao.', avatarBg: '#14B8A6' },
    { id: 'c1-10', name: 'Thanh Hằng', time: '1 tuần trước', text: 'Đánh giá 5 sao!', avatarBg: '#F43F5E' },
    { id: 'c1-11', name: 'Tuấn Kiệt', time: '1 tuần trước', text: 'Giải thích mạch lạc.', avatarBg: '#84CC16' },
    { id: 'c1-12', name: 'Việt Dũng', time: '2 tuần trước', text: 'Bài viết đính kèm hình vẽ trực quan.', avatarBg: '#06B6D4' },
  ],
  'doc-2': [
    { id: 'c2-1', name: 'Thanh Hà', time: '1 giờ trước', text: 'Công thức tính co giãn chéo rất dễ nhớ, cảm ơn bạn!', avatarBg: '#0284C7' },
    { id: 'c2-2', name: 'Gia Bảo', time: '5 giờ trước', text: 'Có đáp án bài tập tình huống ở trang 2 không bạn?', avatarBg: '#16A34A' },
    { id: 'c2-3', name: 'Yến Nhi', time: '1 ngày trước', text: 'Tài liệu FTU lúc nào cũng xịn xò.', avatarBg: '#E11D48' },
    { id: 'c2-4', name: 'Nhật Minh', time: '2 ngày trước', text: 'Đã bookmark lại rồi nè.', avatarBg: '#8B5CF6' },
  ],
  'doc-3': [
    { id: 'c3-1', name: 'Khánh Linh', time: '30 phút trước', text: 'Phần Cây AVL và Bảng băm viết bằng C++ rất trực quan.', avatarBg: '#8B5CF6' },
    { id: 'c3-2', name: 'Minh Quân', time: '3 giờ trước', text: 'Bách Khoa K65 đỉnh quá bro ơi!', avatarBg: '#0284C7' },
    { id: 'c3-3', name: 'Thành Trung', time: '1 ngày trước', text: 'Xin phép lưu về luyện thi thuật toán.', avatarBg: '#10B981' },
  ],
  'doc-4': [
    { id: 'c4-1', name: 'Phương Thảo', time: '4 giờ trước', text: 'Bảng tra phân phối chuẩn ở cuối rất tiện lợi.', avatarBg: '#EC4899' },
    { id: 'c4-2', name: 'Đăng Khoa', time: '1 ngày trước', text: 'Có đáp án kiểm định H0/H1 không chị ơi?', avatarBg: '#F59E0B' },
  ],
  'doc-5': [
    { id: 'c5-1', name: 'Hoàng Long', time: '1 giờ trước', text: 'Raft Consensus giải thích trực quan lắm anh!', avatarBg: '#6366F1' },
    { id: 'c5-2', name: 'Quỳnh Trang', time: '6 giờ trước', text: 'Bài viết System Design chất lượng hàng đầu.', avatarBg: '#E11D48' },
  ],
  'doc-6': [
    { id: 'c6-1', name: 'Ánh Dương', time: '2 giờ trước', text: 'Sơ đồ Chu trình Krebs vẽ đẹp và dễ thuộc quá!', avatarBg: '#14B8A6' },
    { id: 'c6-2', name: 'Hải Đăng', time: '1 ngày trước', text: 'Dân Y Hà Nội thả tim nè <3', avatarBg: '#E11D48' },
  ],
};

const docCommentsStore: Record<string, CommentItem[]> = { ...initialCommentsMap };

export function Detail() {
  const { id } = useParams();
  
  // Find exact matching document by ID or slug
  const item =
    documents.find((doc) => doc.id === id) ||
    documents.find((doc) => doc.title.toLowerCase().replace(/\s+/g, '-').includes(id?.toLowerCase() || '')) ||
    documents[0];

  const { viewed } = useLibrary();
  const { recordActivity } = useSocial();
  const [page, setPage] = useState(0);
  const [zoom, setZoom] = useState(100);
  
  // Interactive social states
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(item ? item.likes : 0);
  const [following, setFollowing] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>(
    docCommentsStore[item?.id || 'doc-1'] || initialCommentsMap['doc-1']
  );
  const [commentInput, setCommentInput] = useState('');

  const lastRecorded = useRef<string | undefined>(undefined);
  const paperRef = useRef<HTMLDivElement>(null);
  const commentsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (item) {
      viewed(item.id);
      if (lastRecorded.current !== item.id) {
        recordActivity({ documentId: item.id, type: 'view' });
        lastRecorded.current = item.id;
      }
      setLikesCount(item.likes);
      setLiked(false);
      setFollowing(false);
      setComments(docCommentsStore[item.id] || initialCommentsMap[item.id] || initialCommentsMap['doc-1']);
      setPage(0);
      setZoom(100);
    }
    try {
      window.scrollTo(0, 0);
    } catch {
      // Ignore JSDOM not implemented warning in test environment
    }
  }, [item, viewed, recordActivity]);

  if (!item) {
    return (
      <EmptyState title="Không tìm thấy tài liệu" description="Đường dẫn này không có trong kho tài liệu mẫu.">
        <Link className="button primary inline-flex items-center gap-2 px-4 py-2 bg-[#0284C7] text-white rounded-xl font-semibold text-sm" to="/explore">
          Quay lại khám phá
        </Link>
      </EmptyState>
    );
  }

  const pageList = Array.isArray(item.pages) && item.pages.length > 0
    ? item.pages
    : [
        {
          heading: '01. Giới thiệu tổng quan',
          paragraphs: [
            item.description || item.postText || 'Tài liệu chi tiết đang được cập nhật nội dung xem trước.',
          ],
        },
      ];
  const content = pageList[Math.min(page, pageList.length - 1)];
  const related = documents.filter((doc) => doc.id !== item.id);

  const handleToggleLike = () => {
    if (liked) {
      setLiked(false);
      setLikesCount((prev) => Math.max(0, prev - 1));
    } else {
      setLiked(true);
      setLikesCount((prev) => prev + 1);
      recordActivity({ documentId: item.id, type: 'like' });
    }
  };

  const handleToggleFollow = () => {
    setFollowing((prev) => !prev);
  };

  const handleCommentClick = () => {
    commentsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    const newEntry: CommentItem = {
      id: Date.now().toString(),
      name: 'Bạn (Người dùng)',
      time: 'Vừa xong',
      text: commentInput.trim(),
      avatarBg: '#0284C7',
    };
    const currentList = docCommentsStore[item.id] || initialCommentsMap[item.id] || [];
    const updated = [newEntry, ...currentList];
    docCommentsStore[item.id] = updated;
    setComments(updated);
    setCommentInput('');
    recordActivity({ documentId: item.id, type: 'comment' });
  };

  return (
    <div className="detail-page page-enter max-w-7xl mx-auto px-4 py-4">
      <Link className="back-link inline-flex items-center gap-1 text-sm text-[#64748B] hover:text-[#0284C7] mb-4 font-medium transition-colors" to="/explore">
        <ArrowLeft size={16} />Khám phá tài liệu
      </Link>

      <div className="detail-heading mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A] mb-1">{nfc(item.title)}</h1>
        <p className="text-sm font-medium text-[#64748B]">
          {nfc(schoolName(item.school))}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT COLUMN: Author info & Document Viewer */}
        <section className="lg:col-span-2 flex flex-col gap-6" aria-label="Xem trước tài liệu">
          {/* AUTHOR CARD */}
          <div className="bg-white p-5 rounded-2xl border border-[#93C5FD]/60 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link to="/ho-so/lan-chi">
                  {item.author.avatar.startsWith('http') ? (
                    <img src={item.author.avatar} alt={item.author.name} className="w-12 h-12 rounded-full object-cover border border-[#E2E8F0]" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#0284C7] text-white flex items-center justify-center font-bold text-lg">
                      {item.author.avatar.length <= 3 ? item.author.avatar : item.author.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </Link>
                <div>
                  <Link to="/ho-so/lan-chi" className="font-bold text-[#0F172A] text-base hover:text-[#0284C7]">
                    {nfc(item.author.name)}
                  </Link>
                  <div className="text-xs text-[#64748B]">{nfc(item.author.role)}</div>
                </div>
              </div>
              <button
                onClick={handleToggleFollow}
                className={`button secondary flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  following
                    ? 'bg-[#F0F9FF] text-[#0284C7] border-[#BAE6FD]'
                    : 'bg-white text-[#0F172A] border-[#CBD5E1] hover:bg-[#F8FAFC]'
                }`}
              >
                {following ? <UserCheck size={15} /> : <UserPlus size={15} />}
                <span>{following ? 'Đã theo dõi' : 'Theo dõi'}</span>
              </button>
            </div>

            <p className="text-sm text-[#334155] italic">
              "{item.description}"
            </p>

            {/* INTERACTION BUTTONS */}
            <div className="grid grid-cols-3 gap-3 border-t border-[#E2E8F0] pt-4">
              <button
                onClick={handleToggleLike}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs md:text-sm font-semibold transition-colors cursor-pointer ${
                  liked
                    ? 'bg-rose-50 text-[#E11D48] border-[#E11D48]'
                    : 'bg-white text-[#E11D48] border-[#F43F5E] hover:bg-rose-50'
                }`}
              >
                <Heart size={16} fill={liked ? '#E11D48' : 'none'} />
                <span>Thích ({likesCount >= 1000 ? `${(likesCount / 1000).toFixed(1)}K` : likesCount})</span>
              </button>

              <button
                onClick={handleCommentClick}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white rounded-xl border border-[#0284C7] text-[#0284C7] text-xs md:text-sm font-semibold hover:bg-sky-50 transition-colors cursor-pointer"
              >
                <MessageCircle size={16} />
                <span>Bình luận ({comments.length})</span>
              </button>

              <SaveButton documentId={item.id} />
            </div>
          </div>

          {/* READER CONTAINER */}
          <div className="border border-[#E2E8F0] rounded-2xl overflow-hidden bg-white shadow-sm">
            <div className="reader-toolbar flex items-center justify-between bg-[#0F172A] text-white px-5 py-3 text-sm font-semibold">
              <span className="flex items-center gap-2">
                <FileText size={17} aria-hidden="true" />Bản xem trước
              </span>
              <div className="flex items-center gap-3">
                <button className="icon-button" aria-label="Giảm cỡ chữ" disabled={zoom <= 85} onClick={() => setZoom(zoom - 15)}>
                  <Minus size={16} />
                </button>
                <span>{zoom}%</span>
                <button className="icon-button" aria-label="Tăng cỡ chữ" disabled={zoom >= 145} onClick={() => setZoom(zoom + 15)}>
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="paper-surround bg-[#E2E8F0] p-6 flex justify-center overflow-x-auto" ref={paperRef}>
              <article className="preview-paper bg-white w-full max-w-[680px] min-h-[480px] p-8 md:p-10 rounded-sm shadow-md text-[#1E293B] leading-relaxed" style={{ fontSize: `${zoom}%`, fontFamily: "'Be Vietnam Pro', Arial, sans-serif" }}>
                <div className="paper-header flex justify-between text-xs font-bold text-[#94A3B8] mb-5 uppercase tracking-wider">
                  <span>MỤC LỤC / TÀI LIỆU MẪU</span>
                  <span>{item.year}</span>
                </div>
                <h2 className="text-xl md:text-2xl font-extrabold text-[#0F172A] mb-2">{nfc(item.title)}</h2>
                <div className="paper-subtitle text-sm text-[#64748B] mb-4">
                  {nfc(subjectName(item.subject))} - {nfc(item.kind)}
                </div>
                <hr className="border-t border-[#E2E8F0] my-4" />
                <h3 className="text-lg font-bold text-[#0F172A] mb-3">{nfc(content.heading)}</h3>
                {content.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-sm md:text-base text-[#334155] mb-4 leading-relaxed">
                    {nfc(paragraph)}
                  </p>
                ))}
              </article>
            </div>

            <div className="reader-pagination flex items-center justify-between bg-[#F8FAFC] px-5 py-3 border-t border-[#E2E8F0] text-sm font-semibold text-[#475569]">
              <button
                className="button secondary flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#CBD5E1] bg-white text-xs font-semibold hover:bg-[#F8FAFC] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                <ChevronLeft size={16} />Trước
              </button>

              <span>Trang {page + 1} / {pageList.length}</span>

              <button
                className="button secondary flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#CBD5E1] bg-white text-xs font-semibold hover:bg-[#F8FAFC] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                disabled={page >= pageList.length - 1}
                onClick={() => setPage((p) => Math.min(pageList.length - 1, p + 1))}
              >
                Tiếp<ChevronRight size={16} />
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Sidebar metadata */}
        <aside className="lg:col-span-1 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-5 sticky top-4">
          <div>
            <h2 className="text-lg font-bold text-[#0F172A] mb-2">Về tài liệu này</h2>
            <p className="text-sm text-[#475569] leading-relaxed mb-4">{nfc(item.description)}</p>
          </div>

          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between border-b border-dashed border-[#E2E8F0] pb-2.5">
              <dt className="text-[#64748B]">Loại tài liệu</dt>
              <dd className="font-bold text-[#0F172A]">{nfc(item.kind)}</dd>
            </div>
            <div className="flex items-center justify-between border-b border-dashed border-[#E2E8F0] pb-2.5">
              <dt className="text-[#64748B]">Năm học</dt>
              <dd className="font-bold text-[#0F172A]">{item.year}</dd>
            </div>
            <div className="flex items-center justify-between border-b border-dashed border-[#E2E8F0] pb-2.5">
              <dt className="text-[#64748B]">Độ dài bản mẫu</dt>
              <dd className="font-bold text-[#0F172A]">{pageList.length} trang</dd>
            </div>
            <div className="flex items-center justify-between border-b border-dashed border-[#E2E8F0] pb-2.5">
              <dt className="text-[#64748B]">Cập nhật</dt>
              <dd className="font-bold text-[#0F172A]">{new Date(item.updated).toLocaleDateString('vi-VN')}</dd>
            </div>
          </dl>

          <div className="flex flex-col gap-3 pt-2">
            <a
              className="button primary inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-xl text-sm transition-colors w-full shadow-sm"
              href={`/samples/${item.id}.html`}
              download={`muc-luc-${item.id}-mau.html`}
            >
              <Download size={18} />Tải bản mẫu HTML
            </a>

            <Link
              to="/quiz"
              className="button secondary inline-flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] font-bold rounded-xl text-sm transition-colors w-full"
            >
              Tạo Quiz từ tài liệu này
            </Link>
          </div>

          {/* COMMENTS SECTION */}
          <div ref={commentsRef} className="mt-2 bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0] flex flex-col gap-3">
            <h3 className="text-[#0F172A] font-bold text-sm flex items-center gap-2">
              <MessageCircle size={16} /> Bình luận ({comments.length})
            </h3>

            <div className="flex flex-col gap-3 max-h-[240px] overflow-y-auto pr-1">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2.5 items-start">
                  <div
                    className="w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ backgroundColor: c.avatarBg }}
                  >
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs">
                      <strong className="font-bold text-[#0F172A]">{c.name}</strong> <span className="text-[#64748B]">• {c.time}</span>
                    </div>
                    <p className="text-xs text-[#334155] mt-0.5 leading-normal">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComment} className="flex flex-col gap-2 mt-1">
              <textarea
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Viết bình luận của bạn..."
                className="w-full p-2.5 rounded-xl border border-[#CBD5E1] text-xs focus:outline-none focus:ring-2 focus:ring-[#0284C7] resize-y min-h-[70px] bg-white"
              ></textarea>
              <button
                type="submit"
                disabled={!commentInput.trim()}
                className="button primary flex items-center justify-center gap-2 px-3 py-2 bg-[#0284C7] hover:bg-[#0369A1] disabled:opacity-50 text-white font-semibold rounded-xl text-xs w-full cursor-pointer transition-colors"
              >
                Gửi bình luận
              </button>
            </form>
          </div>
        </aside>
      </div>

      <section className="related mt-10">
        <div className="section-heading flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#0F172A]">Cùng môn, thêm một góc nhìn</h2>
          <Link to={`/explore?subject=${item.subject}`} className="text-sm font-semibold text-[#0284C7] hover:underline inline-flex items-center gap-1">
            Xem theo môn <ChevronRight size={16} />
          </Link>
        </div>
        <DocumentList items={related} />
      </section>
    </div>
  );
}


