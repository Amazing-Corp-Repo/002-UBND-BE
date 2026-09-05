import assert from "node:assert/strict";
import test from "node:test";

import {
  enrichPhanAnhResponse,
  toPublicPhanAnhResponse,
} from "../src/utils/phan-anh-response.util.js";

const complaint = {
  id: "internal-complaint-id",
  ma_phan_anh: "ABCD1234",
  tieu_de: "Phản ánh kiểm thử",
  mo_ta: "Nội dung phản ánh",
  muc_do: "Cao",
  khu_pho: "Khu phố do công dân nhập",
  sdt_nguoi_phan_anh: "0900000000",
  id_to: "internal-user-id",
  nguoi_cap_nhat: "internal-updater-id",
  lich_su_trang_thai: [
    { ten: "Đã giải quyết", thoi_gian_tao: "2026-09-05T00:00:00.000Z" },
  ],
  dinh_kem_phan_anh: [
    { id: "original", loai: "PHAN_ANH" },
    { id: "resolution", loai: "GIAI_QUYET" },
  ],
  videos_giai_quyet: [{ id: "video-resolution", status: "DONE" }],
  to_phu_trach: {
    id: "internal-user-id",
    ho_va_ten: "Nguyễn Văn Xử Lý",
    email: "internal@example.com",
  },
};

test("complaint response exposes normalized status and resolution media aliases", () => {
  const result = enrichPhanAnhResponse(complaint);
  assert.equal(result.muc_do, "Thông thường");
  assert.equal(result.trang_thai, "Đã giải quyết");
  assert.deepEqual(
    result.danh_sach_file_phan_anh.map((file) => file.id),
    ["original"],
  );
  assert.deepEqual(
    result.danh_sach_file_giai_quyet.map((file) => file.id),
    ["resolution"],
  );
  assert.equal(result.video_giai_quyet.id, "video-resolution");
});

test("public complaint response removes internal identifiers and contact phone", () => {
  const result = toPublicPhanAnhResponse(complaint);
  assert.equal(result.id, undefined);
  assert.equal(result.id_to, undefined);
  assert.equal(result.nguoi_cap_nhat, undefined);
  assert.equal(result.sdt_nguoi_phan_anh, undefined);
  assert.deepEqual(result.to_phu_trach, { ho_va_ten: "Nguyễn Văn Xử Lý" });
});
