import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { MainLayout } from '../../components/layout';
import { useAuth } from '../../lib/authStore';
import { apiClient } from '../../services/apiClient';
import { documentService } from '../../services/documentService';

interface AdminReport {
  id: string;
  reporterUserId: string;
  documentId: string;
  reason: string;
  description?: string;
  status: string;
  createdAt?: string;
}

/**
 * Trang quản trị tối thiểu: danh sách report + quyết định duyệt/từ chối tài liệu.
 * Chỉ ADMIN (role từ JWT) qua được requireAdmin() ở backend.
 */
export function AdminModerationPage() {
  const { isAuthenticated, currentUser } = useAuth();
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<AdminReport[]>('/api/v1/admin/reports');
      setReports(Array.isArray(res) ? res : []);
    } catch (err: any) {
      toast.error(err?.message || 'Không thể tải danh sách báo cáo. Bạn có phải ADMIN?');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleModerate = async (report: AdminReport, status: 'PUBLISHED' | 'REJECTED') => {
    setProcessingId(report.id);
    try {
      await apiClient.put(`/api/v1/admin/documents/${report.documentId}/moderate`, {
        status,
        reason: report.reason,
      });
      toast.success(status === 'REJECTED' ? 'Đã gỡ tài liệu' : 'Đã duyệt lại tài liệu');
      await loadReports();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể thực hiện kiểm duyệt');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <MainLayout isAuthenticated={isAuthenticated} currentUser={currentUser}>
      <div className="admin-moderation page-enter max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck size={20} className="text-[#0284C7]" />
          <p className="eyebrow text-xs font-bold tracking-wider text-[#0284C7] uppercase">QUẢN TRỊ</p>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A] mb-2">Kiểm duyệt báo cáo vi phạm</h1>
        <p className="text-sm text-[#64748B] mb-6">
          Xem xét các báo cáo từ cộng đồng và quyết định giữ hoặc gỡ tài liệu khỏi mạng lưới.
        </p>

        {loading ? (
          <div className="py-10 flex items-center justify-center gap-2 text-sm text-[#64748B]">
            <Loader2 size={20} className="animate-spin text-[#0284C7]" />
            <span>Đang tải danh sách báo cáo...</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-8 text-center text-sm text-[#64748B]">
            Không có báo cáo nào cần xử lý.
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <div
                key={r.id}
                className="report-card bg-white border border-[#E2E8F0] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-0.5 text-[11px] font-bold rounded-md border ${
                        r.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {r.status}
                    </span>
                    <span className="text-xs text-[#94A3B8] font-mono truncate">{r.documentId}</span>
                  </div>
                  <p className="text-sm font-semibold text-[#0F172A]">{r.reason}</p>
                  {r.description && <p className="text-xs text-[#64748B] mt-0.5">{r.description}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={processingId === r.id}
                    onClick={() => handleModerate(r, 'REJECTED')}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 disabled:opacity-60 cursor-pointer"
                  >
                    Gỡ tài liệu
                  </button>
                  <button
                    type="button"
                    disabled={processingId === r.id}
                    onClick={() => handleModerate(r, 'PUBLISHED')}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-60 cursor-pointer"
                  >
                    Giữ tài liệu
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export function AdminModerationRoute() {
  return <AdminModerationPage />;
}

export const AdminModeration = AdminModerationPage;
export default AdminModerationPage;
