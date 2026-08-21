# API Tài liệu (Thư viện) — Request & Response mẫu cho FE

> Base URL: `http://localhost:8880/api`
> Tất cả API đều cần header: `Authorization: Bearer <token>`

---

## 1. VĂN HÓA (`/tai-lieu-van-hoa`)

### 1.1. Lấy danh sách

```
GET /tai-lieu-van-hoa/paging?page=1&size=10&search=&trangThai=&phamVi=&idDanhMuc=
```

**Params:**

| Param | Type | Example |
|-------|------|---------|
| `page` | number | 1 |
| `size` | number | 10 |
| `search` | string | "lịch sử" |
| `trangThai` | enum | `NHAP` / `CHO_DUYET` / `DA_DUYET` / `LUU_TRU` |
| `phamVi` | enum | `CONG_KHAI` / `NOI_BO` / `HAN_CHE` |
| `idDanhMuc` | UUID | "uuid-của-danh-mục" |
| `aiDaHoc` | boolean | true / false |
| `dateFrom` | date | "2024-01-01" |
| `dateTo` | date | "2024-12-31" |
| `sortBy` | string | `thoi_gian_tao` / `tieu_de` / `ngay_ban_hanh` / `luot_xem` / `so_luot_tai` |
| `sortOrder` | string | `asc` / `desc` |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "loai": "VAN_HOA",
      "tieu_de": "Lịch sử hình thành phường Tăng Nhơn Phú",
      "so_hieu": null,
      "ten_di_tich": "UBND Phường Tăng Nhơn Phú",
      "dia_chi": "Số 10 Đường số 4, KP2",
      "ngay_ban_hanh": "2024-01-15T00:00:00.000Z",
      "trang_thai": "DA_DUYET",
      "pham_vi": "CONG_KHAI",
      "mo_ta": "Mô tả ngắn...",
      "ai_da_hoc": true,
      "luot_xem": 1250,
      "so_luot_tai": 340,
      "co_quan_ban_hanh": null,
      "thoi_gian_tao": "2024-01-10T08:00:00.000Z",
      "thoi_gian_cap_nhat": "2024-01-15T14:30:00.000Z",
      "thu_vien_danh_muc": {
        "id": "uuid",
        "ten": "Lịch sử địa phương"
      },
      "thu_vien_tai_lieu_file": [
        {
          "id": "uuid",
          "ten_file": "Lich_su_TNP.pdf",
          "duong_dan": "/uploads/thu-vien/2024/01/file.pdf",
          "kich_thuoc_mb": 8.39,
          "dinh_dang": "application/pdf"
        }
      ],
      "thu_vien_tai_lieu_tag": [
        { "thu_vien_tag": { "id": "uuid", "ten": "lịch sử" } }
      ],
      "_count": {
        "thu_vien_tai_lieu_media": 3
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 10,
    "totalPages": 5,
    "totalItems": 50
  }
}
```

---

### 1.2. Lấy chi tiết

```
GET /tai-lieu-van-hoa/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "loai": "VAN_HOA",
    "tieu_de": "Lịch sử hình thành phường Tăng Nhơn Phú",
    "so_hieu": null,
    "ten_di_tich": "UBND Phường Tăng Nhơn Phú",
    "dia_chi": "Số 10 Đường số 4, KP2",
    "ngay_ban_hanh": "2024-01-15T00:00:00.000Z",
    "trang_thai": "DA_DUYET",
    "pham_vi": "CONG_KHAI",
    "mo_ta": "Tài liệu tổng quan về lịch sử...",
    "ai_da_hoc": true,
    "luot_xem": 1250,
    "so_luot_tai": 340,
    "thoi_gian_tao": "2024-01-10T08:00:00.000Z",
    "thoi_gian_cap_nhat": "2024-01-15T14:30:00.000Z",
    "thu_vien_danh_muc": {
      "id": "uuid",
      "ten": "Lịch sử địa phương"
    },
    "thu_vien_tai_lieu_file": [
      {
        "id": "uuid",
        "ten_file": "Lich_su_TNP.pdf",
        "duong_dan": "/uploads/thu-vien/2024/01/file.pdf",
        "kich_thuoc_mb": 8.39,
        "dinh_dang": "application/pdf"
      }
    ],
    "thu_vien_tai_lieu_media": [
      {
        "id": "uuid",
        "loai": "IMAGE",
        "ten_file_goc": "anh_bia.jpg",
        "url": "/uploads/thu-vien/2024/01/anh_bia.jpg",
        "kich_thuoc": 204800,
        "mime_type": "image/jpeg"
      },
      {
        "id": "uuid",
        "loai": "VIDEO",
        "ten_file_goc": "phong_su.mp4",
        "url": "/uploads/thu-vien/2024/01/phong_su.mp4",
        "kich_thuoc": 52428800,
        "mime_type": "video/mp4"
      }
    ],
    "thu_vien_tai_lieu_tag": [
      { "thu_vien_tag": { "id": "uuid", "ten": "lịch sử" } }
    ]
  }
}
```

---

### 1.3. Tạo mới

```
POST /tai-lieu-van-hoa
Content-Type: multipart/form-data
```

| Field | Type | Required | Ghi chú |
|-------|------|----------|---------|
| `tieuDe` | text | **Có** | Tiêu đề (max 255 ký tự) |
| `tenDiTich` | text | Không | Tên di tích |
| `diaChi` | text | Không | Địa chỉ (max 500) |
| `idDanhMuc` | text | Không | UUID của danh mục (lấy từ API sub-categories) |
| `ngayBanHanh` | text | Không | `"2024-01-15"` |
| `phamVi` | text | Không | `CONG_KHAI` (mặc định) / `NOI_BO` / `HAN_CHE` |
| `moTa` | text | Không | Mô tả |
| `tags` | text | Không | JSON string: `["tag1","tag2"]` hoặc `"tag1,tag2"` |
| `file` | file | Không | PDF/DOC/DOCX (max 50MB) |
| `images` | file[] | Không | JPEG/PNG/GIF/WebP (max 10 file, mỗi file 10MB) |
| `videos` | file[] | Không | MP4/MPEG/MOV (max 5 file, mỗi file 200MB) |

**Response:** Giống response chi tiết ở 1.2

---

### 1.4. Cập nhật

```
PUT /tai-lieu-van-hoa/{id}
Content-Type: multipart/form-data
```

Giống form tạo mới, nhưng **tất cả field đều optional**. Chỉ gửi field cần sửa.

---

### 1.5. Xóa

```
DELETE /tai-lieu-van-hoa/{id}
```

**Response:**
```json
{ "success": true, "data": null, "message": "Xóa tài liệu thành công" }
```

> ⚠️ Không xóa được tài liệu đã duyệt (`DA_DUYET`).

---

### 1.6. Cập nhật trạng thái

```
PUT /tai-lieu-van-hoa/update-status/{id}
Content-Type: application/json
```

**Request:**
```json
{ "trangThai": "DA_DUYET" }
```

**Các giá trị:** `NHAP` → `CHO_DUYET` → `DA_DUYET` → `LUU_TRU`

---

### 1.7. Đồng bộ AI

```
POST /tai-lieu-van-hoa/ai-learn/{id}
Content-Type: application/json
```

**Request:**
```json
{ "action": "learn" }
```

**action:** `learn` hoặc `unlearn`

---

### 1.8. Thống kê

```
GET /tai-lieu-van-hoa/statistics
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 120,
    "pending": 15,
    "approved": 98,
    "revoked": 7,
    "aiLearned": 80,
    "totalViews": 45000,
    "totalDownloads": 12000
  }
}
```

---

### 1.9. Danh sách tiểu mục

```
GET /tai-lieu-van-hoa/sub-categories
```

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "name": "Lịch sử địa phương", "sortOrder": 1, "documentCount": 45 },
    { "id": "uuid", "name": "Di tích lịch sử", "sortOrder": 2, "documentCount": 30 },
    { "id": "uuid", "name": "Văn hóa truyền thống", "sortOrder": 3, "documentCount": 25 }
  ]
}
```

---

### 1.10. Download

```
GET /tai-lieu-van-hoa/{id}/download
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "fileUrl": "/uploads/thu-vien/2024/01/file.pdf",
    "fileName": "Lich_su_TNP.pdf",
    "fileSize": 8.39
  }
}
```

> FE dùng `fileUrl` để tạo link `<a href="fileUrl" download>`.

---

### 1.11. Xóa media

```
DELETE /tai-lieu-van-hoa/{id}/media/{mediaId}
```

---

## 2. PHÁP LUẬT (`/tai-lieu-phap-luat`)

Các API giống Văn hóa, chỉ khác về request/response fields.

### 2.1. Lấy danh sách

```
GET /tai-lieu-phap-luat/paging?page=1&size=10
```

**Params:** Giống Văn hóa, thêm:
- `coQuanBanHanh` — lọc theo cơ quan ban hành

**Response:** Giống, nhưng có thêm field:
```json
{
  "so_hieu": "104/2022/NĐ-CP",
  "co_quan_ban_hanh": "Chính phủ",
  "ngay_hieu_luc": "2023-01-15T00:00:00.000Z",
  "ngay_het_han": null
}
```

---

### 2.2. Tạo mới

```
POST /tai-lieu-phap-luat
Content-Type: multipart/form-data
```

| Field | Type | Required | Ghi chú |
|-------|------|----------|---------|
| `soHieu` | text | **Có** | Số hiệu văn bản, VD: `104/2022/NĐ-CP` |
| `tieuDe` | text | **Có** | Tiêu đề (max 255) |
| `idDanhMuc` | text | **Có** | UUID loại văn bản (lấy từ API doc-types) |
| `coQuanBanHanh` | text | **Có** | Cơ quan ban hành (max 255) |
| `ngayBanHanh` | text | **Có** | `"2024-01-15"` |
| `ngayHieuLuc` | text | Không | Ngày hiệu lực |
| `ngayHetHan` | text | Không | Ngày hết hạn |
| `phamVi` | text | Không | `CONG_KHAI` / `NOI_BO` / `HAN_CHE` |
| `moTa` | text | Không | Tóm tắt nội dung |
| `tags` | text | Không | JSON string |
| `file` | file | Không | PDF/DOC/DOCX (max 50MB) |

> ⚠️ Pháp luật **không có** images/videos.

---

### 2.3. Danh sách loại văn bản (doc-types)

```
GET /tai-lieu-phap-luat/doc-types
```

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "name": "Nghị định", "sortOrder": 1, "documentCount": 55 },
    { "id": "uuid", "name": "Quyết định", "sortOrder": 2, "documentCount": 60 }
  ]
}
```

---

### 2.4. Danh sách cơ quan ban hành

```
GET /tai-lieu-phap-luat/issuing-agencies
```

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": "Chính phủ", "name": "Chính phủ", "documentCount": 80 },
    { "id": "UBND Thành phố", "name": "UBND Thành phố", "documentCount": 50 }
  ]
}
```

---

## 3. CÁC API DÙNG CHUNG

### 3.1. Thống kê

```
GET /tai-lieu-phap-luat/statistics
```

Response giống Văn hóa (1.8).

### 3.2. Download

```
GET /tai-lieu-phap-luat/{id}/download
```

Response giống Văn hóa (1.10).

---

## 4. TỔNG KẾT NHANH

### Endpoint map

| Mục đích | Method | Endpoint | Body |
|----------|--------|----------|------|
| Danh sách | `GET` | `/tai-lieu-van-hoa/paging` | Query params |
| Chi tiết | `GET` | `/tai-lieu-van-hoa/{id}` | — |
| Tạo mới | `POST` | `/tai-lieu-van-hoa` | `multipart/form-data` |
| Cập nhật | `PUT` | `/tai-lieu-van-hoa/{id}` | `multipart/form-data` |
| Xóa | `DELETE` | `/tai-lieu-van-hoa/{id}` | — |
| Đổi trạng thái | `PUT` | `/tai-lieu-van-hoa/update-status/{id}` | `{ "trangThai": "..." }` |
| Đồng bộ AI | `POST` | `/tai-lieu-van-hoa/ai-learn/{id}` | `{ "action": "learn" }` |
| Thống kê | `GET` | `/tai-lieu-van-hoa/statistics` | — |
| Danh mục con | `GET` | `/tai-lieu-van-hoa/sub-categories` | — |
| Download | `GET` | `/tai-lieu-van-hoa/{id}/download` | — |
| Xóa media | `DELETE` | `/tai-lieu-van-hoa/{id}/media/{mediaId}` | — |

Thay `tai-lieu-van-hoa` bằng `tai-lieu-phap-luat` cho API Pháp luật, riêng:
- `sub-categories` → `doc-types` (loại văn bản)
- Thêm `issuing-agencies` (cơ quan ban hành)

### Enum quan trọng

| Field | Giá trị |
|-------|---------|
| `trangThai` | `NHAP` → `CHO_DUYET` → `DA_DUYET` → `LUU_TRU` |
| `phamVi` | `CONG_KHAI` / `NOI_BO` / `HAN_CHE` |
| `action` (AI) | `learn` / `unlearn` |
| `loai` (media) | `IMAGE` / `VIDEO` |