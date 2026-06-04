Yêu cầu rất lớn nên mình chia làm **6 đợt (PR)**, mỗi đợt làm độc lập, bạn duyệt từng đợt để tránh hỏng cùng lúc. Bạn xác nhận làm theo thứ tự nào (hoặc cho phép mình làm tuần tự tất cả).

## Đợt 1 — Trang cá nhân + Đổi mật khẩu
- Redesign `/trang-ca-nhan` theo ảnh 8: card xanh bên trái (avatar, email, SĐT, trạng thái bảo mật, social icons) + 3 ô thống kê (Tổng nạp / Số dư sử dụng / Số dư hiện tại) + form Thông Tin Cá Nhân bên phải (Họ tên, Tên đăng nhập, SĐT, Email, Thời gian đăng ký, Đăng nhập gần đây).
- Thêm trang `/doi-mat-khau` (ảnh 9): nhập MK hiện tại → MK mới → nhập lại. Validate bằng `signInWithPassword` trước khi `updateUser({password})`.
- Schema: thêm cột `phone`, `full_name`, `last_sign_in_at` (đồng bộ từ `auth.users`) vào `profiles`.

## Đợt 2 — Admin "Thông báo" popup + "Logo shop"
- Popup chào mừng (ảnh 1): bảng `shop_settings` đã có → thêm key `welcome_popup` (JSON: title, content, links). Trang chủ hiện popup, có nút "Không hiển thị lại" (localStorage) + "Đóng".
- Tab admin mới **Thông báo**: rich-text + danh sách dòng nội dung + bật/tắt.
- Tab admin **Logo Shop**: upload ảnh logo → `shop_settings.logo_url`. Nếu chưa set → hiện placeholder "ảnh lỗi". Xoá hardcode "ZONOshop" → dùng setting này.

## Đợt 3 — Danh mục (sort cố định + contrast)
- Admin kéo-thả `sort_order` của categories, vị trí cố định (không tự đẩy theo acc mới).
- Tab danh mục ngoài trang chủ (ảnh 3): chip nền tương phản với theme — light mode nền đen chữ trắng, dark mode nền trắng chữ đen, active = gradient.

## Đợt 4 — Sản phẩm: loại "Cày thuê" + xuống dòng mô tả
- Thêm cột `products.product_type` enum (`account` | `boost`).
- Form admin: chọn loại. Nếu **Cày thuê** → khi user mua: popup nhập **Tài khoản / Mật khẩu / Lời nhắn admin** + cảnh báo "tắt 2FA". Đơn lưu vào bảng mới `boost_orders` (status: `pending` mặc định).
- Trang user mới `/lich-su-cay-thue` (dưới Lịch sử mua hàng).
- Trang admin mới **Đơn cày thuê**: xem tài khoản/mật khẩu khách, nút **Hoàn thành** (xác nhận) → `completed`. Nút **Huỷ** → dialog hỏi "Hoàn tiền?" (Yes = cộng lại balance + status `cancelled_refunded`, No = `cancelled`) + ô lời nhắn admin.
- Fix xuống dòng mô tả: render `whitespace-pre-wrap` ở ProductCard + ProductDetail (hiện tại bị mất `\n`).

## Đợt 5 — Tách Nạp tiền + SePay + Đối tác thẻ cào
- Tách `/nap-tien` thành 2 trang: `/nap-the` (ảnh 7: form + Lưu ý + Lịch sử) và `/nap-ngan-hang` (ảnh 6: hướng dẫn + bảng khuyến mãi + logo partner). Cập nhật sidebar.
- Tab admin **Đối tác thẻ cào**: chọn 1 trong 2 (`thesieure` hoặc `gachthefast`) — radio. Mở form điền `partner_id`, `partner_key`, callback URL; bắt nhập lại mật khẩu admin để xác nhận. Hiển thị logo đại diện mỗi bên. Test ping API → set `is_active = true/false`.
- Sửa edge function `charge-card` để gọi đúng provider đang active. Logs trạng thái rõ ràng.
- Tab admin **SePay** (ngân hàng): nhập SePay API key + số TK + tên ngân hàng. Edge function `bank-callback` đã có → cập nhật webhook của SePay khớp `transfer_code` (VAK+3 số) trong content.

## Đợt 6 — Export DB sang Supabase riêng của bạn
- Script tự động chạy lại `pg_dump` mới nhất (sau khi đã chạy các migrations đợt 1-5).
- Tạo file `/mnt/documents/migration/` đầy đủ: `schema.sql`, `data.sql`, `seed-users.ts` (Node script để recreate users bằng Admin API, giữ nguyên UUID).
- README hướng dẫn từng bước. **Lưu ý: trong môi trường Lovable Cloud .env không tự sync sang project khác**; bạn cần fork project hoặc disconnect Cloud rồi connect Supabase ngoài để dùng được DB của bạn.

---

## Lưu ý chi phí
Bạn yêu cầu "trừ ít tín dụng" nhưng phạm vi quá lớn — riêng đợt 4 và 5 đã cần ~15-20 file mới. Mình đề xuất: **làm gọn từng đợt, dừng nếu bạn muốn**. Bắt đầu từ Đợt 1?
