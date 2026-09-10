import test from "node:test";
import assert from "node:assert/strict";
import PHAN_ANH_STATUS, { PHAN_ANH_LIFECYCLE_STATUS } from "../constants/phan-anh-status.constant.js";
import {
  toApiPhanAnhMucDo,
  toApiPhanAnhStatus,
  toDbPhanAnhMucDo,
  toDbPhanAnhStatus,
} from "./phan-anh-status.util.js";

test("maps canonical complaint status codes to legacy Vietnamese database values", () => {
  assert.equal(toDbPhanAnhStatus("DA_GUI"), "Đã gửi");
  assert.equal(toDbPhanAnhStatus("TU_CHOI"), "Từ chối");
  assert.equal(toApiPhanAnhStatus("Đang xử lý"), "DANG_XU_LY");
  assert.equal(toApiPhanAnhStatus("Đã gia hạn"), "DA_GIA_HAN");
});

test("keeps extension history event out of normal complaint lifecycle", () => {
  assert.ok(PHAN_ANH_LIFECYCLE_STATUS.includes(PHAN_ANH_STATUS.TU_CHOI));
  assert.ok(!PHAN_ANH_LIFECYCLE_STATUS.includes(PHAN_ANH_STATUS.DA_GIA_HAN));
});

test("maps severity codes without changing the legacy stored values", () => {
  assert.equal(toDbPhanAnhMucDo("KHAN_CAP"), "Khẩn cấp");
  assert.equal(toApiPhanAnhMucDo("Thông thường"), "BINH_THUONG");
});
