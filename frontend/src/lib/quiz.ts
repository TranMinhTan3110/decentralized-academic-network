import type { DocumentItem } from '../data/documents';

export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswerIndex: number; // 0, 1, 2, 3
    explanation: string;
    sourceSection: string;
}

export interface QuizResult {
    totalQuestions: number;
    correctAnswers: number;
    scorePercentage: number;
    timeSpentSeconds: number;
    userAnswers: Record<string, number>;
}

// Generate realistic mock quizzes tailored to document content
export function generateQuizForDocument(document?: Partial<DocumentItem> | null): QuizQuestion[] {
    const doc = document || { id: 'doc-1', title: 'Tài liệu ôn tập tổng hợp', category: 'Học thuật' };
    const docId = doc.id || 'doc-1';

    if (docId === 'doc-1') {
        return [
            {
                id: 'q1',
                question: 'Trong thuật toán KNN (K-Nearest Neighbors), tham số "K" đại diện cho điều gì?',
                options: [
                    'Số lượng thuộc tính (features) trong tập dữ liệu',
                    'Số lượng láng giềng gần nhất được xét để phân loại',
                    'Số lượng cụm dữ liệu phân chia',
                    'Hệ số học tập của thuật toán',
                ],
                correctAnswerIndex: 1,
                explanation: 'K trong KNN chỉ số lượng láng giềng gần nhất được dùng để bỏ phiếu chọn nhãn cho điểm dữ liệu mới.',
                sourceSection: 'Chương 2: Thuật toán phân loại KNN',
            },
            {
                id: 'q2',
                question: 'Chỉ số Gini Impurity trong Decision Tree dùng để làm gì?',
                options: [
                    'Đo lường độ rủi ro của mô hình',
                    'Đo độ thuần khiết của một nút khi phân chia dữ liệu',
                    'Tính khoảng cách Euclidean giữa hai điểm',
                    'Tối ưu hóa tốc độ huấn luyện mô hình',
                ],
                correctAnswerIndex: 1,
                explanation: 'Gini Impurity đo lường độ không thuần khiết của tập dữ liệu tại một nút, giúp chọn thuộc tính phân nhánh tốt nhất.',
                sourceSection: 'Chương 3: Cây quyết định (Decision Tree)',
            },
            {
                id: 'q3',
                question: 'Kỹ thuật Ensemble Learning nào được sử dụng chính trong Random Forest?',
                options: ['Boosting', 'Bagging (Bootstrap Aggregating)', 'Stacking', 'Voting Classifier'],
                correctAnswerIndex: 1,
                explanation: 'Random Forest kết hợp nhiều Cây quyết định bằng kỹ thuật Bagging để giảm hiện tượng Overfitting.',
                sourceSection: 'Chương 4: Random Forest & Ensemble Learning',
            },
            {
                id: 'q4',
                question: 'Thư viện Python nào thường dùng nhất để cài đặt mô hình Machine Learning cơ bản?',
                options: ['Scikit-Learn', 'Flask', 'BeautifulSoup', 'PyGame'],
                correctAnswerIndex: 0,
                explanation: 'Scikit-Learn cung cấp các công cụ chuẩn hóa cho Machine Learning trong Python như KNN, DecisionTree, SVM...',
                sourceSection: 'Thực hành Colab: Thư viện Scikit-Learn',
            },
            {
                id: 'q5',
                question: 'Công thức khoảng cách nào thường dùng mặc định trong KNN cho dữ liệu liên tục?',
                options: ['Khoảng cách Manhattan', 'Khoảng cách Euclidean', 'Khoảng cách Cosine', 'Khoảng cách Hamming'],
                correctAnswerIndex: 1,
                explanation: 'Khoảng cách Euclidean d = sqrt(sum((x_i - y_i)^2)) là độ đo mặc định trong không gian liên tục.',
                sourceSection: 'Công thức Toán học & Độ đo khoảng cách',
            },
        ];
    }

    if (docId === 'doc-2') {
        return [
            {
                id: 'q1',
                question: 'Độ phức tạp thời gian trung bình để tìm kiếm một phần tử trong Bảng băm (Hash Table) là bao nhiêu?',
                options: ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'],
                correctAnswerIndex: 0,
                explanation: 'Bảng băm có độ phức tạp tìm kiếm trung bình là O(1) nhờ hàm băm trực tiếp chỉ số mảng.',
                sourceSection: 'Phần 3: Bảng băm (Hash Table)',
            },
            {
                id: 'q2',
                question: 'Đặc điểm nào sau đây là của Cây AVL (AVL Tree)?',
                options: [
                    'Chênh lệch chiều cao giữa 2 cây con của một nút không quá 1',
                    'Mọi nút lá đều có cùng độ sâu',
                    'Nút gốc luôn chứa giá trị lớn nhất',
                    'Mỗi nút có tối đa 3 nút con',
                ],
                correctAnswerIndex: 0,
                explanation: 'Cây AVL là cây tìm kiếm nhị phân tự cân bằng với hệ số cân bằng (height difference) <= 1.',
                sourceSection: 'Phần 2: Cây nhị phân tự cân bằng AVL',
            },
            {
                id: 'q3',
                question: 'Thuật toán sắp xếp nào sau đây có độ phức tạp thời gian worst-case là O(n^2)?',
                options: ['Merge Sort', 'Quick Sort', 'Heap Sort', 'Tim Sort'],
                correctAnswerIndex: 1,
                explanation: 'Quick Sort trong trường hợp xấu nhất (chọn phần tử chốt kém) có độ phức tạp O(n^2).',
                sourceSection: 'Phần 4: Các thuật toán sắp xếp tối ưu',
            },
            {
                id: 'q4',
                question: 'Cấu trúc dữ liệu nào hoạt động theo nguyên tắc LIFO (Last In First Out)?',
                options: ['Hàng chờ (Queue)', 'Ngăn xếp (Stack)', 'Danh sách liên kết (Linked List)', 'Cây nhị phân (Binary Tree)'],
                correctAnswerIndex: 1,
                explanation: 'Stack (Ngăn xếp) thêm vào sau cùng sẽ được lấy ra đầu tiên (LIFO).',
                sourceSection: 'Phần 1: Ngăn xếp và Hàng chờ',
            },
        ];
    }

    // Default generic generated quiz for other documents (up to 15 diverse questions)
    const pageList = Array.isArray(doc.pages) ? doc.pages : [];
    const baseTopics = pageList.map((p) => p.heading).filter(Boolean);
    const docTitle = doc.title || 'Tài liệu học tập';
    const docCategory = doc.category || 'Học thuật';

    const genericQuestions: QuizQuestion[] = [
        {
            id: 'q1',
            question: `Khái niệm hoặc phương pháp nền tảng nào được đề cập chính trong tài liệu "${docTitle}"?`,
            options: [
                `Nguyên lý trọng tâm và các phương pháp giải quyết trong ${docCategory}`,
                'Các thuật toán tối ưu hóa hệ thống máy chủ legacy cũ',
                'Ngôn ngữ lập trình Assembly và vi điều khiển nhúng',
                'Mô hình xử lý phân tán độc lập không có ràng buộc',
            ],
            correctAnswerIndex: 0,
            explanation: `Tài liệu thuộc chuyên mục ${docCategory} tập trung vào kiến thức trọng tâm và ứng dụng thực tiễn của ${docTitle}.`,
            sourceSection: baseTopics[0] || 'Tổng quan tài liệu & Mục tiêu môn học',
        },
        {
            id: 'q2',
            question: 'Yếu tố quan trọng nhất để làm chủ và áp dụng hiệu quả nội dung tài liệu này là gì?',
            options: [
                'Chỉ đọc phần tóm tắt kết luận ở cuối tài liệu',
                'Nắm vững bản chất nguyên lý cốt lõi và thực hành bài tập tình huống',
                'Học thuộc lòng toàn bộ định nghĩa nguyên văn',
                'Bỏ qua các bước kiểm thử và đo lường tham số',
            ],
            correctAnswerIndex: 1,
            explanation: 'Hiểu bản chất công thức và làm bài tập mẫu giúp người học ghi nhớ sâu và tự tin áp dụng.',
            sourceSection: baseTopics[1] || 'Phương pháp tiếp cận kiến thức',
        },
        {
            id: 'q3',
            question: `Mục tiêu đào tạo hoặc kết quả đầu ra trọng tâm của chủ đề "${document?.title ?? "Tài liệu"}" là gì?`,
            options: [
                'Thay thế hoàn toàn mọi công cụ phân tích hiện có trên thị trường',
                'Giới hạn kiến thức trong phạm vi lý thuyết trừu tượng',
                'Trang bị năng lực phân tích, thiết kế và thẩm định giải pháp học thuật',
                'Chỉ áp dụng cho các hệ thống phần cứng chuyên dụng',
            ],
            correctAnswerIndex: 2,
            explanation: 'Mục tiêu chính là giúp người học hình thành tư duy hệ thống và năng lực giải quyết vấn đề.',
            sourceSection: baseTopics[2] || 'Mục tiêu đầu ra & Đánh giá năng lực',
        },
        {
            id: 'q4',
            question: 'Phương pháp kiểm chứng kiến thức được khuyến nghị khi nghiên cứu tài liệu này là gì?',
            options: [
                'Làm bài tập trắc nghiệm tự lượng giá và đối soát với tài liệu nguồn',
                'Chỉ đọc lướt qua một lần trước kỳ thi',
                'Sao chép lại toàn bộ văn bản mà không cần hiểu bản chất',
                'Bỏ qua việc thực hành kiểm chứng',
            ],
            correctAnswerIndex: 0,
            explanation: 'Làm trắc nghiệm ôn tập và tự lượng giá giúp phát hiện và bổ sung ngay các lỗ hổng kiến thức.',
            sourceSection: baseTopics[3] || 'Phương pháp tự đánh giá',
        },
        {
            id: 'q5',
            question: `Trong quá trình triển khai nội dung của "${document?.title ?? "Tài liệu"}", sai lầm phổ biến nào cần tránh?`,
            options: [
                'Đọc kỹ các tài liệu tham khảo được gợi ý',
                'Phân tích kỹ lưỡng các điều kiện ràng buộc đầu vào',
                'Bỏ qua bước thẩm định dữ liệu và áp dụng rập khuôn công thức',
                'Thảo luận nhóm để làm rõ các khái niệm phức tạp',
            ],
            correctAnswerIndex: 2,
            explanation: 'Áp dụng rập khuôn mà không phân tích điều kiện tiền đề dễ dẫn đến sai sót trong thực tế.',
            sourceSection: 'Phân tích tình huống & Lưu ý thực tiễn',
        },
        {
            id: 'q6',
            question: 'Khi phân tích các trường hợp biên hoặc điều kiện ngoại lệ, nguyên tắc nào cần ưu tiên?',
            options: [
                'Bỏ qua các trường hợp hiếm gặp để tiết kiệm thời gian',
                'Xác định rõ phạm vi áp dụng và kiểm tra tính toàn vẹn của kết quả',
                'Thay đổi giả định ban đầu để kết quả luôn hợp lệ',
                'Không cần ghi nhận lại các trường hợp ngoại lệ',
            ],
            correctAnswerIndex: 1,
            explanation: 'Kiểm tra trường hợp biên đảm bảo giải pháp luôn ổn định và đáng tin cậy.',
            sourceSection: 'Xử lý trường hợp biên & Ngoại lệ',
        },
        {
            id: 'q7',
            question: `Cơ sở lý thuyết nào đóng vai trò tiên quyết khi tiếp cận chuyên mục ${document?.category ?? "chung"}?`,
            options: [
                'Các nguyên lý toán học và mô hình hóa nền tảng',
                'Kinh nghiệm cảm tính của người thực hiện',
                'Các giả thuyết chưa được thực nghiệm chứng minh',
                'Quy chuẩn tạm thời không chính thức',
            ],
            correctAnswerIndex: 0,
            explanation: 'Các môn học thuộc chuyên mục đều xây dựng dựa trên nền tảng lý thuyết và mô hình chuẩn xác.',
            sourceSection: 'Cơ sở lý thuyết nền tảng',
        },
        {
            id: 'q8',
            question: 'Để đánh giá độ chính xác của giải pháp trong tài liệu, chỉ số nào thường được sử dụng?',
            options: [
                'Thời gian đọc tài liệu của người nghiên cứu',
                'Độ đo định lượng chuẩn hóa theo tiêu chí chuyên ngành',
                'Số lượng trang tài liệu được in ra',
                'Mức độ phức tạp của ngôn từ sử dụng',
            ],
            correctAnswerIndex: 1,
            explanation: 'Các chỉ số định lượng khách quan là tiêu chuẩn đo lường độ chính xác khoa học.',
            sourceSection: 'Đo lường & Đánh giá kết quả',
        },
        {
            id: 'q9',
            question: 'Quy trình thực nghiệm chuẩn tắc gồm những giai đoạn tuần tự nào?',
            options: [
                'Kết luận trước rồi mới tìm dẫn chứng phù hợp',
                'Chuẩn bị dữ liệu -> Thiết lập tham số -> Thực thi -> Đối soát kết quả',
                'Bỏ qua khâu chuẩn bị để tiến hành đo lường ngay',
                'Chỉ thực hiện một lần duy nhất mà không lặp lại',
            ],
            correctAnswerIndex: 1,
            explanation: 'Quy trình chuẩn tắc 4 bước đảm bảo tính lặp lại và khách quan của kết quả.',
            sourceSection: 'Quy trình thực nghiệm',
        },
        {
            id: 'q10',
            question: 'Vai trò của việc đối soát chéo (cross-validation) trong nghiên cứu tài liệu học thuật là gì?',
            options: [
                'Làm phức tạp hóa vấn đề không cần thiết',
                'Hạn chế hiện tượng đánh giá thiên lệch và nâng cao tính tin cậy',
                'Giảm dung lượng lưu trữ của tệp bài giảng',
                'Tăng thời gian hoàn thành bài tập của sinh viên',
            ],
            correctAnswerIndex: 1,
            explanation: 'Đối soát chéo giúp phát hiện sai lệch ngẫu nhiên và nâng cao độ tin cậy của kết luận.',
            sourceSection: 'Phương pháp thẩm định chuyên sâu',
        },
        {
            id: 'q11',
            question: `Ưu thế nổi bật khi áp dụng các kỹ thuật trong "${document?.title ?? "Tài liệu"}" là gì?`,
            options: [
                'Tối ưu hóa hiệu suất và giảm thiểu rủi ro vận hành',
                'Loại bỏ hoàn toàn sự can thiệp của con người',
                'Không cần bất kỳ tài nguyên tính toán nào',
                'Chỉ có giá trị trong các kỳ thi học kỳ',
            ],
            correctAnswerIndex: 0,
            explanation: 'Áp dụng đúng kỹ thuật giúp tiết kiệm thời gian, tối ưu hóa nguồn lực và hạn chế lỗi.',
            sourceSection: 'Ưu thế ứng dụng',
        },
        {
            id: 'q12',
            question: 'Khi gặp mâu thuẫn giữa lý thuyết và kết quả thực nghiệm, bước xử lý đúng đắn là gì?',
            options: [
                'Chỉnh sửa số liệu thực nghiệm cho khớp với lý thuyết',
                'Hủy bỏ toàn bộ đề tài ngay lập tức',
                'Kiểm tra lại điều kiện biên, dữ liệu đầu vào và các giả định nền tảng',
                'Bỏ qua sự khác biệt nếu độ lệch nhỏ',
            ],
            correctAnswerIndex: 2,
            explanation: 'Rà soát giả định và quy trình đo lường là bước đi khoa học để tìm ra nguyên nhân thực sự.',
            sourceSection: 'Phân tích sai lệch',
        },
        {
            id: 'q13',
            question: 'Tính tái lập (reproducibility) trong tài liệu học thuật thể hiện qua điều gì?',
            options: [
                'Khả năng người khác có thể thực hiện lại quy trình và thu được kết quả tương tự',
                'Khả năng sao chép văn bản sang nhiều định dạng tệp khác nhau',
                'Tài liệu có nhiều người tải về trên mạng xã hội',
                'Số lượng hình minh họa xuất hiện trong văn bản',
            ],
            correctAnswerIndex: 0,
            explanation: 'Tính tái lập là tiêu chuẩn vàng của mọi nghiên cứu khoa học và tài liệu giảng dạy chuẩn mực.',
            sourceSection: 'Tính chuẩn xác khoa học',
        },
        {
            id: 'q14',
            question: 'Mối liên hệ giữa tài liệu này với các môn học chuyên ngành khác thể hiện ở khía cạnh nào?',
            options: [
                'Không có bất kỳ mối liên hệ nào với các môn khác',
                'Cung cấp phương pháp luận và công cụ nền tảng để giải quyết bài toán phức tạp hơn',
                'Hoàn toàn trùng lặp nội dung với tất cả các môn khác',
                'Chỉ có giá trị phục vụ cho việc tính điểm học phần',
            ],
            correctAnswerIndex: 1,
            explanation: 'Kiến thức học phần là mắt xích liên kết, tạo tiền đề giải quyết các môn học chuyên sâu.',
            sourceSection: 'Liên kết liên môn',
        },
        {
            id: 'q15',
            question: 'Sau khi hoàn thành nghiên cứu tài liệu, bước phát triển năng lực tiếp theo là gì?',
            options: [
                'Ngừng tìm hiểu về chủ đề này',
                'Chỉ ôn lại đúng các câu hỏi đã có sẵn đáp án',
                'Triển khai dự án thực tế hoặc bài tập lớn áp dụng kiến thức vào bối cảnh mới',
                'Xóa bỏ toàn bộ ghi chép đã thực hiện',
            ],
            correctAnswerIndex: 2,
            explanation: 'Ứng dụng vào thực tiễn dự án là cách tốt nhất để biến kiến thức lý thuyết thành kỹ năng thực thụ.',
            sourceSection: 'Định hướng ứng dụng thực tế',
        },
    ];

    return genericQuestions;
}

export function exportQuizToText(document?: Partial<DocumentItem> | null, questions: QuizQuestion[] = []): string {
    const title = document?.title || 'TÀI LIỆU ÔN TẬP';
    const authorName = document?.author?.name || 'Thành viên';
    const authorRole = document?.author?.role || 'Sinh viên';
    const category = document?.category || 'Học thuật';
    const lines = [
        `==================================================`,
        `BỘ CÂU HỎI QUIZ ÔN TẬP: ${title.toUpperCase()}`,
        `Tác giả tài liệu: ${authorName} (${authorRole})`,
        `Chuyên mục: ${category} | Số câu: ${questions.length}`,
        `Ngày tạo: ${new Date().toLocaleDateString('vi-VN')}`,
        `==================================================`,
        '',
    ];

    questions.forEach((q, idx) => {
        lines.push(`Câu ${idx + 1}: ${q.question}`);
        q.options.forEach((opt, optIdx) => {
            const letter = String.fromCharCode(65 + optIdx);
            lines.push(`   ${letter}. ${opt}`);
        });
        lines.push(`   => Đáp án đúng: ${String.fromCharCode(65 + q.correctAnswerIndex)}. ${q.options[q.correctAnswerIndex]}`);
        lines.push(`   (Nguồn: ${q.sourceSection})`);
        lines.push('');
    });

    return lines.join('\n');
}
