# API Tài liệu văn hóa — lịch sử

> Dùng chung controller/service `thu-vien` với field `loai = "VAN_HOA"`.
> DB dùng bảng `thu_vien_tai_lieu` (unified — chứa SACH, TAI_LIEU, VAN_BAN, BAN_DO, PHAP_LUAT, VAN_HOA).

## Base URL

```
{REACT_APP_API_URL}/api/tai-lieu-van-hoa
```

## Authentication

Tất cả API đều cần header:
```
Authorization: Bearer <token>
```

---

## 1. Tạo tài liệu mới

### `POST /api/tai-lieu-van-hoa`

**Content-Type:** `multipart/form-data`

### Request fields

| Field | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `tieuDe` | string | ✅ | Tiêu đề tài liệu (max 255 ký tự) |
| `tenDiTich` | string | ❌ | Tên di tích |
| `diaChi` | string | ❌ | Địa chỉ (max 500 ký tự) |
| `idDanhMuc` | string | ❌ | UUID của phân nhóm (sub-category) |
| `ngayBanHanh` | string | ❌ | Ngày ban hành, định dạng `yyyy-MM-dd` (vd: `2025-06-15`) |
| `phamVi` | enum | ❌ | Phạm vi: `CONG_KHAI` / `NOI_BO` / `HAN_CHE` (mặc định: `CONG_KHAI`) |
| `moTa` | string | ❌ | Mô tả tài liệu |
| `noiDung` | string | ❌ | Nội dung HTML từ ReactQuill (rich text) |
| `tags` | string | ❌ | JSON string array: `["tag1","tag2"]` hoặc chuỗi phân cách dấu phẩy: `"tag1,tag2"` |
| `file` | file | ❌ | File tài liệu (PDF / DOC / DOCX, max 50MB) |
| `images` | file[] | ❌ | Danh sách ảnh (JPEG/PNG/GIF/WebP, mỗi ảnh max 10MB, tối đa 10 file). Gửi nhiều field cùng tên `images` |
| `images` | file[] | ❌ | Danh sách ảnh (JPEG/PNG/GIF/WebP, mỗi ảnh max 10MB, tối đa 10 file). Gửi nhiều field cùng tên `images` |
| `videos` | file[] | ❌ | Danh sách video (MP4/MPEG/MOV, mỗi video max 200MB, tối đa 5 file). Gửi nhiều field cùng tên `videos` |
| `trangThai` | string | ❌ | Trạng thái khi tạo: `NHAP` (lưu nháp) hoặc `CHO_DUYET` (chờ duyệt). Mặc định: `CHO_DUYET` |

### Response thành công (201)

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "loai": "VAN_HOA",
    "tieu_de": "Đình An Hội - Di tích lịch sử cấp thành phố",
    "ten_di_tich": "Đình An Hội",
    "dia_chi": "12 Nguyễn Huệ, Phường 7, Quận 1",
    "ngay_ban_hanh": "2025-06-15T00:00:00.000Z",
    "pham_vi": "CONG_KHAI",
    "mo_ta": "Đình An Hội được xây dựng vào năm 1850...",
    "noi_dung": "<p>Đình An Hội được xây dựng vào <strong>năm 1850</strong>.</p><p>Nơi đây ghi dấu nhiều sự kiện lịch sử quan trọng.</p>",
    "trang_thai": "CHO_DUYET",
    "ai_da_hoc": false,
    "luot_xem": 0,
    "so_luot_tai": 0,
    "thoi_gian_tao": "2025-06-15T10:30:00.000Z",
    "thoi_gian_cap_nhat": "2025-06-15T10:30:00.000Z",
    "ten_nguoi_tao": "Nguyễn Văn A",
    "ten_nguoi_cap_nhat": null,
    "thu_vien_danh_muc": {
      "id": "uuid",
      "ten": "Đình chùa"
    },
    "thu_vien_tai_lieu_file": [
      {
        "id": "uuid",
        "ten_file": "Tai_lieu.pdf",
        "duong_dan": "/uploads/thu-vien/2025/06/Tai_lieu.pdf",
        "kich_thuoc_mb": 8.39,
        "dinh_dang": "application/pdf"
      }
    ],
    "thu_vien_tai_lieu_media": [
      {
        "id": "uuid",
        "loai": "IMAGE",
        "ten_file_goc": "anh_bia.jpg",
        "url": "/uploads/thu-vien/2025/06/anh_bia.jpg",
        "kich_thuoc": 204800,
        "mime_type": "image/jpeg"
      }
    ],
    "thu_vien_tai_lieu_tag": [
      {
        "thu_vien_tag": { "id": "uuid", "ten": "lịch sử" }
      }
    ]
  },
  "message": "Tạo tài liệu thành công"
}
```

---

## 2. Cập nhật tài liệu

### `PUT /api/tai-lieu-van-hoa/{id}`

**Content-Type:** `multipart/form-data`

**Request fields:** Giống hệt với tạo mới, nhưng tất cả đều optional.
**Lưu ý:** Nếu không gửi `file` mới, file cũ vẫn được giữ lại. Nếu không gửi `images`/`videos` mới, media cũ vẫn được giữ lại.

---

## 3. Lấy danh sách (phân trang)

### `GET /api/tai-lieu-van-hoa/paging`

| Query param | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `page` | number | ✅ | Số trang (bắt đầu từ 1) |
| `size` | number | ✅ | Số lượng item mỗi trang |
| `search` | string | ❌ | Từ khóa tìm kiếm (tìm theo tiêu đề, mô tả, số hiệu) |
| `trangThai` | string | ❌ | Lọc theo trạng thái: `NHAP` / `CHO_DUYET` / `DA_DUYET` / `LUU_TRU` |
| `phamVi` | string | ❌ | Lọc theo phạm vi: `CONG_KHAI` / `NOI_BO` / `HAN_CHE` |
| `idDanhMuc` | UUID | ❌ | Lọc theo danh mục |
| `aiDaHoc` | boolean | ❌ | `true` / `false` — lọc tài liệu đã được AI học |
| `dateFrom` | date | ❌ | Lọc từ ngày ban hành (`yyyy-MM-dd`) |
| `dateTo` | date | ❌ | Lọc đến ngày ban hành (`yyyy-MM-dd`) |
| `sortBy` | string | ❌ | Sắp xếp theo: `thoi_gian_tao`, `tieu_de`, `ngay_ban_hanh`, `luot_xem`, `so_luot_tai` |
| `sortOrder` | string | ❌ | `asc` / `desc` (mặc định: `desc`) |

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "loai": "VAN_HOA",
      "tieu_de": "Đình An Hội - Di tích lịch sử cấp thành phố",
      "ten_di_tich": "Đình An Hội",
      "dia_chi": "12 Nguyễn Huệ, Phường 7, Quận 1",
      "ngay_ban_hanh": "2025-06-15T00:00:00.000Z",
      "pham_vi": "CONG_KHAI",
      "mo_ta": "Mô tả ngắn...",
      "trang_thai": "DA_DUYET",
      "ai_da_hoc": true,
      "luot_xem": 1250,
      "so_luot_tai": 340,
      "thoi_gian_tao": "2025-06-10T08:00:00.000Z",
      "thoi_gian_cap_nhat": "2025-06-15T14:30:00.000Z",
      "ten_nguoi_tao": "Nguyễn Văn A",
      "ten_nguoi_cap_nhat": "Trần Thị B",
      "thu_vien_danh_muc": {
        "id": "uuid",
        "ten": "Đình chùa"
      },
      "thu_vien_tai_lieu_file": [
        {
          "id": "uuid",
          "ten_file": "Tai_lieu.pdf",
          "duong_dan": "/uploads/thu-vien/2025/06/Tai_lieu.pdf",
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
  },
  "message": "Lấy danh sách tài liệu thành công"
}
```

> 📝 **Lưu ý:** Danh sách (`getAll`) không trả về `noi_dung` và `thu_vien_tai_lieu_media` để giảm tải. Xem chi tiết ở endpoint `getById`.
>
> 📝 **Lưu ý về nháp:** Tài liệu ở trạng thái `NHAP` (nháp) **chỉ hiển thị với người tạo** (`nguoi_tao`). Người dùng khác (kể cả có quyền phê duyệt/từ chối) sẽ không thấy tài liệu nháp trong danh sách và không thể xem chi tiết. Khi tài liệu được chuyển sang trạng thái khác (`CHO_DUYET`, `DA_DUYET`, ...) thì mới hiển thị bình thường.

---

## 4. Lấy chi tiết tài liệu

### `GET /api/tai-lieu-van-hoa/{id}`

### Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "loai": "VAN_HOA",
    "tieu_de": "Đình An Hội - Di tích lịch sử cấp thành phố",
    "ten_di_tich": "Đình An Hội",
    "dia_chi": "12 Nguyễn Huệ, Phường 7, Quận 1",
    "ngay_ban_hanh": "2025-06-15T00:00:00.000Z",
    "pham_vi": "CONG_KHAI",
    "mo_ta": "Mô tả ngắn...",
    "noi_dung": "<p>Đình An Hội được xây dựng vào <strong>năm 1850</strong>.</p><p>Nơi đây ghi dấu nhiều sự kiện lịch sử quan trọng.</p>",
    "trang_thai": "DA_DUYET",
    "ai_da_hoc": true,
    "luot_xem": 1250,
    "so_luot_tai": 340,
    "nguoi_duyet": "uuid",
    "thoi_gian_duyet": "2025-06-15T14:30:00.000Z",
    "thoi_gian_tao": "2025-06-10T08:00:00.000Z",
    "thoi_gian_cap_nhat": "2025-06-15T14:30:00.000Z",
    "ten_nguoi_tao": "Nguyễn Văn A",
    "ten_nguoi_cap_nhat": "Trần Thị B",
    "ten_nguoi_duyet": "Lê Văn C",
    "thu_vien_danh_muc": {
      "id": "uuid",
      "ten": "Đình chùa"
    },
    "thu_vien_tai_lieu_file": [
      {
        "id": "uuid",
        "ten_file": "Tai_lieu.pdf",
        "duong_dan": "/uploads/thu-vien/2025/06/Tai_lieu.pdf",
        "kich_thuoc_mb": 8.39,
        "dinh_dang": "application/pdf"
      }
    ],
    "thu_vien_tai_lieu_media": [
      {
        "id": "uuid",
        "loai": "IMAGE",
        "ten_file_goc": "anh_bia.jpg",
        "url": "/uploads/thu-vien/2025/06/anh_bia.jpg",
        "kich_thuoc": 204800,
        "mime_type": "image/jpeg"
      },
      {
        "id": "uuid",
        "loai": "VIDEO",
        "ten_file_goc": "phong_su.mp4",
        "url": "/uploads/thu-vien/2025/06/phong_su.mp4",
        "kich_thuoc": 52428800,
        "mime_type": "video/mp4"
      }
    ],
    "thu_vien_tai_lieu_tag": [
      { "thu_vien_tag": { "id": "uuid", "ten": "lịch sử" } }
    ]
  },
  "message": "Lấy chi tiết tài liệu thành công"
}
```

---

## 5. Xóa tài liệu

### `DELETE /api/tai-lieu-van-hoa/{id}`

> ⚠️ Không thể xóa tài liệu đã duyệt (`DA_DUYET`).

### Response

```json
{
  "success": true,
  "data": null,
  "message": "Xóa tài liệu thành công"
}
```

---

## 6. Cập nhật trạng thái

### `PUT /api/tai-lieu-van-hoa/update-status/{id}`

**Content-Type:** `application/json`

### Request

```json
{
  "trangThai": "DA_DUYET"
}
```

| Field | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `trangThai` | string | ✅ | `NHAP` (bản nháp) → `CHO_DUYET` (chờ duyệt) → `DA_DUYET` (đã duyệt) → `LUU_TRU` (lưu trữ) |

---

## 7. Phê duyệt tài liệu

### `PUT /api/tai-lieu-van-hoa/approve/{id}`

Chỉ duyệt được tài liệu đang ở trạng thái `CHO_DUYET`.

### Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Phê duyệt tài liệu thành công"
}
```

---

## 8. Từ chối tài liệu

### `PUT /api/tai-lieu-van-hoa/reject/{id}`

**Content-Type:** `application/json`

### Request

```json
{
  "lyDoTuChoi": "Thiếu thông tin di tích"
}
```

| Field | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `lyDoTuChoi` | string | ❌ | Lý do từ chối (max 500 ký tự) |

Từ chối sẽ đưa tài liệu về trạng thái `NHAP`.

---

## 9. Đồng bộ AI

### `POST /api/tai-lieu-van-hoa/ai-learn/{id}`

**Content-Type:** `application/json`

### Request

```json
{
  "action": "learn"
}
```

| Field | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `action` | string | ✅ | `learn` (học) hoặc `unlearn` (bỏ học) |

---

## 10. Thống kê

### `GET /api/tai-lieu-van-hoa/statistics`

### Response

```json
{
  "success": true,
  "data": {
    "total": 120,
    "approved": 98,
    "pending": 15,
    "revoked": 7,
    "aiLearned": 80,
    "totalViews": 45000,
    "totalDownloads": 12000
  },
  "message": "Lấy thống kê thành công"
}
```

---

## 11. Danh sách phân nhóm (sub-categories)

### `GET /api/tai-lieu-van-hoa/sub-categories`

### Response

```json
{
  "success": true,
  "data": [
    { "id": "uuid", "name": "Đình chùa", "sortOrder": 1, "documentCount": 10 },
    { "id": "uuid", "name": "Lịch sử địa phương", "sortOrder": 2, "documentCount": 45 }
  ],
  "message": "Lấy danh sách tiểu mục thành công"
}
```

---

## 12. Download tài liệu

### `GET /api/tai-lieu-van-hoa/{id}/download`

Trả về thông tin file để FE tạo link download.

### Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "fileUrl": "/uploads/thu-vien/2025/06/Tai_lieu.pdf",
    "fileName": "Tai_lieu.pdf",
    "fileSize": 8.39
  },
  "message": "Lấy thông tin tải xuống thành công"
}
```

> FE dùng `fileUrl` để tạo link `<a href="fileUrl" download>`.

---

## 13. Xóa media

### `DELETE /api/tai-lieu-van-hoa/{id}/media/{mediaId}`

Xóa mềm một ảnh/video đính kèm tài liệu.

### Response

```json
{
  "success": true,
  "data": null,
  "message": "Xóa media thành công"
}
```

---

## Tổng kết nhanh

### Endpoint map

| Mục đích | Method | Endpoint | Body |
|---|---|---|---|
| Danh sách | `GET` | `/tai-lieu-van-hoa/paging` | Query params |
| Chi tiết | `GET` | `/tai-lieu-van-hoa/{id}` | — |
| Tạo mới | `POST` | `/tai-lieu-van-hoa` | `multipart/form-data` |
| Cập nhật | `PUT` | `/tai-lieu-van-hoa/{id}` | `multipart/form-data` |
| Xóa | `DELETE` | `/tai-lieu-van-hoa/{id}` | — |
| Đổi trạng thái | `PUT` | `/tai-lieu-van-hoa/update-status/{id}` | `{ "trangThai": "..." }` |
| Phê duyệt | `PUT` | `/tai-lieu-van-hoa/approve/{id}` | — |
| Từ chối | `PUT` | `/tai-lieu-van-hoa/reject/{id}` | `{ "lyDoTuChoi": "..." }` |
| Đồng bộ AI | `POST` | `/tai-lieu-van-hoa/ai-learn/{id}` | `{ "action": "learn" }` |
| Thống kê | `GET` | `/tai-lieu-van-hoa/statistics` | — |
| Danh mục con | `GET` | `/tai-lieu-van-hoa/sub-categories` | — |
| Download | `GET` | `/tai-lieu-van-hoa/{id}/download` | — |
| Xóa media | `DELETE` | `/tai-lieu-van-hoa/{id}/media/{mediaId}` | — |

### Enum quan trọng

| Field | Giá trị |
|---|---|
| `trangThai` | `NHAP` → `CHO_DUYET` → `DA_DUYET` → `LUU_TRU` |
| `phamVi` | `CONG_KHAI` / `NOI_BO` / `HAN_CHE` |
| `action` (AI) | `learn` / `unlearn` |
| `loai` (media) | `IMAGE` / `VIDEO` |