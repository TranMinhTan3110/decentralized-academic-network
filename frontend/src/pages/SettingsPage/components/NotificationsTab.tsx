import { useState } from 'react';
import { Bell, MessageSquare, ThumbsUp, Sparkles, Mail, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../../components/ui';

export function NotificationsTab() {
    const [pushEnabled, setPushEnabled] = useState(true);
    const [commentNotify, setCommentNotify] = useState(true);
    const [upvoteNotify, setUpvoteNotify] = useState(true);
    const [aiDigest, setAiDigest] = useState(false);
    const [marketingEmail, setMarketingEmail] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        await new Promise((resolve) => setTimeout(resolve, 500));
        setIsSaving(false);
        toast.success('Đã lưu thiết lập thông báo!');
    };

    return (
        <div className="space-y-6">
            {/* Tab Header */}
            <div className="border-b border-[#d8deea] pb-4">
                <h2 className="text-xl font-bold text-[#121827]">Tùy chỉnh thông báo</h2>
                <p className="text-xs text-[#5f6878] mt-1">
                    Chọn loại thông báo và kênh mà bạn muốn nhận tin từ hệ thống học thuật.
                </p>
            </div>

            {/* Notification Toggles */}
            <div className="space-y-4">
                {/* Item 1 */}
                <div className="p-4 rounded-xl bg-white border border-[#d8deea] flex items-center justify-between gap-4 shadow-xs">
                    <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-[#315dff]/10 text-[#315dff] rounded-lg mt-0.5">
                            <Bell className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-[#121827]">Thông báo đẩy trên trình duyệt (Push)</h3>
                            <p className="text-[11px] text-[#5f6878] mt-0.5">
                                Nhận thông báo tức thì ngay trên màn hình trình duyệt khi có hoạt động mới.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setPushEnabled(!pushEnabled)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                            pushEnabled ? 'bg-[#315dff]' : 'bg-slate-300'
                        }`}
                    >
                        <div
                            className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                                pushEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                    </button>
                </div>

                {/* Item 2 */}
                <div className="p-4 rounded-xl bg-white border border-[#d8deea] flex items-center justify-between gap-4 shadow-xs">
                    <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-[#ee964b]/10 text-[#ee964b] rounded-lg mt-0.5">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-[#121827]">Bình luận & Thảo luận bài viết</h3>
                            <p className="text-[11px] text-[#5f6878] mt-0.5">
                                Thông báo khi người dùng khác thảo luận, đặt câu hỏi hoặc phản hồi bài viết của bạn.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setCommentNotify(!commentNotify)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                            commentNotify ? 'bg-[#315dff]' : 'bg-slate-300'
                        }`}
                    >
                        <div
                            className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                                commentNotify ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                    </button>
                </div>

                {/* Item 3 */}
                <div className="p-4 rounded-xl bg-white border border-[#d8deea] flex items-center justify-between gap-4 shadow-xs">
                    <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-[#1d42d8]/10 text-[#1d42d8] rounded-lg mt-0.5">
                            <ThumbsUp className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-[#121827]">Lượt Upvote & Lưu tài liệu</h3>
                            <p className="text-[11px] text-[#5f6878] mt-0.5">
                                Nhận thông báo mỗi khi tài liệu nghiên cứu của bạn được ai đó thích hoặc lưu vào bộ sưu
                                tập.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setUpvoteNotify(!upvoteNotify)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                            upvoteNotify ? 'bg-[#315dff]' : 'bg-slate-300'
                        }`}
                    >
                        <div
                            className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                                upvoteNotify ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                    </button>
                </div>

                {/* Item 4 */}
                <div className="p-4 rounded-xl bg-white border border-[#d8deea] flex items-center justify-between gap-4 shadow-xs">
                    <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-lg mt-0.5">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-[#121827]">Tổng hợp tài liệu hay từ AI hàng tuần</h3>
                            <p className="text-[11px] text-[#5f6878] mt-0.5">
                                Nhận email tổng hợp tài liệu chuyên ngành mới nhất vào mỗi sáng Thứ Hai.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setAiDigest(!aiDigest)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                            aiDigest ? 'bg-[#315dff]' : 'bg-slate-300'
                        }`}
                    >
                        <div
                            className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                                aiDigest ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                    </button>
                </div>

                {/* Item 5 */}
                <div className="p-4 rounded-xl bg-white border border-[#d8deea] flex items-center justify-between gap-4 shadow-xs">
                    <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-purple-100 text-purple-600 rounded-lg mt-0.5">
                            <Mail className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-[#121827]">Email sự kiện & Cập nhật hệ thống</h3>
                            <p className="text-[11px] text-[#5f6878] mt-0.5">
                                Nhận thông tin về các hội thảo khoa học, cuộc thi và tính năng mới của nền tảng.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setMarketingEmail(!marketingEmail)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                            marketingEmail ? 'bg-[#315dff]' : 'bg-slate-300'
                        }`}
                    >
                        <div
                            className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                                marketingEmail ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                    </button>
                </div>
            </div>

            {/* Action Footer */}
            <div className="flex justify-end pt-4 border-t border-[#d8deea]">
                <Button
                    type="button"
                    variant="primary"
                    onClick={handleSave}
                    disabled={isSaving}
                    icon={
                        isSaving ? (
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )
                    }
                >
                    Lưu thiết lập thông báo
                </Button>
            </div>
        </div>
    );
}
