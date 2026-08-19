# Đánh giá plan tách đăng ký tiếp dân và chuẩn bị thay đổi database

## 1. Kết luận

Hướng thiết kế đúng, nhưng plan hiện tại **chưa an toàn để chạy migration**. Nếu chạy nguyên SQL trong plan, hệ thống có nguy cơ:

- Lỗi migration khi chuyển mã quầy sang UUID.
- Mất dữ liệu đăng ký gặp lãnh đạo cũ.
- Làm hỏng contract của các API tiếp dân đang hoạt động.
- Không thể rollback đầy đủ dữ liệu nếu xảy ra sự cố.

Đánh giá tổng thể:

- Kiến trúc: khoảng **70% phù hợp**.
- Migration: khoảng **40% sẵn sàng**.
- Trạng thái: **chưa nên chạy plan hiện tại**.

## 2. Các phần phù hợp

- Tách tiếp dân tại quầy và đăng ký gặp lãnh đạo thành hai nghiệp vụ riêng.
- Tạo bảng danh mục `quay_tiep_dan`.
- Tách lịch, khung giờ, đăng ký, đính kèm và đánh giá gặp lãnh đạo.
- Dùng `id_quay` làm khóa ngoại thay cho chuỗi `QUAY_1`.
- Mỗi đăng ký gặp lãnh đạo chỉ có tối đa một đánh giá.
- Người duyệt, người hoàn thành và người từ chối được liên kết với `nguoi_dung`.

## 3. Các vấn đề cần sửa trước khi thay đổi DB

### 3.1. Có nguy cơ mất dữ liệu gặp lãnh đạo cũ

Plan tạo các bảng gặp lãnh đạo mới nhưng không chuyển dữ liệu `LEADER_MEETING` hiện có sang đó, sau đó lại xóa:

- `loai`.
- `ten_lanh_dao`.
- `chuc_vu_lanh_dao`.
- `dia_chi`.

Seed hiện tại đã có dữ liệu `LEADER_MEETING` kèm đánh giá. Nếu chạy plan hiện tại, dữ liệu đó không được chuyển sang bảng mới.

Cần bổ sung quy trình:

1. Ánh xạ `ten_lanh_dao` cũ sang `nguoi_dung.id`.
2. Tạo lịch và khung giờ gặp lãnh đạo tương ứng.
3. Chuyển đăng ký cũ sang `dang_ky_gap_lanh_dao`.
4. Chuyển đánh giá cũ sang `danh_gia_gap_lanh_dao`.
5. Đối soát số lượng và dữ liệu trước/sau migration.
6. Chỉ xóa cột cũ khi không còn dữ liệu chưa chuyển.

### 3.2. Không nên xóa `dia_chi`

Mobile tiếp dân hiện đang gửi và hiển thị địa chỉ người dân. Service hiện tại cũng sử dụng `dia_chi` trong response.

Do đó, nên giữ `dia_chi` cho cả:

- Đăng ký tiếp dân tại quầy.
- Đăng ký gặp lãnh đạo.

### 3.3. Không nên xóa audit

Plan đề xuất xóa:

```text
nguoi_tao
nguoi_cap_nhat
```

Đây là dữ liệu audit quan trọng đối với nghiệp vụ hành chính. Nên tiếp tục giữ:

```prisma
nguoi_tao
nguoi_cap_nhat
thoi_gian_tao
thoi_gian_cap_nhat
```

Nếu cần bảo đảm toàn vẹn dữ liệu ở DB, bổ sung relation/FK từ `nguoi_tao` và `nguoi_cap_nhat` tới `nguoi_dung.id`.

### 3.4. Migration `ma_quay` sang `id_quay` có thể thất bại

Bảng `khung_gio_tiep_dan` hiện có CHECK constraint chỉ cho phép:

```text
QUAY_1 ... QUAY_8
```

Plan lại cập nhật cột này thành chuỗi UUID trước khi đổi kiểu. CHECK constraint hiện tại sẽ từ chối giá trị UUID.

Không nên rename và convert trực tiếp. Nên thực hiện theo hướng mở rộng:

```sql
ALTER TABLE "khung_gio_tiep_dan" ADD COLUMN "id_quay" UUID;

UPDATE "khung_gio_tiep_dan" kg
SET "id_quay" = q."id"
FROM "quay_tiep_dan" q
WHERE kg."ma_quay" = q."ma_quay";

-- Kiểm tra tất cả bản ghi đã được ánh xạ.
-- Sau đó mới thêm FK và chuyển code sang sử dụng id_quay.
-- Migration sau mới xóa ma_quay.
```

Áp dụng tương tự cho `dang_ky_tiep_dan.bo_phan`.

### 3.5. Không được đổi contract API cũ từ `department` sang `idQuay`

Plan đang đề xuất sửa validator từ `department` sang `idQuay`. Thay đổi này sẽ phá Mobile, Swagger và các API cũ.

Contract bên ngoài nên tiếp tục nhận:

```json
{
  "department": "QUAY_3"
}
```

Backend tự tra cứu:

```text
QUAY_3 -> quay_tiep_dan.id
```

Response nên tiếp tục trả mã quầy thân thiện:

```json
{
  "department": "QUAY_3",
  "departmentName": "Quầy số 3"
}
```

Mobile không cần biết UUID nội bộ của quầy.

### 3.6. Prisma model trong plan chưa hợp lệ

Dòng dưới đây đang nằm trực tiếp trong code block Prisma:

```prisma
lanh_dao — xác định qua khung_gio_gap → lich_gap → id_lanh_dao
```

Dòng này phải được chuyển thành comment hoặc xóa, nếu không `prisma validate` sẽ thất bại.

Model `nguoi_dung` cũng phải bổ sung các relation ngược tương ứng cho:

- Lịch do lãnh đạo phụ trách.
- Đơn do người dùng phê duyệt.
- Đơn do người dùng hoàn thành.
- Đơn do người dùng từ chối.
- Các quan hệ audit tạo/cập nhật nếu bổ sung FK.

### 3.7. Prisma enum và migration SQL không đồng nhất

Prisma plan dùng:

```prisma
enum trang_thai_gap_lanh_dao {
  PENDING
  APPROVED
  REJECTED
  COMPLETED
}
```

Nhưng SQL lại tạo `trang_thai` bằng `VARCHAR(30)`. Hai bên sẽ gây schema drift.

Cần chọn một trong hai hướng:

1. Dùng PostgreSQL enum và tạo `CREATE TYPE` trong migration.
2. Dùng `VARCHAR(30)` cùng CHECK constraint và không khai báo Prisma enum.

Với cấu trúc dự án hiện tại, dùng `VARCHAR(30)` cùng CHECK constraint sẽ dễ tương thích hơn.

### 3.8. Sức chứa quầy 7 và quầy 8 đang sai yêu cầu

Plan đang seed:

```text
QUAY_7 = 1
QUAY_8 = 1
```

Yêu cầu đã chốt là mỗi quầy mặc định hai người. Cả tám quầy phải có:

```text
suc_chua_mac_dinh = 2
```

Cán bộ có thể điều chỉnh sức chứa sau.

### 3.9. Thiếu CHECK constraint quan trọng

Cần bổ sung tối thiểu:

```sql
CHECK (suc_chua_mac_dinh >= 1)
CHECK (suc_chua >= 1)
CHECK (diem_tong BETWEEN 1 AND 5)
CHECK (kich_thuoc IS NULL OR kich_thuoc >= 0)
CHECK (trang_thai IN ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'))
CHECK (loai_dinh_kem IN ('CCCD_FRONT', 'CCCD_BACK', 'SUPPORTING_DOCUMENT'))
```

Khung giờ cũng phải bảo đảm giờ bắt đầu nhỏ hơn giờ kết thúc. Nên cân nhắc sử dụng kiểu `TIME` thay vì `VARCHAR(10)`.

### 3.10. Nên liên kết đăng ký quầy trực tiếp với khung giờ

Plan vẫn chỉ giữ:

```prisma
id_lich_tiep_dan String?
slot             String?
id_quay          String?
```

Thiết kế này không bảo đảm chuỗi `slot` thực sự tồn tại trong lịch.

Nên bổ sung:

```prisma
id_khung_gio_tiep_dan String? @db.Uuid
```

Đăng ký mới sử dụng FK này. Trường `slot` được giữ tạm thời làm snapshot hoặc để tương thích API cũ.

### 3.11. Rollback hiện tại không khôi phục được dữ liệu

Rollback trong plan chỉ thêm lại các cột đã xóa nhưng không thể khôi phục:

- Giá trị `loai`.
- Địa chỉ.
- Tên và chức vụ lãnh đạo.
- Người tạo và người cập nhật.
- Mã `QUAY_1` từ UUID quầy.
- Dữ liệu gặp lãnh đạo đã chuyển hoặc đã bị xóa.

Ngoài ra, `DROP TABLE quay_tiep_dan CASCADE` có thể xóa các FK trước khi những lệnh `DROP CONSTRAINT` phía sau chạy.

Rollback hiện tại không phải rollback an toàn. Cần backup dữ liệu và thiết kế rollback theo từng phase.

## 4. Phương án migration an toàn

### 4.1. Migration 1 — Mở rộng, không xóa dữ liệu cũ

- Tạo `quay_tiep_dan`.
- Seed đủ tám quầy, mặc định hai người/quầy/ca.
- Tạo các bảng gặp lãnh đạo.
- Thêm `id_quay` vào `dang_ky_tiep_dan`, chưa xóa `bo_phan`.
- Thêm `id_quay` vào `khung_gio_tiep_dan`, chưa xóa `ma_quay`.
- Thêm `id_khung_gio_tiep_dan` vào đăng ký tiếp dân.
- Thêm `nguoi_duyet_don`.
- Giữ toàn bộ cột cũ.
- Thêm FK, CHECK constraint và index cần thiết.

### 4.2. Migration 2 — Backfill và chuyển code

- Backfill `id_quay` từ `bo_phan` và `ma_quay`.
- Dừng migration nếu tồn tại mã quầy không ánh xạ được.
- Chuyển dữ liệu `LEADER_MEETING` sang bảng mới.
- Chuyển đánh giá gặp lãnh đạo sang bảng mới.
- Đối soát số lượng và khóa chính giữa bảng cũ và bảng mới.
- Backend sử dụng UUID nội bộ nhưng vẫn giữ contract `department`.
- Chạy toàn bộ unit test, integration test, Swagger test và Mobile integration test.

### 4.3. Migration 3 — Thu gọn sau khi xác minh

Chỉ thực hiện sau khi đã đối soát dữ liệu và client hoạt động ổn định:

- Xóa `bo_phan` và `ma_quay` cũ.
- Có thể xóa `loai` sau khi không còn bản ghi gặp lãnh đạo trong bảng cũ.
- Chỉ xóa `ten_lanh_dao` và `chuc_vu_lanh_dao` sau khi dữ liệu lịch sử đã được chuyển đầy đủ.
- Không xóa `dia_chi` và các field audit.

## 5. Các nội dung cần chốt

1. Sức chứa khung giờ gặp lãnh đạo mặc định là một người hay có thể cấu hình.
2. Có giữ `chu_de` nullable cho đăng ký gặp lãnh đạo hay bỏ hoàn toàn.
3. Mobile hủy đơn đã chốt là không cho hủy, vì vậy không thêm `CANCELLED` và nên bỏ câu hỏi này khỏi plan.
4. Có bắt buộc đăng ký gặp lãnh đạo ở trạng thái `COMPLETED` trước khi được đánh giá hay không. Đề xuất áp dụng cùng quy tắc với tiếp dân tại quầy: chỉ đánh giá sau `COMPLETED`.

## 6. Trạng thái kiểm tra hiện tại

- `prisma migrate status` xác nhận database DEV có 15 migration và đang đồng bộ.
- `prisma validate` thành công với schema hiện tại, nhưng còn ba warning relation cũ.
- Chưa thay đổi Prisma schema.
- Chưa tạo migration mới.
- Chưa thay đổi dữ liệu database.
- Truy vấn tổng hợp dữ liệu thực tế sau đó gặp lỗi kết nối `ECONNREFUSED`, nên vẫn phải chạy preflight và backup trước khi migration.

## 7. Kết luận triển khai

Không chạy trực tiếp migration SQL trong plan hiện tại.

Plan cần được sửa theo hướng **expand → backfill/chuyển code → verify → contract**, đồng thời giữ nguyên contract API cũ để không ảnh hưởng Mobile và Swagger đang sử dụng.
