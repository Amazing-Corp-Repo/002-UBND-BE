import assert from "node:assert/strict";
import test from "node:test";

import PHAN_ANH_MUC_DO, {
  getPhanAnhMucDoFilterValues,
  normalizePhanAnhMucDo,
} from "../src/constants/phan-anh-muc-do.constant.js";
import {
  CreatePhanAnhRequest,
  CreatePhanAnhPublicRequest,
} from "../src/validators/phan-anh.validator.js";

const validBaseRequest = {
  idLinhVucPhanAnh: "550e8400-e29b-41d4-a716-446655440000",
  tieuDe: "Tiêu đề phản ánh hợp lệ",
  moTa: "Nội dung mô tả phản ánh có đủ độ dài yêu cầu",
  viTri: "Đường số 1",
  mucDo: PHAN_ANH_MUC_DO.THONG_THUONG,
  khuPho: "Khu dân cư tự nhập - Tổ 3",
};

test("new complaint contract exposes exactly two severity levels", () => {
  assert.deepEqual(Object.values(PHAN_ANH_MUC_DO), [
    "Thông thường",
    "Khẩn cấp",
  ]);
});

test("legacy severity values are normalized without changing stored data", () => {
  assert.equal(normalizePhanAnhMucDo("Thấp"), "Thông thường");
  assert.equal(normalizePhanAnhMucDo("Trung bình"), "Thông thường");
  assert.equal(normalizePhanAnhMucDo("Cao"), "Thông thường");
  assert.equal(normalizePhanAnhMucDo("Khẩn cấp"), "Khẩn cấp");
  assert.deepEqual(getPhanAnhMucDoFilterValues("Thông thường"), [
    "Thông thường",
    "Thấp",
    "Trung bình",
    "Cao",
  ]);
});

test("authenticated create accepts free-text neighborhood", () => {
  const { error, value } = CreatePhanAnhRequest.validate(validBaseRequest);
  assert.equal(error, undefined);
  assert.equal(value.khuPho, "Khu dân cư tự nhập - Tổ 3");
});

test("public create accepts free-text neighborhood and rejects legacy severity", () => {
  const publicRequest = {
    ...validBaseRequest,
    tenNguoiPhanAnh: "Nguyễn Văn A",
    soDienThoaiNguoiPhanAnh: "0900000000",
  };
  assert.equal(CreatePhanAnhPublicRequest.validate(publicRequest).error, undefined);

  const legacyRequest = { ...publicRequest, mucDo: "Cao" };
  assert.match(
    CreatePhanAnhPublicRequest.validate(legacyRequest).error.message,
    /Thông thường hoặc Khẩn cấp/,
  );
});
