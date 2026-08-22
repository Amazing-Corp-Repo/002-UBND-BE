# Báo cáo thiết kế Database — Task 4: Kho tư liệu & Tra cứu văn bản

> **Mục đích:** Báo cáo thay đổi schema database cho mentor review
> **Ngày:** 2026-08-21
> **Trạng thái:** Đề xuất thay đổi

---

## 1. Tổng quan

Task 4 yêu cầu xây dựng hệ thống quản lý **tài liệu văn hóa - lịch sử** và **văn bản pháp luật**. Sau khi khảo sát codebase, phát hiện dự án **đã có sẵn 6 bảng `thu_vien_*`** từ giai đoạn trước (migration `20260816171428_them_bang_danh_gia_va_thu_vien`).

**Chiến lược:** Tận dụng 6 bảng có sẵn, chỉ mở rộng thêm cột + 1 bảng mới, thay vì tạo lại từ đầu.

---

## 2. Các bảng hiện có (GIỮ NGUYÊN — không thay đổi)

### 2.1. `thu_vien_danh_muc` — Danh mục tài liệu

| Column | Type | Ghi chú |
|--------|------|---------|
| `id` | UUID | PK |
| `ten` | VarChar(255) | Tên danh mục (VD: "Tủ sách địa phương", "Văn bản pháp luật") |
| `mo_ta` | Text? | Mô tả |
| `icon` | VarChar(50)? | Icon hiển thị |
| `tone` | VarChar(20)? | Màu sắc |
| `thu_tu` | Int? | Thứ tự sắp xếp |
| `is_active` | Boolean? | Soft delete |
| `is_delete` | Boolean? | Soft delete |
| Audit fields | | `nguoi_tao`, `nguoi_cap_nhat`, `thoi_gian_tao`, `thoi_gian_cap_nhat` |

**Seed hiện tại:** 3 danh mục — "Tủ sách địa phương", "Văn bản pháp luật", "Bản đồ số"

### 2.2. `thu_vien_tag` — Thẻ phân loại

| Column | Type | Ghi chú |
|--------|------|---------|
| `id` | UUID | PK |
| `ten` | VarChar(100) | **Unique** — tên thẻ |
| `is_active` | Boolean? | |
| `is_delete` | Boolean? | |
| Audit fields | | |

**Seed hiện tại:** 3 tags — "lịch sử", "văn hóa", "địa chính"

### 2.3. `thu_vien_tai_lieu_tag` — Bảng nối tài liệu ↔ tag

| Column | Type | Ghi chú |
|--------|------|---------|
| `id` | UUID | PK |
| `id_tai_lieu` | UUID | FK → `thu_vien_tai_lieu` |
| `id_tag` | UUID | FK → `thu_vien_tag` |
| Unique | | `(id_tai_lieu, id_tag)` |

### 2.4. `thu_vien_tai_lieu_file` — File / phiên bản tài liệu (private storage)

| Column | Type | Ghi chú |
|--------|------|---------|
| `id` | UUID | PK |
| `id_tai_lieu` | UUID | FK → `thu_vien_tai_lieu` |
| `ten_file` | VarChar(255)? | Tên file |
| `duong_dan` | VarChar(500)? | Đường dẫn private |
| `dinh_dang` | VarChar(50)? | MIME type |
| `kich_thuoc_mb` | Decimal(10,2)? | Dung lượng MB |
| `phien_ban` | Int? | Version number |
| `la_phien_ban_hien_tai` | Boolean? | Đánh dấu bản hiện hành |
| `mo_ta` | Text? | |
| Soft delete + Audit | | |

### 2.5. `thu_vien_tai_lieu_quyen` — Quyền truy cập theo vai trò (dùng khi `pham_vi = HAN_CHE`)

| Column | Type | Ghi chú |
|--------|------|---------|
| `id` | UUID | PK |
| `id_tai_lieu` | UUID | FK → `thu_vien_tai_lieu` |
| `id_vai_tro` | UUID | FK → `roles` |
| Audit fields | | |

---

## 3. Bảng `thu_vien_tai_lieu` — THÊM CỘT (6 cột mới)

Bảng này đã có sẵn các field chính cho tài liệu. Dưới đây là các cột **HIỆN CÓ** và **THÊM MỚI**.

### 3.1. Các cột đã có (GIỮ NGUYÊN)

| Column | Type | Ghi chú | Tương ứng FE API |
|--------|------|---------|-----------------|
| `id` | UUID | PK | `id` |
| `id_danh_muc` | UUID? | FK → `thu_vien_danh_muc` | `subCategory` / `docType` |
| `loai` | VarChar(30)? | `SACH`, `TAI_LIEU`, `VAN_BAN`, `BAN_DO`, `PHAP_LUAT` | Phân loại |
| `tieu_de` | VarChar(255)? | Tiêu đề | `title` |
| `tac_gia` | VarChar(255)? | Tác giả | `relicName` / tác giả |
| `mo_ta` | Text? | Mô tả / tóm tắt | `description` / `summary` |
| `url_bia` | VarChar(500)? | Ảnh bìa (public) | — |
| `so_luot_tai` | BigInt? | Số lượt tải | `downloadCount` |
| `is_featured` | Boolean? | Nổi bật | — |
| `noi_dung` | Text? | Nội dung đầy đủ | — |
| `sections` | Json? | Các section | — |
| `so_hieu` | VarChar(100)? | Số hiệu văn bản | `docNumber` |
| `co_quan_ban_hanh` | VarChar(255)? | Cơ quan ban hành | `issuingAgency` |
| `ngay_ban_hanh` | Date? | Ngày ban hành | `issueDate` |
| `ngay_hieu_luc` | Date? | Ngày hiệu lực | `effectiveDate` |
| `trang_thai_hieu_luc` | VarChar(50)? | Trạng thái hiệu lực | — |
| `chuong` | Json? | Chương / điều (pháp luật) | — |
| `trang_thai` | VarChar(30)? | `NHAP`, `CHO_DUYET`, `DA_DUYET`, `LUU_TRU` | `status` |
| `pham_vi` | VarChar(30)? | `CONG_KHAI`, `NOI_BO`, `HAN_CHE` | `securityLevel` |
| `nguon` | Text? | Nguồn tài liệu (cho chatbot) | — |
| `nguoi_duyet` | UUID? | FK → `nguoi_dung` | `approverId` |
| `thoi_gian_duyet` | Timestamp? | Thời gian duyệt | — |
| `ngay_dang` | Int? | Ngày đăng (số trong năm) | — |
| `ngon_ngu` | VarChar(10)? | Ngôn ngữ | — |
| `is_active` | Boolean? | | |
| `is_delete` | Boolean? | | |
| Audit fields | | | `createdAt`, `updatedAt`, `createdBy` |

### 3.2. Các cột THÊM MỚI (6 cột)

```sql
-- Thêm vào bảng thu_vien_tai_lieu
ALTER TABLE thu_vien_tai_lieu ADD COLUMN luot_xem          BIGINT     DEFAULT 0;
ALTER TABLE thu_vien_tai_lieu ADD COLUMN ai_da_hoc         BOOLEAN    DEFAULT false;
ALTER TABLE thu_vien_tai_lieu ADD COLUMN thoi_gian_ai_hoc  TIMESTAMP(6);
ALTER TABLE thu_vien_tai_lieu ADD COLUMN ngay_het_han      DATE;
ALTER TABLE thu_vien_tai_lieu ADD COLUMN dia_chi           VARCHAR(500);
ALTER TABLE thu_vien_tai_lieu ADD COLUMN ten_di_tich       VARCHAR(255);

-- Index mới
CREATE INDEX idx_thu_vien_tai_lieu_luot_xem  ON thu_vien_tai_lieu(luot_xem);
CREATE INDEX idx_thu_vien_tai_lieu_ai_da_hoc ON thu_vien_tai_lieu(ai_da_hoc);
```

| Cột mới | Type | Mục đích | FE API |
|---------|------|---------|--------|
| `luot_xem` | BigInt? | Đếm lượt xem | `viewCount` |
| `ai_da_hoc` | Boolean? | Đánh dấu AI đã học | `aiLearned` |
| `thoi_gian_ai_hoc` | Timestamp? | Thời điểm AI học | — |
| `ngay_het_han` | Date? | Ngày hết hiệu lực (pháp luật) | `expirationDate` |
| `dia_chi` | VarChar(500)? | Địa chỉ di tích (văn hóa) | `address` |
| `ten_di_tich` | VarChar(255)? | Tên di tích (văn hóa) | `relicName` |

---

## 4. Bảng MỚI: `thu_vien_tai_lieu_media` — Ảnh / Video đính kèm

Dành riêng cho tài liệu văn hóa - lịch sử (ảnh minh họa, video phóng sự).

```sql
CREATE TABLE thu_vien_tai_lieu_media (
  id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_tai_lieu       UUID         NOT NULL REFERENCES thu_vien_tai_lieu(id) ON DELETE CASCADE,
  loai              VARCHAR(10)  NOT NULL,              -- 'IMAGE' | 'VIDEO'
  ten_file_goc      VARCHAR(255),                       -- Tên file gốc
  url               VARCHAR(500),                       -- Đường dẫn private
  kich_thuoc        BIGINT,                             -- Dung lượng (bytes)
  mime_type         VARCHAR(50),                        -- image/jpeg, video/mp4
  is_active         BOOLEAN      DEFAULT true,
  is_delete         BOOLEAN      DEFAULT false,
  nguoi_tao         UUID,
  thoi_gian_tao     TIMESTAMP(6) DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE INDEX idx_tl_media_id_tai_lieu ON thu_vien_tai_lieu_media(id_tai_lieu);
```

| Column | Type | Ghi chú |
|--------|------|---------|
| `id` | UUID | PK |
| `id_tai_lieu` | UUID | FK → `thu_vien_tai_lieu` (CASCADE) |
| `loai` | VarChar(10) | `IMAGE` hoặc `VIDEO` |
| `ten_file_goc` | VarChar(255)? | Tên file gốc từ người dùng |
| `url` | VarChar(500)? | Đường dẫn lưu trữ (private) |
| `kich_thuoc` | BigInt? | Dung lượng bytes |
| `mime_type` | VarChar(50)? | MIME type |
| Soft delete | | `is_active`, `is_delete` |
| `nguoi_tao` | UUID? | |
| `thoi_gian_tao` | Timestamp? | |

---

## 5. Sơ đồ quan hệ (ER Diagram)

```
thu_vien_danh_muc (1) ──── (N) thu_vien_tai_lieu (1) ──── (N) thu_vien_tai_lieu_file
                                    │
                                    │ (1)
                                    │
                                    ├─── (N) thu_vien_tai_lieu_tag (N) ──── (1) thu_vien_tag
                                    │
                                    ├─── (N) thu_vien_tai_lieu_media     ← BẢNG MỚI
                                    │
                                    └─── (N) thu_vien_tai_lieu_quyen (N) ──── (1) roles
```

---

## 6. Mapping FE API → DB (quan trọng cho FE integration)

### Tài liệu Văn hóa - Lịch sử (`loai = 'VAN_HOA'`)

| FE Field | DB Field | Ghi chú |
|----------|---------|---------|
| `id` | `id` | UUID |
| `docNumber` | `so_hieu` | Mặc định "N/A" nếu không có |
| `title` | `tieu_de` | |
| `relicName` | `ten_di_tich` | **Cột mới** |
| `address` | `dia_chi` | **Cột mới** |
| `subCategory` | `thu_vien_danh_muc.ten` | Join qua `id_danh_muc` |
| `issueDate` | `ngay_ban_hanh` | |
| `status` | `trang_thai` | NHAP/CHO_DUYET/DA_DUYET/LUU_TRU |
| `securityLevel` | `pham_vi` | CONG_KHAI/NOI_BO/HAN_CHE |
| `fileUrl/fileName/fileSize` | `thu_vien_tai_lieu_file` | Private storage |
| `approverId/approverName` | `nguoi_duyet` → `nguoi_dung` | Join |
| `aiLearned` | `ai_da_hoc` | **Cột mới** |
| `viewCount` | `luot_xem` | **Cột mới** |
| `downloadCount` | `so_luot_tai` | Đã có |
| `images/videos` | `thu_vien_tai_lieu_media` | **Bảng mới** |
| `description` | `mo_ta` | |
| `tags` | `thu_vien_tag` | Qua bảng nối |
| Audit fields | `thoi_gian_tao/cap_nhat`, `nguoi_tao` | |

### Tài liệu Pháp luật (`loai = 'PHAP_LUAT'`)

| FE Field | DB Field | Ghi chú |
|----------|---------|---------|
| `docNumber` | `so_hieu` | VD: "104/2022/NĐ-CP" |
| `docType` | `thu_vien_danh_muc.ten` | "Nghị định", "Nghị quyết"... |
| `issuingAgency` | `co_quan_ban_hanh` | Đã có |
| `effectiveDate` | `ngay_hieu_luc` | Đã có |
| `expirationDate` | `ngay_het_han` | **Cột mới** |
| `summary` | `mo_ta` | Dùng chung với description |
| Các field còn lại | Tương tự văn hóa | |

---

## 7. Tổng kết thay đổi

### Giữ nguyên (6 bảng hiện có)
✅ `thu_vien_danh_muc` — Danh mục (giữ nguyên)
✅ `thu_vien_tag` — Thẻ (giữ nguyên)
✅ `thu_vien_tai_lieu_tag` — Nối tài liệu ↔ tag (giữ nguyên)
✅ `thu_vien_tai_lieu_file` — File/phiên bản (giữ nguyên)
✅ `thu_vien_tai_lieu_quyen` — Quyền truy cập (giữ nguyên)

### Mở rộng (1 bảng)
📝 `thu_vien_tai_lieu` — Thêm 6 cột, 2 index (xem mục 3.2)

### Thêm mới (1 bảng)
🆕 `thu_vien_tai_lieu_media` — Ảnh/video đính kèm (xem mục 4)

### Tổng số bảng sau thay đổi: **7 bảng** (6 cũ + 1 mới)

---

## 8. Seed data cần bổ sung

- `thu_vien_danh_muc`: Thêm danh mục "Văn hóa - Lịch sử", "Di tích lịch sử"
- `thu_vien_tai_lieu`: Thêm 2 tài liệu mẫu (`VAN_HOA` + `PHAP_LUAT`) với các cột mới
- `thu_vien_tai_lieu_media`: Thêm ảnh/video mẫu cho tài liệu văn hóa
- Cập nhật `luot_xem` cho tài liệu hiện có

---

## 9. Migration

Tạo **1 migration mới** (`YYYYMMDDHHmmss_mo_rong_thu_vien_tai_lieu`) với các thay đổi:
- `ALTER TABLE` thêm 6 cột
- `CREATE TABLE thu_vien_tai_lieu_media`
- `CREATE INDEX` 2 index mới
- Giữ schema-agnostic để deploy lên staging/prod

---

## 10. Ghi chú cho mentor

1. **Tại sao không tạo bảng riêng cho 2 loại tài liệu?** Vì 2 loại chia sẻ ~80% cấu trúc (tiêu đề, status, phạm vi, file, tag, audit, approval). Dùng 1 bảng + cột `loai` + nullable fields giúp search gộp, unified permission, dễ maintain.

2. **Tại sao media tách riêng khỏi `thu_vien_tai_lieu_file`?** Vì media (ảnh/video minh họa) khác bản chất với file tài liệu (PDF/DOCX). Media không cần versioning, không có khái niệm "phiên bản hiện hành".

3. **Private storage**: File tài liệu và media lưu trong `src/private/uploads/`, không serve tĩnh qua `express.static`. Download qua endpoint stream riêng có kiểm tra quyền.

4. **Trạng thái workflow**: `NHAP` → `CHO_DUYET` → `DA_DUYET` → `LUU_TRU`. Tài liệu `DA_DUYET` bắt buộc có `nguon`, `nguoi_duyet`, `thoi_gian_duyet` để chatbot có thể sử dụng.