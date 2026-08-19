# Task 4 — API Kho tư liệu & Tra cứu văn bản (UBND-BE)

> Trạng thái: **ĐANG THẢO LUẬN / LƯU BIÊN BẢN** — đã xác minh schema + FE, đã chốt 1 phần thiết kế. Còn quyết định đang chờ (xử lý đa định dạng file & video) → xem PHẦN 5.

---

## PHẦN 1 — Biên bản đã bàn

### 1.1 Xác minh Schema DB (BE) — **ĐÃ ĐỦ, PHÙ HỢP** ✅
6 bảng `thu_vien_*` nằm trong `prisma/schema.prisma`, sinh từ commit `baa809b`, migration `20260816171428_them_bang_danh_gia_va_thu_vien` (đã **schema-agnostic** → sẵn sàng `migrate deploy` lên staging/prod theo quy tắc vàng CLAUDE.md).

| Yêu cầu Task 4 | Schema hiện có |
|---|---|
| Danh mục | `thu_vien_danh_muc` (ten, mo_ta, icon, tone, thu_tu, audit + soft-delete) |
| Tài liệu + metadata | `thu_vien_tai_lieu`: tieu_de, tac_gia, mo_ta, url_bia, so_luot_tai, noi_dung, sections(Json), so_hieu, co_quan_ban_hanh, ngay_ban_hanh/hieu_luc, trang_thai_hieu_luc, chuong(Json) |
| Phân loại thủ công | `loai` (SACH/TAI_LIEU/VAN_BAN/BAN_DO/PHAP_LUAT) + `id_danh_muc` + tag nhiều-nhiều (`thu_vien_tag` – `thu_vien_tai_lieu_tag`) |
| **Trạng thái 4 mức** | `trang_thai` = `NHAP|CHO_DUYET|DA_DUYET|LUU_TRU` ↔ Nháp–Chờ duyệt–Đã duyệt–Lưu trữ ✅ (đã có, sẵn cho chatbot) |
| **Phạm vi 3 cấp** | `pham_vi` = `CONG_KHAI|NOI_BO|HAN_CHE` + `thu_vien_tai_lieu_quyen` liên kết `roles` cho HAN_CHE ✅ |
| **Nguồn/người duyệt/thời gian duyệt** | `nguon`, `nguoi_duyet` (UUID), `thoi_gian_duyet` (Timestamp) ✅ |
| File / phiên bản | `thu_vien_tai_lieu_file`: duong_dan, dinh_dang(MIME), kich_thuoc_mb, `phien_ban`, `la_phien_ban_hien_tai` ✅ |

**Storage DEV private — đã có precedent**: `createUploader` hỗ trợ `isPublic:false` + `basePathSegments` (mẫu `video-upload.route.js:41-43`: `src/private/uploads/videos`). Chỉ `express.static("src/public")` được serve (`app.js:52`) → file dưới `src/private` là private. **Không có S3/object storage** — "storage DEV private" = private folder trên server.

**Gaps khi triển khai**:
1. Chưa có route/controller/service/repository cho thư viện (chỉ schema + Prisma generated).
2. Chưa có permission `TU_LIEU_*` trong `permission.constant.js`.
3. Chưa có UPLOAD_TYPE, validators, Swagger, test.
4. **Không có hạ tầng test** (không jest/vitest; test script placeholder).
5. Chưa có endpoint download/stream file private có kiểm tra quyền (precedent stream: `export.controller.js`, `log.controller.js` dùng `createReadStream`).

### 1.2 Xác minh FE (`src/SOS_TNP_LONGLO`) — **PHÙ HỢP, NHƯNG MOCK**
- **`DigitalLibraryPage.jsx`** đã tồn tại tại `/cong-dong/thu-vien-so` (`CitizenApp.jsx:44`) — UI hoàn chỉnh (hero, tìm kiếm, filter danh mục, grid, chi tiết, related).
- **Chạy 100% mock**: dữ liệu `libraryCategories`/`libraryDocuments` từ `citizen/data/citizenData.js`; `services/libraryService.js` có `MOCK_MODE = true`, nhánh gọi API thật **bị comment**.
- Chưa có `apis/taiLieu.js` (pattern chuẩn sẵn: `apis/news.js`).
- `utils/apiClient.js` (axios + auto-refresh Bearer) sẵn sàng.
- **Field mock ↔ Schema BE gần như 1:1**: title↔tieu_de, description↔mo_ta, author↔tac_gia, cover↔url_bia, downloads↔so_luot_tai, docType↔loai, code↔so_hieu, issuingAgency↔co_quan_ban_hanh, issuedDate↔ngay_ban_hanh, effectiveDate↔ngay_hieu_luc, status↔trang_thai_hieu_luc, sections↔sections, content↔noi_dung, chapters↔chuong, category↔id_danh_muc, tags↔thu_vien_tag, featured↔is_featured.
- **Lưu ý phạm vi**: cổng dân là **public, không auth** → chỉ nên trả `DA_DUYET + CONG_KHAI`. NOI_BO/HAN_CHE/duyệt nằm ở admin app (chưa có admin UI cho tài liệu).

### 1.3 Quyết định đã chốt (từ hỏi đáp)
1. **Test framework**: `node:test` + `supertest` (nhẹ, Node ≥22.6 native, khớp ESM + `--experimental-strip-types`; chỉ thêm `supertest` devDep).
2. **Phạm vi API**: xây **cả public (cổng dân) + admin**.
3. **Duyệt tách quyền**: thêm `TU_LIEU_APPROVE` riêng (endpoint duyệt ghi `nguoi_duyet` + `thoi_gian_duyet` + bắt buộc `nguon` cho chatbot), tách khỏi `TU_LIEU_UPDATE_STATUS`.

### 1.4 Chỉ đạo triển khai mới nhất
> **"Tạo API trước, có người đảm nhiệm phần tích hợp sau."** → Plan này **chỉ dựng API BE**; bỏ hẳn hướng dẫn/phần code tích hợp FE khỏi phạm vi (ghi tham chiếu ngắn ở PHẦN 7).

> **Câu hỏi đang chờ:** thư viện cho upload **ảnh + video + PDF/DOCX** — xử lý theo cách nào? (Xem PHẦN 5.)

---

## PHẦN 2 — Router & mount
Mount trong `src/routes/root.route.js`:
- `rootRouter.use('/thu-vien', thuVienPublicRouter)` — public, không auth
- `rootRouter.use('/thu-vien', thuVienRouter)` — admin, `authenticate` + `authorize`
→ full base path `/api/thu-vien/*`.

---

## PHẦN 3 — API CONTRACT

### A. Public (cổng dân) — KHÔNG auth — chỉ trả `DA_DUYET` + `CONG_KHAI`
Router `src/routes/thu-vien-public.route.js`

| Method | Path | Mô tả |
|---|---|---|
| GET | `/thu-vien/public/danh-muc` | Danh mục `is_active`, sort `thu_tu` |
| GET | `/thu-vien/public/tai-lieu` | Tìm kiếm/lọc: `page,size,tieuDe,idDanhMuc,loai,idTag,featured` → phân trang |
| GET | `/thu-vien/public/tai-lieu/featured` | Nổi bật (`is_featured`) |
| GET | `/thu-vien/public/tai-lieu/:id` | Chi tiết công khai: metadata + files + tags + đọc online (`noi_dung`/`sections`) |
| GET | `/thu-vien/public/file/:idFile` | Stream/tải file công khai (file của doc DA_DUYET+CONG_KHAI) |

### B. Admin (quản trị) — `authenticate` + `authorize(TU_LIEU_*)`
Middeware order chuẩn: `audit_logs` → `authenticate` → `authorize` → `validate` → `createUploader` → Controller.

**Danh mục** — `src/routes/thu-vien-danh-muc.route.js`
| Method | Path | Quyền |
|---|---|---|
| GET | `/thu-vien/danh-muc` | TU_LIEU_GET_ALL (kèm `_count`) |
| POST | `/thu-vien/danh-muc` | TU_LIEU_CREATE |
| PUT | `/thu-vien/danh-muc/:id` | TU_LIEU_UPDATE |
| DELETE | `/thu-vien/danh-muc/:id` | TU_LIEU_DELETE (xóa mềm; chặn nếu còn tài liệu active) |
| PUT | `/thu-vien/danh-muc/:id/update-status` | TU_LIEU_UPDATE_STATUS (is_active) |

**Tag** — `src/routes/thu-vien-tag.route.js`
| Method | Path | Quyền |
|---|---|---|
| GET | `/thu-vien/tag` | TU_LIEU_GET_ALL (kèm `_count`) |
| POST | `/thu-vien/tag` | TU_LIEU_CREATE (phân loại thủ công) |
| PUT | `/thu-vien/tag/:id` | TU_LIEU_UPDATE |
| DELETE | `/thu-vien/tag/:id` | TU_LIEU_DELETE |

**Tài liệu + duyệt + phạm vi + file** — `src/routes/thu-vien.route.js`
| Method | Path | Quyền | Ghi chú |
|---|---|---|---|
| POST | `/thu-vien/tai-lieu` | TU_LIEU_CREATE | multipart: metadata + file(s) nội dung (private) + bia (public). Transaction doc+tags+files |
| GET | `/thu-vien/tai-lieu` | TU_LIEU_GET_ALL | filter `trang_thai,pham_vi,loai,idDanhMuc,search,nguoiDuyet` |
| GET | `/thu-vien/tai-lieu/:id` | TU_LIEU_GET_DETAIL | kèm files + tags + quyền + người duyệt |
| PUT | `/thu-vien/tai-lieu/:id` | TU_LIEU_UPDATE | cập nhật metadata + file mới = phiên bản (`phien_ban`++) |
| DELETE | `/thu-vien/tai-lieu/:id` | TU_LIEU_DELETE | xóa mềm |
| PUT | `/thu-vien/tai-lieu/:id/trang-thai` | TU_LIEU_UPDATE_STATUS | NHAP/CHO_DUYET/LUU_TRU + hạ DA_DUYET |
| PUT | `/thu-vien/tai-lieu/:id/duyet` | **TU_LIEU_APPROVE** | → DA_DUYET; **bắt buộc `nguon`**; ghi `nguoi_duyet` + `thoi_gian_duyet` |
| PUT | `/thu-vien/tai-lieu/:id/pham-vi` | TU_LIEU_UPDATE_STATUS | set phạm vi |
| PUT | `/thu-vien/tai-lieu/:id/quyen` | TU_LIEU_UPDATE_STATUS | gán/bỏ vai trò truy cập HAN_CHE (`thu_vien_tai_lieu_quyen`) |
| DELETE | `/thu-vien/tai-lieu/:id/file/:idFile` | TU_LIEU_UPDATE | xóa file/phiên bản (chặn xóa bản hiện hành) |
| GET | `/thu-vien/tai-lieu/:id/file/:idFile` | authenticate + kiểm tra quyền | stream/tải có quyền (CONG_KHAI/NOI_BO/HAN_CHE) |
| GET | `/thu-vien/tong-quan` | TU_LIEU_GET_ALL | thống kê theo `trang_thai`/`pham_vi` |

> Route order: path tĩnh + `/:id/xxx` trước `/:id`.

---

## PHẦN 4 — Storage, Phân lớp, Permission, Seed, Test

### 4.1 Storage (Task 4: tránh hồ sơ nhạy cảm trong `src/public`)
- **Ảnh bìa** `url_bia` → **public**: `UPLOAD_TYPE.THU_VIEN_BIA`, thư mục `src/public/uploads/THU_VIEN_BIA/<date>` (cổng dân hiện bia).
- **File nội dung** `thu_vien_tai_lieu_file.duong_dan` → **private**: `UPLOAD_TYPE.THU_VIEN`, `{ isPublic:false, basePathSegments:["src","private","uploads","thu-vien"] }`; lưu `duong_dan` là path **tương đối** so gốc private.
- **Download**: endpoint stream (reuse `createReadStream` + `Content-Disposition` + `stream.pipe`); resolve `duong_dan` + `path.basename()` chống path traversal. Không serve tĩnh.
- Thêm `UPLOAD_TYPE.THU_VIEN`, `UPLOAD_TYPE.THU_VIEN_BIA` vào `src/constants/upload.constant.js`.

### 4.2 Files tạo mới (lane chuẩn, mẫu `tin-tuc`)
- Routes: `thu-vien.route.js`, `thu-vien-public.route.js`, `thu-vien-danh-muc.route.js`, `thu-vien-tag.route.js`
- Controllers: `thu-vien.controller.js`, `thu-vien-danh-muc.controller.js`, `thu-vien-tag.controller.js`
- Services: `thu-vien.service.js`, `thu-vien-danh-muc.service.js`, `thu-vien-tag.service.js`
- Repositories (1/table): `thu-vien.repository.js`, `thu-vien-danh-muc.repository.js`, `thu-vien-tag.repository.js`, `thu-vien-tai-lieu-tag.repository.js`, `thu-vien-tai-lieu-file.repository.js`, `thu-vien-tai-lieu-quyen.repository.js`
- Mapper: `src/mapper/thu-vien.mapper.js` (`toTaiLieuResponse`, `toTaiLieuPublicResponse`, `toDanhMucResponse`, `toTagResponse`) — snake→camel, FE field: title/description/author/cover/downloads/docType/code/issuingAgency/issuedDate/effectiveDate/status/sections/content/tags/featured
- Validators: `src/validators/{thu-vien,thu-vien-danh-muc,thu-vien-tag}.validator.js` — Joi, lỗi tiếng Việt, camelCase, `validate(...)`
- Swagger: `src/schemas/thu-vien.schema.js` (`JoiToSwagger` + `addFileToJoiSchema`), `src/swagger/{thu-vien,thu-vien-danh-muc,thu-vien-tag}.swagger.js`, đăng ký `src/swagger/index.js`
- Test: `test/thu-vien.test.js` + `test/helpers/*`

Files sửa: `root.route.js` (mount), `permission.constant.js` (thêm TU_LIEU_*), `upload.constant.js` (thêm THU_VIEN*), `swagger/index.js` (register), `prisma/seed.js` (dữ liệu mẫu), `package.json` (supertest + script test).

### 4.3 Permission — `src/constants/permission.constant.js` (nguồn sự thật duy nhất)
```js
// PERMISSION
TU_LIEU_CREATE, TU_LIEU_UPDATE, TU_LIEU_DELETE, TU_LIEU_UPDATE_STATUS,
TU_LIEU_APPROVE, TU_LIEU_GET_ALL, TU_LIEU_GET_DETAIL
// PERMISSION_DESC (tiếng Việt — bắt buộc để audit_logs không nhận undefined)
TU_LIEU_CREATE:"Tạo tài liệu thư viện", TU_LIEU_UPDATE:"Cập nhật tài liệu thư viện",
TU_LIEU_DELETE:"Xóa tài liệu thư viện", TU_LIEU_UPDATE_STATUS:"Cập nhật trạng thái tài liệu",
TU_LIEU_APPROVE:"Duyệt tài liệu thư viện", TU_LIEU_GET_ALL:"Xem tất cả tài liệu thư viện",
TU_LIEU_GET_DETAIL:"Xem chi tiết tài liệu thư viện"
// PERMISSION_CATEGORIES
TU_LIEU: "Thư viện tài liệu"
// PERMISSION_TYPE — thêm APPROVE:"Duyệt"
```
Nạp lên DB: `POST /api/permission/sync` (basic auth) **hoặc** chạy `src/seeds/create-account.seed.js` (sync + ADMIN auto-grant). Role ≠ ADMIN gán lại bằng UI; user đăng nhập lại để JWT có code mới.

**Audit**: mọi route ghi `audit_logs(AUDIT_LOGS.{CREATE,UPDATE,DELETE}, PERMISSION_DESC.TU_LIEU_*)`; handler sẵn có tự xóa file upload nếu response lỗi.

### 4.4 Seeder — `prisma/seed.js`
Seed **đã tồn tại** cho 6 bảng. Bổ sung phủ data (upsert UUID cố định, idempotent):
- DA_DUYET + CONG_KHAI (đủ `nguoi_duyet`/`thoi_gian_duyet`/`nguon`, `sections`/`chuong`/`noi_dung` tra cứu, `so_luot_tai`>0, file private `duong_dan`)
- DA_DUYET + NOI_BO; DA_DUYET + HAN_CHE (link `thu_vien_tai_lieu_quyen` → role)
- CHO_DUYET (đủ `nguon` để duyệt được) / NHAP / LUU_TRU
- `thu_vien_tai_lieu_file` không có unique → dùng upsert theo `id` cứng, không `createMany`
- Chạy: `npx prisma db seed` (config ở `prisma.config.ts` → `prisma.seed`)

### 4.5 Test — `node:test` + `supertest`
- `package.json`: thêm `supertest` devDep; script `"test": "node --experimental-strip-types --test"`.
- Đảm bảo `src/app.js` **export app** (hoặc `createApp()`) để supertest boot in-process.
- `test/thu-vien.test.js` (dùng DB dev `UBND_DB_DEV`):
  1. Public search/filter/chi tiết; khẳng định không trả NHAP/CHO_DUYET/NOI_BO/HAN_CHE.
  2. Public download file; file HAN_CHE → 403/404.
  3. Admin upload + duyet → kiểm tra DB ghi `nguoi_duyet`/`thoi_gian_duyet`; duyet thiếu `nguon` → 400.
  4. Quyền truy cập: thiếu `TU_LIEU_*` → 403; tải HAN_CHE thiếu vai trò → 403.
- Test dùng dữ liệu riêng, cleanup xóa mềm sau.

---

## PHẦN 5 — (ĐANG CHỜ QUYẾT) Xử lý đa định dạng file & video

Thư viện cho upload **ảnh + video + PDF/DOCX**. Mô hình đề xuất:
- Mỗi `tài liệu` = record + **nhiều file đính kèm** (`thu_vien_tai_lieu_file`, mỗi file `dinh_dang` MIME + `phien_ban` + `la_phien_ban_hien_tai`).
- **Bìa** = ảnh đứng riêng (`url_bia`, public). **File nội dung** = private.
- PDF: stream xem online (Content-Type); DOCX/xls: down-only (không render).
- Ảnh: hiển thị inline (bia/minh họa).
- **Video**: đang chọn cách — (A) raw + stream byte-range / (B) tái dùng HLS/FFmpeg như phản ánh / (C) hoãn video.
- **Whitelist MIME** + giới hạn dung lượng: đang chọn — mở đủ (ảnh jpeg/png/webp/gif, pdf, doc/docx, xls/xlsx, txt, video mp4/mov/webm; bia ≤2MB, file ≤50MB, video ≤200MB) **hoặc** thu gọn (ảnh + pdf + doc/docx).

---

## PHẦN 6 — Verification (khi code xong)
1. `npm install` (supertest) → `npx prisma generate` → `npx prisma db seed`.
2. Sửa `permission.constant.js` → `POST /api/permission/sync` (hoặc chạy admin-account seed) → đăng nhập ADMIN.
3. `npm run dev`: gọi public qua Swagger/Postman (không token); admin create→duyet→pham-vi→quyen→download, kiểm tra audit_logs + file private không lộ tĩnh.
4. `npm test`.
5. (Chatbot) xác minh doc DA_DUYET đủ `nguon` + `nguoi_duyet` + `thoi_gian_duyet`.

---

## PHẦN 7 — Tích hợp FE (THAM CHIẾU — NGOÀI PHẠM VI, người khác đảm nhiệm)
- `src/apis/taiLieu.js` + sửa `src/services/libraryService.js` (`MOCK_MODE=false`) nối `/api/thu-vien/public/*`; bỏ comment placeholder `/api/library/search`.
- Field mock ↔ mapper `toTaiLieuResponse` khớp sẵn → UI ít đụng.
- NOI_BO/HAN_CHE nằm admin app, không lộ trên cổng dân public.