# Luồng chạy của Classroom (Từ Frontend đến Agent và ngược lại)

Tài liệu này giải thích chi tiết luồng xử lý tin nhắn trong tính năng Classroom, từ khi người dùng nhập câu hỏi trên giao diện (Frontend) cho đến khi nhận được phản hồi từ các AI Agent (Backend).

## Sơ đồ luồng tổng quan

1. **Frontend (Người dùng nhập input)**: `ChatComposer` -> `useClassroomChat` -> `WebSocket (send)`.
2. **Backend (Gateway nhận request)**: `classroom_gateway.py` -> `LiveClassroomSession`.
3. **Backend (Runtime điều phối)**: `classroom_runtime.py` xác định target (Teacher, Student, Generator) -> Tạo prompt -> Gọi `agent.py`.
4. **LLM Provider**: Gọi API của LLM (OpenAI/Anthropic/...) và trả về JSON.
5. **Backend (Gateway trả response)**: Gom các sự kiện vào `snapshot` -> `WebSocket (send)`.
6. **Frontend (Hiển thị)**: `useClassroomChat` (nhận message) -> `applySnapshot` -> `ChatStream` hiển thị ra UI.

---

## Chi tiết từng bước và Function tương ứng

### Bước 1: Người dùng nhập input từ giao diện (Frontend)
- **File**: `codebase/frontend/components/classroom/ClassroomView.tsx`
- **Function/Component**: 
  - Người dùng gõ tin nhắn vào component `ChatComposer`.
  - Khi nhấn gửi, hàm `onSend` được gọi, trigger hàm `sendMessage` từ custom hook `useClassroomChat`.

### Bước 2: Gửi tin nhắn qua WebSocket (Frontend)
- **File**: `codebase/frontend/hooks/useClassroomChat.ts`
- **Function**: `sendMessage(text, target, currentSlide)`
  - Hàm này hiển thị tin nhắn của người dùng lên UI ngay lập tức.
  - Sau đó gọi `sendSocketRequest` để đẩy một payload JSON qua WebSocket:
    ```json
    {
      "action": "message",
      "currentSlide": 1,
      "target": "teacher",
      "text": "Nội dung câu hỏi của người dùng..."
    }
    ```

### Bước 3: Nhận và parse tin nhắn tại Gateway (Backend)
- **File**: `codebase/agents/classroom_gateway.py`
- **Function**: `handle_websocket` bên trong class `ClassroomGateway`
  - Hàm lắng nghe vòng lặp vô tận `await connection.recv()`.
  - Khi có message gửi đến, nó phân tích `action == "message"`.
  - Gọi hàm xử lý chính: `live_session.handle_message(...)`.

### Bước 4: Điều phối Agent xử lý logic (Backend Runtime)
- **File**: `codebase/agents/classroom_runtime.py`
- **Function**: `LiveClassroomSession.handle_message(...)`
  - Hàm này kiểm tra `target` (ví dụ: `teacher`, `student`, `generator`) hoặc kiểm tra xem có đang có `pending_prompt` (câu hỏi đang chờ trả lời từ student agent hay không).
  - Tùy vào ngữ cảnh, nó sẽ gọi các hàm điều phối cụ thể. Ví dụ nếu gửi cho Teacher:
    - Nó gọi `self._teacher_private_reply(...)`.
    - Hàm này tiếp tục chuẩn bị các tham số, gọi `self._run_ta_turn(...)` và build nội dung prompt dựa trên slide hiện hành, lịch sử chat (`_build_ta_prompt`).
  - Hàm sẽ gọi `session._run_json_agent` để tương tác với LLM.

### Bước 5: Agent giao tiếp với LLM (Backend Agent)
- **File**: `codebase/agents/agent.py` và `codebase/agents/classroom_cli.py` (Class `ClassroomSession`)
- **Function**: `_run_json_agent`
  - `agent.py` quản lý System Prompt và các Tools (nếu có). 
  - Gọi LLM API thông qua hàm `provider.complete(...)` (ở `codebase/agents/providers.py`).
  - Phản hồi từ LLM được yêu cầu trả về dưới dạng JSON có cấu trúc (chứa `intent`, `action`, `reply`, `citations`, v.v.).

### Bước 6: Trả kết quả về qua WebSocket (Backend Gateway)
- **File**: `codebase/agents/classroom_gateway.py`
- **Function**: 
  - Sau khi `LiveClassroomSession.handle_message` thực thi xong, nó trả về một `snapshot` (ảnh chụp toàn bộ trạng thái của lớp học hiện tại, chứa `events` là các câu trả lời của agent).
  - Gateway sẽ gói `snapshot` này và gửi ngược lại cho client qua lệnh: `await send_snapshot(snapshot, request_id=request_id)`.
  - Ngoài ra, hệ thống sẽ thiết lập lại các Timer (như đếm giờ nhắc nhở `arm_post_message_timeout` - đếm ngược 10s-15s để TA tự động trả lời nếu user không rep).

### Bước 7: Cập nhật giao diện (Frontend)
- **File**: `codebase/frontend/hooks/useClassroomChat.ts`
- **Function**: `handleSocketMessage`
  - Khi WebSocket nhận được dữ liệu trả về từ server, hàm này parse JSON và gọi `applySnapshot(snapshot)`.
  - Hàm `applySnapshot` sẽ phân tích các `events` mới từ server (những câu trả lời của agent) và push vào state `messages` (bằng cách dùng `eventToMessage`).
- **File**: `codebase/frontend/components/classroom/ClassroomView.tsx`
  - Nhờ state `messages` thay đổi, React sẽ re-render.
  - Component `ChatStream` nhận props `messages` mới và hiển thị phản hồi của Agent lên màn hình. Hoàn tất một vòng lặp (Turn) chat.
