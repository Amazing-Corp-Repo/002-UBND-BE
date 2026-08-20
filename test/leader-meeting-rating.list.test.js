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
const originalFind = Repository.findAll;
let filters;
const token = (roles = ["LANH_DAO"], permissions = [PERMISSION.LMRT_GET_ALL]) =>
  jwtUtils.signAccessToken({ id: leaderId, ten_dang_nhap: "leader", roles, permissions, cate: null }, "127.0.0.1");
const fixture = {
  id: "723e4567-e89b-42d3-a456-426614174001",
  diem_tong: 5,
  ly_do: ["Lãnh đạo rất tận tình và chuyên nghiệp"],
  nhan_xet: "Tôi rất hài lòng",
  thoi_gian_tao: new Date(),
  dang_ky_gap_lanh_dao: {
    id: "423e4567-e89b-42d3-a456-426614174004",
    ma_dang_ky: "LD000126",
    ho_ten: "Nguyễn Văn Bình",
    ngay_hen: new Date("2099-08-25"),
    chu_de: "Kiến nghị",
    khung_gio_gap_lanh_dao: {
      gio_bat_dau: "09:00",
      gio_ket_thuc: "10:30",
      lich_gap_lanh_dao: {
        dia_diem: "Phòng tiếp công dân",
        lanh_dao: { id: leaderId, ho_va_ten: "Nguyễn Văn An" },
      },
    },
  },
};
const createServer = () => { const app = express(); app.use("/api/leader-meeting-ratings", router); app.use(errorHandler); return app.listen(0); };
beforeEach(() => {
  filters = null;
  Repository.findAll = async (input) => { filters = input; return { data: [fixture], totalItems: 1 }; };
});
afterEach(() => { Repository.findAll = originalFind; });

describe("GET /api/leader-meeting-ratings", () => {
  it("documents permission, filters and token-derived leader scope", () => {
    const operation = Swagger["/api/leader-meeting-ratings"].get;
    assert.match(operation.description, /LMRT_GET_ALL/);
    assert.match(operation.description, /access token/);
    assert.equal(operation.parameters.some((item) => item.name === "limit"), true);
  });
  it("scopes a leader and returns a paginated list", async () => {
    const server = createServer(); const { port } = server.address();
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/leader-meeting-ratings?score=5&page=1&limit=10`, { headers: { authorization: `Bearer ${token()}` } });
      const body = await response.json();
      assert.equal(response.status, 200); assert.equal(filters.leaderId, leaderId); assert.equal(filters.score, 5);
      assert.equal(body.data[0].registrationCode, "LD000126"); assert.equal(body.pagination.pageSize, 10);
    } finally { server.close(); }
  });
  it("allows ADMIN to filter another leader", async () => {
    const other = "223e4567-e89b-42d3-a456-426614174001";
    const server = createServer(); const { port } = server.address();
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/leader-meeting-ratings?leaderId=${other}`, { headers: { authorization: `Bearer ${token(["ADMIN"])}` } });
      assert.equal(response.status, 200); assert.equal(filters.leaderId, other);
    } finally { server.close(); }
  });
  it("returns 400 for an invalid range and 403 without permission", async () => {
    const server = createServer(); const { port } = server.address(); const base = `http://127.0.0.1:${port}/api/leader-meeting-ratings`;
    try {
      const invalid = await fetch(`${base}?fromDate=2099-09-01&toDate=2099-08-01`, { headers: { authorization: `Bearer ${token()}` } });
      const forbidden = await fetch(base, { headers: { authorization: `Bearer ${token(["LANH_DAO"], [])}` } });
      assert.equal(invalid.status, 400); assert.equal(forbidden.status, 403);
    } finally { server.close(); }
  });
});
