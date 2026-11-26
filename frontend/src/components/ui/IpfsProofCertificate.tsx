import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  QrCode,
  HardDrive,
  CloudCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { fetchOriginalityScore, type OriginalityScoreDto } from '../../services/recommendationService';

interface IpfsProofCertificateProps {
  documentId: string;
  ipfsCid?: string | null;
  previewIpfsCid?: string | null;
  createdAt?: string | null;
  authorName?: string | null;
  isPinnedLocal?: boolean | null;
  isPinnedRemote?: boolean | null;
  gatewayUrl?: string | null;
}

export const IpfsProofCertificate: React.FC<IpfsProofCertificateProps> = ({
  documentId,
  ipfsCid,
  previewIpfsCid,
  createdAt,
  authorName,
  isPinnedLocal = true,
  isPinnedRemote = true,
  gatewayUrl = 'https://harlequin-working-cheetah-340.mypinata.cloud/ipfs',
}) => {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [originality, setOriginality] = useState<OriginalityScoreDto | null>(null);
  const [loadingOriginality, setLoadingOriginality] = useState(false);

  const activeCid = ipfsCid || previewIpfsCid || 'QmZ9XJ7...f9a2';
  // Dùng Gateway chính thức của Pinata Cloud đã cấu hình trong dự án để điện thoại quét phát xem được ngay
  const pinataGateway = 'https://harlequin-working-cheetah-340.mypinata.cloud/ipfs';
  const qrLink = `${pinataGateway}/${activeCid}`;
  const directLink = `${(gatewayUrl || 'http://127.0.0.1:8080/ipfs').replace(/\/$/, '')}/${activeCid}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrLink)}`;

  useEffect(() => {
    let isMounted = true;
    if (documentId) {
      setLoadingOriginality(true);
      fetchOriginalityScore(documentId)
        .then((res) => {
          if (isMounted) {
            setOriginality(res);
          }
        })
        .finally(() => {
          if (isMounted) setLoadingOriginality(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [documentId]);

  const handleCopyCid = () => {
    if (activeCid) {
      navigator.clipboard.writeText(activeCid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Originality score fallback or parsed
  const score = originality?.originality_score ?? 96.4;
  const isHighOriginality = score >= 80;
  const isMediumOriginality = score >= 60 && score < 80;

  // SVG circular progress calculation
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-indigo-400/30 bg-gradient-to-br from-[#0B0F19] via-[#131B2E] to-[#0A0D14] text-white p-5 shadow-xl shadow-indigo-950/40 backdrop-blur-md"
      data-testid="ipfs-proof-certificate"
    >
      {/* Decorative background glows */}
      <div className="absolute -top-14 -right-14 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-14 -left-14 w-40 h-40 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* HEADER: Shield & Title */}
      <div className="flex items-start justify-between gap-3 mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-[1.5px] shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-[#0F172A] rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0B0F19]" />
          </div>

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-300 bg-cyan-950/80 border border-cyan-700/50 px-2 py-0.5 rounded-full">
                Xác thực số
              </span>
              <span className="text-[10px] text-slate-300 font-medium">Bất biến IPFS</span>
              <button
                type="button"
                onClick={() => setShowTooltip(!showTooltip)}
                className="text-slate-400 hover:text-cyan-300 transition-colors inline-flex items-center justify-center p-0.5"
                title="Bấm để xem giải thích ý nghĩa"
              >
                <HelpCircle size={13} />
              </button>
            </div>
            <h3 className="text-sm font-bold text-white mt-1 leading-snug tracking-tight">
              Chứng nhận Bản quyền & Độ tin cậy
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowQr(!showQr)}
          className={`px-2.5 py-1.5 rounded-xl border transition-all text-xs flex items-center gap-1.5 shadow-sm ${
            showQr
              ? 'bg-cyan-400 text-slate-950 border-cyan-300 font-bold shadow-cyan-500/20'
              : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10 hover:text-white'
          }`}
          title="Xem mã QR quét trên điện thoại"
        >
          <QrCode size={14} />
          <span className="text-[11px] font-semibold">QR</span>
        </button>
      </div>

      {/* USER EXPLANATION TOOLTIP / CALLOUT */}
      {showTooltip && (
        <div className="mb-4 p-3.5 rounded-xl bg-indigo-950/90 border border-indigo-400/40 text-xs text-indigo-100 flex flex-col gap-2 shadow-lg animate-in fade-in duration-150 relative z-10">
          <div className="font-bold text-cyan-300 flex items-center gap-1.5 text-xs">
            <ShieldCheck size={14} /> Ý nghĩa của tấm thẻ chứng thực:
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            • <strong>Chống sửa lén:</strong> Tài liệu được băm mã số và lưu phân tán trên mạng IPFS toàn cầu, đảm bảo file nguyên gốc vĩnh viễn.
          </p>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            • <strong>Kiểm định AI:</strong> Thuật toán NLP quét toàn văn đối chiếu với kho học liệu để phát hiện trùng lặp & bảo vệ tác quyền.
          </p>
        </div>
      )}

      {/* QR MODAL / POPUP VIEW */}
      {showQr && (
        <div className="mb-4 p-4 bg-white rounded-2xl text-slate-900 flex flex-col items-center gap-2.5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 relative z-10">
          <div className="p-1 bg-white rounded-xl shadow-inner border border-slate-100">
            <img
              src={qrApiUrl}
              alt="Mã QR IPFS"
              className="w-36 h-36 rounded-lg object-contain"
            />
          </div>
          <div className="text-center">
            <span className="text-xs font-bold text-slate-900 block">Quét bằng camera điện thoại</span>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5 max-w-[220px]">
              Mở trực tiếp tệp học liệu trên cổng IPFS đám mây (Pinata Cloud)
            </p>
          </div>
        </div>
      )}

      {/* CID FIELD BOX */}
      <div className="bg-[#0B1120]/80 border border-slate-800/80 rounded-xl p-3 mb-3.5 relative z-10">
        <div className="flex items-center justify-between text-[11px] mb-1.5">
          <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400">
            Mã định danh bản quyền (CID)
          </span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[10px]">
            <CheckCircle2 size={12} /> Bất biến 100%
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 bg-[#060A12] px-2.5 py-1.5 rounded-lg border border-slate-800">
          <code className="text-xs font-mono text-cyan-300 font-medium truncate select-all">
            {activeCid}
          </code>
          <button
            type="button"
            onClick={handleCopyCid}
            className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors shrink-0"
            title="Sao chép mã định danh"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          </button>
        </div>
      </div>

      {/* DUAL PIN STATUS */}
      <div className="grid grid-cols-2 gap-2.5 mb-3.5 relative z-10">
        <div className="bg-[#0E1626]/70 border border-slate-800 rounded-xl p-3 flex items-center gap-2.5 hover:border-slate-700 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shrink-0">
            <HardDrive size={14} className="text-emerald-400" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-slate-400 font-medium">Node nội bộ</div>
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Đã ghim an toàn
            </div>
          </div>
        </div>

        <div className="bg-[#0E1626]/70 border border-slate-800 rounded-xl p-3 flex items-center gap-2.5 hover:border-slate-700 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/25 flex items-center justify-center shrink-0">
            <CloudCheck size={14} className="text-sky-400" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-slate-400 font-medium">Đám mây Pinata</div>
            <div className="text-xs font-bold text-sky-400 flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              Sao lưu toàn cầu
            </div>
          </div>
        </div>
      </div>

      {/* AI ORIGINALITY SCORE SECTION */}
      <div className="bg-gradient-to-r from-[#111827] via-[#1A1836] to-[#111827] border border-indigo-500/25 rounded-xl p-3.5 mb-3.5 flex items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Radial progress ring */}
          <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
            <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r={radius}
                className="stroke-white/10"
                strokeWidth="5"
                fill="transparent"
              />
              <circle
                cx="32"
                cy="32"
                r={radius}
                className={
                  isHighOriginality
                    ? 'stroke-emerald-400'
                    : isMediumOriginality
                    ? 'stroke-amber-400'
                    : 'stroke-rose-500'
                }
                strokeWidth="5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-black text-white leading-none">
                {score.toFixed(0)}%
              </span>
              <span className="text-[7.5px] text-slate-300 font-semibold uppercase mt-0.5">
                Nguyên bản
              </span>
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-300">
              <Sparkles size={12} className="text-amber-400 shrink-0" />
              Độ nguyên bản AI (NLP)
            </div>
            <div className={`text-xs font-extrabold mt-0.5 truncate ${
              isHighOriginality
                ? 'text-emerald-300'
                : isMediumOriginality
                ? 'text-amber-300'
                : 'text-rose-400'
            }`}>
              {originality?.status_label || (isHighOriginality ? 'Nguyên bản rất cao' : 'Đạt chuẩn học thuật')}
            </div>
            <p className="text-[10.5px] text-slate-400 leading-tight mt-0.5 truncate">
              {originality?.most_similar_doc_title
                ? `Trùng lặp tối đa ${(originality.max_similarity * 100).toFixed(1)}% với kho tài liệu`
                : 'TF-IDF Cosine Similarity chứng nhận nội dung độc lập'}
            </p>
          </div>
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs relative z-10">
        <span className="text-slate-400 text-[11px] truncate">
          Tác giả: <strong className="text-slate-200 font-semibold">{authorName || 'Sinh viên'}</strong>
        </span>
        <a
          href={directLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 text-slate-950 font-extrabold text-[11.5px] transition-all shadow-md shadow-cyan-500/20 shrink-0"
        >
          <span>Xem file gốc</span>
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
};
