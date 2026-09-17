# Frontend: theme VLearn + tính năng agent nâng cao + nội dung bài giảng dạng file

## Context
Sau khi đã dựng xong Next.js app thật ở `codebase/frontend` (theme tối, slide dạng text tĩnh, 3 agent cơ bản), người dùng đã khảo sát đối thủ tham khảo **VLearn AI Classroom** (https://vlearn.vlol.io.vn/) — một prototype cùng đề bài hackathon (option "VLearn" trong spec.md). Từ bundle CSS công khai của VLearn, đã trích được:
- Một design token system light-mode (xanh navy + trung tính) khá đầy đủ (màu, spacing, radius, shadow, cỡ chữ), kèm 5 màu "persona" gán riêng cho từng loại agent.
- Danh sách tính năng vượt trội hơn bản hiện tại: agent profile popup, agent chat history drawer, checkpoint tương tác giữa bài giảng, nội dung bài giảng dạng file thật (PDF/PPTX/video) thay vì chỉ text tĩnh.

**Không sao chép code/asset của VLearn** — chỉ dùng token màu (dữ liệu, không phải creative work) và ý tưởng tính năng làm tham khảo, tự viết lại toàn bộ bằng code của dự án. Người dùng đã chốt:
- Đổi **toàn bộ theme sang light navy** giống VLearn (không giữ dark theme cũ, không làm switcher).
- PPTX chỉ cần **trích text/tiêu đề từng slide** (không cần render layout gốc).
- Checkpoint được **gắn thủ công theo từng slide/timestamp cụ thể** trong mock data (không phải cứ N slide lại hỏi).
- Không cần nút "Mô phỏng lớp học" riêng kiểu VLearn — mỗi tính năng mới đặt vào đúng vị trí tự nhiên trong UI hiện có (agent profile mở khi bấm vào agent, chat history có nút riêng trong sidebar, checkpoint tự kích hoạt khi điều hướng slide/video tới đúng mốc).

## Việc cần làm

### 1. Theme: chuyển toàn bộ sang light navy (VLearn-inspired)
File: `app/globals.css` — viết lại phần `:root` design tokens và rà soát các màu cứng (hardcoded) trong từng khối component để hợp với nền sáng (giữ nguyên cấu trúc layout/spacing, chỉ đổi màu):
- `--bg-main` → trắng ngà (`#f8f9fa`), `--bg-surface` → trắng (`#fff`), `--bg-surface-elevated` → `#f4f4f4`.
- `--text-primary/secondary/muted` → xám đậm `#2e2e2e` / `#666` / `#848484`.
- `--border-subtle` → `#eeeeef`.
- `--accent-gradient` → dải xanh navy (`#134d8b → #1d6199`) thay cho tím-hồng cũ.
- Agent palette: `teacher` → xanh navy (brand), `student` → xanh lá (persona "assistant" của VLearn), `generator` → amber (persona "inquisitive").
- Mọi `rgba(255,255,255,0.0X)` dùng làm lớp phủ hover/bg trên nền tối trước đây phải đổi hướng thành lớp phủ tối nhạt trên nền sáng (`rgba(11,42,77,0.0X)` hoặc dùng `--bg-surface-elevated`/neutral-200), và text trắng (`#fff`) đổi thành text tối.
- Giữ nguyên toàn bộ class name hiện có để không phải sửa lại JSX ở các component.

### 2. Nội dung bài giảng dạng file (PDF / PPTX / Video)
Thêm khả năng người dùng tải lên file cho bài giảng, thay thế slide text tĩnh (`slidesData`) khi có file — vẫn mock/local (dùng `URL.createObjectURL`, không upload lên server):

- **Thư viện thêm vào `package.json`**: `pdfjs-dist` (render PDF ra canvas + đếm số trang), `jszip` (đọc PPTX như file zip để trích text).
- `lib/types.ts`: thêm `LessonContentType = "text" | "pdf" | "pptx" | "video"`, `LessonUnit` (đại diện 1 "trang/slide/mốc thời gian" hiện tại).
- `lib/pdf.ts`: load PDF bằng pdfjs-dist, trả về số trang + hàm render 1 trang ra `<canvas>`.
- `lib/pptx-parser.ts`: dùng JSZip đọc từng `ppt/slides/slideN.xml`, strip tag XML lấy text/tiêu đề từng slide (không giữ layout gốc — đã chốt với người dùng).
- Component mới trong `components/lesson/`:
  - `LessonUploader.tsx` — input chọn file, phát hiện loại theo phần mở rộng, gọi callback set content.
  - `PdfSlideStage.tsx` — hiển thị trang PDF hiện tại lên canvas.
  - `PptxSlideStage.tsx` — hiển thị text/tiêu đề slide đã trích, tái dùng style `.slide-canvas`/`.slide-title`/`.slide-body` hiện có.
  - `VideoStage.tsx` — thẻ `<video controls>` gốc HTML5 (tua được sẵn theo chuẩn trình duyệt, không cần thư viện), expose `currentTime`/`onTimeUpdate` ra ngoài để phục vụ checkpoint.
- `components/lesson/LessonView.tsx`: thêm state `content: LessonUnit` (mặc định là slide text hiện có cho Bài 1), render đúng Stage component theo `content.type`; `SlideFooterNav` dùng chung cho text/pdf/pptx (điều hướng theo index/trang), video dùng thanh tua riêng của `<video>` thay vì nút prev/next.

### 3. Checkpoint tương tác giữa bài giảng
- `lib/types.ts`: `Checkpoint { id, triggerType: "page" | "time", triggerValue, question, options[] }`.
- `lib/mock-data.ts`: thêm `checkpointsByLesson: Record<number, Checkpoint[]>` — vài checkpoint mẫu gắn cứng vào Bài 1 (ví dụ tại slide 2, và tại giây 30 nếu là nội dung video).
- `components/lesson/CheckpointModal.tsx`: overlay chặn thao tác, tái dùng style quiz (`.quiz-opt-btn`, `.quiz-feedback-box`) đã có ở artifact Quiz, thêm class mới cho backdrop/card (style theo tinh thần VLearn checkpoint nhưng tự viết).
- Logic trigger đặt trong `LessonView.tsx`: sau mỗi lần đổi trang/slide (`page` type) hoặc trong `onTimeUpdate` của video (`time` type) — nếu vị trí hiện tại khớp 1 checkpoint chưa trả lời, mở modal và tạm dừng (pause video / khoá nút next) tới khi người dùng trả lời hoặc bấm bỏ qua.

### 4. Agent profile popup
- `lib/types.ts`: `AgentProfile { key, tagline, bio, quote }`.
- `lib/mock-data.ts`: thêm `agentProfiles: Record<AgentKey, AgentProfile>` cho 3 agent (teacher/student/generator).
- `components/classroom/AgentProfileModal.tsx`: modal hiển thị avatar lớn, vai trò, tagline, bio, quote mẫu.
- `components/classroom/AgentSidebar.tsx`: thêm nút nhỏ "ⓘ" trên mỗi agent-card (tách khỏi vùng click chọn filter hiện có) để mở modal mà không đổi bộ lọc chat.
- State `openProfile: AgentKey | null` quản lý ở `ClassroomView.tsx`, truyền xuống.

### 5. Agent chat history drawer
- `lib/mock-data.ts`: mở rộng dữ liệu lịch sử thành `chatHistorySessions: { date, agent, topic }[]` (nhiều hơn 3 mục tĩnh hiện tại).
- `components/classroom/ChatHistoryDrawer.tsx`: drawer trượt từ trái, liệt kê lịch sử theo ngày; bấm 1 mục chỉ hiện toast mô phỏng "Đang tải lại phiên..." (chưa nối logic replay thật — ngoài phạm vi mock này).
- `components/classroom/AgentSidebar.tsx`: nút "Xem tất cả lịch sử" trong `.chat-history-section` mở drawer.
- State `historyDrawerOpen: boolean` quản lý ở `ClassroomView.tsx`.

## Không làm trong bước này
- Không render PPTX đúng layout/hình ảnh gốc (chỉ text).
- Không tạo theme switcher (dark theme cũ sẽ bị thay hẳn).
- Không nối logic "tải lại phiên chat" thật trong history drawer (chỉ UI mock).
- Không upload file lên backend — mọi file chỉ tồn tại client-side qua object URL trong phiên làm việc.

## Verification
- `cd codebase/frontend && npm install` (cài `pdfjs-dist`, `jszip` mới) `&& npm run build` — phải sạch lỗi TypeScript/ESLint.
- `npm run dev`, kiểm tra thủ công:
  - Giao diện toàn app chuyển sang nền sáng, không còn mảng màu tối sót lại (kiểm tra cả 2 route `/` và `/classroom`).
  - Tải lên 1 file PDF mẫu ở màn Bài giảng → xem được từng trang, next/prev hoạt động.
  - Tải lên 1 file PPTX mẫu → thấy text/tiêu đề từng slide.
  - Tải lên 1 file video mp4 → phát và tua được.
  - Tại đúng slide/mốc thời gian đã gắn checkpoint → modal quiz hiện ra, chặn cho tới khi trả lời/bỏ qua.
  - Ở `/classroom`: bấm nút hồ sơ trên agent-card → modal thông tin agent hiện đúng nội dung, không đổi bộ lọc chat hiện tại.
  - Bấm "Xem tất cả lịch sử" → drawer lịch sử trượt ra, đóng lại được.
