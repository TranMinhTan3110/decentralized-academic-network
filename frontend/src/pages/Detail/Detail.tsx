import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ChevronLeft, ChevronRight, Download, FileText, Minus, Plus,
  MessageCircle, UserPlus, UserCheck, Heart, Lock, ShieldCheck, Loader2,
  ExternalLink, Flag, Trash2, Edit3, Users, Bot
} from 'lucide-react';
import { toast } from 'sonner';
import { useLibrary } from '../../lib/store';
import { useSocial } from '../../lib/socialStore';
import { useAuth } from '../../lib/authStore';
import { DocumentList, EmptyState, SaveButton } from '../../components';
import { documentService } from '../../services/documentService';
import {
  UnlockDocumentModal,
  ReportDocumentModal,
  LikersModal,
  EditDocumentModal,
} from '../../components/modals';
import type { DocumentDetail } from '../../types';

function nfc(text: string): string {
  return text ? text.normalize('NFC') : text;
}

export interface CommentItem {
  id: string;
  authorId?: string;
  name: string;
  time: string;
  text: string;
  avatarBg: string;
}

export function Detail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();

  // Backend live data state
  const [loading, setLoading] = useState<boolean>(true);
  const [docDetail, setDocDetail] = useState<DocumentDetail | null>(null);
  const [hasUnlocked, setHasUnlocked] = useState<boolean>(false);
  const [userBalance, setUserBalance] = useState<number | undefined>(undefined);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isLikersModalOpen, setIsLikersModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeletingDoc, setIsDeletingDoc] = useState<boolean>(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [related, setRelated] = useState<any[]>([]);

  // Item mapped strictly from backend DocumentDetail with useMemo to prevent re-render loops
  const item = useMemo(() => {
    if (!docDetail) return null;
    return {
      id: docDetail.id,
      title: docDetail.title,
      school: docDetail.universityName || docDetail.school || 'Đại học',
      subject: docDetail.courseName || docDetail.subject || 'Môn học',
      kind: docDetail.docType || docDetail.documentType || docDetail.kind || 'Tài liệu',
      year: docDetail.academicYear || (docDetail.year ? String(docDetail.year) : '2026'),
      likes: docDetail.likeCount ?? 0,
      author: {
        name: docDetail.author?.fullName || docDetail.author?.name || 'Tác giả',
        role: docDetail.author?.role || 'Thành viên',
        avatar: docDetail.author?.avatarUrl || docDetail.author?.avatar || '',
      },
      description: docDetail.description || 'Tài liệu học tập chính thức.',
      pages: (docDetail.pages && docDetail.pages.length > 0) ? docDetail.pages : undefined,
      freePages: docDetail.freePages ?? 3,
      unlockPointsRequired: docDetail.unlockPointsRequired ?? 10,
      isBlurLocked: docDetail.isBlurLocked ?? true,
      ipfsCid: docDetail.ipfsCid,
      previewIpfsCid: docDetail.previewIpfsCid,
      thumbnailUrl: docDetail.thumbnailUrl,
      totalPages: docDetail.totalPages ?? 1,
      updated: docDetail.updatedAt,
    };
  }, [docDetail]);

  const ipfsGateway = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_IPFS_GATEWAY) || 'http://localhost:8080/ipfs';
  const previewPdfUrl = item
    ? (hasUnlocked && item.ipfsCid
      ? `${ipfsGateway}/${item.ipfsCid}`
      : item.previewIpfsCid
        ? `${ipfsGateway}/${item.previewIpfsCid}`
        : null)
    : null;

  const { viewed } = useLibrary();
  const { recordActivity } = useSocial();
  const [page, setPage] = useState(0);
  const [zoom, setZoom] = useState(100);

  // Interactive social states
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [following, setFollowing] = useState(false);
  const [commentInput, setCommentInput] = useState('');

  const lastRecorded = useRef<string | undefined>(undefined);
  const lastDocId = useRef<string | undefined>(undefined);
  const paperRef = useRef<HTMLDivElement>(null);
  const commentsRef = useRef<HTMLDivElement>(null);

  // Sau khi unlock thành công, refetch chi tiết để server trả về CID đầy đủ
  // (lần fetch đầu bị che do chưa mở khóa)
  // Chỉ refetch sau khi người dùng VỪA unlock (không refetch khi server báo đã unlock sẵn từ đầu)
  const needsRefetchAfterUnlockRef = useRef(false);
  useEffect(() => {
    if (needsRefetchAfterUnlockRef.current && hasUnlocked && id) {
      needsRefetchAfterUnlockRef.current = false;
      documentService.getDetail(id)
        .then((detail) => {
          if (detail) setDocDetail(detail);
        })
        .catch(() => { });
    }
  }, [hasUnlocked, id]);

  // Fetch real document detail, view record, and unlock status
  useEffect(() => {
    if (!id) {
      setLoading(false);
      setDocDetail(null);
      return;
    }
    let active = true;
    setLoading(true);

    // Call record view API
    documentService.recordView(id).catch(() => { });

    // Call check unlock status
    documentService.checkUnlockStatus(id)
      .then((status) => {
        if (active && status) {
          setHasUnlocked(status.hasUnlocked ?? status.unlocked ?? false);
          setUserBalance(typeof (status as any).userBalance === 'number' ? (status as any).userBalance : undefined);
        }
      })
      .catch(() => { });

    // Fetch comments
    documentService.getComments(id)
      .then((res) => {
        if (active && res) {
          const list = Array.isArray(res) ? res : (res.content || []);
          setComments(
            list.map((c: any) => ({
              id: c.id,
              authorId: c.author?.id || c.author?.userId || c.userId,
              name: c.author?.fullName || c.author?.name || 'Người dùng',
              time: c.createdAt ? new Date(c.createdAt).toLocaleDateString('vi-VN') : 'Vừa xong',
              text: c.content,
              avatarBg: '#0284C7',
            }))
          );
        }
      })
      .catch(() => { });

    // Fetch related documents for recommendations and scroll depth
    documentService.getTrending(6)
      .then((items) => {
        if (active && items) {
          setRelated(items.filter((d: any) => d.id !== id).slice(0, 3));
        }
      })
      .catch(() => { });

    // Fetch document detail
    documentService.getDetail(id)
      .then((detail) => {
        if (active) {
          if (detail) {
            setDocDetail(detail);
            if (detail.hasUnlocked !== undefined) {
              setHasUnlocked(detail.hasUnlocked);
            }
            setLikesCount(detail.likeCount ?? 0);
            setLiked(detail.hasLiked ?? false);
          } else {
            setDocDetail(null);
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setDocDetail(null);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [id, currentUser?.id, isAuthenticated]);

  useEffect(() => {
    if (!id) return;
    if (lastDocId.current !== id) {
      lastDocId.current = id;
      viewed(id);
      if (lastRecorded.current !== id) {
        recordActivity({ documentId: id, type: 'view' });
        lastRecorded.current = id;
      }
      setLiked(false);
      setFollowing(false);
      setPage(0);
      setZoom(100);
      if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
        try {
          window.scrollTo(0, 0);
        } catch {
          // Ignore
        }
      }
    }
  }, [id, viewed, recordActivity]);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-[#64748B]">
        <Loader2 size={32} className="animate-spin text-[#0284C7]" />
        <p className="text-sm font-medium">Đang tải chi tiết tài liệu...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <EmptyState title="Không tìm thấy tài liệu" description="Tài liệu bạn yêu cầu không tồn tại hoặc đã bị xóa.">
        <Link className="button primary inline-flex items-center gap-2 px-4 py-2 bg-[#0284C7] text-white rounded-xl font-semibold text-sm" to="/explore">
          <ArrowLeft size={16} /> Quay lại khám phá
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
          item.description || 'Tài liệu chi tiết đang được cập nhật nội dung xem trước.',
        ],
      },
    ];
  const content = pageList[Math.min(page, pageList.length - 1)];

  // Freemium DRM check
  const freePagesLimit = (item as any)?.freePages ?? 3;
  const unlockPoints = (item as any)?.unlockPointsRequired ?? 10;
  const isBlurLocked = (item as any)?.isBlurLocked ?? true;
  const isPageLocked = !hasUnlocked && isBlurLocked && (freePagesLimit > 0) && (page >= freePagesLimit);

  const handleToggleLike = async () => {
    if (!item) return;
    const nextState = !liked;
    setLiked(nextState);
    setLikesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));
    try {
      const serverLiked = await documentService.toggleLike(item.id);
      recordActivity({ documentId: item.id, type: 'like' });
      if (typeof serverLiked === 'boolean' && serverLiked !== nextState) {
        setLiked(serverLiked);
        setLikesCount((prev) => (serverLiked ? prev + 1 : Math.max(0, prev - 1)));
      }
    } catch {
      // Revert optimistic state on error
      setLiked(!nextState);
      setLikesCount((prev) => (!nextState ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  const handleToggleFollow = () => {
    setFollowing((prev) => !prev);
  };

  const handleCommentClick = () => {
    commentsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const isAuthor = Boolean(
    currentUser && docDetail && (
      (docDetail.author?.id && currentUser.id && docDetail.author.id === currentUser.id) ||
      (docDetail.author?.userId && currentUser.id && docDetail.author.userId === currentUser.id) ||
      (docDetail.author?.fullName && currentUser.name && docDetail.author.fullName === currentUser.name) ||
      (docDetail.author?.name && currentUser.name && docDetail.author.name === currentUser.name)
    )
  );

  const handleDeleteDocument = async () => {
    if (!item) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài liệu này không? Hành động này không thể hoàn tác.')) {
      return;
    }
    setIsDeletingDoc(true);
    try {
      await documentService.delete(item.id);
      toast.success('Xóa tài liệu thành công!');
      navigate('/library?tab=uploads');
    } catch (err: any) {
      toast.error(err?.message || 'Xóa tài liệu thất bại.');
      setIsDeletingDoc(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setDeletingCommentId(commentId);
    try {
      await documentService.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success('Đã xóa bình luận.');
    } catch (err: any) {
      toast.error(err?.message || 'Xóa bình luận thất bại.');
    } finally {
      setDeletingCommentId(null);
    }
  };

  const handleDocumentUpdated = (updated: DocumentDetail) => {
    setDocDetail(updated);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !item) return;
    const text = commentInput.trim();
    setCommentInput('');
    try {
      const added = await documentService.addComment(item.id, text);
      const newEntry: CommentItem = {
        id: added?.id || Date.now().toString(),
        authorId: added?.author?.id || added?.author?.userId || currentUser?.id,
        name: added?.author?.fullName || added?.author?.name || currentUser?.name || 'Bạn (Người dùng)',
        time: 'Vừa xong',
        text: added?.content || text,
        avatarBg: '#0284C7',
      };
      setComments((prev) => [newEntry, ...prev]);
      recordActivity({ documentId: item.id, type: 'comment' });
    } catch {
      const newEntry: CommentItem = {
        id: Date.now().toString(),
        authorId: currentUser?.id,
        name: currentUser?.name || 'Bạn (Người dùng)',
        time: 'Vừa xong',
        text,
        avatarBg: '#0284C7',
      };
      setComments((prev) => [newEntry, ...prev]);
    }
  };

  return (
    <div className="detail-page page-enter max-w-7xl mx-auto space-y-4">
      <Link className="back-link inline-flex items-center gap-1 text-sm text-[#64748B] hover:text-[#0284C7] mb-4 font-medium transition-colors" to="/explore">
        <ArrowLeft size={16} />Khám phá tài liệu
      </Link>

      <div className="detail-heading mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A] mb-1">{nfc(item.title)}</h1>
        <p className="text-sm font-medium text-[#64748B]">
          {nfc(item.school || 'Chưa phân loại trường')}
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
                  {item.author.avatar?.startsWith('http') ? (
                    <img src={item.author.avatar} alt={item.author.name} className="w-12 h-12 rounded-full object-cover border border-[#E2E8F0]" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#0284C7] text-white flex items-center justify-center font-bold text-lg">
                      {item.author.avatar && item.author.avatar.length <= 3 ? item.author.avatar : item.author.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </Link>
                <div>
                  <Link to="/ho-so/lan-chi" className="font-bold text-[#0F172A] text-base hover:text-[#0284C7]">
                    {nfc(item.author.name)}
                  </Link>
                  <div className="text-xs text-[#64748B]">{nfc(item.author.role || '')}</div>
                </div>
              </div>
              {isAuthor ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-50 text-[#0284C7] border border-sky-200 hover:bg-sky-100 transition-colors cursor-pointer"
                    data-testid="edit-document-btn"
                  >
                    <Edit3 size={14} />
                    <span>Chỉnh sửa</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteDocument}
                    disabled={isDeletingDoc}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer disabled:opacity-50"
                    data-testid="delete-document-btn"
                  >
                    {isDeletingDoc ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    <span>Xóa</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleFollow}
                    className={`button secondary flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${following
                        ? 'bg-[#F0F9FF] text-[#0284C7] border-[#BAE6FD]'
                        : 'bg-white text-[#0F172A] border-[#CBD5E1] hover:bg-[#F8FAFC]'
                      }`}
                  >
                    {following ? <UserCheck size={15} /> : <UserPlus size={15} />}
                    <span>{following ? 'Đã theo dõi' : 'Theo dõi'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(true)}
                    className="p-1.5 rounded-xl border border-[#CBD5E1] text-[#64748B] hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Báo cáo vi phạm"
                    aria-label="Báo cáo vi phạm"
                    data-testid="report-document-btn"
                  >
                    <Flag size={15} />
                  </button>
                </div>
              )}
            </div>

            <p className="text-sm text-[#334155] italic">
              "{item.description}"
            </p>

            {/* INTERACTION BUTTONS */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 border-t border-[#E2E8F0] pt-4">
              <div className="flex items-center rounded-xl border border-[#F43F5E] overflow-hidden min-w-0">
                <button
                  onClick={handleToggleLike}
                  className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-2 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer min-w-0 ${liked
                      ? 'bg-rose-50 text-[#E11D48]'
                      : 'bg-white text-[#E11D48] hover:bg-rose-50'
                    }`}
                  data-testid="toggle-like-btn"
                >
                  <Heart size={16} fill={liked ? '#E11D48' : 'none'} className="shrink-0" />
                  <span className="truncate">Thích ({likesCount >= 1000 ? `${(likesCount / 1000).toFixed(1)}K` : likesCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsLikersModalOpen(true)}
                  title="Danh sách người đã thả tim"
                  className="px-2 py-2 bg-rose-100/60 hover:bg-rose-100 text-[#E11D48] border-l border-[#F43F5E]/30 text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center justify-center"
                  data-testid="view-likers-btn"
                  aria-label="Danh sách người đã thả tim"
                >
                  <Users size={14} />
                </button>
              </div>

              <button
                onClick={handleCommentClick}
                className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 bg-white rounded-xl border border-[#0284C7] text-[#0284C7] text-xs sm:text-sm font-semibold hover:bg-sky-50 transition-colors cursor-pointer min-w-0"
              >
                <MessageCircle size={16} className="shrink-0" />
                <span className="truncate">Bình luận ({comments.length})</span>
              </button>

              <SaveButton documentId={item.id} initialSaved={docDetail?.hasBookmarked ?? false} />
            </div>
          </div>

          {/* READER CONTAINER */}
          <div className="border border-[#E2E8F0] rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col">
            <div className="reader-toolbar flex items-center justify-between bg-[#0F172A] text-white px-4 sm:px-5 py-3 text-xs sm:text-sm font-semibold">
              <span className="flex items-center gap-2">
                <FileText size={17} aria-hidden="true" />
                <span>
                  {previewPdfUrl ? 'Bản xem trước IPFS' : 'Bản xem trước'}
                  {item.totalPages > 1 && (
                    <span className="text-slate-300 ml-1.5 font-normal text-xs">
                      ({hasUnlocked ? `${item.totalPages} trang` : `${freePagesLimit} / ${item.totalPages} trang đọc thử`})
                    </span>
                  )}
                </span>
                {hasUnlocked && <span className="text-emerald-400 font-bold ml-1">(Đã mở khóa toàn bộ)</span>}
              </span>
              <div className="flex items-center gap-3">
                {previewPdfUrl ? (
                  <a
                    href={previewPdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-sky-300 hover:text-white transition-colors"
                    title="Mở toàn màn hình trong tab mới"
                  >
                    <ExternalLink size={15} />
                    <span className="hidden sm:inline">Mở toàn màn hình</span>
                  </a>
                ) : (
                  <>
                    <button className="icon-button" aria-label="Giảm cỡ chữ" disabled={zoom <= 85} onClick={() => setZoom(zoom - 15)}>
                      <Minus size={16} />
                    </button>
                    <span>{zoom}%</span>
                    <button className="icon-button" aria-label="Tăng cỡ chữ" disabled={zoom >= 145} onClick={() => setZoom(zoom + 15)}>
                      <Plus size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {previewPdfUrl ? (
              <div className="relative w-full bg-[#334155] flex flex-col">
                <iframe
                  src={`${previewPdfUrl}#view=FitH`}
                  title={nfc(item.title)}
                  className="w-full h-[650px] sm:h-[750px] border-0 bg-slate-800"
                />

                {/* DRM NOTICE / UNLOCK BAR AT BOTTOM */}
                {!hasUnlocked && isBlurLocked && freePagesLimit < item.totalPages && (
                  <div className="bg-gradient-to-r from-slate-900 to-sky-950 text-white p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center shrink-0">
                        <Lock size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white">
                          Đang xem trước {freePagesLimit} / {item.totalPages} trang miễn phí trên IPFS
                        </h4>
                        <p className="text-[11px] sm:text-xs text-slate-300">
                          Mở khóa để xem trọn vẹn toàn bộ {item.totalPages} trang và tải tệp PDF gốc.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsUnlockModalOpen(true)}
                      className="w-full sm:w-auto px-4 py-2 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shrink-0 cursor-pointer transition-colors"
                    >
                      <ShieldCheck size={15} />
                      <span>Mở khóa ({unlockPoints === 0 ? 'Miễn phí' : `${unlockPoints} điểm`})</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="paper-surround bg-[#E2E8F0] p-3 sm:p-6 flex justify-center max-h-[600px] overflow-y-auto" ref={paperRef}>
                  {isPageLocked ? (
                    <div className="relative w-full max-w-[680px]">
                      {/* BLURRED MOCK CONTENT */}
                      <article
                        className="preview-paper bg-white w-full min-h-[480px] p-5 sm:p-8 md:p-10 rounded-sm shadow-md text-[#1E293B] select-none pointer-events-none filter blur-sm"
                        aria-hidden="true"
                        style={{ fontSize: `${zoom}%` }}
                      >
                        <div className="space-y-4">
                          <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                          <div className="h-4 bg-slate-200 rounded w-full"></div>
                          <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                          <div className="h-4 bg-slate-200 rounded w-4/6"></div>
                          <div className="h-4 bg-slate-200 rounded w-full"></div>
                          <div className="h-4 bg-slate-200 rounded w-3/5"></div>
                        </div>
                      </article>

                      {/* DRM LOCK OVERLAY */}
                      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm rounded-sm flex flex-col items-center justify-center text-center p-6 text-white z-10">
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-400/40 flex items-center justify-center mb-3">
                          <Lock size={28} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Trang nội dung đã bị khóa</h3>
                        <p className="text-xs sm:text-sm text-slate-300 max-w-sm mb-4 leading-relaxed">
                          Tài liệu này cho phép đọc thử miễn phí {freePagesLimit} trang đầu tiên. Để xem trọn vẹn và tải bản rõ nét, vui lòng mở khóa.
                        </p>
                        <button
                          onClick={() => setIsUnlockModalOpen(true)}
                          className="px-5 py-2.5 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-colors cursor-pointer"
                        >
                          <ShieldCheck size={16} />
                          <span>Mở khóa với {unlockPoints === 0 ? '0 điểm' : `${unlockPoints} điểm`}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <article className="preview-paper bg-white w-full max-w-[680px] min-h-[480px] p-5 sm:p-8 md:p-10 rounded-sm shadow-md text-[#1E293B] leading-relaxed" style={{ fontSize: `${zoom}%`, fontFamily: "'Be Vietnam Pro', Arial, sans-serif" }}>
                      <div className="paper-header flex justify-between text-xs font-bold text-[#94A3B8] mb-5 uppercase tracking-wider">
                        <span>MỤC LỤC / TÀI LIỆU MẪU</span>
                        <span>{item.year}</span>
                      </div>
                      <h2 className="text-xl md:text-2xl font-extrabold text-[#0F172A] mb-2">{nfc(item.title)}</h2>
                      <div className="paper-subtitle text-sm text-[#64748B] mb-4">
                        {nfc(item.subject || 'Môn học')} - {nfc(item.kind || '')}
                      </div>
                      <hr className="border-t border-[#E2E8F0] my-4" />
                      <h3 className="text-lg font-bold text-[#0F172A] mb-3">{nfc(content.heading)}</h3>
                      {content.paragraphs.map((paragraph) => (
                        <p key={paragraph} className="text-sm md:text-base text-[#334155] mb-4 leading-relaxed">
                          {nfc(paragraph)}
                        </p>
                      ))}
                    </article>
                  )}
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
              </>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: Sidebar metadata */}
        <aside className="lg:col-span-1 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-5 sticky top-4">
          <div>
            <h2 className="text-lg font-bold text-[#0F172A] mb-2">Về tài liệu này</h2>
            <p className="text-sm text-[#475569] leading-relaxed mb-4">{nfc(item.description || '')}</p>
          </div>

          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between border-b border-dashed border-[#E2E8F0] pb-2.5">
              <dt className="text-[#64748B]">Loại tài liệu</dt>
              <dd className="font-bold text-[#0F172A]">{nfc(item.kind || '')}</dd>
            </div>
            <div className="flex items-center justify-between border-b border-dashed border-[#E2E8F0] pb-2.5">
              <dt className="text-[#64748B]">Năm học</dt>
              <dd className="font-bold text-[#0F172A]">{item.year}</dd>
            </div>
            <div className="flex items-center justify-between border-b border-dashed border-[#E2E8F0] pb-2.5">
              <dt className="text-[#64748B]">Độ dài tài liệu</dt>
              <dd className="font-bold text-[#0F172A]">{item.totalPages || pageList.length} trang</dd>
            </div>
            <div className="flex items-center justify-between border-b border-dashed border-[#E2E8F0] pb-2.5">
              <dt className="text-[#64748B]">Bản quyền DRM</dt>
              <dd className="font-bold text-[#0284C7]">
                {freePagesLimit} trang thử · {unlockPoints === 0 ? 'Miễn phí' : `${unlockPoints} điểm`}
              </dd>
            </div>
            {(item.previewIpfsCid || item.ipfsCid) && (
              <div className="flex items-center justify-between border-b border-dashed border-[#E2E8F0] pb-2.5">
                <dt className="text-[#64748B]">Mã IPFS CID</dt>
                <dd className="font-mono text-[11px] text-emerald-600 font-bold truncate max-w-[150px]" title={item.previewIpfsCid || item.ipfsCid}>
                  {item.previewIpfsCid || item.ipfsCid}
                </dd>
              </div>
            )}
            <div className="flex items-center justify-between border-b border-dashed border-[#E2E8F0] pb-2.5">
              <dt className="text-[#64748B]">Cập nhật</dt>
              <dd className="font-bold text-[#0F172A]">{item.updated ? new Date(item.updated).toLocaleDateString('vi-VN') : 'Mới cập nhật'}</dd>
            </div>
          </dl>

          <div className="flex flex-col gap-3 pt-2">
            {previewPdfUrl ? (
              <button
                type="button"
                className="button primary inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-xl text-sm transition-colors w-full shadow-sm cursor-pointer"
                onClick={async () => {
                  try {
                    const blob = await documentService.download(item.id);
                    const objectUrl = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = objectUrl;
                    a.download = `${item.title || 'tai-lieu'}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(objectUrl);
                  } catch (err: any) {
                    toast.error(err?.message || 'Không thể tải tài liệu.');
                  }
                }}
              >
                <Download size={18} />
                {hasUnlocked ? 'Tải trọn vẹn PDF (IPFS)' : 'Tải bản xem trước PDF (IPFS)'}
              </button>
            ) : (
              <a
                className="button primary inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-xl text-sm transition-colors w-full shadow-sm"
                href={`/samples/${item.id}.html`}
                download={`muc-luc-${item.id}-mau.html`}
              >
                <Download size={18} />Tải bản mẫu HTML
              </a>
            )}

            <Link
              to="/quiz"
              className="button secondary inline-flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] font-bold rounded-xl text-sm transition-colors w-full"
            >
              Tạo Quiz từ tài liệu này
            </Link>

            <Link
              to={`/chat?documentId=${item.id}`}
              className="button secondary inline-flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-[#F0F9FF] border border-[#BAE6FD] text-[#0284C7] font-bold rounded-xl text-sm transition-colors w-full"
            >
              <Bot size={18} /> Hỏi đáp AI với tài liệu này
            </Link>
          </div>

          {/* COMMENTS SECTION */}
          <div ref={commentsRef} className="mt-2 bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0] flex flex-col gap-3">
            <h3 className="text-[#0F172A] font-bold text-sm flex items-center gap-2">
              <MessageCircle size={16} /> Bình luận ({comments.length})
            </h3>

            <div className="flex flex-col gap-3 max-h-[240px] overflow-y-auto pr-1">
              {comments.map((c) => {
                // Chỉ chủ sở hữu comment (khớp authorId) được xóa — backend vẫn chốt quyền lần nữa
                const canDelete = Boolean(
                  currentUser?.id && c.authorId && c.authorId === currentUser.id
                );
                return (
                  <div key={c.id} className="flex gap-2.5 items-start justify-between group">
                    <div className="flex gap-2.5 items-start min-w-0">
                      <div
                        className="w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ backgroundColor: c.avatarBg }}
                      >
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs">
                          <strong className="font-bold text-[#0F172A]">{c.name}</strong> <span className="text-[#64748B]">• {c.time}</span>
                        </div>
                        <p className="text-xs text-[#334155] mt-0.5 leading-normal break-words">{c.text}</p>
                      </div>
                    </div>
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        disabled={deletingCommentId === c.id}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors opacity-70 group-hover:opacity-100 shrink-0 cursor-pointer disabled:opacity-30"
                        title="Xóa bình luận"
                        aria-label="Xóa bình luận"
                        data-testid="delete-comment-btn"
                      >
                        {deletingCommentId === c.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
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

      {/* UNLOCK DOCUMENT MODAL */}
      <UnlockDocumentModal
        isOpen={isUnlockModalOpen}
        documentTitle={item.title}
        unlockPoints={unlockPoints}
        userBalance={userBalance}
        onClose={() => setIsUnlockModalOpen(false)}
        onUnlocked={() => {
          needsRefetchAfterUnlockRef.current = true;
          setHasUnlocked(true);
        }}
        documentId={item.id}
      />

      {/* REPORT DOCUMENT MODAL */}
      <ReportDocumentModal
        isOpen={isReportModalOpen}
        documentTitle={item.title}
        documentId={item.id}
        onClose={() => setIsReportModalOpen(false)}
      />

      {/* LIKERS MODAL */}
      <LikersModal
        isOpen={isLikersModalOpen}
        documentId={item.id}
        onClose={() => setIsLikersModalOpen(false)}
      />

      {/* EDIT DOCUMENT MODAL */}
      {docDetail && (
        <EditDocumentModal
          isOpen={isEditModalOpen}
          document={docDetail}
          onClose={() => setIsEditModalOpen(false)}
          onUpdated={handleDocumentUpdated}
        />
      )}
    </div>
  );
}
