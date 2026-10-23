# Lớp học sôi nổi — Mã nguồn đầy đủ

Website HTML/CSS/JavaScript thuần, không cần backend, cơ sở dữ liệu, API key hoặc bước build. Bao gồm bản sửa thời gian vòng quay mới nhất.

## Các chức năng

- Sidebar mở riêng Vòng quay, Đua vịt 3D, Thẻ bí mật, Bảng xếp hạng, Học sinh & điểm, Lịch sử.
- Vòng quay có tên từng học sinh, chỉnh màu, âm thanh, xáo trộn, thời lượng 4/7/10/15 giây và đếm thời gian còn lại.
- Cuộc đua vịt WebGL 3D, đếm ngược, tạm dừng, phóng to.
- Nhập danh sách, cộng/trừ điểm, hoàn tác, đồng hạng, lưu nhiều tiết và xuất CSV.

## Cấu trúc

```text
lop-hoc-soi-noi/
  public/
    index.html       Giao diện và sidebar
    app.js           Điều hướng, dữ liệu, chấm điểm và gọi tên
    wheel.js         Vòng quay Canvas
    race3d.js        Cuộc đua WebGL 3D
    style.css        Kiểu giao diện cơ bản
    navigation.css   Sidebar và vòng quay
    race3d.css       Sân khấu 3D
  tests/wheel-timing.cjs
  package.json
  server.cjs
  README.md
```

## Chạy trên máy

Cài Node.js 18 trở lên, mở terminal tại thư mục chứa `package.json`, chạy:

```sh
npm start
```

Mở `http://127.0.0.1:4173`. Không cần chạy `npm install` vì dự án không dùng gói phụ thuộc. Máy chủ này chỉ phục vụ xem thử trên máy cá nhân.

Kiểm tra logic thời gian và kết quả vòng quay:

```sh
npm test
```

## Đưa website lên mạng công khai

Đây là website tĩnh. Có thể dùng dịch vụ hosting hỗ trợ HTML/CSS/JS, hoặc hosting có tên miền của bạn.

1. Giải nén bộ mã nguồn.
2. Chọn thư mục `public` làm thư mục xuất bản (publish/output directory).
3. Nếu hosting hỏi framework, chọn website tĩnh/không framework. Không cần lệnh build.
4. Nếu tải file qua trình quản lý file hoặc FTP, tải **toàn bộ nội dung bên trong `public`** vào thư mục gốc của website. `index.html` phải nằm ở gốc đó, cùng các file JS/CSS.
5. Bật HTTPS bằng chức năng chứng chỉ của hosting, rồi mở tên miền để kiểm tra.

Không cần đưa `server.cjs`, `tests`, `package.json` hoặc README lên hosting tĩnh. Không có file bí mật hay thông tin xác thực Sites trong bộ mã nguồn này.

Các trang sử dụng hash như `#wheel`, `#students`, `#ranking`, nên không cần cấu hình rewrite URL cho SPA.

## Dữ liệu học sinh

Dữ liệu được lưu bằng `localStorage` trên từng trình duyệt, tại địa chỉ website đang sử dụng. Đưa website lên mạng không tự đồng bộ danh sách và điểm giữa các máy, giữa các giáo viên hoặc giữa file HTML trên máy và tên miền mới.

- Khi mở tên miền mới, nhập lại danh sách học sinh ở mục **Học sinh & điểm**.
- Xuất CSV để giữ bảng điểm trước khi chuyển địa chỉ hoặc xóa dữ liệu trình duyệt. Bản hiện tại chưa có nhập lại điểm từ CSV.
- Giáo viên có thể dùng cùng một website công khai nhưng mỗi trình duyệt sẽ có dữ liệu riêng.
- Dữ liệu mẫu chỉ được tạo khi bấm **Dùng danh sách mẫu**; bộ mã nguồn không chứa điểm hay danh sách thực từ phiên chạy thử.

## Tùy chỉnh

- Đổi tên, nội dung giao diện: `public/index.html` và `public/app.js`.
- Chỉnh bảng màu vòng quay: `palettes` trong `public/wheel.js`.
- Chỉnh kiểu chữ, màu giao diện: các file CSS trong `public`.
- Giữ khóa `soi-noi-v1` trong `app.js` nếu muốn tiếp tục đọc dữ liệu đã lưu tại cùng địa chỉ.

Kiểu chữ được tải từ Google Fonts; nếu không có mạng, giao diện dùng phông hệ thống. Đồ họa 3D tự dựng bằng WebGL, không tải thư viện hoặc mô hình bên ngoài. Cần trình duyệt có WebGL để dùng đua vịt; vòng quay dùng Canvas 2D.

## Phạm vi hiện tại

Không có đăng nhập, tài khoản giáo viên, đồng bộ đám mây hay cơ sở dữ liệu tập trung. Các trò chơi được thiết kế lại theo yêu cầu, không phải mã nguồn lấy từ các website tham khảo.
