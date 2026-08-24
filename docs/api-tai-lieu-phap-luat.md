# API Tài liệu quy phạm pháp luật

> Dùng chung controller/service `thu-vien` với field `loai = "PHAP_LUAT"`.
> DB dùng bảng `thu_vien_tai_lieu` (unified — chứa SACH, TAI_LIEU, VAN_BAN, BAN_DO, PHAP_LUAT, VAN_HOA).

## Base URL

```
{REACT_APP_API_URL}/api/tai-lieu-phap-luat
```

## Authentication

Tất cả API đều cần header:
```
Authorization: Bearer <token>
```

---

## 1. Tạo tài liệu mới

### `POST /api/tai-lieu-phap-luat`

**Content-Type:** `multipart/form-data`

### Request fields

| Field | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `soHieu` | string | ✅ | Số hiệu văn bản (max 100 ký tự). VD: `"12/2025/QĐ-UBND"` |
| `tieuDe` | string | ✅ | Tiêu đề văn bản (max 255 ký tự) |
| `idDanhMuc` | UUID | ✅ | UUID của loại văn bản (danh mục). VD: luật, nghị định, thông tư,... |
| `coQuanBanHanh` | string | ✅ | Cơ quan ban hành (max 255 ký tự). VD: `"UBND Thành phố Hồ Chí Minh"` |
| `ngayBanHanh` | date | ✅ | Ngày ban hành, định dạng `yyyy-MM-dd` (VD: `2025-06-15`) |
| `ngayHieuLuc` | date | ❌ | Ngày hiệu lực, định dạng `yyyy-MM-dd` |
| `ngayHetHan` | date | ❌ | Ngày hết hạn, định dạng `yyyy-MM-dd` |
| `phamVi` | enum | ❌ | Phạm vi: `CONG_KHAI` / `NOI_BO` / `HAN_CHE` (mặc định: `CONG_KHAI`) |
| `moTa` | string | ❌ | Mô tả văn bản (trích yếu nội dung) |
| `tags` | string | ❌ | JSON string array: `["tag1","tag2"]` hoặc chuỗi phân cách dấu phẩy: `"tag1,tag2"` |
| `file` | file | ✅ | File văn bản (PDF / DOC / DOCX, max 50MB) |
| `trangThai` | string | ❌ | Trạng thái khi tạo: `NHAP` (lưu nháp) hoặc `CHO_DUYET` (chờ duyệt). Mặc định: `CHO_DUYET` |

> **Khác với Văn hóa:** Pháp luật **không** có `images`, `videos`, `tenDiTich`, `diaChi`, `noiDung`. Thay vào đó có `soHieu`, `coQuanBanHanh`, `ngayHieuLuc`, `ngayHetHan`.

### Response thành công (201)

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "loai": "PHAP_LUAT",
    "tieu_de": "Quyết định về việc ban hành quy chế quản lý trật tự xây dựng",
    "so_hieu": "12/2025/QĐ-UBND",
    "co_quan_ban_hanh": "UBND Thành phố Hồ Chí Minh",
    "ngay_ban_hanh": "2025-06-15T00:00:00.000Z",
    "ngay_hieu_luc": "2025-07-01T00:00:00.000Z",
    "ngay_het_han": null,
    "pham_vi": "CONG_KHAI",
    "mo_ta": "Quyết định ban hành quy chế quản lý trật tự xây dựng trên địa bàn...",
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
      "ten": "Quyết định"
    },
    "thu_vien_tai_lieu_file": [
      {
        "id": "uuid",
        "ten_file": "QD-12-2025.pdf",
        "duong_dan": "/uploads/thu-vien/2025/06/QD-12-2025.pdf",
        "kich_thuoc_mb": 2.45,
        "dinh_dang": "application/pdf"
      }
    ],
    "thu_vien_tai_lieu_tag": [
      {
        "thu_vien_tag": { "id": "uuid", "ten": "trật tự xây dựng" }
      }
    ]
  },
  "message": "Tạo tài liệu thành công"
}
```

> **Lưu ý:** Pháp luật **không** có `thu_vien_tai_lieu_media` (ảnh/video) — mảng này sẽ không xuất hiện hoặc là mảng rỗng.

---

## 2. Cập nhật tài liệu

### `PUT /api/tai-lieu-phap-luat/{id}`

**Content-Type:** `multipart/form-data`

**Request fields:** Giống hệt với tạo mới, nhưng tất cả đều **optional** (trừ khi muốn thay đổi).

| Field | Ghi chú |
|---|---|
| `file` | Nếu gửi file mới → file cũ được giữ lại lịch sử, file mới là bản hiện tại |
| `tags` | Nếu gửi → ghi đè hoàn toàn danh sách tags cũ |

---

## 3. Lấy danh sách (phân trang)

### `GET /api/tai-lieu-phap-luat/paging`

**Quyền:** `TL_GET_ALL`

| Query param | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `page` | number | ❌ | Số trang (bắt đầu từ 1, mặc định: 1) |
| `size` | number | ❌ | Số lượng item mỗi trang (mặc định: 10) |
| `search` | string | ❌ | Từ khóa tìm kiếm (tìm theo tiêu đề, mô tả, số hiệu) |
| `trangThai` | string | ❌ | Lọc theo trạng thái: `NHAP` / `CHO_DUYET` / `DA_DUYET` / `LUU_TRU` |
| `phamVi` | string | ❌ | Lọc theo phạm vi: `CONG_KHAI` / `NOI_BO` / `HAN_CHE` |
| `idDanhMuc` | UUID | ❌ | Lọc theo loại văn bản (danh mục) |
| `aiDaHoc` | boolean | ❌ | `true` / `false` — lọc tài liệu đã được AI học |
| `dateFrom` | date | ❌ | Lọc từ ngày ban hành (`yyyy-MM-dd`) |
| `dateTo` | date | ❌ | Lọc đến ngày ban hành (`yyyy-MM-dd`) |
| `coQuanBanHanh` | string | ❌ | Lọc theo cơ quan ban hành |
| `sortBy` | string | ❌ | Sắp xếp theo: `thoi_gian_tao`, `tieu_de`, `ngay_ban_hanh`, `luot_xem`, `so_luot_tai` |
| `sortOrder` | string | ❌ | `asc` / `desc` (mặc định: `desc`) |

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "loai": "PHAP_LUAT",
      "tieu_de": "Quyết định về việc ban hành quy chế quản lý trật tự xây dựng",
      "so_hieu": "12/2025/QĐ-UBND",
      "co_quan_ban_hanh": "UBND Thành phố Hồ Chí Minh",
      "ngay_ban_hanh": "2025-06-15T00:00:00.000Z",
      "ngay_hieu_luc": "2025-07-01T00:00:00.000Z",
      "ngay_het_han": null,
      "pham_vi": "CONG_KHAI",
      "mo_ta": "Quyết định ban hành quy chế quản lý trật tự xây dựng...",
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
        "ten": "Quyết định"
      },
      "thu_vien_tai_lieu_file": [
        {
          "id": "uuid",
          "ten_file": "QD-12-2025.pdf",
          "duong_dan": "/uploads/thu-vien/2025/06/QD-12-2025.pdf",
          "kich_thuoc_mb": 2.45,
          "dinh_dang": "application/pdf"
        }
      ],
      "thu_vien_tai_lieu_tag": [
        { "thu_vien_tag": { "id": "uuid", "ten": "trật tự xây dựng" } }
      ],
      "_count": {
        "thu_vien_tai_lieu_media": 0
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

> 📝 **Lưu ý về nháp:** Tài liệu ở trạng thái `NHAP` (nháp) **chỉ hiển thị với người tạo** (`nguoi_tao`). Người dùng khác (kể cả có quyền phê duyệt/từ chối) sẽ không thấy tài liệu nháp trong danh sách và không thể xem chi tiết. Khi tài liệu được chuyển sang trạng thái khác (`CHO_DUYET`, `DA_DUYET`, ...) thì mới hiển thị bình thường.

---

## 4. Lấy chi tiết tài liệu

### `GET /api/tai-lieu-phap-luat/{id}`

**Quyền:** `TL_GET_DETAIL`

### Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "loai": "PHAP_LUAT",
    "tieu_de": "Quyết định về việc ban hành quy chế quản lý trật tự xây dựng",
    "so_hieu": "12/2025/QĐ-UBND",
    "co_quan_ban_hanh": "UBND Thành phố Hồ Chí Minh",
    "ngay_ban_hanh": "2025-06-15T00:00:00.000Z",
    "ngay_hieu_luc": "2025-07-01T00:00:00.000Z",
    "ngay_het_han": null,
    "pham_vi": "CONG_KHAI",
    "mo_ta": "Quyết định ban hành quy chế quản lý trật tự xây dựng...",
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
      "ten": "Quyết định"
    },
    "thu_vien_tai_lieu_file": [
      {
        "id": "uuid",
        "ten_file": "QD-12-2025.pdf",
        "duong_dan": "/uploads/thu-vien/2025/06/QD-12-2025.pdf",
        "kich_thuoc_mb": 2.45,
        "dinh_dang": "application/pdf"
      }
    ],
    "thu_vien_tai_lieu_media": [],
    "thu_vien_tai_lieu_tag": [
      { "thu_vien_tag": { "id": "uuid", "ten": "trật tự xây dựng" } }
    ]
  },
  "message": "Lấy chi tiết tài liệu thành công"
}
```

> **Khác với Văn hóa:** Pháp luật **không có** `noi_dung` (rich text HTML) và `thu_vien_tai_lieu_media` thường là mảng rỗng.

---

## 5. Xóa tài liệu

### `DELETE /api/tai-lieu-phap-luat/{id}`

**Quyền:** `TL_DELETE`

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

### `PUT /api/tai-lieu-phap-luat/update-status/{id}`

**Quyền:** `TL_UPDATE_STATUS`

**Content-Type:** `application/json`

### Request

```json
{
  "trangThai": "DA_DUYET"
}
```

| Field | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `trangThai` | string | ✅ | `NHAP` (bản nháp) → `CHO_DUYET` (chờ duyệt) → `DA_DUYET` (đã duyệt) → `TU_CHOI` (từ chối) → `LUU_TRU` (lưu trữ) |

---

## 7. Phê duyệt tài liệu

### `PUT /api/tai-lieu-phap-luat/approve/{id}`

**Quyền:** `TL_APPROVE`

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

### `PUT /api/tai-lieu-phap-luat/reject/{id}`

**Quyền:** `TL_REJECT`

**Content-Type:** `application/json`

### Request

```json
{
  "lyDoTuChoi": "Thiếu thông tin cơ quan ban hành"
}
```

| Field | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `lyDoTuChoi` | string | ❌ | Lý do từ chối (max 500 ký tự) |

Từ chối sẽ đưa tài liệu về trạng thái `TU_CHOI`.

---

## 9. Đồng bộ AI

### `POST /api/tai-lieu-phap-luat/ai-learn/{id}`

**Quyền:** `TL_AI_LEARN`

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

### `GET /api/tai-lieu-phap-luat/statistics`

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
  }
}
```

---

## 11. Danh sách loại văn bản (doc-types)

> API này dùng **chung danh mục** (`thu_vien_danh_muc`) với Văn hóa, nhưng chỉ đếm số lượng tài liệu loại `PHAP_LUAT`.

### `GET /api/tai-lieu-phap-luat/doc-types`

### Response

```json
{
  "success": true,
  "data": [
    { "id": "uuid", "name": "Quyết định", "sortOrder": 1, "documentCount": 45 },
    { "id": "uuid", "name": "Nghị định", "sortOrder": 2, "documentCount": 30 },
    { "id": "uuid", "name": "Thông tư", "sortOrder": 3, "documentCount": 20 }
  ],
  "message": "Lấy danh sách loại văn bản thành công"
}
```

---

## 12. Danh sách cơ quan ban hành

> Lấy danh sách cơ quan ban hành (group by) kèm số lượng tài liệu.

### `GET /api/tai-lieu-phap-luat/issuing-agencies`

### Response

```json
{
  "success": true,
  "data": [
    { "id": "UBND Thành phố Hồ Chí Minh", "name": "UBND Thành phố Hồ Chí Minh", "documentCount": 50 },
    { "id": "HĐND Thành phố Hồ Chí Minh", "name": "HĐND Thành phố Hồ Chí Minh", "documentCount": 20 },
    { "id": "Sở Tư pháp", "name": "Sở Tư pháp", "documentCount": 15 }
  ],
  "message": "Lấy danh sách cơ quan ban hành thành công"
}
```

---

## 13. Download tài liệu

### `GET /api/tai-lieu-phap-luat/{id}/download`

**Quyền:** `TL_DOWNLOAD`

Trả về thông tin file để FE tạo link download.

### Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "fileUrl": "/uploads/thu-vien/2025/06/QD-12-2025.pdf",
    "fileName": "QD-12-2025.pdf",
    "fileSize": 2.45
  },
  "message": "Lấy thông tin tải xuống thành công"
}
```

> FE dùng `fileUrl` để tạo link `<a href="fileUrl" download>`. Nhớ ghép với `REACT_APP_API_URL`.

---

## 14. Sự khác biệt với API Văn hóa

| Khía cạnh | Văn hóa | Pháp luật |
|---|---|---|
| **Route prefix** | `/api/tai-lieu-van-hoa` | `/api/tai-lieu-phap-luat` |
| **Field riêng** | `tenDiTich`, `diaChi` | `soHieu`, `coQuanBanHanh` |
| **Ngày tháng** | `ngayBanHanh` (optional) | `ngayBanHanh` (required), `ngayHieuLuc`, `ngayHetHan` |
| **idDanhMuc** | Optional | **Required** |
| **Media (ảnh/video)** | ✅ Có (`images`, `videos`) | ❌ Không có |
| **noiDung (HTML)** | ✅ Có | ❌ Không có |
| **Endpoint riêng** | `sub-categories` | `doc-types`, `issuing-agencies` |
| **File upload** | PDF/DOC/DOCX + ảnh + video | Chỉ PDF/DOC/DOCX |
| **Permissions** | Giống | Giống |

---

## Tổng kết nhanh

### Endpoint map

| Mục đích | Method | Endpoint | Quyền | Body |
|---|---|---|---|---|
| Danh sách | `GET` | `/tai-lieu-phap-luat/paging` | `TL_GET_ALL` | Query params |
| Chi tiết | `GET` | `/tai-lieu-phap-luat/{id}` | `TL_GET_DETAIL` | — |
| Tạo mới | `POST` | `/tai-lieu-phap-luat` | `TL_CREATE` | `multipart/form-data` |
| Cập nhật | `PUT` | `/tai-lieu-phap-luat/{id}` | `TL_UPDATE` | `multipart/form-data` |
| Xóa | `DELETE` | `/tai-lieu-phap-luat/{id}` | `TL_DELETE` | — |
| Đổi trạng thái | `PUT` | `/tai-lieu-phap-luat/update-status/{id}` | `TL_UPDATE_STATUS` | `{ "trangThai": "..." }` |
| Phê duyệt | `PUT` | `/tai-lieu-phap-luat/approve/{id}` | `TL_APPROVE` | — |
| Từ chối | `PUT` | `/tai-lieu-phap-luat/reject/{id}` | `TL_REJECT` | `{ "lyDoTuChoi": "..." }` |
| Hoàn tác duyệt | `PUT` | `/tai-lieu-phap-luat/unapprove/{id}` | `TL_UNAPPROVE` | — |
| Đồng bộ AI | `POST` | `/tai-lieu-phap-luat/ai-learn/{id}` | `TL_AI_LEARN` | `{ "action": "learn" }` |
| Thống kê | `GET` | `/tai-lieu-phap-luat/statistics` | — | — |
| Loại văn bản | `GET` | `/tai-lieu-phap-luat/doc-types` | — | — |
| Cơ quan ban hành | `GET` | `/tai-lieu-phap-luat/issuing-agencies` | — | — |
| Download | `GET` | `/tai-lieu-phap-luat/{id}/download` | `TL_DOWNLOAD` | — |

### Enum quan trọng

| Field | Giá trị |
|---|---|
| `trangThai` | `NHAP` → `CHO_DUYET` → `DA_DUYET` → `TU_CHOI` → `LUU_TRU` |
| `phamVi` | `CONG_KHAI` / `NOI_BO` / `HAN_CHE` |
| `action` (AI) | `learn` / `unlearn` |