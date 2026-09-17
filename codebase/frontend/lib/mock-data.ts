import type {
  AgentProfile,
  ChatHistorySession,
  Checkpoint,
  Flashcard,
  MindmapLeaf,
  Message,
  QuizQuestion,
} from "./types";
import type { LectureDay } from "./lecture-data";

export const initialConversation: Message[] = [
  {
    id: 1,
    senderType: "teacher",
    senderName: "TS. Minh",
    role: "Giảng viên",
    avatar: "👨‍🏫",
    time: "10:15",
    text: `Chào bạn! Chúng ta vừa đi qua slide về cơ chế <strong>Scaled Dot-Product Attention</strong>. Trọng tâm của bài này là hiểu rõ cách mà ma trận <span class="code-chip">Query</span> tìm kiếm thông tin phù hợp trong <span class="code-chip">Key</span> để trích xuất <span class="code-chip">Value</span>. Bạn thấy phần nào còn cần giải thích sâu hơn không?`,
  },
  {
    id: 2,
    senderType: "student",
    senderName: "Bảo Nam",
    role: "Bạn học (Active Recall)",
    avatar: "🎒",
    time: "10:16",
    text: `Ủa cậu ơi! Chỗ công thức <span class="code-chip">Softmax((Q · K^T) / √dk) · V</span>, tớ vẫn chưa thông suốt lắm: <strong>Tại sao lại cần chia cho căn bậc hai của dk (√dk)</strong> vậy cậu? Nếu bỏ √dk đi thì thuật toán có chạy được không? Cậu thử giải thích ngắn gọn bằng lời của cậu cho tớ nghe với!`,
    activeRecallPrompt: true,
  },
  {
    id: 3,
    senderType: "generator",
    senderName: "Nexus Bot",
    role: "Sinh tài liệu",
    avatar: "⚡",
    time: "10:16",
    text: `Mình đã tạo sẵn <strong>1 bộ Quiz 2 câu</strong> và <strong>3 thẻ Flashcards 3D</strong> ở cột <em>Kho Artifacts bên phải</em> để cả lớp cùng củng cố kiến thức nhé!`,
    hasArtifactNotice: true,
  },
];

export const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    prompt: `Tại sao trong công thức Scaled Dot-Product lại chia cho <span class="code-chip">√dk</span>?`,
    options: [
      { key: "A", text: "Để giảm kích thước bộ nhớ GPU", isCorrect: false },
      { key: "B", text: "Để tránh tích vô hướng quá lớn làm triệt tiêu gradient ở hàm Softmax", isCorrect: true },
      { key: "C", text: "Để biến ma trận thành ma trận đường chéo", isCorrect: false },
    ],
    correctFeedback:
      "🎉 <strong>Chính xác!</strong> Chia cho √dk giúp giá trị đầu vào của Softmax không quá lớn, chống triệt tiêu gradient.",
    wrongFeedback:
      "❌ <strong>Chưa đúng rồi!</strong> Đáp án đúng là <strong>B</strong>. Lý do chính là để ngăn chặn hiện tượng bão hòa gradient trong Softmax.",
  },
  {
    id: 2,
    prompt: `Trong cơ chế Attention, vector nào đóng vai trò là "Truy vấn tìm kiếm"?`,
    options: [
      { key: "A", text: "Query (Q)", isCorrect: true },
      { key: "B", text: "Key (K)", isCorrect: false },
      { key: "C", text: "Value (V)", isCorrect: false },
    ],
    correctFeedback:
      "🎉 <strong>Chính xác!</strong> Vector Query (Q) đại diện cho câu hỏi hoặc từ đang cần tra cứu mối liên hệ.",
    wrongFeedback:
      "❌ <strong>Chưa đúng rồi!</strong> Đáp án đúng là <strong>A</strong>. Query là vector truy vấn, Key là từ được so sánh, Value là thông tin được lấy.",
  },
];

export const flashcardsData: Flashcard[] = [
  {
    term: "Scaled Dot-Product Attention",
    def: "Công thức: Softmax((Q · K^T) / √dk) · V.<br><br>💡 <strong>Mẹo nhớ:</strong> Query hỏi Key để tìm độ tương quan, sau đó nhân với Value để gom thông tin.",
  },
  {
    term: "Multi-Head Attention",
    def: "Chia vector Q, K, V thành nhiều tập con (heads) tính song song.<br><br>💡 <strong>Lợi ích:</strong> Cho phép chú ý đồng thời nhiều khía cạnh cú pháp & ngữ nghĩa khác nhau.",
  },
  {
    term: "Vanishing Gradient in Softmax",
    def: "Khi giá trị đầu vào quá lớn, đạo hàm của hàm Softmax tiệm cận về 0.<br><br>💡 <strong>Khắc phục:</strong> Chia cho √dk để chuẩn hóa phương sai về xấp xỉ 1.",
  },
];

export const mindmapLeaves: MindmapLeaf[] = [
  {
    label: "1. Vectors Q, K, V",
    tag: "Trọng số ngữ cảnh",
    detail: "Nhánh Q-K-V: Bản chất của phép truy xuất thông tin ngữ cảnh",
  },
  {
    label: "2. Scaling Factor (√dk)",
    tag: "Chống van gradient",
    detail: "Nhánh Scaling Factor: Chia cho căn bậc hai dk để bảo vệ độ dốc gradient",
  },
  {
    label: "3. Softmax Distribution",
    tag: "Xác suất chú ý",
    detail: "Nhánh Softmax: Chuẩn hoá các trọng số chú ý thành xác suất tổng bằng 1",
  },
  {
    label: "4. Multi-Head Attention",
    tag: "Song song hóa",
    detail: "Nhánh Multi-Head: Cho phép mô hình đồng thời chú ý tới nhiều khía cạnh ngữ pháp & ngữ nghĩa khác nhau",
  },
];

/* Checkpoint tương tác gắn thủ công theo trang slide — key là id buổi học (day1/day2). */
export const checkpointsByDay: Record<LectureDay["id"], Checkpoint[]> = {
  day1: [
    {
      id: 1,
      pageIndex: 4,
      question: "Trước khi qua tiếp: LLM sinh ra câu trả lời dựa trên cơ chế nào?",
      options: [
        { key: "A", text: "Dự đoán xác suất token tiếp theo dựa trên ngữ cảnh", isCorrect: true },
        { key: "B", text: "Tra cứu trực tiếp trong một cơ sở dữ liệu có sẵn", isCorrect: false },
        { key: "C", text: "Chạy các luật if-else được lập trình cứng", isCorrect: false },
      ],
    },
    {
      id: 2,
      pageIndex: 9,
      question: "Vì sao AI có thể trả lời khác nhau ở 2 lần chạy cùng một câu hỏi?",
      options: [
        { key: "A", text: "Vì mô hình bị lỗi", isCorrect: false },
        { key: "B", text: "Vì bản chất AI sinh ra theo xác suất, không phải kết quả cố định", isCorrect: true },
        { key: "C", text: "Vì mạng internet không ổn định", isCorrect: false },
      ],
    },
  ],
  day2: [
    {
      id: 3,
      pageIndex: 4,
      question: "Bước đầu tiên khi nhận một đề bài AI mơ hồ từ sếp/stakeholder là gì?",
      options: [
        { key: "A", text: "Bắt tay build giải pháp ngay để kịp tiến độ", isCorrect: false },
        { key: "B", text: "Đào sâu tìm vấn đề/pain point thực sự phía sau đề bài", isCorrect: true },
        { key: "C", text: "Chọn công nghệ AI mới nhất đang hot", isCorrect: false },
      ],
    },
    {
      id: 4,
      pageIndex: 9,
      question: "Theo mô hình Double Diamond, 'do the wrong thing right' nguy hiểm ở điểm nào?",
      options: [
        { key: "A", text: "Tốn ít thời gian hơn dự kiến", isCorrect: false },
        { key: "B", text: "Làm rất tốt nhưng sai vấn đề ngay từ đầu, không học được gì hữu ích", isCorrect: true },
        { key: "C", text: "Không liên quan gì đến rủi ro dự án", isCorrect: false },
      ],
    },
  ],
};

export const agentProfiles: Record<"teacher" | "student" | "generator", AgentProfile> = {
  teacher: {
    key: "teacher",
    name: "TS. Minh",
    tagline: "Giảng viên AI — giải thích bản chất, không chỉ đọc công thức",
    bio: "TS. Minh chuyên phân tích sâu các khái niệm nền tảng của Transformer & LLM, luôn đối chiếu công thức toán học với trực giác thực tế để bạn hiểu tận gốc thay vì học vẹt.",
    quote: "Hiểu đúng bản chất một lần, nhớ được cả đời — học vẹt thì quên sau một tuần.",
  },
  student: {
    key: "student",
    name: "Bảo Nam",
    tagline: "Bạn học ảo — luyện Active Recall cùng bạn",
    bio: "Bảo Nam đóng vai một bạn học tò mò, liên tục đặt câu hỏi ngược lại để bạn phải tự diễn giải kiến thức bằng lời của mình (kỹ thuật Feynman) — cách ghi nhớ hiệu quả nhất.",
    quote: "Cậu thử giải thích lại cho tớ nghe xem, tớ đảm bảo cậu sẽ nhớ lâu hơn nhiều!",
  },
  generator: {
    key: "generator",
    name: "Nexus Bot",
    tagline: "Trợ lý sinh tài liệu ôn tập tức thì",
    bio: "Nexus Bot lắng nghe cuộc trò chuyện và tự động tạo Quiz, Flashcard, Mindmap bám sát đúng nội dung đang thảo luận, giúp bạn củng cố kiến thức ngay lập tức.",
    quote: "Yêu cầu gì cứ nói — quiz, flashcard hay mindmap, mình tạo ngay cho bạn!",
  },
};

export const chatHistorySessions: ChatHistorySession[] = [
  { date: "Hôm nay, 10:15", agent: "teacher", topic: "Tại sao cần căn bậc 2 dk?" },
  { date: "Hôm nay, 10:16", agent: "student", topic: "Phân biệt Query, Key, Value" },
  { date: "Hôm nay, 10:20", agent: "generator", topic: "Multi-head Attention lợi ích gì?" },
  { date: "Hôm qua", agent: "teacher", topic: "Vì sao Transformer thay thế được RNN?" },
  { date: "Hôm qua", agent: "student", topic: "Thử thách: giải thích lại Scaled Dot-Product" },
  { date: "3 ngày trước", agent: "generator", topic: "Tạo flashcard ôn tập chương 1" },
];
