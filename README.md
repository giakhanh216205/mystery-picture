# The Mystery Picture – trò chơi khởi động chủ đề Áo Dài

## Chạy trong Visual Studio Code
1. Giải nén thư mục `mystery-picture`.
2. Trong VS Code: File → Open Folder… → chọn thư mục `mystery-picture`.
3. Cách 1 (nhanh): mở thư mục trong File Explorer và bấm đúp `index.html`, game mở bằng trình duyệt.
   Cách 2 (khuyên dùng): cài tiện ích **Live Server** (tác giả Ritwick Dey), chuột phải `index.html` → **Open with Live Server**.
4. Bấm **FULL SCREEN** trên thanh công cụ trước khi chiếu.

Cần có mạng để tải font chữ (Google Fonts). Không có mạng thì game vẫn chạy, chỉ đổi sang font mặc định.

## Cách chơi
- Màn hình đầu: luật chơi → bấm **START**.
- Bấm **ô số bất kỳ** (trên ảnh hoặc ở danh sách bên trái) → hiện câu hỏi của ô đó, đồng hồ tự chạy.
- Bấm **SHOW ANSWER** → chữ điền vào ô → bấm **OPEN TILE** → quay về bảng, mảnh ảnh đó lật ra.
- **BACK** = quay về bảng mà không mở ô (khi chưa ai trả lời đúng, có thể chọn lại sau).
- Ô 5 và 7 là **LUCKY NUMBER**: không có câu hỏi, có pháo giấy.
- Khi có người đoán đúng chủ đề → bấm **REVEAL THE TOPIC** để công bố ÁO DÀI.
- **RESET** để chơi lại từ đầu. **TIMER** chọn 15/20/30 giây. **SOUND** bật/tắt âm thanh.

Phím tắt: `1`–`7` mở ô · `Space` dừng/chạy đồng hồ · `Enter` bước tiếp · `Esc` quay lại.

## Sửa nội dung
- Câu hỏi, gợi ý, đáp án: sửa mảng `TILES` ở đầu file `js/game.js`.
  Đáp án viết liền, không dấu cách (ví dụ `CONICALHAT`), số ô chữ tự tính theo độ dài.
- Đổi ảnh chủ đề: thay file `images/topic.jpg` (nên dùng ảnh vuông).
- Màu sắc, font: các biến ở đầu file `css/style.css`.
