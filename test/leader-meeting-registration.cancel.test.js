import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import prisma from "../src/config/database.config.js";
import { PERMISSION } from "../src/constants/permission.constant.js";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import Repository from "../src/repositories/leader-meeting-registration.repository.js";
import router from "../src/routes/leader-meeting-registration.route.js";
import Swagger from "../src/swagger/leader-meeting-registration.swagger.js";
import jwtUtils from "../src/utils/jwt.util.js";

const leaderId = "123e4567-e89b-42d3-a456-426614174001";
const id = "423e4567-e89b-42d3-a456-426614174005";
const originals = { find: Repository.findManagementDetail, cancel: Repository.cancelApproved, audit: prisma.audit_logs.create };
let args;
const token = (permissions = [PERMISSION.LMR_CANCEL], roles = ["LANH_DAO"]) =>
  jwtUtils.signAccessToken({ id: leaderId, ten_dang_nhap: "leader", permissions, roles, cate: null }, "127.0.0.1");
const detail = (status) => ({
  id, ma_dang_ky: "LD000127", ngay_hen: new Date("2099-08-25"), ngay_lam_don: new Date("2099-08-20"),
  chu_de: "Kiến nghị", ly_do: "Đề nghị hướng dẫn", ho_ten: "Nguyễn Văn Bình", sdt: "0901234567",
  cccd: "012345678901", ngay_cap_cccd: null, noi_cap_cccd: null, dia_chi: "Hà Tĩnh", trang_thai: status,
  ly_do_tu_choi: null, ly_do_huy: status === "CANCELED" ? "Lãnh đạo có lịch công tác đột xuất" : null,
  ghi_chu_xu_ly: null, ghi_chu_hoan_thanh: null, thoi_gian_phe_duyet: new Date(),
  thoi_gian_bat_dau_xu_ly: null, thoi_gian_hoan_thanh: null, thoi_gian_tu_choi: null,
  thoi_gian_huy: status === "CANCELED" ? new Date() : null, thoi_gian_tao: new Date(), thoi_gian_cap_nhat: new Date(),
  khung_gio_gap_lanh_dao: { id: "323e4567-e89b-42d3-a456-426614174001", gio_bat_dau: "09:00", gio_ket_thuc: "10:30",
    lich_gap_lanh_dao: { id: "223e4567-e89b-42d3-a456-426614174001", ngay: new Date("2099-08-25"), dia_diem: "Phòng tiếp công dân", ghi_chu: null,
      lanh_dao: { id: leaderId, ho_va_ten: "Nguyễn Văn An", email: null, so_dien_thoai: null } } },
  nguoi_duyet: { id: leaderId, ho_va_ten: "Nguyễn Văn An" }, nguoi_bat_dau_xu_ly_ref: null,
  nguoi_hoan_thanh_ref: null, nguoi_tu_choi_ref: null,
  nguoi_huy_ref: status === "CANCELED" ? { id: leaderId, ho_va_ten: "Nguyễn Văn An" } : null,
  dinh_kem_dang_ky_gap_lanh_dao: [], danh_gia_gap_lanh_dao: null,
});
const server = () => { const app = express(); app.use(express.json()); app.use("/api/leader-meeting-registrations", router); app.use(errorHandler); return app.listen(0); };

beforeEach(() => {
  args = null;
  Repository.findManagementDetail = async () => detail("APPROVED");
  Repository.cancelApproved = async (...input) => { args = input; return detail("CANCELED"); };
  prisma.audit_logs.create = async () => ({ id: "audit" });
});
afterEach(() => { Repository.findManagementDetail = originals.find; Repository.cancelApproved = originals.cancel; prisma.audit_logs.create = originals.audit; });

describe("PATCH /api/leader-meeting-registrations/:id/cancel", () => {
  it("documents leader-only cancellation and no-refund rule", () => {
    const operation = Swagger["/api/leader-meeting-registrations/{id}/cancel"].patch;
    assert.match(operation.description, /LMR_CANCEL/);
    assert.match(operation.description, /ADMIN và APPROVER không được hủy thay/);
    assert.match(operation.description, /không được hoàn lại/);
  });
  it("cancels an owned approved registration and validates errors", async () => {
    const app = server(); const { port } = app.address(); const url = `http://127.0.0.1:${port}/api/leader-meeting-registrations/${id}/cancel`;
    try {
      const ok = await fetch(url, { method: "PATCH", headers: { authorization: `Bearer ${token()}`, "content-type": "application/json" }, body: JSON.stringify({ reason: "Lãnh đạo có lịch công tác đột xuất" }) });
      const body = await ok.json();
      assert.equal(ok.status, 200); assert.equal(body.data.status, "CANCELED"); assert.equal(args[1], leaderId); assert.equal(args[2].nguoi_huy, leaderId);
      const missing = await fetch(url, { method: "PATCH", headers: { authorization: `Bearer ${token()}`, "content-type": "application/json" }, body: "{}" });
      const admin = await fetch(url, { method: "PATCH", headers: { authorization: `Bearer ${token([PERMISSION.LMR_CANCEL], ["ADMIN"])}`, "content-type": "application/json" }, body: JSON.stringify({ reason: "Lý do hợp lệ" }) });
      assert.equal(missing.status, 400);
      assert.equal(admin.status, 403);
    } finally { app.close(); }
  });
});
