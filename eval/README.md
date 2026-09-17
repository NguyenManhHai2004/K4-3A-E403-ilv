# Eval cho Track D1 — CP3

## Chốt định dạng

`golden-set.json` là file nguồn cho 20 case. Repo gốc chỉ bắt buộc golden set nằm trong `eval/`, không bắt buộc tên hay schema cụ thể. JSON phù hợp với prototype đa agent vì mỗi case cần lưu route, ngữ cảnh, nguồn, hành vi mong muốn và tiêu chí cấm; một file CSV phẳng sẽ khó giữ các trường lồng nhau này.

`run-01-results-template.csv` là bảng chấm. Khi chạy lượt đầu, sao chép thành `run-01-results.csv`, điền output và kết quả cho đủ cả 20 case, kể cả case fail. Không điền PASS trước khi đã chạy thật.

## Phạm vi đã khóa

- Track: D1 — lớp học mô phỏng đa tác tử.
- Một bài: Day 1 AI & LLM Foundation.
- Ba agent:
  - `teaching_assistant_agent`: tóm tắt/chốt ý như vai giảng viên.
  - `socratic_tutor`: hỏi đáp, chẩn đoán và gợi mở như vai TA.
  - `artifact_agent`: tạo quiz, mindmap và sơ đồ luyện tập.
- Bộ điều phối không phải agent thứ tư. Nó chỉ route, xếp thứ tự và hợp nhất output để mỗi lượt có một giọng nói chính.

## Coverage theo rubric

| Hạng mục | Coverage |
|---|---:|
| Tổng case | 20 |
| Case thường | 9 |
| Case khó | 8 |
| Case hiếm | 3 |
| Case lấy/phát triển từ chatlog K4 thật | 18 |
| L1 — nguồn sự thật | 2 |
| L2 — mơ hồ/thiếu input | 4 |
| L3 — ngoài phạm vi/thẩm quyền | 3 |
| L4 — hiểu sai đặc thù domain | 2 |

Các lớp có thể cắt qua nhóm “hiếm”, nên tổng theo lớp không cần bằng 8. Điều kiện của rubric là mỗi lớp có ít nhất hai case.

Các đường đi trải nghiệm đã có:

- Happy path: `D1-GS-001` đến `D1-GS-009`.
- Low-confidence: `D1-GS-012`, `D1-GS-013`.
- Failure/không căn cứ hoặc không thẩm quyền: `D1-GS-010`, `D1-GS-011`, `D1-GS-015`, `D1-GS-018`.
- Correction/sửa hiểu sai hoặc sửa cách dạy: `D1-GS-014`, `D1-GS-016`, `D1-GS-017`, `D1-GS-020`.
- Điều phối đa tác tử: `D1-GS-019`.

## Cách chạy cho CP3

1. Chạy `./eval/validate-golden-set.ps1` từ root repo. Script kiểm tra JSON, cơ cấu case, `turn_id` và mã transcript.
2. Khóa prompt/model/version cần đo; ghi version đó vào bảng kết quả.
3. Với từng case, truyền `context`, `conversation_history` nếu có, và `user_input` vào prototype. Không truyền `expected_behavior` cho model; phần này chỉ dành cho evaluator.
4. Lưu output thô vào `eval/runs/run-01/D1-GS-xxx.md` hoặc trace tương đương.
5. Hai người chấm độc lập ít nhất 5 case khó. Mỗi chiều chỉ nhận `PASS` hoặc `FAIL`; ghi lý do ngắn dựa trên `must_do`/`must_not`.
6. `case_pass = PASS` chỉ khi cả ba chiều PASS và không có critical violation.
7. Tính `pass_rate = số case PASS / 20`. So với quality bar đã khai, không đổi bar sau khi nhìn kết quả.

PowerShell để tính nhanh sau khi đã điền bảng:

```powershell
$r = Import-Csv ./eval/run-01-results.csv
$passed = @($r | Where-Object case_pass -eq 'PASS').Count
"{0}/{1} = {2:P0}" -f $passed, $r.Count, ($passed / $r.Count)
```

## Cách chấm ba chiều  :))))))))))))))))))

- `groundedness`: mọi claim kiến thức chính có nguồn hỗ trợ; mã trích dẫn thật; thiếu nguồn thì agent nói rõ, không đoán.
- `role_and_pedagogy`: đúng agent/đúng thứ tự; TA không cho đáp án ngay khi learner chưa thử; không agent nào nói chồng; sửa hiểu sai trước khi kết thúc.
- `task_contract`: làm đủ `must_do`, không phạm `must_not`, đúng số câu/độ dài/định dạng.

Quality bar cho CP3: ít nhất `16/20` case PASS, không có critical violation, và mỗi lớp L1–L4 có ít nhất một case PASS.

Track D còn yêu cầu đo việc học, không chỉ đo output AI. Bar validation đã khai trong JSON: ít nhất 4/5 học viên giải thích lại đúng hai ý cốt lõi và đạt 2/3 câu exit ticket không xem đáp án.

## Artifact CP3 vẫn còn phải tạo sau khi có prototype

- `run-01-results.csv` đã chấm đủ 20 case và có tỷ lệ pass.
- Output/trace thật của từng case.
- Video 30 giây cho thấy ít nhất một lời gọi AI thật ở quyết định trung tâm.
- Trong `spec.md` §5–§7: bảng 4 lớp, ≥8 kịch bản, ba chiều chất lượng và quality bar bằng số.

