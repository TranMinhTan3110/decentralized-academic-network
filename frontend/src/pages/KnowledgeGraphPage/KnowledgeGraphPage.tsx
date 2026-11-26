import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  FileSpreadsheet,
  FileText,
  FlaskConical,
  GraduationCap,
  Loader2,
  Map as MapIcon,
  Maximize2,
  Network,
  Search,
  Sparkles,
  Target,
  User,
  ZoomIn,
  ZoomOut,
  X,
} from 'lucide-react';
import { MainLayout } from '../../components/layout';
import { DocumentThumbnail } from '../../components/ui';
import { documentService } from '../../services/documentService';
import {
  fetchKnowledgeGraphEdges,
  type KnowledgeGraphEdgeDto,
} from '../../services/recommendationService';

interface GraphDoc {
  id: string;
  title: string;
  courseName: string;
  universityName: string;
  authorName: string;
  docType: string;
  fileExtension: string;
  thumbnailUrl?: string | null;
  totalPages: number;
  likeCount: number;
  academicYear?: string;
}

interface SemanticLink {
  id: string;
  source: string;
  target: string;
  similarity: number;
  keywords: string[];
}

interface ConstellationNode {
  id: string;
  kind: 'course' | 'document';
  label: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  extLabel?: string;
  docCount?: number;
  doc?: GraphDoc;
  courseKey?: string;
}

type LearningStage = 'foundation' | 'practice' | 'exam';

const STOP_WORDS = new Set([
  'và', 'của', 'các', 'cho', 'trong', 'với', 'được', 'không', 'những', 'này',
  'một', 'là', 'từ', 'đến', 'theo', 'như', 'khi', 'để', 'trên', 'tại', 'về',
  'tài', 'liệu', 'môn', 'học', 'bài', 'tập', 'giáo', 'trình', 'đề', 'thi',
  'the', 'and', 'for', 'with', 'from', 'local', 'test', 'sample',
]);

function getExtMeta(ext: string): { color: string; badgeClass: string; short: string } {
  const clean = (ext || 'pdf').replace(/^\./, '').toLowerCase();
  if (clean === 'docx' || clean === 'doc') {
    return { color: '#0284C7', badgeClass: 'bg-sky-50 text-sky-700 border-sky-200', short: '.DOCX' };
  }
  if (clean === 'pptx' || clean === 'ppt') {
    return { color: '#D97706', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200', short: '.PPTX' };
  }
  if (clean === 'xlsx' || clean === 'xls' || clean === 'csv') {
    return {
      color: '#059669',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      short: `.${clean.toUpperCase()}`,
    };
  }
  if (clean === 'txt') {
    return { color: '#475569', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200', short: '.TXT' };
  }
  return { color: '#E11D48', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200', short: '.PDF' };
}

function classifyLearningStage(doc: GraphDoc): LearningStage {
  const t = `${doc.docType} ${doc.title}`.toLowerCase();
  const ext = (doc.fileExtension || '').toLowerCase();

  if (
    t.includes('exam') ||
    t.includes('đề thi') ||
    t.includes('ôn tập') ||
    t.includes('ôn luyện') ||
    t.includes('quiz') ||
    t.includes('kahoot') ||
    t.includes('kiểm tra') ||
    t.includes('phỏng vấn') ||
    t.includes('ôn')
  ) {
    return 'exam';
  }
  if (
    t.includes('lab') ||
    t.includes('thực hành') ||
    t.includes('bài tập') ||
    t.includes('dataset') ||
    t.includes('dữ liệu') ||
    t.includes('test case') ||
    t.includes('case') ||
    ext === 'xlsx' ||
    ext === 'xls' ||
    ext === 'csv'
  ) {
    return 'practice';
  }
  return 'foundation';
}

function tokenizeText(text: string): string[] {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-zA-ZÀ-ỹ0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w) && !/^\d+$/.test(w));
}

function computeClientSemanticLinks(docs: GraphDoc[], existingPairs: Set<string>): SemanticLink[] {
  const links: SemanticLink[] = [];
  const docTokens = docs.map((d) => ({
    doc: d,
    tokens: new Set(tokenizeText(`${d.title} ${d.courseName} ${d.universityName}`)),
  }));

  for (let i = 0; i < docTokens.length; i++) {
    for (let j = i + 1; j < docTokens.length; j++) {
      const a = docTokens[i];
      const b = docTokens[j];
      const pairKey = a.doc.id < b.doc.id ? `${a.doc.id}::${b.doc.id}` : `${b.doc.id}::${a.doc.id}`;
      if (existingPairs.has(pairKey)) continue;

      const shared: string[] = [];
      a.tokens.forEach((t) => {
        if (b.tokens.has(t)) shared.push(t);
      });

      const unionSize = a.tokens.size + b.tokens.size - shared.length;
      if (unionSize <= 0) continue;

      let score = shared.length / unionSize;
      if (a.doc.courseName === b.doc.courseName && shared.length >= 1) {
        score = Math.min(0.92, score + 0.28);
      }

      if (score >= 0.15 && shared.length >= 1) {
        links.push({
          id: `sem-local-${pairKey}`,
          source: a.doc.id,
          target: b.doc.id,
          similarity: Number(Math.min(0.95, score).toFixed(2)),
          keywords: shared.slice(0, 3),
        });
      }
    }
  }

  return links.sort((x, y) => y.similarity - x.similarity).slice(0, 50);
}

const STAGE_CONFIG: Array<{
  key: LearningStage;
  step: string;
  title: string;
  subtitle: string;
  accentBg: string;
  accentText: string;
  accentBorder: string;
  lineColor: string;
  icon: typeof BookOpen;
}> = [
  {
    key: 'foundation',
    step: 'BƯỚC 1',
    title: 'Nền tảng & Lý thuyết',
    subtitle: 'Slide bài giảng, giáo trình, tổng quan kiến thức',
    accentBg: 'bg-[#EEF2FF]',
    accentText: 'text-[#4F46E5]',
    accentBorder: 'border-[#C7D2FE]',
    lineColor: '#6366F1',
    icon: BookOpen,
  },
  {
    key: 'practice',
    step: 'BƯỚC 2',
    title: 'Thực hành & Dữ liệu',
    subtitle: 'Bài lab, bảng dữ liệu, bài tập mẫu',
    accentBg: 'bg-emerald-50',
    accentText: 'text-emerald-700',
    accentBorder: 'border-emerald-200',
    lineColor: '#10B981',
    icon: FlaskConical,
  },
  {
    key: 'exam',
    step: 'BƯỚC 3',
    title: 'Ôn thi & Luyện tập',
    subtitle: 'Đề cương, câu hỏi trắc nghiệm, kinh nghiệm thi',
    accentBg: 'bg-amber-50',
    accentText: 'text-amber-700',
    accentBorder: 'border-amber-200',
    lineColor: '#F59E0B',
    icon: Target,
  },
];

export function KnowledgeGraphPage() {
  const [viewMode, setViewMode] = useState<'mindmap' | 'network'>('mindmap');
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<GraphDoc[]>([]);
  const [backendEdges, setBackendEdges] = useState<KnowledgeGraphEdgeDto[]>([]);
  const [algorithmLabel, setAlgorithmLabel] = useState<string>('TF-IDF Cosine Similarity');

  const [activeCourse, setActiveCourse] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [minSimilarity, setMinSimilarity] = useState<number>(20);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  // Network View interactive state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragOverrides, setDragOverrides] = useState<Record<string, { x: number; y: number }>>({});
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number }>({ x: 0, y: 0, panX: 0, panY: 0 });
  const draggingNodeRef = useRef<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([
      documentService.getFeed({ page: 0, size: 60 }).catch(() => ({ content: [] })),
      fetchKnowledgeGraphEdges(0.12, 100).catch(() => null),
    ]).then(([feedRes, graphRes]) => {
      if (!active) return;
      const rawList = Array.isArray(feedRes) ? feedRes : feedRes?.content || [];
      const mappedDocs: GraphDoc[] = rawList.map((item: any) => ({
        id: String(item.id),
        title: item.title || 'Tài liệu học thuật',
        courseName: item.courseName || item.category || 'Học thuật chung',
        universityName: item.universityName || item.school || 'Cộng đồng DeDocu',
        authorName: item.author?.fullName || item.author?.name || 'Thành viên',
        docType: item.docType || item.kind || 'DOCUMENT',
        fileExtension: item.fileExtension || 'pdf',
        thumbnailUrl: item.thumbnailUrl || null,
        totalPages: item.totalPages || item.pages || 1,
        likeCount: item.likeCount ?? item.likes ?? 0,
        academicYear: item.academicYear || item.year || '',
      }));

      setDocs(mappedDocs);
      if (graphRes?.edges) {
        setBackendEdges(graphRes.edges);
        if (graphRes.algorithm_applied) {
          setAlgorithmLabel(graphRes.algorithm_applied);
        }
      }
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  // Group documents by course, sorted by most documents first
  const coursesGrouped = useMemo(() => {
    const map = new Map<string, GraphDoc[]>();
    const q = searchQuery.trim().toLowerCase();
    docs.forEach((d) => {
      if (q && !d.title.toLowerCase().includes(q) && !d.courseName.toLowerCase().includes(q)) {
        return;
      }
      const list = map.get(d.courseName) || [];
      list.push(d);
      map.set(d.courseName, list);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [docs, searchQuery]);

  // Auto-select first (largest) course
  useEffect(() => {
    if (coursesGrouped.length === 0) {
      setActiveCourse('');
      return;
    }
    if (!activeCourse || !coursesGrouped.some(([name]) => name === activeCourse)) {
      setActiveCourse(coursesGrouped[0][0]);
    }
  }, [coursesGrouped, activeCourse]);

  // All AI semantic links above threshold
  const allSemanticLinks = useMemo<SemanticLink[]>(() => {
    const docIdSet = new Set(docs.map((d) => d.id));
    const existingPairs = new Set<string>();
    const threshold = minSimilarity / 100;
    const links: SemanticLink[] = [];

    backendEdges.forEach((be) => {
      const s = String(be.source_id);
      const t = String(be.target_id);
      if (!docIdSet.has(s) || !docIdSet.has(t)) return;
      const pairKey = s < t ? `${s}::${t}` : `${t}::${s}`;
      existingPairs.add(pairKey);
      if (be.similarity >= threshold) {
        links.push({
          id: `sem-be-${pairKey}`,
          source: s,
          target: t,
          similarity: be.similarity,
          keywords: be.shared_keywords || [],
        });
      }
    });

    const localLinks = computeClientSemanticLinks(docs, existingPairs).filter(
      (l) => l.similarity >= threshold
    );
    return [...links, ...localLinks].sort((a, b) => b.similarity - a.similarity);
  }, [docs, backendEdges, minSimilarity]);

  const docById = useMemo(() => {
    const map = new Map<string, GraphDoc>();
    docs.forEach((d) => map.set(d.id, d));
    return map;
  }, [docs]);

  // Active course docs grouped into 3 learning stages
  const activeCourseDocs = useMemo(() => {
    const found = coursesGrouped.find(([name]) => name === activeCourse);
    return found ? found[1] : [];
  }, [coursesGrouped, activeCourse]);

  const stageBuckets = useMemo(() => {
    const buckets: Record<LearningStage, GraphDoc[]> = {
      foundation: [],
      practice: [],
      exam: [],
    };
    activeCourseDocs.forEach((d) => {
      buckets[classifyLearningStage(d)].push(d);
    });
    return buckets;
  }, [activeCourseDocs]);

  // AI-suggested related docs for the active course (or specifically selected doc)
  const aiRelatedForMindmap = useMemo(() => {
    const targetIds = selectedDocId
      ? new Set([selectedDocId])
      : new Set(activeCourseDocs.map((d) => d.id));

    const results: Array<{
      sourceDoc: GraphDoc;
      targetDoc: GraphDoc;
      similarity: number;
      keywords: string[];
      isCrossCourse: boolean;
    }> = [];
    const seenTarget = new Set<string>();

    allSemanticLinks.forEach((link) => {
      let srcId: string | null = null;
      let dstId: string | null = null;
      if (targetIds.has(link.source) && !targetIds.has(link.target)) {
        srcId = link.source;
        dstId = link.target;
      } else if (targetIds.has(link.target) && !targetIds.has(link.source)) {
        srcId = link.target;
        dstId = link.source;
      } else if (!selectedDocId && targetIds.has(link.source) && targetIds.has(link.target)) {
        srcId = link.source;
        dstId = link.target;
      }

      if (!srcId || !dstId) return;
      const key = `${srcId}::${dstId}`;
      if (seenTarget.has(key)) return;
      seenTarget.add(key);

      const srcDoc = docById.get(srcId);
      const dstDoc = docById.get(dstId);
      if (srcDoc && dstDoc) {
        results.push({
          sourceDoc: srcDoc,
          targetDoc: dstDoc,
          similarity: link.similarity,
          keywords: link.keywords,
          isCrossCourse: srcDoc.courseName !== dstDoc.courseName,
        });
      }
    });

    return results.slice(0, 6);
  }, [selectedDocId, activeCourseDocs, allSemanticLinks, docById]);

  // Clean, zero-overlap Radial Constellation layout for Mode 2 (Network View)
  const { constellationNodes, constellationBelongs } = useMemo(() => {
    const cx = 480;
    const cy = 310;
    const courses = coursesGrouped;
    const cNodes: ConstellationNode[] = [];
    const belongs: Array<{ source: string; target: string }> = [];

    const courseCount = courses.length;
    const courseOrbit = courseCount <= 1 ? 0 : courseCount === 2 ? 210 : Math.min(235, 165 + courseCount * 14);

    courses.forEach(([cName, cDocs], cIdx) => {
      const baseAngle =
        courseCount === 1
          ? 0
          : -Math.PI / 2 + (2 * Math.PI * cIdx) / courseCount;
      const baseX = cx + Math.cos(baseAngle) * courseOrbit;
      const baseY = cy + Math.sin(baseAngle) * courseOrbit;
      const courseId = `course::${cName}`;
      const override = dragOverrides[courseId];

      cNodes.push({
        id: courseId,
        kind: 'course',
        label: cName,
        x: override ? override.x : baseX,
        y: override ? override.y : baseY,
        radius: 30,
        color: '#4F46E5',
        docCount: cDocs.length,
        courseKey: cName,
      });

      // Fan documents smoothly outward away from center so they NEVER collide with other courses
      const spreadSpan = Math.min(Math.PI * 1.15, Math.max(0.9, cDocs.length * 0.45));
      cDocs.forEach((doc, dIdx) => {
        const offsetAngle =
          cDocs.length === 1
            ? 0
            : -spreadSpan / 2 + (spreadSpan * dIdx) / (cDocs.length - 1);
        const angle = courseCount === 1 ? (2 * Math.PI * dIdx) / Math.max(1, cDocs.length) : baseAngle + offsetAngle;
        const docRadius = cDocs.length > 5 ? (dIdx % 2 === 0 ? 112 : 162) : 118;
        const dx = baseX + Math.cos(angle) * docRadius;
        const dy = baseY + Math.sin(angle) * docRadius;
        const docOverride = dragOverrides[doc.id];
        const meta = getExtMeta(doc.fileExtension);

        cNodes.push({
          id: doc.id,
          kind: 'document',
          label: doc.title,
          x: docOverride ? docOverride.x : dx,
          y: docOverride ? docOverride.y : dy,
          radius: 17,
          color: meta.color,
          extLabel: meta.short.replace('.', ''),
          doc,
          courseKey: cName,
        });

        belongs.push({ source: courseId, target: doc.id });
      });
    });

    return { constellationNodes: cNodes, constellationBelongs: belongs };
  }, [coursesGrouped, dragOverrides]);

  const cNodeById = useMemo(() => {
    const map = new Map<string, ConstellationNode>();
    constellationNodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [constellationNodes]);

  const toSvgCoords = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 480, y: 310 };
    const rect = svg.getBoundingClientRect();
    const viewX = ((clientX - rect.left) / rect.width) * 960;
    const viewY = ((clientY - rect.top) / rect.height) * 620;
    return { x: (viewX - pan.x) / zoom, y: (viewY - pan.y) / zoom };
  };

  const handleSvgMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if ((e.target as HTMLElement).closest('[data-graph-node="true"]')) return;
    isPanningRef.current = true;
    panStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  };

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (draggingNodeRef.current) {
      const coords = toSvgCoords(e.clientX, e.clientY);
      setDragOverrides((prev) => ({ ...prev, [draggingNodeRef.current!]: coords }));
      return;
    }
    if (isPanningRef.current && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const dx = ((e.clientX - panStartRef.current.x) / rect.width) * 960;
      const dy = ((e.clientY - panStartRef.current.y) / rect.height) * 620;
      setPan({ x: panStartRef.current.panX + dx, y: panStartRef.current.panY + dy });
    }
  };

  const handleSvgMouseUp = () => {
    isPanningRef.current = false;
    draggingNodeRef.current = null;
  };

  const activeFocusNodeId = hoveredNodeId || selectedNodeId;
  const selectedConstellationNode = selectedNodeId ? cNodeById.get(selectedNodeId) || null : null;

  const totalPagesActiveCourse = activeCourseDocs.reduce((acc, d) => acc + (d.totalPages || 1), 0);

  return (
    <MainLayout>
      <div className="page-enter space-y-5">
        {/* PAGE HEADER + VIEW MODE SWITCHER */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] border border-[#E0E7FF] text-[11px] font-bold uppercase tracking-wider mb-1.5">
              <Network size={12} />
              <span>Bản đồ Tri thức AI · {algorithmLabel}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Bản đồ Học tập & Liên kết Tri thức
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1">
              Hệ thống tự động phân nhóm tài liệu theo lộ trình 3 bước và phát hiện các tài liệu bổ trợ liên quan bằng AI.
            </p>
          </div>

          {/* 2-MODE SEGMENTED SWITCHER */}
          <div className="inline-flex items-center gap-1 bg-white border border-[#E6E8F0] rounded-2xl p-1.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('mindmap')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'mindmap'
                  ? 'bg-[#4F46E5] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F6F7FB]'
              }`}
            >
              <MapIcon size={15} />
              <span>Sơ đồ Lộ trình</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('network')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'network'
                  ? 'bg-[#4F46E5] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F6F7FB]'
              }`}
            >
              <Network size={15} />
              <span>Toàn cảnh Mạng lưới</span>
            </button>
          </div>
        </div>

        {/* SEARCH + AI THRESHOLD BAR */}
        <div className="bg-white border border-[#E6E8F0] rounded-2xl p-3 flex flex-wrap items-center gap-3 shadow-2xs">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Lọc nhanh theo tên môn học hoặc tài liệu..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl bg-[#F6F7FB] border border-[#E6E8F0] focus:bg-white focus:border-[#4F46E5] focus:outline-none text-[#0F172A]"
            />
          </div>

          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#F5F3FF] border border-[#E9D5FF]/80">
            <Sparkles size={14} className="text-[#7C3AED] shrink-0" />
            <label htmlFor="ai-sim-slider" className="text-xs font-semibold text-[#5B21B6] whitespace-nowrap">
              Ngưỡng liên kết AI ≥ {minSimilarity}%
            </label>
            <input
              id="ai-sim-slider"
              type="range"
              min={15}
              max={75}
              step={5}
              value={minSimilarity}
              onChange={(e) => setMinSimilarity(Number(e.target.value))}
              className="w-24 accent-[#7C3AED] cursor-pointer"
            />
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-[#475569] px-3 py-1.5 rounded-xl bg-[#F6F7FB] border border-[#E6E8F0]">
            <span className="text-[#4F46E5] font-bold">{coursesGrouped.length}</span> môn
            <span className="text-[#CBD5E1]">·</span>
            <span className="text-[#0F172A] font-bold">{docs.length}</span> tài liệu
            <span className="text-[#CBD5E1]">·</span>
            <span className="text-[#7C3AED] font-bold">{allSemanticLinks.length}</span> liên kết AI
          </div>
        </div>

        {loading ? (
          <div className="bg-white border border-[#E6E8F0] rounded-2xl h-[460px] flex flex-col items-center justify-center gap-3 text-[#64748B]">
            <Loader2 size={32} className="animate-spin text-[#4F46E5]" />
            <p className="text-sm font-medium">Đang phân tích cấu trúc môn học & liên kết ngữ nghĩa AI...</p>
          </div>
        ) : coursesGrouped.length === 0 ? (
          <div className="bg-white border border-[#E6E8F0] rounded-2xl p-12 text-center">
            <Network size={42} className="mx-auto text-[#CBD5E1] mb-3" />
            <h2 className="text-base font-bold text-[#0F172A]">Chưa tìm thấy tài liệu phù hợp</h2>
            <p className="text-xs text-[#64748B] mt-1">Thử xóa từ khóa tìm kiếm hoặc chia sẻ tài liệu mới để dựng bản đồ.</p>
          </div>
        ) : viewMode === 'mindmap' ? (
          /* =================================================================
             MODE 1: STRUCTURED LEARNING MINDMAP (ZERO OVERLAP, CRYSTAL CLEAR)
             ================================================================= */
          <div className="space-y-5">
            {/* COURSE PILL SELECTOR */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {coursesGrouped.map(([cName, cDocs]) => {
                const isSelected = cName === activeCourse;
                return (
                  <button
                    key={cName}
                    type="button"
                    onClick={() => {
                      setActiveCourse(cName);
                      setSelectedDocId(null);
                    }}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 border ${
                      isSelected
                        ? 'bg-[#4F46E5] text-white border-[#4F46E5] shadow-sm shadow-indigo-500/25'
                        : 'bg-white text-[#475569] border-[#E6E8F0] hover:border-[#C7D2FE] hover:text-[#4F46E5]'
                    }`}
                  >
                    <BookOpen size={14} />
                    <span>{cName}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-[#F6F7FB] text-[#64748B]'
                      }`}
                    >
                      {cDocs.length}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* MINDMAP BOARD */}
            <div
              className="rounded-3xl border border-[#E6E8F0] p-5 sm:p-7 shadow-2xs"
              style={{
                backgroundColor: '#FAFBFD',
                backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            >
              {/* ROOT COURSE HUB */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-gradient-to-r from-[#4F46E5] via-[#5B4CE8] to-[#7C3AED] text-white rounded-2xl p-5 shadow-md shadow-indigo-500/15 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs border border-white/25 flex items-center justify-center shrink-0">
                    <GraduationCap size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-100 block">
                      CHỦ ĐỀ TRUNG TÂM · LỘ TRÌNH 3 BƯỚC
                    </span>
                    <h2 className="text-lg sm:text-xl font-extrabold leading-tight mt-0.5">
                      {activeCourse}
                    </h2>
                    <p className="text-xs text-indigo-100 mt-1">
                      {activeCourseDocs.length} tài liệu học tập · {totalPagesActiveCourse} trang nội dung · {aiRelatedForMindmap.length} liên kết AI bổ trợ
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Link
                    to="/quiz"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-[#4F46E5] hover:bg-indigo-50 text-xs font-bold shadow-xs transition-colors"
                  >
                    <BrainCircuit size={15} />
                    <span>Luyện Quiz AI môn này</span>
                  </Link>
                  <Link
                    to="/upload"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25 text-xs font-semibold transition-colors"
                  >
                    <span>+ Đóng góp tài liệu</span>
                  </Link>
                </div>
              </div>

              {/* CONNECTOR LINES (Desktop visual mindmap branches) */}
              <div className="hidden lg:block -mt-6 mb-2 px-16">
                <svg viewBox="0 0 900 44" className="w-full h-11 overflow-visible" aria-hidden="true">
                  <path d="M 450 0 C 450 24, 150 18, 150 44" fill="none" stroke="#6366F1" strokeWidth="2.2" strokeLinecap="round" opacity="0.6" />
                  <path d="M 450 0 L 450 44" fill="none" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" opacity="0.6" />
                  <path d="M 450 0 C 450 24, 750 18, 750 44" fill="none" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" opacity="0.6" />
                  <circle cx="150" cy="44" r="4" fill="#6366F1" />
                  <circle cx="450" cy="44" r="4" fill="#10B981" />
                  <circle cx="750" cy="44" r="4" fill="#F59E0B" />
                </svg>
              </div>

              {/* 3 LEARNING STAGE COLUMNS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
                {STAGE_CONFIG.map((stage) => {
                  const StageIcon = stage.icon;
                  const stageDocs = stageBuckets[stage.key];
                  return (
                    <div
                      key={stage.key}
                      className="bg-white/95 backdrop-blur-xs border border-[#E6E8F0] rounded-2xl p-4 shadow-xs flex flex-col gap-3"
                    >
                      {/* Stage header */}
                      <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#F1F5F9]">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-xl ${stage.accentBg} ${stage.accentText} border ${stage.accentBorder} flex items-center justify-center shrink-0`}>
                            <StageIcon size={18} />
                          </div>
                          <div>
                            <span className={`text-[10px] font-extrabold tracking-wider uppercase ${stage.accentText} block`}>
                              {stage.step}
                            </span>
                            <h3 className="text-sm font-bold text-[#0F172A] leading-tight">{stage.title}</h3>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-[#F6F7FB] text-[#475569] text-[11px] font-bold border border-[#E6E8F0]">
                          {stageDocs.length}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#64748B] -mt-1">{stage.subtitle}</p>

                      {/* Document mini-cards */}
                      {stageDocs.length === 0 ? (
                        <div className="p-4 rounded-xl border border-dashed border-[#E2E8F0] bg-[#FAFBFD] text-center">
                          <p className="text-xs text-[#94A3B8]">Chưa có tài liệu ở bước này</p>
                          <Link
                            to="/upload"
                            className="inline-block mt-1.5 text-[11px] font-semibold text-[#4F46E5] hover:underline"
                          >
                            + Đóng góp ngay
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {stageDocs.map((doc) => {
                            const extMeta = getExtMeta(doc.fileExtension);
                            const isPicked = selectedDocId === doc.id;
                            return (
                              <div
                                key={doc.id}
                                onClick={() => setSelectedDocId(isPicked ? null : doc.id)}
                                className={`p-3 rounded-xl border transition-all cursor-pointer group ${
                                  isPicked
                                    ? 'bg-[#EEF2FF]/70 border-[#4F46E5] ring-2 ring-[#4F46E5]/15 shadow-xs'
                                    : 'bg-[#FAFBFD] hover:bg-white border-[#E6E8F0] hover:border-[#C7D2FE] hover:shadow-xs'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <DocumentThumbnail
                                    thumbnailUrl={doc.thumbnailUrl}
                                    title={doc.title}
                                    fileExtension={doc.fileExtension}
                                    className="w-12 h-[62px] rounded-lg shadow-2xs shrink-0"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${extMeta.badgeClass}`}>
                                        {extMeta.short}
                                      </span>
                                      <span className="text-[10px] text-[#64748B] font-medium">
                                        {doc.totalPages} trang
                                      </span>
                                    </div>
                                    <h4 className="text-xs font-bold text-[#0F172A] leading-snug line-clamp-2 group-hover:text-[#4F46E5] transition-colors">
                                      {doc.title}
                                    </h4>
                                    <div className="flex items-center justify-between gap-2 mt-2">
                                      <span className="text-[10px] text-[#64748B] truncate">
                                        {doc.authorName}
                                      </span>
                                      <Link
                                        to={`/detail/${doc.id}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center gap-0.5 text-[11px] font-bold text-[#4F46E5] hover:text-[#3730A3] shrink-0"
                                      >
                                        <span>Đọc</span>
                                        <ArrowRight size={12} />
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* BRANCH 4: AI SEMANTIC BRIDGES (CROSS-DOCUMENT / CROSS-COURSE) */}
              <div className="mt-6 pt-5 border-t border-dashed border-[#C4B5FD]">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center">
                      <Sparkles size={16} />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-[#0F172A]">
                        {selectedDocId && docById.get(selectedDocId)
                          ? `Tài liệu AI gợi ý bổ trợ cho "${docById.get(selectedDocId)?.title}"`
                          : `Liên kết Kiến thức AI cho môn "${activeCourse}"`}
                      </h3>
                      <p className="text-[11px] text-[#64748B]">
                        Phát hiện tự động bằng {algorithmLabel} (ngưỡng ≥ {minSimilarity}%)
                      </p>
                    </div>
                  </div>
                  {selectedDocId && (
                    <button
                      type="button"
                      onClick={() => setSelectedDocId(null)}
                      className="text-xs font-semibold text-[#7C3AED] hover:underline cursor-pointer"
                    >
                      Xem tất cả liên kết của môn
                    </button>
                  )}
                </div>

                {aiRelatedForMindmap.length === 0 ? (
                  <div className="bg-white/90 border border-[#E9D5FF] rounded-2xl p-4 text-xs text-[#64748B] flex items-center justify-between gap-3">
                    <span>
                      Chưa có liên kết AI nào đạt ngưỡng <strong>{minSimilarity}%</strong>. Hãy thử kéo thanh ngưỡng AI thấp xuống hoặc bấm vào 1 tài liệu khác.
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                    {aiRelatedForMindmap.map(({ sourceDoc, targetDoc, similarity, keywords, isCrossCourse }) => (
                      <Link
                        key={`${sourceDoc.id}-${targetDoc.id}`}
                        to={`/detail/${targetDoc.id}`}
                        className="bg-white hover:bg-[#FAF8FF] border border-[#E9D5FF] hover:border-[#A78BFA] rounded-2xl p-3.5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between gap-2.5 group"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="px-2 py-0.5 rounded-full bg-[#F5F3FF] text-[#6D28D9] text-[10px] font-bold border border-[#DDD6FE] truncate">
                              {isCrossCourse ? `Liên môn · ${targetDoc.courseName}` : targetDoc.courseName}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-[#7C3AED] text-white text-[10px] font-extrabold shrink-0">
                              {Math.round(similarity * 100)}% khớp
                            </span>
                          </div>
                          <div className="flex items-start gap-2.5">
                            <DocumentThumbnail
                              thumbnailUrl={targetDoc.thumbnailUrl}
                              title={targetDoc.title}
                              fileExtension={targetDoc.fileExtension}
                              className="w-11 h-14 rounded-lg shrink-0"
                            />
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-[#0F172A] group-hover:text-[#6D28D9] line-clamp-2 leading-snug">
                                {targetDoc.title}
                              </h4>
                              <p className="text-[10px] text-[#64748B] mt-1 truncate">
                                Liên quan với: <strong>{sourceDoc.title}</strong>
                              </p>
                            </div>
                          </div>
                        </div>

                        {keywords.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 pt-2 border-t border-[#F3E8FF]">
                            {keywords.map((kw) => (
                              <span
                                key={kw}
                                className="px-1.5 py-0.5 rounded bg-[#F5F3FF] text-[10px] font-medium text-[#5B21B6]"
                              >
                                #{kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* =================================================================
             MODE 2: AUTO-FIT RADIAL CONSTELLATION (ZERO OVERLAP NETWORK VIEW)
             ================================================================= */
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_330px] gap-5 items-start">
            <div className="relative bg-white border border-[#E6E8F0] rounded-2xl overflow-hidden shadow-2xs h-[560px] sm:h-[620px] select-none">
              <svg
                ref={svgRef}
                viewBox="0 0 960 620"
                className="w-full h-full cursor-grab active:cursor-grabbing"
                style={{
                  backgroundColor: '#FAFBFD',
                  backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
                onMouseDown={handleSvgMouseDown}
                onMouseMove={handleSvgMouseMove}
                onMouseUp={handleSvgMouseUp}
                onMouseLeave={handleSvgMouseUp}
                onWheel={(e) => {
                  e.preventDefault();
                  const factor = e.deltaY < 0 ? 1.1 : 0.91;
                  setZoom((z) => Math.min(2.2, Math.max(0.55, Number((z * factor).toFixed(2)))));
                }}
              >
                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                  {/* Course-to-Doc structural edges */}
                  {constellationBelongs.map((edge) => {
                    const s = cNodeById.get(edge.source);
                    const t = cNodeById.get(edge.target);
                    if (!s || !t) return null;
                    const focused =
                      !activeFocusNodeId || edge.source === activeFocusNodeId || edge.target === activeFocusNodeId;
                    return (
                      <line
                        key={`${edge.source}-${edge.target}`}
                        x1={s.x}
                        y1={s.y}
                        x2={t.x}
                        y2={t.y}
                        stroke="#CBD5E1"
                        strokeWidth={1.6}
                        opacity={focused ? 0.85 : 0.25}
                      />
                    );
                  })}

                  {/* AI Semantic edges */}
                  {allSemanticLinks.map((link) => {
                    const s = cNodeById.get(link.source);
                    const t = cNodeById.get(link.target);
                    if (!s || !t) return null;
                    const focused =
                      !activeFocusNodeId || link.source === activeFocusNodeId || link.target === activeFocusNodeId;
                    const midX = (s.x + t.x) / 2;
                    const midY = (s.y + t.y) / 2;
                    return (
                      <g key={link.id}>
                        <line
                          x1={s.x}
                          y1={s.y}
                          x2={t.x}
                          y2={t.y}
                          stroke="#7C3AED"
                          strokeWidth={focused ? 2.2 : 1.2}
                          strokeDasharray="6 4"
                          opacity={focused ? 0.85 : 0.2}
                        />
                        {activeFocusNodeId && focused && (
                          <g transform={`translate(${midX}, ${midY})`}>
                            <rect x={-22} y={-9} width={44} height={18} rx={9} fill="#7C3AED" />
                            <text
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill="#FFFFFF"
                              fontSize="9.5"
                              fontWeight="700"
                            >
                              {Math.round(link.similarity * 100)}%
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}

                  {/* Nodes */}
                  {constellationNodes.map((node) => {
                    const isSelected = selectedNodeId === node.id;
                    const isHovered = hoveredNodeId === node.id;
                    const shortLabel = node.label.length > 22 ? `${node.label.slice(0, 20)}…` : node.label;
                    const pillW = Math.min(144, shortLabel.length * 6 + 18);

                    return (
                      <g
                        key={node.id}
                        data-graph-node="true"
                        transform={`translate(${node.x}, ${node.y})`}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredNodeId(node.id)}
                        onMouseLeave={() => setHoveredNodeId(null)}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          draggingNodeRef.current = node.id;
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNodeId(node.id);
                        }}
                      >
                        {(isSelected || isHovered || node.kind === 'course') && (
                          <circle
                            r={node.radius + (isSelected ? 9 : 6)}
                            fill={node.color}
                            opacity={isSelected ? 0.22 : 0.12}
                          />
                        )}
                        <circle
                          r={node.radius}
                          fill={node.color}
                          stroke="#FFFFFF"
                          strokeWidth={isSelected ? 3.5 : 2.5}
                        />
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#FFFFFF"
                          fontSize={node.kind === 'course' ? '12' : '8.5'}
                          fontWeight="800"
                          style={{ pointerEvents: 'none' }}
                        >
                          {node.kind === 'course' ? `${node.docCount ?? 0}` : node.extLabel}
                        </text>

                        <g transform={`translate(0, ${node.radius + 15})`} style={{ pointerEvents: 'none' }}>
                          <rect
                            x={-pillW / 2}
                            y={-10}
                            width={pillW}
                            height={20}
                            rx={7}
                            fill={node.kind === 'course' ? '#EEF2FF' : '#FFFFFF'}
                            stroke={isSelected ? '#4F46E5' : '#E2E8F0'}
                            strokeWidth={isSelected ? 1.4 : 0.9}
                          />
                          <text
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill={node.kind === 'course' ? '#3730A3' : '#0F172A'}
                            fontSize={node.kind === 'course' ? '11' : '10'}
                            fontWeight={node.kind === 'course' ? '700' : '600'}
                          >
                            {shortLabel}
                          </text>
                        </g>
                      </g>
                    );
                  })}
                </g>
              </svg>

              {/* LEGEND */}
              <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs border border-[#E6E8F0] rounded-xl px-3 py-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-[#475569] shadow-xs">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4F46E5]" /> Môn học
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48]" /> PDF
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7]" /> Word
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" /> Slide
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" /> Excel
                </span>
                <span className="inline-flex items-center gap-1.5 text-[#7C3AED] font-semibold">
                  <span className="w-4 border-t-2 border-dashed border-[#7C3AED]" /> Liên kết AI
                </span>
              </div>

              {/* ZOOM CONTROLS */}
              <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/95 border border-[#E6E8F0] rounded-xl p-1 shadow-xs">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(2.2, Number((z + 0.15).toFixed(2))))}
                  className="p-1.5 rounded-lg hover:bg-[#F6F7FB] text-[#475569] cursor-pointer"
                  title="Phóng to"
                >
                  <ZoomIn size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.55, Number((z - 0.15).toFixed(2))))}
                  className="p-1.5 rounded-lg hover:bg-[#F6F7FB] text-[#475569] cursor-pointer"
                  title="Thu nhỏ"
                >
                  <ZoomOut size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                    setDragOverrides({});
                  }}
                  className="p-1.5 rounded-lg hover:bg-[#F6F7FB] text-[#475569] cursor-pointer"
                  title="Cân chỉnh lại"
                >
                  <Maximize2 size={15} />
                </button>
              </div>
            </div>

            {/* NETWORK INSPECTOR */}
            <aside className="bg-white border border-[#E6E8F0] rounded-2xl p-5 shadow-2xs space-y-4">
              {selectedConstellationNode?.kind === 'document' && selectedConstellationNode.doc ? (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] border border-[#E0E7FF] text-[11px] font-bold">
                      {selectedConstellationNode.doc.courseName}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedNodeId(null)}
                      className="p-1 rounded-lg hover:bg-[#F6F7FB] text-[#94A3B8] cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="flex gap-3 items-start">
                    <DocumentThumbnail
                      thumbnailUrl={selectedConstellationNode.doc.thumbnailUrl}
                      title={selectedConstellationNode.doc.title}
                      fileExtension={selectedConstellationNode.doc.fileExtension}
                      className="w-20 h-[104px] rounded-xl shadow-xs shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-[#0F172A] leading-snug line-clamp-3">
                        {selectedConstellationNode.doc.title}
                      </h3>
                      <p className="text-[11px] text-[#64748B] flex items-center gap-1 mt-2 truncate">
                        <User size={12} /> {selectedConstellationNode.doc.authorName}
                      </p>
                      <p className="text-[11px] text-[#64748B] flex items-center gap-1 mt-1">
                        <FileText size={12} /> {selectedConstellationNode.doc.totalPages} trang
                      </p>
                    </div>
                  </div>
                  <Link
                    to={`/detail/${selectedConstellationNode.doc.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white text-xs font-semibold shadow-xs"
                  >
                    <span>Mở đọc tài liệu</span>
                    <ArrowRight size={14} />
                  </Link>
                </>
              ) : selectedConstellationNode?.kind === 'course' ? (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#4F46E5]">CỤM MÔN HỌC</span>
                      <h3 className="text-base font-bold text-[#0F172A]">{selectedConstellationNode.label}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedNodeId(null)}
                      className="p-1 rounded-lg hover:bg-[#F6F7FB] text-[#94A3B8] cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCourse(selectedConstellationNode.label);
                      setViewMode('mindmap');
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold cursor-pointer"
                  >
                    <MapIcon size={14} />
                    <span>Mở Sơ đồ Lộ trình môn này</span>
                  </button>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet size={18} className="text-[#4F46E5]" />
                    <h3 className="text-sm font-bold text-[#0F172A]">Chế độ Toàn cảnh Mạng lưới</h3>
                  </div>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Kéo thả bất kỳ nút nào, cuộn chuột để phóng to/thu nhỏ, hoặc bấm vào một <strong>môn học</strong> để nhảy thẳng sang <strong>Sơ đồ Lộ trình 3 bước</strong>.
                  </p>
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default KnowledgeGraphPage;
