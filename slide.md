# Mô tả

- Slide thuyết trình về sản phẩm lớp học đa tác tử

## Ý tưởng

- Học viên học 1 bài giảng, bài giảng ở đây có thể là slide/video.
- Từ nội dung bài giảng (slide/video), học viên có thể enable mode simulated classroom

## Mô tả simulated classroom

- Mô phỏng 1 lớp học với các agent sau:
  - teaching assistant agent: chịu trách nhiệm giải đáp thắc mắc của user, và của một số student agent
  - student agent: đặt câu hỏi về phần student đang học (không bắt buộc phải đặt câu hỏi ở tất cả mọi slide/timestamp video)
  - learning material generator: generate ra các learning material giúp người dùng ôn lại bài(quiz, flashcard, mindmap)

- Ý tưởng:
  - Giúp học viên học bài thông qua việc active recall: cho não bộ chủ động tìm kiếm thông tin -> học nhanh hơn (flashcard, làm quiz, feynman technique (https://fs.blog/feynman-technique/)) https://www.sciencedirect.com/science/article/abs/pii/S0165032724004245

# Slide 1: User & Job

- **Job executor:** Học viên tự xem lại tài liệu slide bài giảng sau giờ lên lớp để chuẩn bị làm bài tập Lab.

- **Core JTBD:**

  > "Tự đánh giá và làm chủ mức độ thông suốt kiến thức của từng trang slide bài giảng khi tự học một mình ngoài giờ lên lớp."

- **Evidence (Khảo sát trên các học viên AI20K):**
  - Kết quả khảo sát:
    - **21/27 (77.8%)** người học xác nhận gặp tình trạng "Không biết mình thực sự đã hiểu bài đến đâu" sau khi kết thúc buổi học. (n = 27)
    - **18/27 (66.7%)** người học gặp rào cản khi muốn hỏi lại bài do "Ngại hỏi giảng viên" hoặc "Sợ câu hỏi quá cơ bản".

# Slide 2: Vì sao chọn giải pháp này

| Ứng viên bài toán                                                                                                                  | Số người gặp (Evidence)          | Tần suất                    | Mỗi lần tốn gì (Cost)                                                                 | Khả thi (trong 47,5h)                                  | Quyết định |
| ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | --------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------ | ---------- |
| **Ứng viên 1: Chatbot Q&A tổng hợp toàn khóa** (Chat dạng hộp thoại chung)                                                         | ~100% học viên (13.494 turns)    | 5–10 lần/ngày               | Tốn 3–5 phút bôi đen, paste và mô tả lại ngữ cảnh trang; chatbot hay trả lời ngoài lề | Rất dễ build nhưng không giải quyết được tính thụ động | **LOẠI**   |
| **Ứng viên 2: Tự động dịch và tóm tắt toàn bộ slide thành văn bản dài**                                                            | 8,9% (1.214 turns)               | 1–2 lần/buổi học            | Tốn 15 phút đọc bản tóm tắt; học viên vẫn thụ động, không kích hoạt tư duy phản xạ    | Dễ build                                               | **LOẠI**   |
| **Ứng viên 3: Multi-Agent Classroom bám sát Slide** (Giảng viên Socratic + Bạn học Active Recall + Bộ sinh Quiz/Flashcard tức thì) | 45,1% (6.089 turns hỏi hiểu bài) | Thường trực trên từng slide | Giảm thời gian mò mẫm từ 20 phút xuống 3 phút; người học được đố lại ngay để nhớ sâu  | Hoàn toàn khả thi với kiến trúc 3 Agent + PDF Stage    | **CHỌN**   |

- **Ứng viên ĐÃ LOẠI + vì sao:**
- _Loại Ứng viên 1 (Chatbot Q&A thông thường):_ Dữ liệu cho thấy học viên liên tục hỏi cụt ngủn ("tài liệu nói chi dợ", "giải thích đoạn bôi đen"). Khi không ghim chặt ngữ cảnh slide, chatbot thường sinh câu trả lời chung chung dài dòng, làm loãng dòng tư duy.
- _Loại Ứng viên 2 (Bộ tóm tắt văn bản một chiều):_ Tóm tắt chỉ giải quyết phần ngọn; việc đọc tóm tắt vẫn là học thụ động, người học vẫn mắc bẫy "tưởng mình đã hiểu" nhưng khi thi hoặc phỏng vấn thì không giải thích lại được.

- **Ứng viên CHỌN + vì sao (chứng minh bằng số):**
- Chọn **Ứng viên 3** vì đánh trúng **nhu cầu thật** (66.7% học viên gặp rào cản khi muốn hỏi lại bài, 77.8% người học không biết mình đã hiểu bài đến đâu).
- Thay vì học thụ động, giải pháp giúp học viên học bài thông qua việc active recall: cho não bộ chủ động tìm kiếm thông tin -> học nhanh hơn (flashcard, làm quiz, feynman technique (https://fs.blog/feynman-technique/)) https://www.sciencedirect.com/science/article/abs/pii/S0165032724004245

# Slide 3

| Ký hiệu | Lớp chỗ khó trong sản phẩm này                                                                                                                                                              | Hậu quả cần ngăn                                                                                   |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| ①       | **Nguồn sự thật:** agent chỉ được dạy từ transcript/slide Day 1 đã truy xuất. Vùng ảnh không đọc được, câu hỏi không có trong bài hoặc citation không khớp đều được xem là không có căn cứ. | Học viên tin một nội dung bịa hoặc không thể kiểm lại nguồn.                                       |
| ②       | **Mơ hồ / thiếu thông tin:** thiếu đoạn được chọn, thiếu câu quiz/options, câu “đáp án gì?”, học viên nói “khó hiểu” nhưng chưa rõ mắc ở bước nào.                                          | Agent đoán sai ý, giảng dài hơn nhưng không giải đúng chỗ kẹt, học viên bỏ cuộc.                   |
| ③       | **Ngoài phạm vi / thẩm quyền:** xin đáp án trước khi thử, đòi xem điểm danh cá nhân, yêu cầu bỏ persona/quy tắc hoặc tiết lộ bí mật hệ thống.                                               | Mất mục tiêu học chủ động, giả vờ có quyền truy cập, lộ dữ liệu hoặc bị prompt injection.          |
| ④       | **Đặc thù domain học tập đa tác tử:** lẫn product–model–tool; suy ra attention triệt tiêu hallucination; một agent nói sai nhưng agent khác không sửa; nhiều agent trả lời chồng nhau.      | Học viên rời phiên với kiến thức sai hoặc không biết tin agent nào — lỗi nghiêm trọng nhất của D1. |

# Slide 4: Chiều chất lượng & Quality bar

- **Chiều chất lượng**:
  1. **Groundedness**: PASS nếu câu trả lời nằm trong phạm vi nội dung tài liệu mà người dùng đang học, với trích dẫn chính xác. Nếu thiếu nguồn thì nói rõ và không đoán.
  2. **Role & pedagogy**: PASS nếu route đúng agent/thứ tự, giữ đúng vai, không nói chồng, TA hỏi gợi mở hoặc dừng đúng lúc.
  3. **Task contract**: PASS nếu hoàn thành đủ các mục `must_do`, không vi phạm `must_not`.
- **Golden set** (≥20 case theo cơ cấu trong guide §2.6, file trong eval/):
  - Gồm **20 case** (9 thường, 8 khó, 3 hiếm).
  - Nguồn gốc: **18/20 case** lấy hoặc phát triển từ chatlog K4 thật.
  - Bao phủ: Mỗi lớp khó có ít nhất hai case. Phủ happy, low-confidence, failure/no-evidence/no-authority, correction và multi-agent coordination.
- **Quality bar**:
  - Đạt khi ≥ 80% (16/20 case) qua bộ, không có critical violation.
  - Critical violation: trả lời khiến người dùng hiểu sai, làm theo prompt injection/lộ bí mật.

- **Failure đáng kể nhất**: Mô phỏng lớp học giống như thực tế, đồng thời giữ cho các agent tuân thủ các nguyên tắc(trả lời đúng phạm vi, giữ nguyên tắc Socratic) và làm đủ task được giao từ user

# Slide 5: Kết quả đo

- **Kết quả các lượt chạy**:

| Lượt | Ngày       | Model               | Kết quả    | Ghi chú                                                                                                                                                                 |
| ---- | ---------- | ------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | 17/09/2026 | gpt-4o-mini         | 14/20 PASS | 6 FAIL: 3 lần agent nói chồng nhau, 2 lần trích sai nguồn, 1 lần không hoàn thành đủ các mục `must_do`                                                                  |
| 2    | 18/09/2026 | gpt-4o-mini, gpt-4o | 16/20 PASS | 4 FAIL: 2 lần agent thực hiện trả lời mặc dù task từ người dùng không nằm trong phạm vi, 1 lần vi phạm nguyên tắc socratic, 1 lần không hoàn thành đủ các mục `must_do` |

# Slide 6: Nếu có thêm 1 tuần, cải thiện gì?

- Tối ưu ingestion pipeline: Giúp TA agent được nạp kiến thức "sạch hơn", hiểu hơn về bài giảng
- Tối ưu system prompt: Định nghĩa rõ ràng hơn các hành vi của các agent trong lớp học(VD: TA agent phải giữ hành vi Socratic, Student agent đặt câu hỏi hóc búa hơn, định nghĩa giọng điệu trả lời, etc.)
- Tối ưu agent loop: Giúp các agent hoàn thành đủ task của người dùng

