# DB — Bổ sung cho Cổng thông tin công dân (SOS_TNP_LONGLO)

> Tài liệu đề xuất thay đổi DB để thống nhất với mentor.
> Nền tảng: DB cũ 33 bảng (`prisma/schema.prisma` / `database-schema.dbml`).
> UI mới tham chiếu: cổng công dân trong `SOS_TNP_LONGLO/src/citizen` (chưa có BE, đang dùng mock data).

## Tóm tắt

- **Tái sử dụng, không đổi**: Phản ánh, Thủ tục, Lịch tiếp dân, Tin tức, Liên hệ, Danh bạ phòng ban.
- **Thêm cột (ALTER)**: `tin_tuc` (+2), `thu_tuc_hanh_chinh` (+1).
- **Bảng mới (CREATE)**:
  - `danh_gia_phan_anh` — Đánh giá hài lòng phản ánh (SOS-018) + thống kê.
  - `dang_ky_tiep_dan` — Đăng ký tiếp dân / đặt lịch gặp lãnh đạo.
  - `danh_gia_tiep_dan` — Đánh giá sau buổi tiếp dân / gặp lãnh đạo.
  - `thu_vien_danh_muc` — Danh mục Thư viện số.
  - `thu_vien_tai_lieu` — Tài liệu Thư viện số (gộp sách/địa phương + văn bản pháp luật).
  - *(tuỳ chọn)* `banner_trang_chu` — Banner quảng bá trang chủ.
- **Quyền mới**: seed vào `permissions` (không phải DDL).

---

## 1) Tái sử dụng — không cần đổi

| UI mới | Bảng DB cũ | Ghi chú |
|---|---|---|
| Phản ánh (gửi 4 bước + tra cứu theo mã) | `phan_anh`, `dinh_kem_phan_anh`, `lich_su_trang_thai`, `linh_vuc_phan_anh` | Có sẵn `tieu_de, mo_ta, vi_tri, ten_nguoi_phan_anh, sdt_nguoi_phan_anh, id_linh_vuc_phan_anh`, ảnh đính kèm, lịch sử trạng thái. Chỉ cần endpoint public (GET tra cứu theo mã, POST citizen gửi) — không đụng schema. |
| Thủ tục hành chính | `thu_tuc_hanh_chinh` + `cach_thuc_thuc_hien` (duration/fee), `truong_hop_thu_tuc`, `thanh_phan_ho_so`, `trinh_tu_thuc_hien_thu_tuc`, `mau_don`, `linh_vuc`, `co_so_dich_vu_cong` | Đã đủ summary/steps; `linh_vuc` = phân loại (Hộ tịch, Đất đai…). |
| Lịch tiếp dân | `lich_tiep_dan` | `day/time/host/place` ↔ `dia_diem/ten_can_bo/thoi_gian`. |
| Tin tức / Thông báo | `tin_tuc`, `danh_muc_tin_tuc`, `dinh_kem_tin_tuc`, `tin_tuc_view` | Thiếu cột excerpt & đánh dấu quan trọng → mục 3. |
| Liên hệ / giờ làm việc | `uy_ban` | `dia_chi_tru_so, so_dien_thoai, email, gio_lam_viec(JSON)`. |
| Danh bạ phòng ban | `co_so_dich_vu_cong` | Khớp `departments`. |
| Bản đồ số / quy hoạch | ngoài (Map + GIS `data_1.json`/`ranh_gioi.json`) | Không cần bảng. |
| AI Chat | không (rule-based client) | Chỉ thêm `ai_gop_y_lich_su` nếu cần lưu lịch sử/LRS. |

---

## 2) Bảng MỚI

Chuẩn chung: PK UUID, bộ cột audit `nguoi_tao / nguoi_cap_nhat / thoi_gian_tao / thoi_gian_cap_nhat` + `is_active / is_delete`.

### 2a. `danh_gia_phan_anh` — Đánh giá hài lòng phản ánh
Màn SOS-018 (citizen chấm 1–5 sao + góp ý) và Dashboard thống kê.

| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | uuid | PK |
| id_phan_anh | uuid | UNIQUE, FK → `phan_anh` |
| diem | int | 1..5 |
| nhan_xet | text | góp ý (≤2000 ký tự) |
| + audit, is_active, is_delete | | |

1 phản ánh đã giải quyết = 1 đánh giá.

### 2b. `dang_ky_tiep_dan` — Đăng ký tiếp dân / gặp lãnh đạo
Tương ứng `counterReceptionFeedbackQueue` + `leaderMeetingFeedbackQueue` trong mock.

| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | uuid | PK |
| loai | varchar(30) | `COUNTER_RECEPTION` \| `LEADER_MEETING` |
| ma_tiep_dan | varchar(50) | ticket: `TD-...` / `LĐ-...` |
| id_lich_tiep_dan | uuid | FK → `lich_tiep_dan` (nullable) |
| ngay | date | |
| slot | varchar(50) | ví dụ "07:30 - 08:30" |
| chu_de | varchar(255) | topic |
| ly_do | text | reason (meeting) |
| ho_ten | varchar(150) | |
| sdt | varchar(20) | |
| cccd | varchar(20) | |
| dia_chi | text | |
| bo_phan | text | office: Quầy tiếp dân / Phòng tiếp công dân |
| ten_lanh_dao | varchar(255) | (LEADER_MEETING) |
| chuc_vu_lanh_dao | varchar(255) | |
| trang_thai | varchar(30) | `pending`/`approved`/`completed`/`cancelled` (default `pending`) |
| + audit | | |

### 2c. `danh_gia_tiep_dan` — Đánh giá sau buổi tiếp dân / gặp lãnh đạo
Tương ứng `receptionFeedbackMockRatings`.

| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | uuid | PK |
| id_dang_ky_tiep_dan | uuid | UNIQUE, FK → `dang_ky_tiep_dan` |
| diem_tong | int | overall |
| tieu_chi | json | `{attitude, guidance, waiting}` |
| ly_do | json | `["Được hướng dẫn rõ ràng", ...]` |
| nhan_xet | text | |

### 2d. `thu_vien_danh_muc` — Danh mục Thư viện số
`libraryCategories`: tu-sach, tai-lieu, van-ban, ban-do.

| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | uuid | PK |
| ten | varchar(255) | |
| mo_ta | text | |
| icon | varchar(50) | BookOpen / FileText / ScrollText / Map |
| tone | varchar(20) | blue/green/orange/purple |
| thu_tu | int | |
| + audit, is_active, is_delete | | |

### 2e. `thu_vien_tai_lieu` — Tài liệu Thư viện số
Gộp sách/tài liệu/văn bản/bản đồ địa phương + văn bản pháp luật quốc gia (mock `libraryDocuments` + `MOCK_LAWS`) vì UI dùng chung 1 component detail; cột nhóm luật để NULL.

| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | uuid | PK |
| id_danh_muc | uuid | FK → `thu_vien_danh_muc` (nullable) |
| loai | varchar(30) | `SACH`\|`TAI_LIEU`\|`VAN_BAN`\|`BAN_DO`\|`PHAP_LUAT` |
| tieu_de | varchar(255) | |
| tac_gia | varchar(255) | |
| mo_ta | text | description |
| url_bia | varchar(500) | cover |
| so_luot_tai | bigint | default 0 |
| is_featured | bool | |
| noi_dung | text | nội dung văn bản địa phương |
| sections | json | sách/tài liệu: `[{heading, content}]` |
| so_hieu | varchar(100) | "Hiến pháp 2013" |
| co_quan_ban_hanh | varchar(255) | |
| ngay_ban_hanh | date | |
| ngay_hieu_luc | date | |
| trang_thai_hieu_luc | varchar(50) | "Đang hiệu lực" |
| chuong | json | `[{title, articles[]}]` |
| trang_thai | varchar(30) | `NHAP`\|`CHO_DUYET`\|`DA_DUYET`\|`LUU_TRU` |
| pham_vi | varchar(30) | `CONG_KHAI`\|`NOI_BO`\|`HAN_CHE` |
| nguon | text | nguồn tài liệu (yêu cầu Task 4 cho chatbot) |
| nguoi_duyet | uuid | FK → `nguoi_dung` (yêu cầu Task 4) |
| thoi_gian_duyet | timestamp | (yêu cầu Task 4) |
| ngay_dang | int | số trang (metadata) |
| ngon_ngu | varchar(10) | vi/en (metadata) |
| + audit, is_active, is_delete | | |

> Bỏ `tags json` và `url_file` (được tách sang bảng `thu_vien_tag` + `thu_vien_tai_lieu_file`).

### 2e2. `thu_vien_tag` — Thẻ phân loại tài liệu (nhiều-nhiều)
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | uuid | PK |
| ten | varchar(100) | `lịch sử`, `văn hóa`, `hộ tịch`... |
| + audit, is_active, is_delete | | |

### 2e3. `thu_vien_tai_lieu_tag` — bảng nối tài liệu ↔ tag
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | uuid | PK |
| id_tai_lieu | uuid | FK → `thu_vien_tai_lieu` |
| id_tag | uuid | FK → `thu_vien_tag` |

### 2e4. `thu_vien_tai_lieu_file` — File / phiên bản tài liệu
Lưu storage DEV **private** (KHÔNG `src/public/uploads`).
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | uuid | PK |
| id_tai_lieu | uuid | FK → `thu_vien_tai_lieu` |
| ten_file | varchar(255) | tên file gốc |
| duong_dan | varchar(500) | path private trong storage |
| dinh_dang | varchar(50) | MIME: application/pdf... |
| kich_thuoc_mb | decimal(10,2) | |
| phien_ban | int | số phiên bản |
| la_phien_ban_hien_tai | bool | đánh dấu bản đang dùng |
| mo_ta | text | ghi chú đổi phiên bản |
| + audit, is_active, is_delete | | |

### 2e5. `thu_vien_tai_lieu_quyen` — Quyền truy cập (theo vai trò)
Chỉ dùng khi tài liệu có `pham_vi = HAN_CHE`.
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | uuid | PK |
| id_tai_lieu | uuid | FK → `thu_vien_tai_lieu` |
| id_vai_tro | uuid | FK → `roles` |
| + audit | | |

### 2f. *(tuỳ chọn)* `banner_trang_chu` — Banner trang chủ
Cho `heroBanners`.

| Cột | Kiểu |
|---|---|
| id | uuid PK |
| tieu_de | varchar(255) |
| eyebrow | varchar(255) |
| mo_ta | text |
| metric | varchar(50) |
| metric_label | varchar(255) |
| url_anh | varchar(500) |
| thu_tu | int |
| is_active / is_delete + audit | |

---

## 3) Cột THÊM vào bảng cũ

| Bảng | Cột mới | Kiểu | Mục đích |
|---|---|---|---|
| `tin_tuc` | `trich_doan` | text | excerpt hiển thị trên home/list |
| `tin_tuc` | `is_quan_trong` | bool | đánh dấu thông báo quan trọng/khẩn cấp (`importantNotices`) |
| `thu_tuc_hanh_chinh` | `is_featured` | bool | thủ tục nổi bật hiện ở home |

> `phan_anh` không cần đổi (giữ `vi_tri` cho "địa điểm"). `linh_vuc_phan_anh` seed thêm nhóm "Điện, nước, chiếu sáng" (data seed, không phải DDL).

---

## 4) Quyền mới — seed vào `permissions`, không phải schema

- `THU_VIEN_CREATE/UPDATE/DELETE/GET_ALL/GET_DETAIL`
- `THU_VIEN_DUYET` (duyệt tài liệu — chuyển trạng thái sang `DA_DUYET`)
- `THU_VIEN_QUAN_LY_TAG` (quản lý tag)
- `DANH_GIA_PHAN_ANH_GET_ALL` (thống kê đánh giá)
- `DANG_KY_TIEP_DAN_UPDATE_STATUS/GET_ALL`
- `DANH_GIA_TIEP_DAN_GET_ALL`

Đồng bộ với `permission.constant.js` (BE) + route `POST /api/permission/sync`.

---

## 5) Quy trình triển khai (theo chuẩn BE)

1. Sửa `prisma/schema.prisma` → `prisma migrate dev --name <ten>` ở **DB dev cục bộ** (sinh file migration + `prisma generate`).
2. Giữ migration **schema-agnostic** (gỡ `"<SCHEMA>".` qualifier + dòng `CREATE SCHEMA`).
3. `prisma migrate deploy` lên staging → prod. **Backup `pg_dump -n '"<SCHEMA>"'` trước khi chạy prod.**
4. **Tuyệt đối không** `migrate dev`/`reset` lên server; không chỉ `db push`.
5. Module mới đủ chuỗi `route → controller → service → repository`, bảo vệ `authenticate` + `authorize([PERMISSION.*])`.

---

## 6) Kết quả triển khai Task 2 (đã kiểm tra thực tế)

### Migration đã sinh & deploy
- `prisma/migrations/20260816171428_them_bang_danh_gia_va_thu_vien/` — **additive** hoàn toàn: chỉ `CREATE TABLE` (9 bảng) + `CREATE INDEX` + `ALTER TABLE ADD CONSTRAINT` (FK). **Không có** `DROP TABLE`/`DROP COLUMN`, không `TRUNCATE`, không `DELETE` → không mất dữ liệu cũ.
- **Schema-agnostic**: tên bảng không qualify `"<SCHEMA>".`, không có `CREATE SCHEMA` → schema do `?schema=` của connection chọn (dev `UBND_DB_DEV`, staging `UBND_DB_STG`, prod `UBND_DB`).
- Đã `prisma migrate dev` tạo file + áp lên **DB dev Render** (chia sẻ team). Đã verify bảng hiện hữu.

### Bảng mới (9)
`danh_gia_phan_anh`, `dang_ky_tiep_dan`, `danh_gia_tiep_dan`, `thu_vien_danh_muc`, `thu_vien_tai_lieu`, `thu_vien_tag`, `thu_vien_tai_lieu_tag`, `thu_vien_tai_lieu_file`, `thu_vien_tai_lieu_quyen`.

### Seed DEV (đã chạy thành công trên Render dev DB)
Lệnh: `npx prisma db seed` (`prisma/seed.js`, config trong `prisma.config.ts`).
- **Idempotent**: dùng UUID cố định + `upsert` → chạy lại không nhân đôi (đã chạy 2 lần, cùng số bản ghi).
- Dữ liệu giả: `roles`(2), `lich_tiep_dan`(2), `phan_anh`(3), `danh_gia_phan_anh`(2), `dang_ky_tiep_dan`(2), `danh_gia_tiep_dan`(1), `thu_vien_danh_muc`(3), `thu_vien_tai_lieu`(3), `thu_vien_tag`(3), `thu_vien_tai_lieu_tag`(4), `thu_vien_tai_lieu_file`(1), `thu_vien_tai_lieu_quyen`(1).
- Cần data nền cho FK (roles/admin, linh_vuc_phan_anh, lich_tiep_dan, phan_anh) — seed tự upsert.

> Team pull code về: chỉ cần `.env` trỏ đúng `DATABASE_URL` (DB dev Render chung) → `npx prisma generate` → chạy app. Seed đã có sẵn trên DB chung; chỉ chạy lại `db seed` nếu muốn reset data giả trên máy riêng.

### Sơ đồ dữ liệu
Xem `database-schema-new-features.dbml` (phần "BỔ SUNG — CỔNG THÔNG TIN CÔNG DÂN") — đủ 9 bảng mới + quan hệ FK.