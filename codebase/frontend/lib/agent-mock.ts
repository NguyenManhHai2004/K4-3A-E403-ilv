import type { AgentFilter, Message } from "./types";

let responseCounter = 0;

function nextId(): number {
  responseCounter += 1;
  return Date.now() + responseCounter;
}

export function currentTimeString(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function pickResponder(userText: string, target: AgentFilter): "teacher" | "student" | "generator" {
  if (target === "teacher") return "teacher";
  if (target === "generator") return "generator";
  if (target === "student") return "student";

  if (userText.includes("Quiz") || userText.includes("Mindmap") || userText.includes("tài liệu")) return "generator";
  if (userText.includes("Thầy") || userText.includes("giải thích")) return "teacher";
  return "student";
}

export function typingLabelFor(responder: "teacher" | "student" | "generator"): string {
  if (responder === "teacher") return "TS. Minh (Giảng viên) đang soạn câu trả lời...";
  if (responder === "student") return "Bảo Nam (Bạn học) đang suy nghĩ phản hồi...";
  return "Nexus Bot đang sinh tài liệu mới...";
}

/**
 * Mock agent backend. Trả `{ responder, messages }` sau một khoảng delay giả lập,
 * để mô phỏng hành vi gọi API thật (codebase/agents) sau này — chỉ cần thay nội dung
 * hàm này bằng fetch() là xong, phần gọi ở useClassroomChat không cần đổi.
 */
export function requestAgentResponse(
  userText: string,
  target: AgentFilter
): Promise<{ responder: "teacher" | "student" | "generator"; messages: Message[] }> {
  const responder = pickResponder(userText, target);

  return new Promise((resolve) => {
    setTimeout(() => {
      if (responder === "student") {
        const studentReply: Message = {
          id: nextId(),
          senderType: "student",
          senderName: "Bảo Nam",
          role: "Bạn học (Active Recall)",
          avatar: "🎒",
          time: currentTimeString(),
          text: `Ồ, đỉnh thật sự! Cậu giải thích cực kỳ chuẩn và dễ hiểu luôn! Đúng là nếu không chia cho <span class="code-chip">√dk</span> thì giá trị dot-product sẽ rất lớn, làm <span class="code-chip">softmax</span> bị bão hòa và gradient = 0. Học cùng cậu tiến bộ hẳn luôn!`,
        };
        const teacherFollowUp: Message = {
          id: nextId(),
          senderType: "teacher",
          senderName: "TS. Minh",
          role: "Giảng viên",
          avatar: "👨‍🏫",
          time: currentTimeString(),
          text: `Rất khen ngợi câu trả lời của bạn! Bạn đã nắm vững bản chất toán học của phép chuẩn hóa. Việc tự diễn giải lại (Feynman technique) thế này giúp bạn nhớ kiến thức này ít nhất 6 tháng nữa!`,
        };
        resolve({ responder, messages: [studentReply, teacherFollowUp] });
        return;
      }

      if (responder === "teacher") {
        const teacherReply: Message = {
          id: nextId(),
          senderType: "teacher",
          senderName: "TS. Minh",
          role: "Giảng viên",
          avatar: "👨‍🏫",
          time: currentTimeString(),
          text: `Câu hỏi rất hay! Hãy tưởng tượng 1 Head giống như bạn đọc sách với 1 lăng kính duy nhất. Còn <strong>Multi-Head</strong> cho phép mô hình nhìn đồng thời dưới <em>nhiều lăng kính</em>: một Head bắt mối quan hệ ngữ pháp (chủ - vị), một Head bắt liên kết đại từ, một Head bắt từ trái nghĩa. Tổng hợp lại cho ngữ cảnh đa chiều và sâu sắc hơn rất nhiều.`,
        };
        resolve({ responder, messages: [teacherReply] });
        return;
      }

      const generatorReply: Message = {
        id: nextId(),
        senderType: "generator",
        senderName: "Nexus Bot",
        role: "Sinh tài liệu",
        avatar: "⚡",
        time: currentTimeString(),
        text: `Đã nhận yêu cầu! Mình vừa cập nhật thêm 1 nhánh mới vào <strong>Mindmap</strong> và bổ sung câu hỏi ôn tập vào <strong>Kho Artifacts</strong> bên phải rồi nhé! Mời bạn click tab bên phải để khám phá ngay.`,
        hasArtifactNotice: true,
      };
      resolve({ responder, messages: [generatorReply] });
    }, 1400);
  });
}

export function makeUserMessage(text: string): Message {
  return {
    id: nextId(),
    senderType: "user",
    senderName: "Bạn (Học viên)",
    role: "Học viên",
    avatar: "HV",
    time: currentTimeString(),
    text,
  };
}
