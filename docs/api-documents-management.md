# API Design — Quản lý Tài liệu (Thư viện) — Document Management

> Dành cho trang `/admin/documents/history` (Văn hóa) và `/admin/documents/legal` (Pháp luật)

---

## Tổng quan

Hai trang có cấu trúc gần giống nhau, chỉ khác loại tài liệu:

| Trang | Loại | API Base Path |
|-------|------|---------------|
| Văn hóa - Lịch sử | `VAN_HOA` | `{{BASE_URL}}/api/tai-lieu-van-hoa` |
| Quy phạm pháp luật | `PHAP_LUAT` | `{{BASE_URL}}/api/tai-lieu-phap-luat` |

**Base URL:** `http://localhost:8880/`

---

## 1. Cấu trúc response chung

```json
{
  "success": true,
  "data": { ... },
  "message": "Thành công"
}
```

Lỗi:
```json
{
  "success": false,
  "data": null,
  "message": "Mô tả lỗi chi tiết"
}
```

Phân trang:
```json
{
  "success": true,
  "data": [ ... ],
  "message": "Thành công",
  "pagination": {
    "currentPage": 1,
    "pageSize": 10,
    "totalPages": 5,
    "totalItems": 50
  }
}
```

---

## 2. Các enum / hằng số

### 2.1. Trạng thái tài liệu (`trangThai`)

| Giá trị | Mô tả | Ý nghĩa FE |
|---------|-------|------------|
| `NHAP` | Bản nháp | `warning` / màu cam |
| `CHO_DUYET` | Chờ duyệt | `processing` / màu xanh dương |
| `DA_DUYET` | Đã duyệt | `success` / màu xanh lá |
| `LUU_TRU` | Lưu trữ | `default` / màu xám |

### 2.2. Phạm vi bảo mật (`phamVi`)

| Giá trị | Mô tả |
|---------|-------|
| `CONG_KHAI` | Công khai — hiển thị cho công dân |
| `NOI_BO` | Nội bộ — chỉ admin |
| `HAN_CHE` | Hạn chế |

### 2.3. Loại media

| Giá trị | Mô tả |
|---------|-------|
| `IMAGE` | Ảnh |
| `VIDEO` | Video |

---

## 3. API cho Tài liệu Văn hóa (`/api/tai-lieu-van-hoa`)

### 3A. Lấy danh sách (phân trang)

**GET** `/api/tai-lieu-van-hoa/paging`

**Headers:** `Authorization: Bearer <token>`

**Query params:**

| Param | Type | Required | Default | Mô tả |
|-------|------|----------|---------|-------|
| `page` | number | No | 1 | Trang hiện tại |
| `size` | number | No | 10 | Số bản ghi mỗi trang |
| `search` | string | No | — | Tìm theo tiêu đề, mô tả |
| `idDanhMuc` | UUID | No | — | Lọc theo danh mục |
| `trangThai` | enum | No | — | `NHAP`, `CHO_DUYET`, `DA_DUYET`, `LUU_TRU` |
| `phamVi` | enum | No | — | `CONG_KHAI`, `NOI_BO`, `HAN_CHE` |
| `aiDaHoc` | boolean | No | — | `true` / `false` |
| `dateFrom` | date | No | — | Từ ngày ban hành |
| `dateTo` | date | No | — | Đến ngày ban hành |
| `sortBy` | string | No | `thoi_gian_tao` | `thoi_gian_tao`, `tieu_de`, `ngay_ban_hanh`, `luot_xem`, `so_luot_tai` |
| `sortOrder` | string | No | `desc` | `asc` / `desc` |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "loai": "VAN_HOA",
      "tieu_de": "Lịch sử hình thành và phát triển Phường Tăng Nhơn Phú",
      "so_hieu": null,
      "ten_di_tich": "UBND Phường Tăng Nhơn Phú",
      "dia_chi": "Số 10 Đường số 4, Khu phố 2, Phường Tăng Nhơn Phú",
      "ngay_ban_hanh": "2023-01-15T00:00:00.000Z",
      "trang_thai": "DA_DUYET",
      "pham_vi": "CONG_KHAI",
      "mo_ta": "Tài liệu tổng quan về lịch sử...",
      "ai_da_hoc": true,
      "thoi_gian_ai_hoc": "2023-01-16T09:00:00.000Z",
      "luot_xem": 1250,
      "so_luot_tai": 340,
      "co_quan_ban_hanh": null,
      "ngay_hieu_luc": null,
      "ngay_het_han": null,
      "nguoi_tao": "uuid",
      "nguoi_cap_nhat": null,
      "nguoi_duyet": null,
      "thoi_gian_duyet": null,
      "thoi_gian_tao": "2023-01-10T08:00:00.000Z",
      "thoi_gian_cap_nhat": "2023-01-15T14:30:00.000Z",
      "is_active": true,
      "is_delete": false,
      "thu_vien_danh_muc": {
        "id": "uuid",
        "ten": "Lịch sử địa phương"
      },
      "thu_vien_tai_lieu_file": [
        {
          "id": "uuid",
          "ten_file": "Lich_su_TNP.pdf",
          "duong_dan": "/uploads/thu-vien/.../file.pdf",
          "kich_thuoc_mb": 8.39,
          "dinh_dang": "application/pdf"
        }
      ],
      "thu_vien_tai_lieu_tag": [
        {
          "thu_vien_tag": {
            "id": "uuid",
            "ten": "lịch sử"
          }
        }
      ],
      "_count": {
        "thu_vien_tai_lieu_media": 3
      }
    }
  ],
  "message": "Lấy danh sách tài liệu thành công",
  "pagination": {
    "currentPage": 1,
    "pageSize": 10,
    "totalPages": 5,
    "totalItems": 50
  }
}
```

> **Lưu ý:** Response trả về raw snake_case từ Prisma. FE cần map sang camelCase nếu muốn dùng trực tiếp.

---

### 3B. Lấy chi tiết tài liệu

**GET** `/api/tai-lieu-van-hoa/{id}`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "loai": "VAN_HOA",
    "tieu_de": "Lịch sử hình thành và phát triển Phường Tăng Nhơn Phú",
    "so_hieu": null,
    "ten_di_tich": "UBND Phường Tăng Nhơn Phú",
    "dia_chi": "Số 10 Đường số 4, Khu phố 2, Phường Tăng Nhơn Phú",
    "ngay_ban_hanh": "2023-01-15T00:00:00.000Z",
    "trang_thai": "DA_DUYET",
    "pham_vi": "CONG_KHAI",
    "mo_ta": "Tài liệu tổng quan về lịch sử...",
    "ai_da_hoc": true,
    "thoi_gian_ai_hoc": "2023-01-16T09:00:00.000Z",
    "luot_xem": 1250,
    "so_luot_tai": 340,
    "co_quan_ban_hanh": null,
    "ngay_hieu_luc": null,
    "ngay_het_han": null,
    "nguoi_tao": "uuid",
    "nguoi_cap_nhat": null,
    "nguoi_duyet": null,
    "thoi_gian_duyet": null,
    "thoi_gian_tao": "2023-01-10T08:00:00.000Z",
    "thoi_gian_cap_nhat": "2023-01-15T14:30:00.000Z",
    "is_active": true,
    "is_delete": false,
    "thu_vien_danh_muc": {
      "id": "uuid",
      "ten": "Lịch sử địa phương"
    },
    "thu_vien_tai_lieu_file": [
      {
        "id": "uuid",
        "ten_file": "Lich_su_TNP.pdf",
        "duong_dan": "/uploads/thu-vien/.../file.pdf",
        "kich_thuoc_mb": 8.39,
        "dinh_dang": "application/pdf"
      }
    ],
    "thu_vien_tai_lieu_media": [
      {
        "id": "uuid",
        "loai": "IMAGE",
        "ten_file_goc": "anh_bia.jpg",
        "url": "/uploads/thu-vien/.../anh_bia.jpg",
        "kich_thuoc": 204800,
        "mime_type": "image/jpeg"
      },
      {
        "id": "uuid",
        "loai": "VIDEO",
        "ten_file_goc": "phong_su.mp4",
        "url": "/uploads/thu-vien/.../phong_su.mp4",
        "kich_thuoc": 52428800,
        "mime_type": "video/mp4"
      }
    ],
    "thu_vien_tai_lieu_tag": [
      {
        "thu_vien_tag": {
          "id": "uuid",
          "ten": "lịch sử"
        }
      }
    ]
  },
  "message": "Lấy chi tiết tài liệu thành công"
}
```

**Response (404):**
```json
{
  "success": false,
  "data": null,
  "message": "Không tìm thấy tài liệu"
}
```

---

### 3C. Tạo mới tài liệu

**POST** `/api/tai-lieu-van-hoa`

**Headers:** `Authorization: Bearer <token>`

**Request (multipart/form-data):**

| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| `tieuDe` | string | **Có** | Tiêu đề tài liệu (max 255) |
| `tenDiTich` | string | Không | Tên di tích |
| `diaChi` | string | Không | Địa chỉ (max 500) |
| `idDanhMuc` | UUID | Không | ID danh mục / tiểu mục |
| `ngayBanHanh` | date | Không | Ngày ban hành |
| `phamVi` | enum | Không | `CONG_KHAI` (mặc định), `NOI_BO`, `HAN_CHE` |
| `moTa` | string | Không | Mô tả tóm tắt |
| `tags` | string | Không | Gửi dạng JSON string array `["tag1","tag2"]` hoặc comma-separated `"tag1,tag2"` |
| `file` | file | Không | File tài liệu (PDF, DOC, DOCX) — max 50MB |
| `images` | file[] | Không | Danh sách ảnh (tối đa 10 file, mỗi file max 10MB) |
| `videos` | file[] | Không | Danh sách video (tối đa 5 file, mỗi file max 200MB) |

**Response (201):**
```json
{
  "success": true,
  "data": { /* chi tiết tài liệu, giống 3B */ },
  "message": "Tạo tài liệu thành công"
}
```

---

### 3D. Cập nhật tài liệu

**PUT** `/api/tai-lieu-van-hoa/{id}`

**Headers:** `Authorization: Bearer <token>`

**Request (multipart/form-data):** Tương tự Create, tất cả field đều **optional**. Nếu không gửi file mới → giữ file cũ.

**Response (200):**
```json
{
  "success": true,
  "data": { /* chi tiết tài liệu sau khi cập nhật */ },
  "message": "Cập nhật tài liệu thành công"
}
```

---

### 3E. Xóa tài liệu

**DELETE** `/api/tai-lieu-van-hoa/{id}`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Xóa tài liệu thành công"
}
```

**Lưu ý:** Không thể xóa tài liệu đã duyệt (`DA_DUYET`). Xóa mềm (soft delete).

---

### 3F. Cập nhật trạng thái

**PUT** `/api/tai-lieu-van-hoa/update-status/{id}`

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "trangThai": "DA_DUYET"
}
```

| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| `trangThai` | enum | **Có** | `NHAP`, `CHO_DUYET`, `DA_DUYET`, `LUU_TRU` |

**Response (200):**
```json
{
  "success": true,
  "data": { /* chi tiết tài liệu sau cập nhật */ },
  "message": "Cập nhật trạng thái thành công"
}
```

---

### 3G. Đồng bộ AI

**POST** `/api/tai-lieu-van-hoa/ai-learn/{id}`

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "action": "learn"
}
```

| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| `action` | enum | **Có** | `learn` (học) hoặc `unlearn` (bỏ học) |

**Response (200):**
```json
{
  "success": true,
  "data": { /* chi tiết tài liệu sau cập nhật */ },
  "message": "Đồng bộ AI thành công"
}
```

---

### 3H. Thống kê (KPI Cards)

**GET** `/api/tai-lieu-van-hoa/statistics`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
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
  },
  "message": "Lấy thống kê thành công"
}
```

---

### 3I. Danh sách tiểu mục (danh mục)

**GET** `/api/tai-lieu-van-hoa/sub-categories`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Lịch sử địa phương",
      "sortOrder": 1,
      "documentCount": 45
    }
  ],
  "message": "Lấy danh sách tiểu mục thành công"
}
```

---

### 3J. Download tài liệu

**GET** `/api/tai-lieu-van-hoa/{id}/download`

**Headers:** `Authorization: Bearer <token>`

**Response (200):** Trả về JSON chứa thông tin file để FE xử lý download:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "fileUrl": "/uploads/thu-vien/.../file.pdf",
    "fileName": "Lich_su_TNP.pdf",
    "fileSize": 8.39
  },
  "message": "Lấy thông tin tải xuống thành công"
}
```

> **Ghi chú:** FE cần dùng `fileUrl` để tạo link download. API này tự động tăng `so_luot_tai`.

---

### 3K. Xóa media (ảnh/video đính kèm)

**DELETE** `/api/tai-lieu-van-hoa/{id}/media/{mediaId}`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Xóa media thành công"
}
```

---

## 4. API cho Tài liệu Pháp luật (`/api/tai-lieu-phap-luat`)

### 4A. Lấy danh sách (phân trang)

**GET** `/api/tai-lieu-phap-luat/paging`

**Headers:** `Authorization: Bearer <token>`

**Query params:** Giống 3A, thêm:
| Param | Type | Required | Default | Mô tả |
|-------|------|----------|---------|-------|
| `coQuanBanHanh` | string | No | — | Lọc theo cơ quan ban hành |

**Response (200):** Cấu trúc giống 3A, nhưng có thêm các field pháp luật:
```json
{
  "so_hieu": "104/2022/NĐ-CP",
  "co_quan_ban_hanh": "Chính phủ",
  "ngay_hieu_luc": "2023-01-15T00:00:00.000Z",
  "ngay_het_han": null
}
```

---

### 4B. Lấy chi tiết

**GET** `/api/tai-lieu-phap-luat/{id}`

**Headers:** `Authorization: Bearer <token>`

---

### 4C. Tạo mới

**POST** `/api/tai-lieu-phap-luat`

**Headers:** `Authorization: Bearer <token>`

**Request (multipart/form-data):**

| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| `soHieu` | string | **Có** | Số hiệu văn bản (VD: `104/2022/NĐ-CP`) |
| `tieuDe` | string | **Có** | Tiêu đề văn bản (max 255) |
| `idDanhMuc` | UUID | **Có** | ID loại văn bản (VD: Nghị định, Quyết định...) |
| `coQuanBanHanh` | string | **Có** | Cơ quan ban hành (max 255) |
| `ngayBanHanh` | date | **Có** | Ngày ban hành |
| `ngayHieuLuc` | date | Không | Ngày hiệu lực |
| `ngayHetHan` | date | Không | Ngày hết hạn |
| `phamVi` | enum | Không | `CONG_KHAI` (mặc định), `NOI_BO`, `HAN_CHE` |
| `moTa` | string | Không | Mô tả / tóm tắt nội dung |
| `tags` | string | Không | JSON string array hoặc comma-separated |
| `file` | file | Không | File tài liệu (PDF, DOC, DOCX) — max 50MB |

> **Lưu ý:** Pháp luật **không** có images/videos.

---

### 4D. Cập nhật

**PUT** `/api/tai-lieu-phap-luat/{id}`

**Headers:** `Authorization: Bearer <token>` — Tất cả field đều optional.

---

### 4E. Xóa

**DELETE** `/api/tai-lieu-phap-luat/{id}`

**Headers:** `Authorization: Bearer <token>`

---

### 4F. Cập nhật trạng thái

**PUT** `/api/tai-lieu-phap-luat/update-status/{id}`

**Headers:** `Authorization: Bearer <token>`

---

### 4G. Đồng bộ AI

**POST** `/api/tai-lieu-phap-luat/ai-learn/{id}`

**Headers:** `Authorization: Bearer <token>`

---

### 4H. Thống kê

**GET** `/api/tai-lieu-phap-luat/statistics`

**Headers:** `Authorization: Bearer <token>`

---

### 4I. Danh sách loại văn bản (doc types)

**GET** `/api/tai-lieu-phap-luat/doc-types`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Nghị định",
      "sortOrder": 1,
      "documentCount": 55
    }
  ],
  "message": "Lấy danh sách loại văn bản thành công"
}
```

---

### 4J. Danh sách cơ quan ban hành

**GET** `/api/tai-lieu-phap-luat/issuing-agencies`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "Chính phủ",
      "name": "Chính phủ",
      "documentCount": 80
    }
  ],
  "message": "Lấy danh sách cơ quan ban hành thành công"
}
```

> **Lưu ý:** `id` chính là tên cơ quan ban hành.

---

### 4K. Download

**GET** `/api/tai-lieu-phap-luat/{id}/download`

**Headers:** `Authorization: Bearer <token>`

---

## 5. Danh sách API đầy đủ

### Tài liệu Văn hóa (`/api/tai-lieu-van-hoa`)

| # | Method | Endpoint | Mô tả | Permission |
|---|--------|----------|-------|-----------|
| 1 | GET | `/paging` | Danh sách (phân trang, lọc, sort) | `TL_GET_ALL` |
| 2 | GET | `/{id}` | Chi tiết | `TL_GET_DETAIL` |
| 3 | POST | `/` | Tạo mới (multipart) | `TL_CREATE` |
| 4 | PUT | `/{id}` | Cập nhật (multipart) | `TL_UPDATE` |
| 5 | DELETE | `/{id}` | Xóa mềm | `TL_DELETE` |
| 6 | PUT | `/update-status/{id}` | Cập nhật trạng thái | `TL_UPDATE_STATUS` |
| 7 | POST | `/ai-learn/{id}` | Đồng bộ AI | `TL_AI_LEARN` |
| 8 | GET | `/statistics` | Thống kê KPI | — |
| 9 | GET | `/sub-categories` | Danh sách tiểu mục | — |
| 10 | GET | `/{id}/download` | Download file | `TL_DOWNLOAD` |
| 11 | DELETE | `/{id}/media/{mediaId}` | Xóa media đính kèm | `TL_DELETE` |

### Tài liệu Pháp luật (`/api/tai-lieu-phap-luat`)

| # | Method | Endpoint | Mô tả | Permission |
|---|--------|----------|-------|-----------|
| 1 | GET | `/paging` | Danh sách (phân trang, lọc, sort) | `TL_GET_ALL` |
| 2 | GET | `/{id}` | Chi tiết | `TL_GET_DETAIL` |
| 3 | POST | `/` | Tạo mới (multipart) | `TL_CREATE` |
| 4 | PUT | `/{id}` | Cập nhật (multipart) | `TL_UPDATE` |
| 5 | DELETE | `/{id}` | Xóa mềm | `TL_DELETE` |
| 6 | PUT | `/update-status/{id}` | Cập nhật trạng thái | `TL_UPDATE_STATUS` |
| 7 | POST | `/ai-learn/{id}` | Đồng bộ AI | `TL_AI_LEARN` |
| 8 | GET | `/statistics` | Thống kê KPI | — |
| 9 | GET | `/doc-types` | Danh sách loại văn bản | — |
| 10 | GET | `/issuing-agencies` | Danh sách cơ quan ban hành | — |
| 11 | GET | `/{id}/download` | Download file | `TL_DOWNLOAD` |

---

## 6. Các điểm khác biệt quan trọng so với docs cũ

| Nội dung | Docs cũ | Thực tế |
|----------|---------|---------|
| Tên field request | `title`, `docNumber`, `relicName`... | `tieuDe`, `soHieu`, `tenDiTich`... |
| Trạng thái | `Đã duyệt`, `Chờ duyệt`, `Đã thu hồi` | `DA_DUYET`, `CHO_DUYET`, `NHAP`, `LUU_TRU` |
| Mức bảo mật | `Công khai`, `Nội bộ` | `CONG_KHAI`, `NOI_BO`, `HAN_CHE` |
| Danh mục / loại VB | Gửi bằng tên string | Gửi bằng UUID (`idDanhMuc`) |
| Tags | `string[]` | JSON string hoặc comma-separated string |
| Response | camelCase, gọn | snake_case, raw từ Prisma |
| Download | Trả file stream | Trả JSON chứa thông tin file |
| Export Excel | Có trong docs | Chưa implement |
| Upload tạm | Có trong docs | Chưa implement |
| Upload file riêng lẻ | Có trong docs | Chưa implement |
| Media | Tách riêng images/videos | Gộp chung bảng, phân biệt bằng `loai: IMAGE/VIDEO` |

---

## 7. Ghi chú cho FE

1. **Tất cả API đều yêu cầu** `Authorization: Bearer <token>` (JWT).
2. **Request dạng multipart/form-data** cho create/update — gửi field text + file trong cùng form.
3. **Tags:** Gửi dạng JSON string: `["tag1","tag2"]` hoặc comma-separated: `"tag1,tag2"`.
4. **Response snake_case:** Hiện tại BE trả raw snake_case. FE có thể tự map sang camelCase nếu cần.
5. **Media (Văn hóa):** Lấy chi tiết mới có media. Danh sách chỉ có `_count.thu_vien_tai_lieu_media`.
6. **Download:** Nhận JSON chứa `fileUrl`, FE tự tạo `<a href="fileUrl" download>`.
7. **View count:** Chưa có API riêng để increment view count — cần BE bổ sung sau nếu cần.
8. **Phân quyền:** Sync permission `TL_*` trước khi dùng: `POST /api/permission/sync`.