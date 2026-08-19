# Đề xuất hoàn thiện schema đăng ký gặp lãnh đạo

## 1. Đánh giá tổng quan

Model `dang_ky_gap_lanh_dao` hiện tại đúng hướng nhưng chưa đáp ứng đủ dữ liệu đang được thu thập trên màn hình Mobile **Đăng ký gặp Lãnh đạo**.

Các phần còn thiếu chính:

1. Thông tin CCCD, địa chỉ và ngày làm đơn.
2. Cấu trúc lưu ảnh CCCD và tài liệu đính kèm.
3. Liên kết chính xác đến khung giờ riêng của lãnh đạo.
4. Khóa ngoại cho người duyệt, người hoàn thành và người từ chối.

## 2. Các field còn thiếu

Mobile đang yêu cầu các trường sau nhưng model chưa lưu:

```prisma
ngay_cap_cccd DateTime? @db.Date
noi_cap_cccd  String?   @db.VarChar(255)
dia_chi       String?
ngay_lam_don  DateTime? @db.Date
```

Trong đó `dia_chi` là bắt buộc trên Mobile nên cần được bổ sung chắc chắn.

Mobile còn yêu cầu:

- Ảnh CCCD mặt trước.
- Ảnh CCCD mặt sau.
- Tối đa ba tài liệu hỗ trợ.

Không nên lưu tên file trực tiếp trong `dang_ky_gap_lanh_dao`. Nên tạo table riêng:

```prisma
model dinh_kem_dang_ky_gap_lanh_dao {
  id            String   @id @default(dbgenerated("public.uuid_generate_v4()")) @db.Uuid
  id_dang_ky    String   @db.Uuid
  loai_dinh_kem String   @db.VarChar(30) // CCCD_FRONT | CCCD_BACK | SUPPORTING_DOCUMENT
  ten_file_goc  String   @db.VarChar(255)
  duong_dan_file String
  mime_type     String?  @db.VarChar(100)
  kich_thuoc    Int?
  thoi_gian_tao DateTime @default(now())

  dang_ky_gap_lanh_dao dang_ky_gap_lanh_dao
    @relation(fields: [id_dang_ky], references: [id], onDelete: Cascade)

  @@index([id_dang_ky])
}
```

## 3. Không nên dùng trực tiếp `id_lich_tiep_dan` hiện tại

Mobile đang chọn:

- Lãnh đạo.
- Ngày gặp.
- Một khung giờ cụ thể của lãnh đạo.

Trong khi `lich_tiep_dan` hiện tại phục vụ tiếp dân tại tám quầy. Dùng chung có thể làm trộn hai nghiệp vụ.

Nên tách thành:

```text
lich_gap_lanh_dao
khung_gio_gap_lanh_dao
dang_ky_gap_lanh_dao
```

Trong đăng ký nên lưu:

```prisma
id_khung_gio_gap_lanh_dao String @db.Uuid
```

Từ khung giờ có thể xác định:

- Lãnh đạo phụ trách.
- Ngày gặp.
- Thời gian gặp.
- Địa điểm hoặc phòng gặp.
- Khung giờ còn chỗ hay đã kín.

Khi đó, các field sau chỉ cần giữ làm dữ liệu snapshot nếu nghiệp vụ yêu cầu:

```prisma
id_lich_tiep_dan String?
ngay             DateTime?
slot             String?
```

## 4. Các field bắt buộc

Mobile bắt buộc chọn lãnh đạo trước khi gửi nên `id_lanh_dao` không nên nullable:

```prisma
id_lanh_dao String @db.Uuid
```

Các field bắt buộc trên Mobile cũng nên chuyển thành non-null:

```prisma
ngay    DateTime @db.Date
slot    String   @db.VarChar(50)
ly_do   String
ho_ten  String   @db.VarChar(150)
sdt     String   @db.VarChar(20)
cccd    String   @db.VarChar(20)
dia_chi String
```

`chu_de` hiện chưa có ô nhập riêng trên Mobile. Có thể:

- Bỏ nếu không sử dụng.
- Hoặc giữ nullable để bổ sung danh mục chủ đề sau.

## 5. Chuẩn hóa trạng thái

`trang_thai` không nên nullable và nên sử dụng enum:

```prisma
enum trang_thai_gap_lanh_dao {
  PENDING
  APPROVED
  REJECTED
  COMPLETED
}
```

Áp dụng vào model:

```prisma
trang_thai trang_thai_gap_lanh_dao @default(PENDING)
```

Mobile hiện vẫn có trạng thái `CANCELLED` và nút hủy đơn. Tuy nhiên, yêu cầu trước đó đã chốt bỏ chức năng Mobile hủy đơn. Vì vậy nên xóa nút hủy khỏi Mobile thay vì thêm `CANCELLED` vào DB.

Nếu quyết định cho phép hủy trở lại thì cần bổ sung:

```prisma
ly_do_huy     String?
thoi_gian_huy DateTime?
nguoi_huy     String?   @db.Uuid
```

## 6. Khóa ngoại người xử lý

Các field dưới đây mới chỉ là UUID và chưa tạo relation Prisma:

```prisma
nguoi_duyet_don
nguoi_hoan_thanh
nguoi_tu_choi
```

Cần khai báo relation riêng vì tất cả đều trỏ đến `nguoi_dung`:

```prisma
lanh_dao              nguoi_dung  @relation("DangKyGapLanhDao_LanhDao", fields: [id_lanh_dao], references: [id])
nguoi_duyet            nguoi_dung? @relation("DangKyGapLanhDao_NguoiDuyet", fields: [nguoi_duyet_don], references: [id])
nguoi_hoan_thanh_ref   nguoi_dung? @relation("DangKyGapLanhDao_NguoiHoanThanh", fields: [nguoi_hoan_thanh], references: [id])
nguoi_tu_choi_ref      nguoi_dung? @relation("DangKyGapLanhDao_NguoiTuChoi", fields: [nguoi_tu_choi], references: [id])
```

Nếu không khai báo relation, database không đảm bảo các UUID này thật sự tồn tại trong `nguoi_dung`.

## 7. Audit và xóa mềm

Model nên bổ sung:

```prisma
nguoi_tao      String? @db.Uuid
nguoi_cap_nhat String? @db.Uuid
```

Các field trạng thái và thời điểm tạo không nên nullable:

```prisma
is_active     Boolean  @default(true)
is_delete     Boolean  @default(false)
thoi_gian_tao DateTime @default(dbgenerated("(now() AT TIME ZONE 'utc'::text)")) @db.Timestamp(6)
```

## 8. Quan hệ đánh giá

Mỗi đơn chỉ được đánh giá một lần. Vì vậy nên thay:

```prisma
danh_gia_gap_lanh_dao danh_gia_gap_lanh_dao[]
```

bằng:

```prisma
danh_gia_gap_lanh_dao danh_gia_gap_lanh_dao?
```

Đồng thời `id_dang_ky_gap_lanh_dao` trong table đánh giá phải có `@unique`.

## 9. Index đề xuất

```prisma
@@index([id_lanh_dao, ngay])
@@index([id_lanh_dao, ngay, slot])
@@index([sdt])
@@index([cccd])
@@index([trang_thai])
@@index([thoi_gian_tao])
```

Nếu sử dụng khóa ngoại đến khung giờ riêng của lãnh đạo:

```prisma
@@index([id_khung_gio_gap_lanh_dao])
```

## 10. Nội dung cần chốt trước khi code

Cần chốt sức chứa của một khung giờ gặp lãnh đạo:

- Mỗi khung giờ chỉ nhận một người như Mobile hiện tại.
- Hoặc mỗi khung giờ có sức chứa cấu hình và nhận nhiều người.

Quyết định này ảnh hưởng trực tiếp đến:

- Cấu trúc `khung_gio_gap_lanh_dao`.
- Cách tính chỗ còn lại.
- Điều kiện chống đăng ký trùng.
- Cách xử lý khi đơn bị từ chối.

## 11. Kết luận

Model hiện tại cần bổ sung hoặc điều chỉnh:

1. `ngay_cap_cccd`, `noi_cap_cccd`, `dia_chi`, `ngay_lam_don`.
2. Table đính kèm CCCD và tài liệu hỗ trợ.
3. Khóa ngoại đến khung giờ riêng của lãnh đạo.
4. Relation người duyệt, người hoàn thành và người từ chối.
5. Enum trạng thái non-null.
6. Audit tạo/cập nhật và trạng thái xóa mềm non-null.
7. Quan hệ đánh giá một-một.
8. Các index phục vụ tra cứu, kiểm tra trùng và thống kê.
