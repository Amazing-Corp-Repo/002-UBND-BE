import test from "node:test";
import assert from "node:assert/strict";
import PHAN_ANH_STATUS, { PHAN_ANH_LIFECYCLE_STATUS } from "../constants/phan-anh-status.constant.js";
import {
  getLatestPhanAnhLifecycleHistory,
  getPhanAnhDisplayHistory,
  getPhanAnhLifecycleHistory,
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

test("uses the latest lifecycle status when extension is the newest audit event", () => {
  const history = [
    { ten: PHAN_ANH_STATUS.DA_GIA_HAN, thoi_gian_tao: "2026-09-12T03:00:00.000Z" },
    { ten: PHAN_ANH_STATUS.DANG_XU_LY, thoi_gian_tao: "2026-09-12T02:00:00.000Z" },
    { ten: PHAN_ANH_STATUS.DA_GUI, thoi_gian_tao: "2026-09-12T01:00:00.000Z" },
  ];

  assert.deepEqual(getPhanAnhLifecycleHistory(history).map((item) => item.ten), ["Đang xử lý", "Đã gửi"]);
  assert.equal(getLatestPhanAnhLifecycleHistory(history)?.ten, PHAN_ANH_STATUS.DANG_XU_LY);
});

test("keeps an extension update visible without exposing a sixth status", () => {
  const history = [
    {
      ten: PHAN_ANH_STATUS.DA_GIA_HAN,
      ghi_chu: "Cần thêm thời gian phối hợp",
      thoi_gian_tao: "2026-09-12T03:00:00.000Z",
      nguoi_dung: { ho_va_ten: "Admin" },
    },
    { ten: PHAN_ANH_STATUS.DANG_XU_LY, thoi_gian_tao: "2026-09-12T02:00:00.000Z" },
  ];
  const displayed = getPhanAnhDisplayHistory(history);

  assert.equal(displayed[0].ten, PHAN_ANH_STATUS.DANG_XU_LY);
  assert.equal(displayed[0].ghi_chu, "Lý do gia hạn: Cần thêm thời gian phối hợp");
  assert.ok(displayed[0].is_gia_han);
  assert.equal(displayed[0].nguoi_dung.ho_va_ten, "Admin");
});

test("maps severity codes without changing the legacy stored values", () => {
  assert.equal(toDbPhanAnhMucDo("KHAN_CAP"), "Khẩn cấp");
  assert.equal(toApiPhanAnhMucDo("Thông thường"), "BINH_THUONG");
});
