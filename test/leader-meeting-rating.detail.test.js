import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import { PERMISSION } from "../src/constants/permission.constant.js";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import Repository from "../src/repositories/leader-meeting-rating.repository.js";
import router from "../src/routes/leader-meeting-rating.route.js";
import Swagger from "../src/swagger/leader-meeting-rating.swagger.js";
import jwtUtils from "../src/utils/jwt.util.js";

const leaderId = "123e4567-e89b-42d3-a456-426614174001";
const ratingId = "723e4567-e89b-42d3-a456-426614174001";
const originalFind = Repository.findDetail;
let scopedLeaderId;
const token = (roles = ["LANH_DAO"], permissions = [PERMISSION.LMRT_GET_DETAIL]) =>
  jwtUtils.signAccessToken({ id: leaderId, ten_dang_nhap: "leader", roles, permissions, cate: null }, "127.0.0.1");
const fixture = {
  id: ratingId,
  diem_tong: 5,
  tieu_chi: null,
  nhan_xet: "Tôi rất hài lòng",
  thoi_gian_tao: new Date(),
  dang_ky_gap_lanh_dao: {
    id: "423e4567-e89b-42d3-a456-426614174004",
    ma_dang_ky: "LD000126",
    ngay_hen: new Date("2099-08-25"),
    ngay_lam_don: new Date("2099-08-20"),
    chu_de: "Kiến nghị",
    ly_do: "Đề nghị hướng dẫn",
    ho_ten: "Nguyễn Văn Bình",
    sdt: "0901234567",
    cccd: "012345678901",
    dia_chi: "Hà Tĩnh",
    trang_thai: "COMPLETED",
    thoi_gian_hoan_thanh: new Date(),
    khung_gio_gap_lanh_dao: {
      id: "323e4567-e89b-42d3-a456-426614174001",
      gio_bat_dau: "09:00",
      gio_ket_thuc: "10:30",
      lich_gap_lanh_dao: {
        id: "223e4567-e89b-42d3-a456-426614174001",
        dia_diem: "Phòng tiếp công dân",
        lanh_dao: { id: leaderId, ho_va_ten: "Nguyễn Văn An", email: null, so_dien_thoai: null },
      },
    },
  },
};
const createServer = () => { const app = express(); app.use("/api/leader-meeting-ratings", router); app.use(errorHandler); return app.listen(0); };
beforeEach(() => {
  scopedLeaderId = null;
  Repository.findDetail = async (_id, scope) => { scopedLeaderId = scope; return fixture; };
});
afterEach(() => { Repository.findDetail = originalFind; });

describe("GET /api/leader-meeting-ratings/:id", () => {
  it("documents permission, ownership and no counter data", () => {
    const operation = Swagger["/api/leader-meeting-ratings/{id}"].get;
    assert.match(operation.description, /LMRT_GET_DETAIL/);
    assert.match(operation.description, /không chứa dữ liệu quầy/);
    assert.equal(operation.parameters[0].schema.example, ratingId);
  });
  it("returns an owned rating detail", async () => {
    const server = createServer(); const { port } = server.address();
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/leader-meeting-ratings/${ratingId}`, { headers: { authorization: `Bearer ${token()}` } });
      const body = await response.json();
      assert.equal(response.status, 200); assert.equal(scopedLeaderId, leaderId);
      assert.equal(body.data.score, 5); assert.equal(body.data.registration.registrationCode, "LD000126");
      assert.equal("counterId" in body.data.registration, false);
    } finally { server.close(); }
  });
  it("allows ADMIN to view across leaders", async () => {
    const server = createServer(); const { port } = server.address();
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/leader-meeting-ratings/${ratingId}`, { headers: { authorization: `Bearer ${token(["ADMIN"])}` } });
      assert.equal(response.status, 200); assert.equal(scopedLeaderId, undefined);
    } finally { server.close(); }
  });
  it("returns 400 for invalid UUID, 403 without permission and 404 outside scope", async () => {
    const server = createServer(); const { port } = server.address(); const base = `http://127.0.0.1:${port}/api/leader-meeting-ratings`;
    try {
      const invalid = await fetch(`${base}/invalid`, { headers: { authorization: `Bearer ${token()}` } });
      const forbidden = await fetch(`${base}/${ratingId}`, { headers: { authorization: `Bearer ${token(["LANH_DAO"], [])}` } });
      Repository.findDetail = async () => null;
      const missing = await fetch(`${base}/${ratingId}`, { headers: { authorization: `Bearer ${token()}` } });
      assert.equal(invalid.status, 400); assert.equal(forbidden.status, 403); assert.equal(missing.status, 404);
    } finally { server.close(); }
  });
});
