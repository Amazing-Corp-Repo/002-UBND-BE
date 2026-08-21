# API Design — Quản lý Tài liệu (Document Management)

> Dành cho trang `/admin/documents/history` (Văn hóa - Lịch sử) và `/admin/documents/legal` (Quy phạm pháp luật)

---

## Tổng quan

Hai trang này có cấu trúc và chức năng gần như giống hệt nhau, chỉ khác về kiểu tài liệu quản lý:

| Trang | Kiểu | Route | API Base Path |
|-------|------|-------|---------------|
| Văn hóa - Lịch sử | `history` | `/admin/documents/history` | `/api/tai-lieu-van-hoa` |
| Quy phạm pháp luật | `legal` | `/admin/documents/legal` | `/api/tai-lieu-phap-luat` |

**Base URL chung:** `http://localhost:8880/`

---

## 1. Cấu trúc response chung

Tất cả API đều trả về response theo format thống nhất trong dự án:

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
  "data": { ... },
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

## 2. Đối tượng dữ liệu (Data Models)

### 2.1. Tài liệu Văn hóa - Lịch sử (History Document)

```json
{
  "id": "HD001",
  "docNumber": "N/A",
  "title": "Lịch sử hình thành và phát triển Phường Tăng Nhơn Phú",
  "relicName": "UBND Phường Tăng Nhơn Phú",
  "address": "Số 10 Đường số 4, Khu phố 2, Phường Tăng Nhơn Phú",
  "subCategory": "Lịch sử địa phương",
  "issueDate": "2023-01-15",
  "status": "Đã duyệt",
  "securityLevel": "Công khai",
  "fileUrl": "/uploads/history/lich_su_TNP.pdf",
  "fileName": "Lich_su_TNP.pdf",
  "fileSize": 8388608,
  "approverId": "user-001",
  "approverName": "Trần Văn A",
  "aiLearned": true,
  "viewCount": 1250,
  "downloadCount": 340,
  "images": [
    {
      "id": "img-001",
      "name": "anh_bia.jpg",
      "url": "/uploads/history/images/anh_bia.jpg",
      "size": 204800
    }
  ],
  "videos": [
    {
      "id": "vid-001",
      "name": "phong_su.mp4",
      "url": "/uploads/history/videos/phong_su.mp4",
      "size": 52428800
    }
  ],
  "description": "Tài liệu tổng quan về lịch sử...",
  "tags": ["lịch sử", "địa phương", "phường"],
  "createdAt": "2023-01-10T08:00:00Z",
  "updatedAt": "2023-01-15T14:30:00Z",
  "createdBy": "user-002",
  "createdByName": "Nguyễn Thị B"
}
```

### 2.2. Tài liệu Pháp luật (Legal Document)

```json
{
  "id": "LD001",
  "docNumber": "104/2022/NĐ-CP",
  "title": "Nghị định quy định về quản lý văn bản pháp luật tại địa phương",
  "docType": "Nghị định",
  "issuingAgency": "Chính phủ",
  "issueDate": "2022-12-31",
  "effectiveDate": "2023-01-15",
  "expirationDate": null,
  "status": "Đã duyệt",
  "securityLevel": "Công khai",
  "fileUrl": "/uploads/legal/NghiDinh_104_2022.pdf",
  "fileName": "NghiDinh_104_2022.pdf",
  "fileSize": 3984588,
  "approverId": "user-001",
  "approverName": "Trần Văn A",
  "aiLearned": true,
  "viewCount": 890,
  "downloadCount": 210,
  "summary": "Nghị định này quy định...",
  "tags": ["nghị định", "quản lý văn bản"],
  "createdAt": "2022-12-28T10:00:00Z",
  "updatedAt": "2023-01-05T09:00:00Z",
  "createdBy": "user-002",
  "createdByName": "Nguyễn Thị B"
}
```

### 2.3. Danh mục các loại tài liệu (Document Types)

```json
{
  "id": "dt-001",
  "name": "Nghị định",
  "category": "legal",
  "sortOrder": 1,
  "isActive": true
}
```

### 2.4. Danh mục tiểu mục cho tài liệu lịch sử (History Subcategories)

```json
{
  "id": "sc-001",
  "name": "Lịch sử địa phương",
  "sortOrder": 1,
  "isActive": true
}
```

---

## 3. Danh sách API

### 3.1. API cho Tài liệu Văn hóa - Lịch sử (`/api/tai-lieu-van-hoa`)

#### A. Lấy danh sách tài liệu (phân trang)

**GET** `/api/tai-lieu-van-hoa/paging`

**Request:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `page` | number | No | 1 | Trang hiện tại |
| `pageSize` | number | No | 10 | Số bản ghi mỗi trang |
| `search` | string | No | — | Tìm kiếm theo tiêu đề, mô tả |
| `subCategory` | string | No | — | Lọc theo tiểu mục |
| `status` | string | No | — | Lọc theo trạng thái (`Đã duyệt`, `Chờ duyệt`, `Đã thu hồi`) |
| `securityLevel` | string | No | — | Lọc theo mức độ bảo mật (`Công khai`, `Nội bộ`) |
| `aiLearned` | boolean | No | — | Lọc theo trạng thái AI đã học |
| `dateFrom` | string (date) | No | — | Lọc từ ngày (issueDate) |
| `dateTo` | string (date) | No | — | Lọc đến ngày (issueDate) |
| `sortBy` | string | No | `createdAt` | Trường sắp xếp |
| `sortOrder` | string | No | `desc` | Thứ tự sắp xếp (`asc`, `desc`) |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "HD001",
      "docNumber": "N/A",
      "title": "Lịch sử hình thành...",
      "relicName": "UBND Phường...",
      "address": "Số 10 Đường số 4...",
      "subCategory": "Lịch sử địa phương",
      "issueDate": "2023-01-15",
      "status": "Đã duyệt",
      "securityLevel": "Công khai",
      "fileName": "Lich_su_TNP.pdf",
      "fileSize": 8388608,
      "approverName": "Trần Văn A",
      "aiLearned": true,
      "viewCount": 1250,
      "downloadCount": 340,
      "createdAt": "2023-01-10T08:00:00Z",
      "updatedAt": "2023-01-15T14:30:00Z"
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

---

#### B. Lấy chi tiết tài liệu

**GET** `/api/tai-lieu-van-hoa/{id}`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "HD001",
    "docNumber": "N/A",
    "title": "Lịch sử hình thành và phát triển Phường Tăng Nhơn Phú",
    "relicName": "UBND Phường Tăng Nhơn Phú",
    "address": "Số 10 Đường số 4, Khu phố 2, Phường Tăng Nhơn Phú",
    "subCategory": "Lịch sử địa phương",
    "issueDate": "2023-01-15",
    "status": "Đã duyệt",
    "securityLevel": "Công khai",
    "fileUrl": "/uploads/history/lich_su_TNP.pdf",
    "fileName": "Lich_su_TNP.pdf",
    "fileSize": 8388608,
    "approverId": "user-001",
    "approverName": "Trần Văn A",
    "aiLearned": true,
    "viewCount": 1250,
    "downloadCount": 340,
    "images": [
      {
        "id": "img-001",
        "name": "anh_bia.jpg",
        "url": "/uploads/history/images/anh_bia.jpg",
        "size": 204800
      }
    ],
    "videos": [
      {
        "id": "vid-001",
        "name": "phong_su.mp4",
        "url": "/uploads/history/videos/phong_su.mp4",
        "size": 52428800
      }
    ],
    "description": "Tài liệu tổng quan về lịch sử...",
    "tags": ["lịch sử", "địa phương", "phường"],
    "createdAt": "2023-01-10T08:00:00Z",
    "updatedAt": "2023-01-15T14:30:00Z",
    "createdBy": "user-002",
    "createdByName": "Nguyễn Thị B"
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

#### C. Tạo mới tài liệu

**POST** `/api/tai-lieu-van-hoa`

**Request (multipart/form-data):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Tiêu đề tài liệu |
| `relicName` | string | No | Tên di tích/danh thắng |
| `address` | string | No | Địa chỉ |
| `subCategory` | string | No | Tiểu mục (VD: `Lịch sử địa phương`) |
| `issueDate` | date | Yes | Ngày ban hành |
| `securityLevel` | string | Yes | `Công khai` hoặc `Nội bộ` |
| `description` | string | No | Mô tả tóm tắt |
| `tags` | string[] | No | Mảng tags (gửi dạng JSON string) |
| `file` | file | No | File tài liệu đính kèm (PDF, DOC, DOCX) |
| `images` | file[] | No | Danh sách hình ảnh (tối đa 10 file) |
| `videos` | file[] | No | Danh sách video (tối đa 5 file) |

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "HD002",
    "title": "Lịch sử hình thành...",
    "status": "Chờ duyệt",
    "createdAt": "2023-01-10T08:00:00Z",
    "createdBy": "user-002",
    "createdByName": "Nguyễn Thị B"
  },
  "message": "Tạo tài liệu thành công"
}
```

**Response (400 - Validation lỗi):**
```json
{
  "success": false,
  "data": {
    "errors": {
      "title": "Tiêu đề không được để trống",
      "issueDate": "Ngày ban hành không hợp lệ"
    }
  },
  "message": "Dữ liệu không hợp lệ"
}
```

---

#### D. Cập nhật tài liệu

**PUT** `/api/tai-lieu-van-hoa/{id}`

**Request (multipart/form-data):** Tương tự Create, nhưng tất cả field đều là optional (chỉ gửi field cần sửa). Nếu không gửi file mới → giữ file cũ.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "HD001",
    "title": "Lịch sử hình thành (đã chỉnh sửa)",
    "status": "Chờ duyệt",
    "updatedAt": "2023-06-15T10:00:00Z"
  },
  "message": "Cập nhật tài liệu thành công"
}
```

---

#### E. Xóa tài liệu

**DELETE** `/api/tai-lieu-van-hoa/{id}`

**Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Xóa tài liệu thành công"
}
```

**Response (400 - Không thể xóa vì đã được duyệt):**
```json
{
  "success": false,
  "data": null,
  "message": "Không thể xóa tài liệu đã được duyệt"
}
```

---

#### F. Cập nhật trạng thái

**PUT** `/api/tai-lieu-van-hoa/update-status/{id}`

**Request:**
```json
{
  "status": "Đã duyệt"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | Yes | `Đã duyệt`, `Chờ duyệt`, hoặc `Đã thu hồi` |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "HD001",
    "status": "Đã duyệt",
    "approverId": "user-001",
    "approverName": "Trần Văn A",
    "updatedAt": "2023-01-15T14:30:00Z"
  },
  "message": "Cập nhật trạng thái thành công"
}
```

---

#### G. Đồng bộ AI (AI Knowledge Sync)

**POST** `/api/tai-lieu-van-hoa/ai-learn/{id}`

**Request:**
```json
{
  "action": "learn"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | string | Yes | `learn` (học) hoặc `unlearn` (bỏ học) |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "HD001",
    "aiLearned": true,
    "aiLearnedAt": "2023-01-16T09:00:00Z"
  },
  "message": "Đồng bộ AI thành công"
}
```

---

#### H. Thống kê (KPI Cards)

**GET** `/api/tai-lieu-van-hoa/statistics`

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

#### I. Upload file (ảnh, video riêng lẻ)

**POST** `/api/tai-lieu-van-hoa/upload`

**Request (multipart/form-data):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | file | Yes | File cần upload |
| `type` | string | Yes | Loại file: `image`, `video`, `document` |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "url": "/uploads/history/images/anh_bia.jpg",
    "name": "anh_bia.jpg",
    "size": 204800,
    "type": "image/jpeg"
  },
  "message": "Upload file thành công"
}
```

---

#### J. Xóa file ảnh/video đính kèm

**DELETE** `/api/tai-lieu-van-hoa/{id}/media/{mediaId}`

**Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Xóa media thành công"
}
```

---

#### K. Lấy danh sách tiểu mục (subcategories)

**GET** `/api/tai-lieu-van-hoa/sub-categories`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "sc-001",
      "name": "Lịch sử địa phương",
      "sortOrder": 1,
      "documentCount": 45
    },
    {
      "id": "sc-002",
      "name": "Di tích lịch sử",
      "sortOrder": 2,
      "documentCount": 30
    },
    {
      "id": "sc-003",
      "name": "Văn hóa truyền thống",
      "sortOrder": 3,
      "documentCount": 25
    }
  ],
  "message": "Lấy danh sách tiểu mục thành công"
}
```

---

#### L. Download tài liệu

**GET** `/api/tai-lieu-van-hoa/{id}/download`

**Response:** File stream (Content-Disposition: attachment)

**Lưu ý:** API này sẽ tự động tăng `downloadCount` của tài liệu.

---

#### M. Xuất danh sách tài liệu (Export)

**GET** `/api/tai-lieu-van-hoa/export`

**Request:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `format` | string | No | `excel` | Định dạng xuất: `excel`, `csv`, `pdf` |
| `search` | string | No | — | Tìm kiếm (lọc theo từ khóa) |
| `status` | string | No | — | Lọc theo trạng thái |
| `subCategory` | string | No | — | Lọc theo tiểu mục |
| `dateFrom` | string | No | — | Lọc từ ngày |
| `dateTo` | string | No | — | Lọc đến ngày |

**Response:** File stream (Excel/CSV/PDF)

---

### 3.2. API cho Tài liệu Pháp luật (`/api/tai-lieu-phap-luat`)

Các API tương tự tài liệu văn hóa, chỉ khác ở model và các field đặc thù.

#### A. Lấy danh sách tài liệu pháp luật (phân trang)

**GET** `/api/tai-lieu-phap-luat/paging`

**Request:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `page` | number | No | 1 | Trang hiện tại |
| `pageSize` | number | No | 10 | Số bản ghi mỗi trang |
| `search` | string | No | — | Tìm kiếm theo tiêu đề, số hiệu, tóm tắt |
| `docType` | string | No | — | Lọc theo loại văn bản |
| `issuingAgency` | string | No | — | Lọc theo cơ quan ban hành |
| `status` | string | No | — | Lọc theo trạng thái |
| `securityLevel` | string | No | — | Lọc theo mức độ bảo mật |
| `aiLearned` | boolean | No | — | Lọc theo trạng thái AI đã học |
| `dateFrom` | string (date) | No | — | Lọc từ ngày ban hành |
| `dateTo` | string (date) | No | — | Lọc đến ngày ban hành |
| `sortBy` | string | No | `createdAt` | Trường sắp xếp |
| `sortOrder` | string | No | `desc` | Thứ tự sắp xếp |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "LD001",
      "docNumber": "104/2022/NĐ-CP",
      "title": "Nghị định quy định về quản lý văn bản pháp luật tại địa phương",
      "docType": "Nghị định",
      "issuingAgency": "Chính phủ",
      "issueDate": "2022-12-31",
      "effectiveDate": "2023-01-15",
      "status": "Đã duyệt",
      "securityLevel": "Công khai",
      "fileName": "NghiDinh_104_2022.pdf",
      "fileSize": 3984588,
      "approverName": "Trần Văn A",
      "aiLearned": true,
      "viewCount": 890,
      "downloadCount": 210,
      "createdAt": "2022-12-28T10:00:00Z",
      "updatedAt": "2023-01-05T09:00:00Z"
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

---

#### B. Lấy chi tiết tài liệu pháp luật

**GET** `/api/tai-lieu-phap-luat/{id}`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "LD001",
    "docNumber": "104/2022/NĐ-CP",
    "title": "Nghị định quy định về quản lý văn bản pháp luật tại địa phương",
    "docType": "Nghị định",
    "issuingAgency": "Chính phủ",
    "issueDate": "2022-12-31",
    "effectiveDate": "2023-01-15",
    "expirationDate": null,
    "status": "Đã duyệt",
    "securityLevel": "Công khai",
    "fileUrl": "/uploads/legal/NghiDinh_104_2022.pdf",
    "fileName": "NghiDinh_104_2022.pdf",
    "fileSize": 3984588,
    "approverId": "user-001",
    "approverName": "Trần Văn A",
    "aiLearned": true,
    "viewCount": 890,
    "downloadCount": 210,
    "summary": "Nghị định này quy định về quản lý văn bản pháp luật, bao gồm việc soạn thảo, ban hành, lưu trữ và công bố văn bản quy phạm pháp luật tại địa phương.",
    "tags": ["nghị định", "quản lý văn bản"],
    "createdAt": "2022-12-28T10:00:00Z",
    "updatedAt": "2023-01-05T09:00:00Z",
    "createdBy": "user-002",
    "createdByName": "Nguyễn Thị B"
  },
  "message": "Lấy chi tiết tài liệu thành công"
}
```

---

#### C. Tạo mới tài liệu pháp luật

**POST** `/api/tai-lieu-phap-luat`

**Request (multipart/form-data):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `docNumber` | string | Yes | Số hiệu văn bản (VD: `104/2022/NĐ-CP`) |
| `title` | string | Yes | Tiêu đề văn bản |
| `docType` | string | Yes | Loại văn bản (VD: `Nghị định`) |
| `issuingAgency` | string | Yes | Cơ quan ban hành |
| `issueDate` | date | Yes | Ngày ban hành |
| `effectiveDate` | date | No | Ngày hiệu lực |
| `expirationDate` | date | No | Ngày hết hiệu lực |
| `securityLevel` | string | Yes | `Công khai` hoặc `Nội bộ` |
| `summary` | string | No | Tóm tắt nội dung |
| `tags` | string[] | No | Mảng tags (gửi dạng JSON string) |
| `file` | file | No | File tài liệu đính kèm (PDF, DOC, DOCX) |

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "LD002",
    "docNumber": "105/2023/QĐ-UBND",
    "title": "Quyết định về việc...",
    "status": "Chờ duyệt",
    "createdAt": "2023-02-10T08:00:00Z",
    "createdBy": "user-002",
    "createdByName": "Nguyễn Thị B"
  },
  "message": "Tạo tài liệu thành công"
}
```

---

#### D. Cập nhật tài liệu pháp luật

**PUT** `/api/tai-lieu-phap-luat/{id}`

**Request (multipart/form-data):** Tương tự Create, tất cả field đều optional.

---

#### E. Xóa tài liệu pháp luật

**DELETE** `/api/tai-lieu-phap-luat/{id}`

---

#### F. Cập nhật trạng thái tài liệu pháp luật

**PUT** `/api/tai-lieu-phap-luat/update-status/{id}`

**Request:**
```json
{
  "status": "Đã duyệt"
}
```

---

#### G. Đồng bộ AI cho tài liệu pháp luật

**POST** `/api/tai-lieu-phap-luat/ai-learn/{id}`

**Request:**
```json
{
  "action": "learn"
}
```

---

#### H. Thống kê tài liệu pháp luật (KPI Cards)

**GET** `/api/tai-lieu-phap-luat/statistics`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total": 200,
    "pending": 25,
    "approved": 165,
    "revoked": 10,
    "aiLearned": 140,
    "totalViews": 78000,
    "totalDownloads": 23000
  },
  "message": "Lấy thống kê thành công"
}
```

---

#### I. Lấy danh sách loại văn bản (doc types)

**GET** `/api/tai-lieu-phap-luat/doc-types`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "dt-001",
      "name": "Nghị định",
      "sortOrder": 1,
      "documentCount": 55
    },
    {
      "id": "dt-002",
      "name": "Nghị quyết",
      "sortOrder": 2,
      "documentCount": 40
    },
    {
      "id": "dt-003",
      "name": "Quyết định",
      "sortOrder": 3,
      "documentCount": 60
    },
    {
      "id": "dt-004",
      "name": "Chỉ thị",
      "sortOrder": 4,
      "documentCount": 15
    },
    {
      "id": "dt-005",
      "name": "Thông tư",
      "sortOrder": 5,
      "documentCount": 20
    },
    {
      "id": "dt-006",
      "name": "Báo cáo",
      "sortOrder": 6,
      "documentCount": 5
    },
    {
      "id": "dt-007",
      "name": "Kế hoạch",
      "sortOrder": 7,
      "documentCount": 5
    }
  ],
  "message": "Lấy danh sách loại văn bản thành công"
}
```

---

#### J. Lấy danh sách cơ quan ban hành

**GET** `/api/tai-lieu-phap-luat/issuing-agencies`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "ag-001",
      "name": "Chính phủ",
      "documentCount": 80
    },
    {
      "id": "ag-002",
      "name": "Quốc hội",
      "documentCount": 30
    },
    {
      "id": "ag-003",
      "name": "UBND Thành phố",
      "documentCount": 50
    },
    {
      "id": "ag-004",
      "name": "UBND Quận 9",
      "documentCount": 25
    },
    {
      "id": "ag-005",
      "name": "UBND Phường Tăng Nhơn Phú",
      "documentCount": 15
    }
  ],
  "message": "Lấy danh sách cơ quan ban hành thành công"
}
```

---

#### K. Download tài liệu pháp luật

**GET** `/api/tai-lieu-phap-luat/{id}/download`

---

#### L. Xuất danh sách tài liệu pháp luật (Export)

**GET** `/api/tai-lieu-phap-luat/export`

**Request:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `format` | string | No | `excel` | `excel`, `csv`, `pdf` |
| `search` | string | No | — | Tìm kiếm |
| `docType` | string | No | — | Lọc loại văn bản |
| `status` | string | No | — | Lọc trạng thái |
| `dateFrom` | string | No | — | Lọc từ ngày |
| `dateTo` | string | No | — | Lọc đến ngày |

---

### 3.3. API dùng chung (Shared)

#### A. Upload file tạm thời (trước khi tạo tài liệu)

**POST** `/api/upload/temp`

**Request (multipart/form-data):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | file | Yes | File cần upload tạm |
| `folder` | string | Yes | Thư mục đích: `history`, `legal`, `history-images`, `history-videos` |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "url": "/uploads/temp/abc123.jpg",
    "name": "abc123.jpg",
    "originalName": "anh_bia.jpg",
    "size": 204800,
    "mimeType": "image/jpeg"
  },
  "message": "Upload tạm thời thành công"
}
```

---

## 4. Sơ đồ luồng (Flow Diagram)

### 4.1. Luồng làm việc cơ bản

```
┌──────────────┐      ┌──────────────────┐      ┌───────────────┐
│  Danh sách   │ ───► │  Tạo / Chỉnh sửa │ ───► │  Chờ duyệt   │
│  (Table)     │      │  (Modal Form)    │      │  (Pending)    │
└──────────────┘      └──────────────────┘      └───────┬───────┘
       ▲                                                 │
       │                   ┌──────────────────┐          │
       │                   │  Duyệt / Thu hồi │ ◄────────┘
       │                   │  (Cập nhật status)│
       │                   └──────────────────┘
       │                           │
       │                   ┌───────┴────────┐
       │                   │                │
       │              ┌────▼────┐     ┌─────▼─────┐
       │              │Đã duyệt │     │Đã thu hồi │
       │              │(Approved)│    │(Revoked)  │
       │              └────┬────┘     └─────┬─────┘
       │                   │                │
       │                   ▼                │
       │           ┌──────────────┐         │
       └───────────│  Đồng bộ AI  │         │
                   └──────────────┘         │
                       │                    │
                       ▼                    │
               ┌──────────────┐             │
               │  AI đã học   │             │
               │  (Learned)   │             │
               └──────────────┘             │
                                            │
                                            ▼
                               ┌──────────────────────┐
                               │  Có thể xóa được    │
                               └──────────────────────┘
```

### 4.2. Luồng xử lý filter/search

```
┌──────────┐    ┌───────────┐    ┌──────────┐    ┌──────────────┐
│  Search  │───►│  Filter   │───►│  Sort    │───►│  Pagination  │
│  (input) │    │ (dropdown)│    │ (column) │    │  (page nav)  │
└──────────┘    └───────────┘    └──────────┘    └──────┬───────┘
                                                         │
                                                         ▼
                                               ┌──────────────────┐
                                               │  GET /paging?   │
                                               │  search=&filter │
                                               │  &sort=&page=   │
                                               └──────────────────┘
```

---

## 5. Các enum / hằng số

### 5.1. Trạng thái tài liệu

| Giá trị | Mô tả | Màu hiển thị |
|---------|-------|-------------|
| `Chờ duyệt` | Đang chờ phê duyệt | `orange` / `warning` |
| `Đã duyệt` | Đã được phê duyệt | `green` / `success` |
| `Đã thu hồi` | Đã bị thu hồi | `red` / `error` |

### 5.2. Mức độ bảo mật

| Giá trị | Mô tả |
|---------|-------|
| `Công khai` | Hiển thị cho công dân |
| `Nội bộ` | Chỉ hiển thị nội bộ admin |

### 5.3. Loại văn bản pháp luật (docType)

| Giá trị | Mô tả |
|---------|-------|
| `Nghị định` | Nghị định |
| `Nghị quyết` | Nghị quyết |
| `Quyết định` | Quyết định |
| `Chỉ thị` | Chỉ thị |
| `Thông tư` | Thông tư |
| `Báo cáo` | Báo cáo |
| `Kế hoạch` | Kế hoạch |

### 5.4. Tiểu mục Văn hóa - Lịch sử (subCategory)

| Giá trị | Mô tả |
|---------|-------|
| `Lịch sử địa phương` | Lịch sử địa phương |
| `Di tích lịch sử` | Di tích lịch sử |
| `Văn hóa truyền thống` | Văn hóa truyền thống |

---

## 6. Tổng kết

### Danh sách API đầy đủ

#### Tài liệu Văn hóa - Lịch sử (`/api/tai-lieu-van-hoa`)

| # | Method | Endpoint | Mô tả |
|---|--------|----------|-------|
| 1 | GET | `/api/tai-lieu-van-hoa/paging` | Danh sách (phân trang, lọc, sort) |
| 2 | GET | `/api/tai-lieu-van-hoa/{id}` | Chi tiết |
| 3 | POST | `/api/tai-lieu-van-hoa` | Tạo mới |
| 4 | PUT | `/api/tai-lieu-van-hoa/{id}` | Cập nhật |
| 5 | DELETE | `/api/tai-lieu-van-hoa/{id}` | Xóa |
| 6 | PUT | `/api/tai-lieu-van-hoa/update-status/{id}` | Cập nhật trạng thái |
| 7 | POST | `/api/tai-lieu-van-hoa/ai-learn/{id}` | Đồng bộ AI |
| 8 | GET | `/api/tai-lieu-van-hoa/statistics` | Thống kê KPI |
| 9 | POST | `/api/tai-lieu-van-hoa/upload` | Upload file |
| 10 | DELETE | `/api/tai-lieu-van-hoa/{id}/media/{mediaId}` | Xóa media |
| 11 | GET | `/api/tai-lieu-van-hoa/sub-categories` | Danh sách tiểu mục |
| 12 | GET | `/api/tai-lieu-van-hoa/{id}/download` | Download file |
| 13 | GET | `/api/tai-lieu-van-hoa/export` | Xuất danh sách |

#### Tài liệu Pháp luật (`/api/tai-lieu-phap-luat`)

| # | Method | Endpoint | Mô tả |
|---|--------|----------|-------|
| 1 | GET | `/api/tai-lieu-phap-luat/paging` | Danh sách (phân trang, lọc, sort) |
| 2 | GET | `/api/tai-lieu-phap-luat/{id}` | Chi tiết |
| 3 | POST | `/api/tai-lieu-phap-luat` | Tạo mới |
| 4 | PUT | `/api/tai-lieu-phap-luat/{id}` | Cập nhật |
| 5 | DELETE | `/api/tai-lieu-phap-luat/{id}` | Xóa |
| 6 | PUT | `/api/tai-lieu-phap-luat/update-status/{id}` | Cập nhật trạng thái |
| 7 | POST | `/api/tai-lieu-phap-luat/ai-learn/{id}` | Đồng bộ AI |
| 8 | GET | `/api/tai-lieu-phap-luat/statistics` | Thống kê KPI |
| 9 | GET | `/api/tai-lieu-phap-luat/doc-types` | Danh sách loại văn bản |
| 10 | GET | `/api/tai-lieu-phap-luat/issuing-agencies` | Danh sách cơ quan ban hành |
| 11 | GET | `/api/tai-lieu-phap-luat/{id}/download` | Download file |
| 12 | GET | `/api/tai-lieu-phap-luat/export` | Xuất danh sách |

#### Dùng chung

| # | Method | Endpoint | Mô tả |
|---|--------|----------|-------|
| 1 | POST | `/api/upload/temp` | Upload tạm thời |

---

## 7. Ghi chú cho Backend

1. **Quyền truy cập:** Tất cả API đều yêu cầu xác thực JWT (Bearer token). Phân quyền dựa trên role: `ADMIN`, `LEADER`, `APPROVER`, `OFFICER` có quyền CRUD; roles khác (nếu có) chỉ có quyền xem.

2. **File upload:** Các API upload file nên sử dụng `multipart/form-data`. Dung lượng tối đa:
   - File tài liệu (PDF, DOC, DOCX): 50MB
   - Ảnh: 10MB mỗi ảnh, tối đa 10 ảnh/tài liệu
   - Video: 200MB mỗi video, tối đa 5 video/tài liệu (chỉ cho tài liệu văn hóa)

3. **Audit log:** Mọi thao tác CRUD và cập nhật trạng thái nên ghi log vào hệ thống nhật ký (`/api/nhat-ky`).

4. **Xóa mềm (Soft delete):** Khi xóa tài liệu, chỉ nên đánh dấu `isDeleted = true` thay vì xóa hẳn, để có thể khôi phục nếu cần.

5. **Cache:** API thống kê nên được cache (ít nhất 5 phút) vì dữ liệu ít thay đổi.

6. **Số hiệu văn bản (docNumber) cho tài liệu văn hóa:** Nếu không có, mặc định là `N/A`.