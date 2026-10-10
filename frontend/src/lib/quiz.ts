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
export function generateQuizForDocument(document: DocumentItem): QuizQuestion[] {
    const docId = document.id;

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

    // Default generic generated quiz for other documents
    return [
        {
            id: 'q1',
            question: `Khái niệm nền tảng nào được đề cập chính trong tài liệu "${document.title}"?`,
            options: [
                `${document.category} và các phương pháp ứng dụng thực tế`,
                'Các thuật toán tối ưu hệ thống legacy cũ',
                'Ngôn ngữ lập trình Assembly nâng cao',
                'Quản trị doanh nghiệp và tiếp thị số',
            ],
            correctAnswerIndex: 0,
            explanation: `Tài liệu thuộc chuyên mục ${document.category} tập trung vào kiến thức trọng tâm và ứng dụng thực tiễn.`,
            sourceSection: 'Tổng quan tài liệu & Mục tiêu môn học',
        },
        {
            id: 'q2',
            question: 'Yếu tố quan trọng nhất để làm chủ nội dung tài liệu này là gì?',
            options: [
                'Nắm vững công thức cốt lõi và thực hành bài tập mẫu',
                'Học thuộc lòng toàn bộ định nghĩa',
                'Chỉ đọc phần kết luận cuối tài liệu',
                'Bỏ qua các hình ảnh minh họa',
            ],
            correctAnswerIndex: 0,
            explanation: 'Hiểu bản chất công thức và làm bài tập mẫu giúp ghi nhớ sâu và ứng dụng thực tế.',
            sourceSection: 'Hướng dẫn ôn tập hiệu quả',
        },
        {
            id: 'q3',
            question: `Tài liệu này được biên soạn bởi ai và phù hợp với đối tượng nào?`,
            options: [
                `Biên soạn bởi ${document.author.name} (${document.author.role}), phù hợp sinh viên và người nghiên cứu`,
                'Do học sinh cấp 2 biên soạn ngẫu nhiên',
                'Tài liệu sưu tầm không rõ nguồn gốc',
                'Dành riêng cho chuyên gia trên 20 năm kinh nghiệm',
            ],
            correctAnswerIndex: 0,
            explanation: `Tài liệu uy tín được chia sẻ bởi ${document.author.name} (${document.author.role}).`,
            sourceSection: 'Thông tin tác giả & Giới thiệu',
        },
        {
            id: 'q4',
            question: 'Phương pháp kiểm chứng kiến thức được khuyến nghị khi đọc tài liệu này?',
            options: [
                'Làm trắc nghiệm ôn tập và tự giải lại các ví dụ minh họa',
                'Chỉ đọc lướt qua một lần',
                'Sao chép lại toàn bộ văn bản',
                'Không cần kiểm tra lại',
            ],
            correctAnswerIndex: 0,
            explanation: 'Làm Quiz trắc nghiệm giúp hệ thống lại các lỗ hổng kiến thức ngay lập tức.',
            sourceSection: 'Phương pháp tự đánh giá',
        },
    ];
}

export function exportQuizToText(document: DocumentItem, questions: QuizQuestion[]): string {
    const lines = [
        `==================================================`,
        `BỘ CÂU HỎI QUIZ ÔN TẬP: ${document.title.toUpperCase()}`,
        `Tác giả tài liệu: ${document.author.name} (${document.author.role})`,
        `Chuyên mục: ${document.category} | Số câu: ${questions.length}`,
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
