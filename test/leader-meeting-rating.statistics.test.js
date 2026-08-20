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
const originalStats = Repository.getStatistics;
let filters;
const token = (roles = ["LANH_DAO"], permissions = [PERMISSION.LMRT_GET_STATS]) =>
  jwtUtils.signAccessToken({ id: leaderId, ten_dang_nhap: "leader", roles, permissions, cate: null }, "127.0.0.1");
const leaderRow = (score) => ({
  diem_tong: score,
  dang_ky_gap_lanh_dao: {
    khung_gio_gap_lanh_dao: {
      lich_gap_lanh_dao: { lanh_dao: { id: leaderId, ho_va_ten: "Nguyễn Văn An" } },
    },
  },
});
const createServer = () => { const app = express(); app.use("/api/leader-meeting-ratings", router); app.use(errorHandler); return app.listen(0); };
beforeEach(() => {
  filters = null;
  Repository.getStatistics = async (input) => {
    filters = input;
    return {
      overall: { _count: { _all: 4 }, _avg: { diem_tong: 4.25 } },
      scoreGroups: [
        { diem_tong: 3, _count: { _all: 1 } },
        { diem_tong: 4, _count: { _all: 1 } },
        { diem_tong: 5, _count: { _all: 2 } },
      ],
      leaderRows: [leaderRow(3), leaderRow(4), leaderRow(5), leaderRow(5)],
    };
  };
});
afterEach(() => { Repository.getStatistics = originalStats; });

describe("GET /api/leader-meeting-ratings/statistics", () => {
  it("documents scope and all basic aggregates", () => {
    const operation = Swagger["/api/leader-meeting-ratings/statistics"].get;
    assert.match(operation.description, /LMRT_GET_STATS/);
    assert.match(operation.description, /tỷ lệ hài lòng/);
    assert.match(operation.description, /theo lãnh đạo/);
  });
  it("calculates statistics in the authenticated leader scope", async () => {
    const server = createServer(); const { port } = server.address();
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/leader-meeting-ratings/statistics`, { headers: { authorization: `Bearer ${token()}` } });
      const body = await response.json();
      assert.equal(response.status, 200); assert.equal(filters.leaderId, leaderId);
      assert.equal(body.data.totalRatings, 4); assert.equal(body.data.averageScore, 4.25);
      assert.equal(body.data.satisfactionRate, 75); assert.equal(body.data.scoreDistribution.length, 5);
      assert.equal(body.data.byLeader[0].averageScore, 4.25);
    } finally { server.close(); }
  });
  it("allows ADMIN to filter a leader and returns zero-safe statistics", async () => {
    Repository.getStatistics = async (input) => {
      filters = input;
      return { overall: { _count: { _all: 0 }, _avg: { diem_tong: null } }, scoreGroups: [], leaderRows: [] };
    };
    const other = "223e4567-e89b-42d3-a456-426614174001";
    const server = createServer(); const { port } = server.address();
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/leader-meeting-ratings/statistics?leaderId=${other}`, { headers: { authorization: `Bearer ${token(["ADMIN"])}` } });
      const body = await response.json();
      assert.equal(response.status, 200); assert.equal(filters.leaderId, other);
      assert.equal(body.data.averageScore, 0); assert.equal(body.data.satisfactionRate, 0);
    } finally { server.close(); }
  });
  it("returns 400 for an invalid range and 403 without permission", async () => {
    const server = createServer(); const { port } = server.address(); const base = `http://127.0.0.1:${port}/api/leader-meeting-ratings/statistics`;
    try {
      const invalid = await fetch(`${base}?fromDate=2099-09-01&toDate=2099-08-01`, { headers: { authorization: `Bearer ${token()}` } });
      const forbidden = await fetch(base, { headers: { authorization: `Bearer ${token(["LANH_DAO"], [])}` } });
      assert.equal(invalid.status, 400); assert.equal(forbidden.status, 403);
    } finally { server.close(); }
  });
});
