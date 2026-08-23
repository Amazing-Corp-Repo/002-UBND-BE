# API Tài liệu công khai (trang người dân)

> API public, **không cần token** — dùng để hiển thị tài liệu văn hóa/lịch sử và quy phạm pháp luật lên trang web người dân.
> Chỉ trả về tài liệu đã duyệt (`DA_DUYET`) và phạm vi công khai (`CONG_KHAI`).

## Base URL

```
{REACT_APP_API_URL}/api/tai-lieu-cong-khai
```

Ví dụ: `https://api.ubnd.gov.vn/api/tai-lieu-cong-khai`

---

## 1. Lấy danh sách (phân trang)

### `GET /paging`

Không có body, tất cả tham số đều là **query string**.

#### Request

| Query param | Kiểu | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|---|
| `page` | number | ❌ | `1` | Số trang (bắt đầu từ 1) |
| `size` | number | ❌ | `10` | Số item mỗi trang |
| `search` | string | ❌ | — | Từ khóa tìm kiếm (tìm theo `tieu_de`, `mo_ta`, `so_hieu`) |
| `idDanhMuc` | UUID | ❌ | — | Lọc theo danh mục |
| `loai` | string | ❌ | cả hai | Lọc loại: `VAN_HOA` hoặc `PHAP_LUAT`. Bỏ qua → trả về cả hai. |
| `sortBy` | string | ❌ | `thoi_gian_tao` | Sắp xếp theo: `thoi_gian_tao`, `tieu_de`, `ngay_ban_hanh`, `luot_xem`, `so_luot_tai` |
| `sortOrder` | string | ❌ | `desc` | `asc` / `desc` |

#### Ví dụ gọi API

```js
// Lấy trang 1, 12 item, lọc loại văn hóa
GET /api/tai-lieu-cong-khai/paging?page=1&size=12&loai=VAN_HOA

// Tìm kiếm, lọc theo danh mục
GET /api/tai-lieu-cong-khai/paging?search=đình&idDanhMuc=uuid-xxx

// Lấy pháp luật, sắp xếp theo ngày ban hành tăng dần
GET /api/tai-lieu-cong-khai/paging?loai=PHAP_LUAT&sortBy=ngay_ban_hanh&sortOrder=asc
```

#### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "loai": "VAN_HOA",
      "tieu_de": "Đình An Hội - Di tích lịch sử cấp thành phố",
      "ten_di_tich": "Đình An Hội",
      "dia_chi": "12 Nguyễn Huệ, Phường 7, Quận 1",
      "ngay_ban_hanh": "2025-06-15T00:00:00.000Z",
      "pham_vi": "CONG_KHAI",
      "mo_ta": "Mô tả ngắn về di tích lịch sử...",
      "trang_thai": "DA_DUYET",
      "luot_xem": 1250,
      "so_luot_tai": 340,
      "thoi_gian_tao": "2025-06-10T08:00:00.000Z",
      "thoi_gian_cap_nhat": "2025-06-15T14:30:00.000Z",
      "ten_nguoi_tao": "Nguyễn Văn A",
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
        { "thu_vien_tag": { "id": "uuid", "ten": "lịch sử" } },
        { "thu_vien_tag": { "id": "uuid", "ten": "di tích" } }
      ],
      "_count": {
        "thu_vien_tai_lieu_media": 3
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 12,
    "totalPages": 5,
    "totalItems": 50
  },
  "message": "Lấy danh sách tài liệu thành công"
}
```

#### Mô tả response fields (danh sách)

| Field | Kiểu | Luôn có | Mô tả | Hiển thị FE |
|---|---|---|---|---|
| `id` | UUID | ✅ | ID tài liệu | Dùng cho link chi tiết |
| `loai` | `"VAN_HOA"` / `"PHAP_LUAT"` | ✅ | Loại tài liệu | Badge: "Văn hóa" / "Pháp luật" |
| `tieu_de` | string | ✅ | Tiêu đề | Tiêu đề chính, có thể click vào chi tiết |
| `ten_di_tich` | string | ❌ | Tên di tích (chỉ VAN_HOA) | Hiển thị nếu có |
| `dia_chi` | string | ❌ | Địa chỉ di tích (chỉ VAN_HOA) | Hiển thị nếu có |
| `ngay_ban_hanh` | ISO date | ❌ | Ngày ban hành | Định dạng ngày tháng |
| `mo_ta` | string | ❌ | Mô tả ngắn | Đoạn mô tả, có thể cắt bớt (truncate) |
| `pham_vi` | `"CONG_KHAI"` | ✅ | Phạm vi (luôn CONG_KHAI) | Ẩn, chỉ để debug |
| `trang_thai` | `"DA_DUYET"` | ✅ | Trạng thái (luôn DA_DUYET) | Ẩn, chỉ để debug |
| `luot_xem` | number | ✅ | Lượt xem | Hiển thị số |
| `so_luot_tai` | number | ✅ | Lượt tải | Hiển thị số |
| `thoi_gian_tao` | ISO date | ✅ | Ngày đăng | Định dạng ngày tháng |
| `thoi_gian_cap_nhat` | ISO date | ✅ | Ngày cập nhật | Ẩn hoặc tooltip |
| `ten_nguoi_tao` | string | ✅ | Người tạo | Hiển thị tên tác giả |
| `thu_vien_danh_muc` | object | ❌ | Danh mục | `thu_vien_danh_muc.ten` → label danh mục |
| `thu_vien_tai_lieu_file` | array | ❌ | File tài liệu | Xem **File URL** bên dưới |
| `thu_vien_tai_lieu_tag` | array | ❌ | Tags | `tag.thu_vien_tag.ten` → từng tag |
| `_count.thu_vien_tai_lieu_media` | number | ✅ | Số lượng media | Ẩn hoặc badge "3 ảnh" |

> **Lưu ý danh mục**: `thu_vien_danh_muc` có thể là `null` nếu tài liệu chưa gán danh mục. FE cần kiểm tra `null` trước khi truy cập `ten`.

---

## 2. Lấy chi tiết tài liệu

### `GET /{id}`

#### Request

| Param | Ví dụ |
|---|---|
| `id` | `550e8400-e29b-41d4-a716-446655440000` |

#### Ví dụ gọi API

```
GET /api/tai-lieu-cong-khai/550e8400-e29b-41d4-a716-446655440000
```

#### Response

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "loai": "VAN_HOA",
    "tieu_de": "Đình An Hội - Di tích lịch sử cấp thành phố",
    "ten_di_tich": "Đình An Hội",
    "dia_chi": "12 Nguyễn Huệ, Phường 7, Quận 1",
    "ngay_ban_hanh": "2025-06-15T00:00:00.000Z",
    "pham_vi": "CONG_KHAI",
    "mo_ta": "Mô tả ngắn...",
    "noi_dung": "<p>Đình An Hội được xây dựng vào <strong>năm 1850</strong>.</p><p>Nơi đây ghi dấu nhiều sự kiện lịch sử quan trọng của địa phương.</p>",
    "trang_thai": "DA_DUYET",
    "luot_xem": 1250,
    "so_luot_tai": 340,
    "thoi_gian_tao": "2025-06-10T08:00:00.000Z",
    "thoi_gian_cap_nhat": "2025-06-15T14:30:00.000Z",
    "ten_nguoi_tao": "Nguyễn Văn A",
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
      { "thu_vien_tag": { "id": "uuid", "ten": "lịch sử" } },
      { "thu_vien_tag": { "id": "uuid", "ten": "di tích" } }
    ]
  },
  "message": "Lấy chi tiết tài liệu thành công"
}
```

#### Field chỉ có ở chi tiết (so với danh sách)

| Field | Kiểu | Mô tả | Hiển thị FE |
|---|---|---|---|
| `noi_dung` | string (HTML) | Nội dung rich text | **Render HTML** — xem lưu ý bên dưới |
| `thu_vien_tai_lieu_media` | array | Danh sách ảnh/video | Hiển thị gallery ảnh + video player |

---

## 3. Hướng dẫn FE hiển thị

### 3.1. File URL — ghép với API Base URL

Các đường dẫn `duong_dan` và `url` trong response là **đường dẫn tương đối**, cần ghép với `REACT_APP_API_URL`:

```js
// File tài liệu (PDF)
const fileUrl = `${REACT_APP_API_URL}${item.thu_vien_tai_lieu_file[0]?.duong_dan}`
// => https://api.ubnd.gov.vn/uploads/thu-vien/2025/06/Tai_lieu.pdf

// Media (ảnh/video)
const imageUrl = `${REACT_APP_API_URL}${media.url}`
// => https://api.ubnd.gov.vn/uploads/thu-vien/2025/06/anh_bia.jpg
```

### 3.2. Lọc loại tài liệu

Mặc định API trả về cả `VAN_HOA` và `PHAP_LUAT` trong cùng một danh sách. Nếu FE có tab riêng:

```js
// Tab "Văn hóa lịch sử"
const res = await fetch(`${API_URL}/api/tai-lieu-cong-khai/paging?loai=VAN_HOA&page=1&size=12`)

// Tab "Quy phạm pháp luật"
const res = await fetch(`${API_URL}/api/tai-lieu-cong-khai/paging?loai=PHAP_LUAT&page=1&size=12`)
```

### 3.3. Render `noi_dung` (HTML)

`noi_dung` là chuỗi HTML từ trình soạn thảo rich text (ReactQuill). FE render bằng:

```jsx
// React — dùng dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: data.noi_dung }} />

// Hoặc dùng thư viện sanitize để tránh XSS
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data.noi_dung) }} />
```

### 3.4. Hiển thị Media

```jsx
{data.thu_vien_tai_lieu_media?.map(media => {
  const url = `${REACT_APP_API_URL}${media.url}`;
  if (media.loai === 'IMAGE') {
    return <img src={url} alt={media.ten_file_goc} />;
  }
  if (media.loai === 'VIDEO') {
    return <video src={url} controls />;
  }
  return null;
})}
```

### 3.5. Format ngày tháng

Tất cả ngày tháng đều là ISO string (`2025-06-15T00:00:00.000Z`). FE format:

```js
const date = new Date(item.ngay_ban_hanh);
// => "15/06/2025" hoặc "15 tháng 6, 2025"
```

### 3.6. Kiểm tra `null` cho danh mục

```jsx
// An toàn — thu_vien_danh_muc có thể là null
const danhMuc = item.thu_vien_danh_muc?.ten ?? 'Chưa phân loại';
```

### 3.7. Xử lý mảng `thu_vien_tai_lieu_file`

Danh sách chỉ trả về **1 file** mới nhất (luôn là bản hiện tại). Nếu mảng rỗng → tài liệu chưa có file đính kèm:

```jsx
const file = item.thu_vien_tai_lieu_file?.[0];
if (file) {
  // Hiển thị nút "Tải xuống"
  // file.ten_file → tên file
  // file.kich_thuoc_mb → dung lượng (MB)
  // file.dinh_dang → MIME type
}
```

---

## 4. Error handling

```json
// 404 — Không tìm thấy
{
  "success": false,
  "message": "Không tìm thấy tài liệu",
  "errors": null
}
```

---

## 5. Tổng quan luồng FE

```
Trang người dân
├── Tab "Văn hóa lịch sử"        → GET /paging?loai=VAN_HOA
├── Tab "Quy phạm pháp luật"     → GET /paging?loai=PHAP_LUAT
├── Tab "Tất cả"                  → GET /paging (không loai)
│
├── Card item → click → chi tiết  → GET /{id}
│   ├── Hiển thị: tiêu đề, danh mục, mô tả, tags
│   ├── Nội dung: render HTML (noi_dung)
│   ├── Gallery: ảnh + video (media)
│   └── Tải file: PDF (file)
│
└── Thanh tìm kiếm                → GET /paging?search=keyword
    Phân trang                    → GET /paging?page=N&size=12
```