import type {
  Flashcard,
  Lesson,
  MindmapLeaf,
  Message,
  QuizQuestion,
  Slide,
} from "./types";

export const lessons: Lesson[] = [
  { number: 1, name: "Cơ chế Attention & Transformer", status: "Đang học", slideCount: 4 },
  { number: 2, name: "Prompt Engineering Nâng Cao", status: "Sắp tới", slideCount: 6 },
  { number: 3, name: "RAG & Vector Database Search", status: "Chưa học", slideCount: 5 },
  { number: 4, name: "Multi-Agent Collaboration Architecture", status: "Chưa học", slideCount: 8 },
];

export const slidesData: Slide[] = [
  {
    tag: "Khái niệm nền tảng",
    title: "1. Tại sao Attention Mechanism ra đời?",
    body: `
      <p style="margin-bottom: 14px;">Trước khi có Transformer (2017), các mô hình dịch máy và xử lý ngôn ngữ chủ yếu dựa trên <strong>RNN và LSTM</strong>. Tuy nhiên, các kiến trúc này gặp hai giới hạn chí mạng:</p>
      <ul style="padding-left: 20px; margin-bottom: 14px; display: flex; flex-direction: column; gap: 8px;">
        <li><strong>Mất mát thông tin đường dài (Long-term Dependency):</strong> Khi câu văn quá dài, các từ ở đầu câu dễ bị lãng quên ở cuối câu.</li>
        <li><strong>Không tính toán song song được (Sequential bottleneck):</strong> Từ sau phải chờ từ trước tính xong, khiến việc huấn luyện trên dữ liệu khổng lồ tốn hàng tháng trời.</li>
      </ul>
      <p>Cơ chế <strong>Self-Attention</strong> ra đời với bài báo huyền thoại <em>"Attention Is All You Need"</em>, giải quyết triệt để 2 vấn đề này bằng cách cho phép mỗi từ kết nối trực tiếp với mọi từ khác trong câu cùng một lúc.</p>
    `,
  },
  {
    tag: "Công thức toán học & Bản chất",
    title: "2. Scaled Dot-Product Attention hoạt động như thế nào?",
    body: `
      <p>Trọng tâm của Transformer là phép tính tích vô hướng có chia tỷ lệ giữa ba ma trận <strong>Query (Q)</strong>, <strong>Key (K)</strong> và <strong>Value (V)</strong>:</p>

      <div class="attention-diagram-box">
        <div class="vector-node q">
          <span>Query (Q)</span>
          <span class="vector-desc">Từ đang tìm kiếm</span>
        </div>
        <div class="diagram-operator">×</div>
        <div class="vector-node k">
          <span>Key (K)</span>
          <span class="vector-desc">Từ được đối chiếu</span>
        </div>
        <div class="diagram-operator">÷ √d<sub>k</sub> ➔ Softmax ➔ ×</div>
        <div class="vector-node v">
          <span>Value (V)</span>
          <span class="vector-desc">Thông tin truyền đi</span>
        </div>
      </div>

      <div style="text-align: center; margin-top: 14px;">
        <div class="formula-badge">Attention(Q, K, V) = softmax( (Q · K<sup>T</sup>) / √d<sub>k</sub> ) · V</div>
      </div>
      <p style="margin-top: 14px; font-size: 13px; color: #9ca3af;">
        * Lưu ý: Chia cho <strong>√d<sub>k</sub></strong> để giữ phương sai ổn định, không làm softmax bị bão hòa. Hãy mở <strong>Multi-Agent Classroom</strong> để cùng thảo luận chi tiết điều này với Bạn học và Giảng viên AI!
      </p>
    `,
  },
  {
    tag: "Kiến trúc mở rộng",
    title: "3. Multi-Head Attention: Đa góc nhìn ngữ nghĩa",
    body: `
      <p style="margin-bottom: 14px;">Thay vì chỉ tính một hàm attention duy nhất, kiến trúc Transformer chia các vector thành <strong>h heads (thường là 8 hoặc 16 heads)</strong> chạy song song.</p>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 10px;">
        <div style="background: rgba(255, 255, 255, 0.03); padding: 14px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.08);">
          <strong style="color: #6366f1;">Head 1 · Quan hệ ngữ pháp:</strong>
          <p style="font-size: 13px; color: #d1d5db; margin-top: 6px;">Tập trung liên kết Chủ ngữ với Động từ chính ("The dog ... barked").</p>
        </div>
        <div style="background: rgba(255, 255, 255, 0.03); padding: 14px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.08);">
          <strong style="color: #10b981;">Head 2 · Đại từ thay thế:</strong>
          <p style="font-size: 13px; color: #d1d5db; margin-top: 6px;">Tập trung giải nghĩa đại từ ("it" chỉ đồ vật hay con vật xuất hiện trước đó).</p>
        </div>
      </div>
      <p style="margin-top: 14px;">Nhờ vậy, mô hình thu được hiểu biết toàn diện về ngữ nghĩa văn bản ở nhiều tầng trừu tượng khác nhau.</p>
    `,
  },
  {
    tag: "Ứng dụng thực tế",
    title: "4. Tác động tới ChatGPT, Gemini & Kỷ nguyên LLMs",
    body: `
      <p style="margin-bottom: 14px;">Mọi mô hình ngôn ngữ lớn (LLMs) đột phá hiện nay như <strong>GPT-4, Claude 3.5, Gemini 1.5 Pro, Llama 3</strong> đều kế thừa trực tiếp từ khối Transformer Decoder.</p>
      <ul style="padding-left: 20px; display: flex; flex-direction: column; gap: 8px;">
        <li><strong>Khả năng In-Context Learning:</strong> LLM hiểu ngữ cảnh lập tức chỉ qua vài dòng prompt mà không cần fine-tune lại trọng số.</li>
        <li><strong>Multi-Agent Systems:</strong> Cơ sở để triển khai nhiều Agent giao tiếp tự động, phản biện và hợp tác giải quyết bài toán phức tạp.</li>
      </ul>
      <div style="margin-top: 20px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); padding: 12px 16px; border-radius: 10px; display: flex; align-items: center; justify-content: space-between;">
        <span style="font-size: 13px; color: #e0e7ff;">💡 Bạn đã sẵn sàng thảo luận và ôn tập với 3 AI Agents chưa?</span>
      </div>
    `,
  },
];

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
