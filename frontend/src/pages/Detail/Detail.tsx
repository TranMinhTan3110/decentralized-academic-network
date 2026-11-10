import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Download, FileText, Minus, Plus,
  MessageCircle, UserPlus, UserCheck, Heart, Lock, ShieldCheck, Loader2,
  ExternalLink, Flag, Trash2, Edit3, Users, Star, CornerDownRight, FileSpreadsheet,
  Layers, Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { useLibrary } from '../../lib/store';
import { useSocial } from '../../lib/socialStore';
import { useAuth } from '../../lib/authStore';
import { DocumentList, EmptyState, SaveButton, DocxViewer, ExcelViewer } from '../../components';
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

function normalizeIpfsUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.replace('http://localhost:8080/ipfs', 'http://127.0.0.1:8080/ipfs');
}

function getAttachmentFormatMeta(extRaw: string) {
  const ext = (extRaw || 'file').toLowerCase();
  if (ext === 'xlsx' || ext === 'xls') {
    return {
      label: `Microsoft Excel (.${ext})`,
      shortBadge: `.${ext.toUpperCase()}`,
      closedBadgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      openBadgeClass: 'text-emerald-300 bg-emerald-950/60 border-emerald-400/30',
    };
  }
  if (ext === 'csv') {
    return {
      label: 'Bảng tính CSV (.csv)',
      shortBadge: '.CSV',
      closedBadgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      openBadgeClass: 'text-emerald-300 bg-emerald-950/60 border-emerald-400/30',
    };
  }
  if (ext === 'docx' || ext === 'doc') {
    return {
      label: `Microsoft Word (.${ext})`,
      shortBadge: `.${ext.toUpperCase()}`,
      closedBadgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
      openBadgeClass: 'text-sky-300 bg-sky-950/60 border-sky-400/30',
    };
  }
  if (ext === 'pdf') {
    return {
      label: 'Tài liệu PDF (.pdf)',
      shortBadge: '.PDF',
      closedBadgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
      openBadgeClass: 'text-rose-200 bg-rose-950/60 border-rose-400/30',
    };
  }
  if (ext === 'pptx' || ext === 'ppt') {
    return {
      label: `PowerPoint (.${ext})`,
      shortBadge: `.${ext.toUpperCase()}`,
      closedBadgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      openBadgeClass: 'text-amber-200 bg-amber-950/60 border-amber-400/30',
    };
  }
  if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) {
    return {
      label: `Hình ảnh (.${ext})`,
      shortBadge: `.${ext.toUpperCase()}`,
      closedBadgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      openBadgeClass: 'text-indigo-200 bg-indigo-950/60 border-indigo-400/30',
    };
  }
  if (ext === 'txt') {
    return {
      label: 'Văn bản (.txt)',
      shortBadge: '.TXT',
      closedBadgeClass: 'bg-slate-200 text-slate-800 border-slate-300',
      openBadgeClass: 'text-slate-200 bg-slate-800 border-slate-600',
    };
  }
  return {
    label: `Tệp đính kèm (.${ext})`,
    shortBadge: `.${ext.toUpperCase()}`,
    closedBadgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    openBadgeClass: 'text-slate-200 bg-slate-800 border-slate-600',
  };
}

function TxtAttachmentPreview({
  fileUrl,
  documentId,
  attachmentIndex,
  fileName,
  fallbackPdfUrl,
}: {
  fileUrl: string | null;
  documentId: string;
  attachmentIndex: number;
  fileName: string;
  fallbackPdfUrl: string | null;
}) {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [failed, setFailed] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    setTextContent(null);
    setFailed(false);

    const loadTxt = async () => {
      try {
        if (fileUrl) {
          const res = await fetch(fileUrl);
          if (res.ok) {
            const txt = await res.text();
            if (active) {
              setTextContent(txt);
              return;
            }
          }
        }
        const blob = await documentService.download(documentId, attachmentIndex);
        const txt = await blob.text();
        if (active) setTextContent(txt);
      } catch {
        if (active) setFailed(true);
      }
    };

    loadTxt();
    return () => {
      active = false;
    };
  }, [fileUrl, documentId, attachmentIndex]);

  if (failed && fallbackPdfUrl) {
    return (
      <iframe
        src={`${fallbackPdfUrl}#view=FitH`}
        title={fileName}
        className="w-full h-[600px] border-0 bg-slate-800"
      />
    );
  }

  if (textContent === null) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-2.5 bg-[#1E293B] text-slate-300">
        <Loader2 size={26} className="animate-spin text-sky-400" />
        <span className="text-xs font-medium">Đang tải nội dung văn bản...</span>
      </div>
    );
  }

  return (
    <div className="bg-[#334155] p-4 sm:p-6 max-h-[650px] overflow-auto flex justify-center">
      <pre className="bg-white text-[#1E293B] w-full max-w-3xl p-5 sm:p-8 rounded-lg shadow-md text-xs sm:text-sm font-mono whitespace-pre-wrap break-words leading-relaxed">
        {textContent}
      </pre>
    </div>
  );
}

export interface CommentItem {
  id: string;
  authorId?: string;
  name: string;
  time: string;
  text: string;
  avatarBg: string;
  likeCount?: number;
  replies?: CommentItem[];
}

function mapRawCommentItem(c: any, isReply = false): CommentItem {
  return {
    id: c.id,
    authorId: c.author?.id || c.author?.userId || c.userId,
    name: c.author?.fullName || c.author?.name || 'Người dùng',
    time: c.createdAt ? new Date(c.createdAt).toLocaleDateString('vi-VN') : 'Vừa xong',
    text: c.content,
    avatarBg: isReply ? '#6366F1' : '#0284C7',
    likeCount: c.likeCount ?? 0,
    replies: Array.isArray(c.replies)
      ? c.replies.map((r: any) => mapRawCommentItem(r, true))
      : [],
  };
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
    const authorIdentifier =
      docDetail.author?.username ||
      docDetail.author?.id ||
      docDetail.author?.userId ||
      (docDetail as any).userId;
    const authorProfileUrl = authorIdentifier
      ? `/profile/${String(authorIdentifier).replace('@', '')}`
      : '#';

    return {
      id: docDetail.id,
      title: docDetail.title,
      school: docDetail.universityName || docDetail.school || 'Đại học',
      subject: docDetail.courseName || docDetail.subject || 'Môn học',
      kind: docDetail.docType || docDetail.documentType || docDetail.kind || 'Tài liệu',
      year: docDetail.academicYear || (docDetail.year ? String(docDetail.year) : '2026'),
      likes: docDetail.likeCount ?? 0,
      author: {
        id: authorIdentifier,
        profileUrl: authorProfileUrl,
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
      fileExtension: docDetail.fileExtension || 'pdf',
      fileUrl: docDetail.fileUrl,
      attachments: docDetail.attachments || [],
    };
  }, [docDetail]);

  const ipfsGateway = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_IPFS_GATEWAY) || 'http://127.0.0.1:8080/ipfs';
  const fileExt = (item?.fileExtension || '').toLowerCase();
  const isDocx = fileExt === 'docx' || fileExt === 'doc';
  const isPdf = fileExt === 'pdf';
  const isExcel = fileExt === 'xlsx' || fileExt === 'xls' || fileExt === 'csv';

  // Với tài liệu Excel / Bảng tính: Sử dụng ipfsCid của tệp gốc Excel / CSV nếu có
  const effectiveExcelCid = item?.ipfsCid || null;
  const rawExcelUrl = effectiveExcelCid ? `${ipfsGateway}/${effectiveExcelCid}` : (item?.fileUrl || null);
  const excelUrl = rawExcelUrl ? rawExcelUrl.replace('http://localhost:8080/ipfs', 'http://127.0.0.1:8080/ipfs') : null;

  // Với tài liệu Docx: Sử dụng ipfsCid của tệp gốc Word nếu có
  const effectiveDocxCid = item?.ipfsCid || null;
  const rawDocxUrl = effectiveDocxCid ? `${ipfsGateway}/${effectiveDocxCid}` : (item?.fileUrl || null);
  const docxUrl = rawDocxUrl ? rawDocxUrl.replace('http://localhost:8080/ipfs', 'http://127.0.0.1:8080/ipfs') : null;

  const rawPreviewUrl = item
    ? (isPdf
      ? (hasUnlocked && item.ipfsCid
        ? `${ipfsGateway}/${item.ipfsCid}`
        : item.previewIpfsCid
          ? `${ipfsGateway}/${item.previewIpfsCid}`
          : null)
      : (item.previewIpfsCid
        ? `${ipfsGateway}/${item.previewIpfsCid}`
        : (item.ipfsCid ? `${ipfsGateway}/${item.ipfsCid}` : null)))
    : null;
  const previewPdfUrl = rawPreviewUrl ? rawPreviewUrl.replace('http://localhost:8080/ipfs', 'http://127.0.0.1:8080/ipfs') : null;

  const { viewed } = useLibrary();
  const { recordActivity } = useSocial();
  const [page, setPage] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [expandedFiles, setExpandedFiles] = useState<Record<number, boolean>>({ 0: true });
  const fileCardRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Interactive social states
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [following, setFollowing] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [likedCommentIds, setLikedCommentIds] = useState<Record<string, boolean>>({});

  // 5-Star Rating states
  const [ratingAvg, setRatingAvg] = useState<number>(0);
  const [ratingCount, setRatingCount] = useState<number>(0);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverStar, setHoverStar] = useState<number>(0);
  const [isRatingSubmitting, setIsRatingSubmitting] = useState<boolean>(false);
  const [isEditingRating, setIsEditingRating] = useState<boolean>(false);

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
          setComments(list.map((c: any) => mapRawCommentItem(c, false)));
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
            setRatingAvg(typeof detail.ratingAvg === 'number' ? detail.ratingAvg : 0);
            setRatingCount(typeof detail.ratingCount === 'number' ? detail.ratingCount : 0);
            setUserRating(typeof detail.userRating === 'number' ? detail.userRating : null);
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
      setExpandedFiles({ 0: true });
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
    const result = await Swal.fire({
      title: 'Xóa bài đăng?',
      text: 'Bạn có chắc chắn muốn xóa tài liệu này không? Hành động này không thể hoàn tác.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Xóa bài đăng',
      cancelButtonText: 'Hủy bỏ',
      reverseButtons: true,
    });
    if (!result.isConfirmed) {


      return;
    }
    setIsDeletingDoc(true);
    try {
      await documentService.delete(item.id);
      await Swal.fire({
        title: 'Đã xóa!',
        text: 'Tài liệu đã được xóa thành công.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
      navigate('/');
    } catch (err: any) {
      Swal.fire({
        title: 'Lỗi',
        text: err?.message || 'Xóa tài liệu thất bại.',
        icon: 'error',
        confirmButtonColor: '#0284c7',
      });
      setIsDeletingDoc(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const result = await Swal.fire({
      title: 'Xóa bình luận?',
      text: 'Bạn có chắc chắn muốn xóa bình luận này không?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy bỏ',
      reverseButtons: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    setDeletingCommentId(commentId);
    try {
      await documentService.deleteComment(commentId);
      setComments((prev) =>
        prev
          .filter((c) => c.id !== commentId)
          .map((c) => ({
            ...c,
            replies: c.replies ? c.replies.filter((r) => r.id !== commentId) : [],
          }))
      );
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

  const handleRateDocument = async (star: number) => {
    if (!item || isRatingSubmitting) return;
    if (isAuthor) {
      toast.error('Tác giả không thể tự đánh giá tài liệu của chính mình.');
      return;
    }

    // Nếu người dùng đã đánh giá trước đó
    if (userRating !== null) {
      if (!isEditingRating) {
        return;
      }
      if (star === userRating) {
        setIsEditingRating(false);
        setHoverStar(0);
        toast.info(`Đã giữ nguyên mức đánh giá ${star} sao.`);
        return;
      }
      const confirmResult = await Swal.fire({
        title: 'Sửa đánh giá?',
        text: `Bạn đã chấm ${userRating} sao cho tài liệu này. Bạn có chắc muốn đổi thành ${star} sao không?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#0284c7',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Đổi đánh giá',
        cancelButtonText: 'Giữ nguyên',
        reverseButtons: true,
      });
      if (!confirmResult.isConfirmed) {
        setIsEditingRating(false);
        setHoverStar(0);
        return;
      }
    }

    setIsRatingSubmitting(true);
    const prevUserRating = userRating;
    const prevAvg = ratingAvg;
    const prevCount = ratingCount;
    setUserRating(star);
    setIsEditingRating(false);
    setHoverStar(0);
    try {
      const res = await documentService.rateDocument(item.id, star);
      if (res) {
        setRatingAvg(typeof res.ratingAvg === 'number' ? res.ratingAvg : star);
        setRatingCount(typeof res.ratingCount === 'number' ? res.ratingCount : Math.max(1, prevCount));
        setUserRating(typeof res.userRating === 'number' ? res.userRating : star);
      }
      toast.success(
        prevUserRating !== null
          ? `Đã cập nhật đánh giá thành ${star} sao!`
          : `Đã đánh giá ${star} sao cho tài liệu!`
      );
    } catch (err: any) {
      setUserRating(prevUserRating);
      setRatingAvg(prevAvg);
      setRatingCount(prevCount);
      toast.error(err?.message || 'Không thể gửi đánh giá lúc này.');
    } finally {
      setIsRatingSubmitting(false);
    }
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
        likeCount: 0,
        replies: [],
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
        likeCount: 0,
        replies: [],
      };
      setComments((prev) => [newEntry, ...prev]);
    }
  };

  const handleAddReply = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyInput.trim() || !item || isSubmittingReply) return;
    const text = replyInput.trim();
    setIsSubmittingReply(true);
    try {
      const added = await documentService.addComment(item.id, text, undefined, parentId);
      const newReply: CommentItem = {
        id: added?.id || `reply-${Date.now()}`,
        authorId: added?.author?.id || added?.author?.userId || currentUser?.id,
        name: added?.author?.fullName || added?.author?.name || currentUser?.name || 'Bạn (Người dùng)',
        time: 'Vừa xong',
        text: added?.content || text,
        avatarBg: '#6366F1',
        likeCount: 0,
      };
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentId ? { ...c, replies: [...(c.replies || []), newReply] } : c
        )
      );
      setReplyInput('');
      setReplyingToId(null);
      recordActivity({ documentId: item.id, type: 'comment' });
    } catch (err: any) {
      toast.error(err?.message || 'Không thể gửi phản hồi.');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (likedCommentIds[commentId]) return;
    setLikedCommentIds((prev) => ({ ...prev, [commentId]: true }));
    const updateLikes = (list: CommentItem[]): CommentItem[] =>
      list.map((c) => {
        if (c.id === commentId) {
          return { ...c, likeCount: (c.likeCount || 0) + 1 };
        }
        if (c.replies && c.replies.length > 0) {
          return { ...c, replies: updateLikes(c.replies) };
        }
        return c;
      });
    setComments((prev) => updateLikes(prev));
    try {
      await documentService.likeComment(commentId);
    } catch {
      // Keep optimistic update
    }
  };

  const totalCommentsCount = comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);
  const isMultiFile = Boolean(item.attachments && item.attachments.length > 1);

  const toggleFilePreview = (idx: number) => {
    setExpandedFiles((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const focusFilePreview = (idx: number) => {
    setExpandedFiles((prev) => ({ ...prev, [idx]: true }));
    setTimeout(() => {
      const target = fileCardRefs.current[idx];
      if (target && typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 60);
  };

  const handleToggleAllFiles = () => {
    if (!item.attachments || item.attachments.length === 0) return;
    const allOpen = item.attachments.every((_, i) => Boolean(expandedFiles[i]));
    if (allOpen) {
      setExpandedFiles({});
    } else {
      const next: Record<number, boolean> = {};
      item.attachments.forEach((_, i) => {
        next[i] = true;
      });
      setExpandedFiles(next);
    }
  };

  const handleDownloadAttachment = async (idx: number, fallbackFileName: string, directUrl?: string | null) => {
    if (!hasUnlocked && isBlurLocked && !isAuthor && unlockPoints > 0) {
      setIsUnlockModalOpen(true);
      return;
    }
    try {
      let blob: Blob | null = null;
      if (directUrl) {
        try {
          const directRes = await fetch(directUrl);
          if (directRes.ok) {
            blob = await directRes.blob();
          }
        } catch {
          // Fallback to backend download endpoint below
        }
      }
      if (!blob) {
        blob = await documentService.download(item.id, idx);
      }
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = fallbackFileName || `tai-lieu-${idx + 1}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch (err: any) {
      if (directUrl) {
        window.open(directUrl, '_blank', 'noopener,noreferrer');
      } else {
        toast.error(err?.message || 'Không thể tải tệp đính kèm.');
      }
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
                <Link to={item.author.profileUrl} className="hover:opacity-85 transition-opacity">
                  {item.author.avatar?.startsWith('http') ? (
                    <img src={item.author.avatar} alt={item.author.name} className="w-12 h-12 rounded-full object-cover border border-[#E2E8F0]" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#0284C7] text-white flex items-center justify-center font-bold text-lg">
                      {item.author.avatar && item.author.avatar.length <= 3 ? item.author.avatar : item.author.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </Link>
                <div>
                  <Link to={item.author.profileUrl} className="font-bold text-[#0F172A] text-base hover:text-[#0284C7] transition-colors hover:underline">
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
                <span className="truncate">Bình luận ({totalCommentsCount})</span>
              </button>

              <SaveButton documentId={item.id} initialSaved={docDetail?.hasBookmarked ?? false} />
            </div>
          </div>

          {/* READER CONTAINER */}
          {isMultiFile ? (
            <div className="flex flex-col gap-3.5" data-testid="multi-file-preview-list">
              <div className="bg-white px-4 sm:px-5 py-3 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#0F172A]">
                  <Layers size={16} className="text-[#0284C7] shrink-0" />
                  <span>Bản xem trước gói học liệu ({item.attachments.length} tệp)</span>
                  <span className="hidden sm:inline text-xs font-normal text-[#64748B]">
                    • Bấm vào từng tệp để đóng / mở xem trước
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleAllFiles}
                  data-testid="toggle-all-previews-btn"
                  className="text-xs font-semibold text-[#0284C7] hover:text-[#0369A1] bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  {item.attachments.every((_, i) => Boolean(expandedFiles[i]))
                    ? 'Thu gọn tất cả'
                    : 'Mở tất cả'}
                </button>
              </div>

              {item.attachments.map((att, idx) => {
                const isOpen = Boolean(expandedFiles[idx]);
                const attExt = (att.fileExtension || 'pdf').toLowerCase();
                const attMeta = getAttachmentFormatMeta(attExt);
                const attIsExcel = attExt === 'xlsx' || attExt === 'xls' || attExt === 'csv';
                const attIsDocx = attExt === 'docx' || attExt === 'doc';
                const attIsPdf = attExt === 'pdf';
                const attIsImage = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(attExt);
                const attIsTxt = attExt === 'txt';

                const canAccessFull = hasUnlocked || isAuthor || !isBlurLocked;
                const attCid = att.ipfsCid || (idx === 0 ? item.ipfsCid : undefined) || null;
                const rawDirect = attCid
                  ? `${ipfsGateway}/${attCid}`
                  : (att.fileUrl || (idx === 0 ? item.fileUrl : null));
                const attDirectUrl = normalizeIpfsUrl(rawDirect);

                const attPreviewPdfUrl = (() => {
                  if (canAccessFull && attIsPdf && attDirectUrl) {
                    return attDirectUrl;
                  }
                  if (att.previewIpfsCid) {
                    return normalizeIpfsUrl(`${ipfsGateway}/${att.previewIpfsCid}`);
                  }
                  if (idx === 0 && item.previewIpfsCid) {
                    return normalizeIpfsUrl(`${ipfsGateway}/${item.previewIpfsCid}`);
                  }
                  return documentService.getAttachmentPreviewUrl(item.id, idx);
                })();

                const attSizeMb = (att.fileSizeBytes || att.fileSize)
                  ? `${(((att.fileSizeBytes || att.fileSize || 0)) / 1024 / 1024).toFixed(2)} MB`
                  : null;
                const attPagesCount = att.totalPages || (idx === 0 ? item.totalPages : undefined);

                return (
                  <div
                    key={`${att.fileName}-${idx}`}
                    ref={(el) => {
                      fileCardRefs.current[idx] = el;
                    }}
                    data-testid={`attachment-preview-card-${idx}`}
                    className={`border rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col transition-all ${isOpen
                        ? 'border-[#94A3B8]/80 shadow-md'
                        : 'border-[#CBD5E1] hover:border-[#0284C7]/70'
                      }`}
                  >
                    {/* ACCORDION HEADER BAR */}
                    <div
                      className={`flex items-center justify-between gap-2 px-4 sm:px-5 py-3.5 transition-colors ${isOpen
                          ? 'bg-[#0F172A] text-white hover:bg-[#1E293B]'
                          : 'bg-white text-[#0F172A] hover:bg-[#F8FAFC]'
                        }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleFilePreview(idx)}
                        aria-expanded={isOpen}
                        data-testid={`attachment-preview-toggle-${idx}`}
                        className="flex-1 flex items-center justify-between gap-3 text-left cursor-pointer min-w-0"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold shrink-0 border ${isOpen
                                ? 'bg-sky-500/20 text-sky-300 border-sky-400/30'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                          >
                            Tệp {idx + 1}/{item.attachments.length}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase shrink-0 border ${isOpen ? attMeta.openBadgeClass : attMeta.closedBadgeClass
                              }`}
                          >
                            {attMeta.shortBadge}
                          </span>
                          <div className="min-w-0 flex flex-col sm:flex-row sm:items-center sm:gap-2">
                            <span
                              className={`font-bold text-xs sm:text-sm truncate ${isOpen ? 'text-white' : 'text-[#0F172A]'
                                }`}
                              title={att.fileName}
                            >
                              {nfc(att.fileName)}
                            </span>
                            <span
                              className={`text-[11px] shrink-0 ${isOpen ? 'text-slate-300' : 'text-[#64748B]'
                                }`}
                            >
                              {attSizeMb ? `${attSizeMb}` : ''}
                              {attPagesCount && attPagesCount > 1 && !attIsExcel
                                ? `${attSizeMb ? ' • ' : ''}${attPagesCount} trang`
                                : ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <span
                            className={`hidden md:inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg border ${isOpen ? attMeta.openBadgeClass : attMeta.closedBadgeClass
                              }`}
                          >
                            {attIsExcel ? (
                              <FileSpreadsheet size={12} />
                            ) : attIsImage ? (
                              <ImageIcon size={12} />
                            ) : (
                              <FileText size={12} />
                            )}
                            <span>{attMeta.label}</span>
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${isOpen
                                ? 'bg-slate-800 text-slate-200 border border-slate-600'
                                : 'bg-[#E0F2FE] text-[#0284C7] border border-sky-200'
                              }`}
                          >
                            <span>{isOpen ? 'Thu gọn' : 'Xem trước'}</span>
                            {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </span>
                        </div>
                      </button>

                      {isOpen && (attIsPdf || attIsImage) && (attDirectUrl || attPreviewPdfUrl) && (
                        <a
                          href={(attIsImage ? attDirectUrl : attPreviewPdfUrl) || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg text-sky-300 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
                          title="Mở toàn màn hình trong tab mới"
                          aria-label="Mở toàn màn hình trong tab mới"
                        >
                          <ExternalLink size={15} />
                        </a>
                      )}
                    </div>

                    {/* ACCORDION COLLAPSIBLE PREVIEW BODY */}
                    {isOpen && (
                      <div data-testid={`attachment-preview-body-${idx}`} className="flex flex-col">
                        {attIsExcel && (attCid || attDirectUrl || canAccessFull) ? (
                          <ExcelViewer
                            documentId={item.id}
                            attachmentIndex={idx}
                            fileUrl={attDirectUrl}
                            ipfsCid={attCid}
                            title={nfc(att.fileName)}
                            hasUnlocked={hasUnlocked}
                            isBlurLocked={isBlurLocked}
                            freePagesLimit={freePagesLimit}
                            totalPages={attPagesCount || item.totalPages}
                            unlockPoints={unlockPoints}
                            onUnlockRequest={() => setIsUnlockModalOpen(true)}
                            fileExtension={attExt}
                          />
                        ) : attIsDocx && (attCid || attDirectUrl || canAccessFull) ? (
                          <DocxViewer
                            documentId={item.id}
                            attachmentIndex={idx}
                            fileUrl={attDirectUrl}
                            ipfsCid={attCid}
                            title={nfc(att.fileName)}
                            hasUnlocked={hasUnlocked}
                            isBlurLocked={isBlurLocked}
                            freePagesLimit={freePagesLimit}
                            totalPages={attPagesCount || item.totalPages}
                            unlockPoints={unlockPoints}
                            onUnlockRequest={() => setIsUnlockModalOpen(true)}
                          />
                        ) : attIsImage && attDirectUrl && canAccessFull ? (
                          <div className="bg-[#1E293B] p-4 sm:p-6 flex flex-col items-center justify-center min-h-[340px]">
                            <img
                              src={attDirectUrl}
                              alt={nfc(att.fileName)}
                              className="max-w-full max-h-[680px] object-contain rounded-lg shadow-lg bg-white"
                            />
                          </div>
                        ) : attIsTxt && (attDirectUrl || canAccessFull) ? (
                          <TxtAttachmentPreview
                            fileUrl={attDirectUrl}
                            documentId={item.id}
                            attachmentIndex={idx}
                            fileName={nfc(att.fileName)}
                            fallbackPdfUrl={attPreviewPdfUrl}
                          />
                        ) : attPreviewPdfUrl ? (
                          <div className="relative w-full bg-[#334155] flex flex-col">
                            <iframe
                              src={`${attPreviewPdfUrl}#view=FitH`}
                              title={nfc(att.fileName)}
                              className="w-full h-[650px] sm:h-[750px] border-0 bg-slate-800"
                            />

                            {!hasUnlocked && isBlurLocked && (
                              <div className="bg-gradient-to-r from-slate-900 to-sky-950 text-white p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-700">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center shrink-0">
                                    <Lock size={18} />
                                  </div>
                                  <div>
                                    <h4 className="text-xs sm:text-sm font-bold text-white">
                                      Đang xem bản đọc thử miễn phí của {nfc(att.fileName)}
                                    </h4>
                                    <p className="text-[11px] sm:text-xs text-slate-300">
                                      Mở khóa gói học liệu để xem trọn vẹn tất cả {item.attachments.length} tệp và tải tệp gốc.
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
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="border border-[#E2E8F0] rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col">
              <div className="reader-toolbar flex items-center justify-between bg-[#0F172A] text-white px-4 sm:px-5 py-3 text-xs sm:text-sm font-semibold">
                <span className="flex items-center gap-2">
                  <FileText size={17} aria-hidden="true" />
                  <span>
                    {isExcel
                      ? `Bản xem trước Bảng tính (.${fileExt.toUpperCase()})`
                      : isDocx
                        ? 'Bản xem trước Word (.docx)'
                        : previewPdfUrl
                          ? 'Bản xem trước IPFS'
                          : 'Bản xem trước'}
                    {item.totalPages > 1 && !isExcel && (
                      <span className="text-slate-300 ml-1.5 font-normal text-xs">
                        ({hasUnlocked ? `${item.totalPages} trang` : `${freePagesLimit} / ${item.totalPages} trang đọc thử`})
                      </span>
                    )}
                  </span>
                  {hasUnlocked && <span className="text-emerald-400 font-bold ml-1">(Đã mở khóa toàn bộ)</span>}
                </span>
                <div className="flex items-center gap-3">
                  {isExcel ? (
                    <span className="text-[11px] sm:text-xs text-emerald-300 font-medium bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-400/30 flex items-center gap-1.5">
                      <FileSpreadsheet size={13} className="text-emerald-400" />
                      <span>{fileExt === 'csv' ? 'Bảng tính CSV (.csv)' : `Microsoft Excel (.${fileExt})`}</span>
                    </span>
                  ) : isDocx ? (
                    <span className="text-[11px] sm:text-xs text-sky-300 font-medium bg-sky-950/60 px-2.5 py-1 rounded-lg border border-sky-400/30">
                      Microsoft Word (.docx)
                    </span>
                  ) : previewPdfUrl ? (
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

              {isExcel && (effectiveExcelCid || excelUrl || hasUnlocked || isAuthor) ? (
                <ExcelViewer
                  documentId={item.id}
                  fileUrl={excelUrl}
                  ipfsCid={effectiveExcelCid}
                  title={nfc(item.title)}
                  hasUnlocked={hasUnlocked}
                  isBlurLocked={isBlurLocked}
                  freePagesLimit={freePagesLimit}
                  totalPages={item.totalPages}
                  unlockPoints={unlockPoints}
                  onUnlockRequest={() => setIsUnlockModalOpen(true)}
                  fileExtension={fileExt}
                />
              ) : isDocx && (effectiveDocxCid || docxUrl || hasUnlocked || isAuthor) ? (
                <DocxViewer
                  documentId={item.id}
                  fileUrl={docxUrl}
                  ipfsCid={effectiveDocxCid}
                  title={nfc(item.title)}
                  hasUnlocked={hasUnlocked}
                  isBlurLocked={isBlurLocked}
                  freePagesLimit={freePagesLimit}
                  totalPages={item.totalPages}
                  unlockPoints={unlockPoints}
                  onUnlockRequest={() => setIsUnlockModalOpen(true)}
                />
              ) : previewPdfUrl ? (
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
                            Mở khóa để xem trọn vẹn toàn bộ {item.totalPages} trang và tải tệp {isDocx ? '.DOCX gốc' : isExcel ? `.${fileExt.toUpperCase()} gốc` : 'PDF gốc'}.
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
          )}
        </section>

        {/* RIGHT COLUMN: Sidebar metadata */}
        <aside className="lg:col-span-1 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-5 sticky top-4">
          <div>
            <h2 className="text-lg font-bold text-[#0F172A] mb-2">Về tài liệu này</h2>
            <p className="text-sm text-[#475569] leading-relaxed mb-4">{nfc(item.description || '')}</p>
          </div>

          {/* 5-STAR RATING WIDGET */}
          <div
            className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 flex flex-col gap-2.5"
            data-testid="document-rating-widget"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                <Star size={14} className="text-amber-500 fill-amber-500" />
                Đánh giá học liệu
              </span>
              <div className="flex items-center gap-1 text-xs font-bold text-amber-700" data-testid="rating-summary-text">
                <span className="text-sm font-extrabold text-[#0F172A]">
                  {ratingCount > 0 ? Number(ratingAvg).toFixed(1) : 'Chưa có'}
                </span>
                {ratingCount > 0 && <span>/ 5 ({ratingCount} đánh giá)</span>}
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <div
                className="flex items-center gap-1"
                onMouseLeave={() => setHoverStar(0)}
              >
                {[1, 2, 3, 4, 5].map((star) => {
                  const isLocked = isAuthor || (userRating !== null && !isEditingRating);
                  const activeStar = isAuthor
                    ? Math.round(ratingAvg)
                    : isLocked && userRating !== null
                      ? userRating
                      : (hoverStar || userRating || Math.round(ratingAvg));
                  const isFilled = star <= activeStar;
                  return (
                    <button
                      key={star}
                      type="button"
                      disabled={isRatingSubmitting || isLocked}
                      onMouseEnter={() => {
                        if (!isLocked) setHoverStar(star);
                      }}
                      onClick={() => handleRateDocument(star)}
                      data-testid={`rate-star-${star}`}
                      aria-label={`Đánh giá ${star} sao`}
                      className={`p-1 rounded-lg transition-transform ${isLocked
                          ? 'cursor-default opacity-90'
                          : 'hover:bg-amber-100/80 hover:scale-110 cursor-pointer'
                        } disabled:opacity-80`}
                    >
                      <Star
                        size={20}
                        className={isFilled ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}
                      />
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-[#64748B]" data-testid="user-rating-label">
                  {isAuthor
                    ? 'Bạn là tác giả tài liệu này'
                    : userRating
                      ? (isEditingRating ? `Chọn mức sao mới (hiện tại: ${userRating} ⭐)` : `Bạn đã chấm ${userRating} sao`)
                      : 'Chọn 1–5 sao'}
                </span>
                {!isAuthor && userRating !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingRating((prev) => !prev);
                      setHoverStar(0);
                    }}
                    data-testid="edit-rating-btn"
                    className="text-[11px] font-bold text-[#0284C7] hover:underline cursor-pointer px-1.5 py-0.5 rounded bg-sky-50 border border-sky-200"
                  >
                    {isEditingRating ? 'Hủy' : 'Sửa'}
                  </button>
                )}
              </div>
            </div>
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
            <div className="flex items-center justify-between border-b border-dashed border-[#E2E8F0] pb-2.5">
              <dt className="text-[#64748B]">Cập nhật</dt>
              <dd className="font-bold text-[#0F172A]">{item.updated ? new Date(item.updated).toLocaleDateString('vi-VN') : 'Mới cập nhật'}</dd>
            </div>
          </dl>

          {item.attachments && item.attachments.length > 0 && (
            <div className="bg-[#F8FAFC] p-3.5 rounded-2xl border border-[#E2E8F0] flex flex-col gap-2.5" data-testid="bundle-attachments-box">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={14} className="text-[#0284C7]" />
                  Gói học liệu ({item.attachments.length} tệp)
                </h3>
                {isMultiFile && (
                  <span className="text-[10px] font-medium text-[#64748B]">Bấm để xem trước</span>
                )}
              </div>
              <ul className="flex flex-col gap-2">
                {item.attachments.map((att, idx) => {
                  const isOpenInPreview = isMultiFile && Boolean(expandedFiles[idx]);
                  const canDownloadAtt = hasUnlocked || isAuthor || !isBlurLocked;
                  const directAttUrl = normalizeIpfsUrl(
                    att.fileUrl || (att.ipfsCid ? `${ipfsGateway}/${att.ipfsCid}` : null)
                  );
                  return (
                    <li
                      key={`${att.fileName}-${idx}`}
                      className={`flex items-center justify-between gap-2 p-2 rounded-xl border text-xs transition-colors ${isOpenInPreview
                          ? 'bg-sky-50/70 border-[#0284C7]/60'
                          : 'bg-white border-[#E2E8F0] hover:border-[#94A3B8]'
                        }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (!isMultiFile) return;
                          if (expandedFiles[idx]) {
                            toggleFilePreview(idx);
                          } else {
                            focusFilePreview(idx);
                          }
                        }}
                        disabled={!isMultiFile}
                        data-testid={`sidebar-attachment-item-${idx}`}
                        className={`flex items-center gap-2 min-w-0 flex-1 text-left ${isMultiFile ? 'cursor-pointer' : 'cursor-default'
                          }`}
                      >
                        <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-bold text-[10px] uppercase shrink-0">
                          .{att.fileExtension || 'file'}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[#0F172A] truncate" title={att.fileName}>
                            {att.fileName}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-[#64748B]">
                            {(att.fileSizeBytes || att.fileSize) && (
                              <span>{(((att.fileSizeBytes || att.fileSize || 0)) / 1024 / 1024).toFixed(2)} MB</span>
                            )}
                            {isMultiFile && (
                              <span className={isOpenInPreview ? 'text-[#0284C7] font-bold' : 'text-slate-400'}>
                                • {isOpenInPreview ? 'Đang mở' : 'Đã đóng'}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                      {canDownloadAtt ? (
                        <button
                          type="button"
                          onClick={() => handleDownloadAttachment(idx, att.fileName, directAttUrl)}
                          className="px-2 py-1 rounded-lg bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#0284C7] font-bold text-[11px] shrink-0 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Download size={12} /> Tải
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsUnlockModalOpen(true)}
                          className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-[11px] shrink-0 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Lock size={11} /> Mở khóa
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2">
            {previewPdfUrl || isDocx || isExcel ? (
              <button
                type="button"
                className="button primary inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-xl text-sm transition-colors w-full shadow-sm cursor-pointer"
                onClick={async () => {
                  if (!hasUnlocked && isBlurLocked && !isAuthor && unlockPoints > 0) {
                    setIsUnlockModalOpen(true);
                    return;
                  }
                  try {
                    const blob = await documentService.download(item.id);
                    const objectUrl = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = objectUrl;
                    const downloadExt = item.fileExtension || (isDocx ? 'docx' : isExcel ? fileExt : 'pdf');
                    a.download = `${item.title || 'tai-lieu'}.${downloadExt}`;
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
                {hasUnlocked || isAuthor || !isBlurLocked
                  ? `Tải trọn vẹn .${(item.fileExtension || (isDocx ? 'docx' : isExcel ? fileExt : 'pdf')).toUpperCase()} (IPFS)`
                  : `Mở khóa để tải .${(item.fileExtension || (isDocx ? 'docx' : isExcel ? fileExt : 'pdf')).toUpperCase()} (${unlockPoints} điểm)`}
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
          </div>

          {/* COMMENTS SECTION */}
          <div ref={commentsRef} className="mt-2 bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0] flex flex-col gap-3">
            <h3 className="text-[#0F172A] font-bold text-sm flex items-center gap-2">
              <MessageCircle size={16} /> Bình luận ({totalCommentsCount})
            </h3>

            <div className="flex flex-col gap-3 max-h-[320px] overflow-y-auto pr-1">
              {comments.map((c) => {
                // Chỉ chủ sở hữu comment (khớp authorId) được xóa — backend vẫn chốt quyền lần nữa
                const canDelete = Boolean(
                  currentUser?.id && c.authorId && c.authorId === currentUser.id
                );
                const isReplying = replyingToId === c.id;
                const isLikedComment = Boolean(likedCommentIds[c.id]);
                return (
                  <div key={c.id} className="flex flex-col gap-1.5">
                    <div className="flex gap-2.5 items-start justify-between group">
                      <div className="flex gap-2.5 items-start min-w-0 flex-1">
                        <div
                          className="w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ backgroundColor: c.avatarBg }}
                        >
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs">
                            <strong className="font-bold text-[#0F172A]">{c.name}</strong> <span className="text-[#64748B]">• {c.time}</span>
                          </div>
                          <p className="text-xs text-[#334155] mt-0.5 leading-normal break-words">{c.text}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <button
                              type="button"
                              onClick={() => handleLikeComment(c.id)}
                              data-testid={`like-comment-btn-${c.id}`}
                              className={`inline-flex items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer ${isLikedComment ? 'text-rose-500 font-semibold' : 'text-[#64748B] hover:text-rose-500'
                                }`}
                            >
                              <Heart size={11} className={isLikedComment ? 'fill-rose-500 text-rose-500' : ''} />
                              <span>{c.likeCount || 0}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setReplyingToId(isReplying ? null : c.id);
                                setReplyInput('');
                              }}
                              data-testid={`reply-comment-btn-${c.id}`}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#64748B] hover:text-[#0284C7] transition-colors cursor-pointer"
                            >
                              <CornerDownRight size={11} />
                              <span>{isReplying ? 'Hủy' : 'Trả lời'}</span>
                            </button>
                          </div>
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

                    {/* NESTED REPLIES */}
                    {c.replies && c.replies.length > 0 && (
                      <div className="ml-8 pl-2.5 border-l-2 border-[#E2E8F0] flex flex-col gap-2 mt-1">
                        {c.replies.map((reply) => {
                          const canDeleteReply = Boolean(
                            currentUser?.id && reply.authorId && reply.authorId === currentUser.id
                          );
                          const isLikedReply = Boolean(likedCommentIds[reply.id]);
                          return (
                            <div key={reply.id} className="flex gap-2 items-start justify-between group/reply">
                              <div className="flex gap-2 items-start min-w-0 flex-1">
                                <div
                                  className="w-6 h-6 rounded-full text-white flex items-center justify-center text-[10px] font-bold shrink-0"
                                  style={{ backgroundColor: reply.avatarBg || '#6366F1' }}
                                >
                                  {reply.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-[11px]">
                                    <strong className="font-bold text-[#0F172A]">{reply.name}</strong>{' '}
                                    <span className="text-[#64748B]">• {reply.time}</span>
                                  </div>
                                  <p className="text-xs text-[#334155] mt-0.5 leading-normal break-words">{reply.text}</p>
                                  <button
                                    type="button"
                                    onClick={() => handleLikeComment(reply.id)}
                                    data-testid={`like-comment-btn-${reply.id}`}
                                    className={`inline-flex items-center gap-1 text-[10px] font-medium mt-0.5 transition-colors cursor-pointer ${isLikedReply ? 'text-rose-500 font-semibold' : 'text-[#64748B] hover:text-rose-500'
                                      }`}
                                  >
                                    <Heart size={10} className={isLikedReply ? 'fill-rose-500 text-rose-500' : ''} />
                                    <span>{reply.likeCount || 0}</span>
                                  </button>
                                </div>
                              </div>
                              {canDeleteReply && (
                                <button
                                  onClick={() => handleDeleteComment(reply.id)}
                                  disabled={deletingCommentId === reply.id}
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors opacity-70 group-hover/reply:opacity-100 shrink-0 cursor-pointer disabled:opacity-30"
                                  title="Xóa phản hồi"
                                  aria-label="Xóa phản hồi"
                                  data-testid="delete-reply-btn"
                                >
                                  {deletingCommentId === reply.id ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : (
                                    <Trash2 size={12} />
                                  )}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* INLINE REPLY INPUT */}
                    {isReplying && (
                      <form
                        onSubmit={(e) => handleAddReply(e, c.id)}
                        className="ml-8 mt-1 flex items-center gap-1.5"
                      >
                        <input
                          type="text"
                          value={replyInput}
                          onChange={(e) => setReplyInput(e.target.value)}
                          placeholder={`Trả lời ${c.name}...`}
                          data-testid="reply-comment-input"
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-[#CBD5E1] text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#0284C7]"
                          autoFocus
                        />
                        <button
                          type="submit"
                          disabled={!replyInput.trim() || isSubmittingReply}
                          data-testid="submit-reply-btn"
                          className="px-2.5 py-1.5 bg-[#0284C7] hover:bg-[#0369A1] disabled:opacity-50 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shrink-0"
                        >
                          Gửi
                        </button>
                      </form>
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
          <h2 className="text-xl font-bold text-[#0F172A]">Một số bài đăng khác</h2>
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
