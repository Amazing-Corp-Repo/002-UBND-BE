import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import { PERMISSION } from "../src/constants/permission.constant.js";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import LeaderMeetingRegistrationRepository from "../src/repositories/leader-meeting-registration.repository.js";
import leaderMeetingRegistrationRouter from "../src/routes/leader-meeting-registration.route.js";
import LeaderMeetingRegistrationSwagger from "../src/swagger/leader-meeting-registration.swagger.js";
import jwtUtils from "../src/utils/jwt.util.js";

const leaderId = "123e4567-e89b-42d3-a456-426614174001";
const originalFind = LeaderMeetingRegistrationRepository.findManagement;
let filters;

const token = (roles = ["LANH_DAO"], permissions = [PERMISSION.LMR_GET_ALL]) =>
  jwtUtils.signAccessToken(
    { id: leaderId, ten_dang_nhap: "leader", permissions, roles, cate: null },
    "127.0.0.1"
  );

const fixture = {
  id: "423e4567-e89b-42d3-a456-426614174001",
  ma_dang_ky: "LD000123",
  ngay_hen: new Date("2099-08-25T00:00:00.000Z"),
  chu_de: "Kiến nghị",
  ho_ten: "Nguyễn Văn Bình",
  sdt: "0901234567",
  cccd: "012345678901",
  trang_thai: "PENDING",
  thoi_gian_phe_duyet: null,
  thoi_gian_bat_dau_xu_ly: null,
  thoi_gian_hoan_thanh: null,
  thoi_gian_tu_choi: null,
  thoi_gian_huy: null,
  thoi_gian_tao: new Date(),
  khung_gio_gap_lanh_dao: {
    id: "323e4567-e89b-42d3-a456-426614174001",
    gio_bat_dau: "09:00",
    gio_ket_thuc: "10:30",
    lich_gap_lanh_dao: {
      id: "223e4567-e89b-42d3-a456-426614174001",
      dia_diem: "Phòng tiếp công dân",
      lanh_dao: { id: leaderId, ho_va_ten: "Nguyễn Văn An" },
    },
  },
  danh_gia_gap_lanh_dao: null,
};

const createServer = () => {
  const app = express();
  app.use("/api/leader-meeting-registrations", leaderMeetingRegistrationRouter);
  app.use(errorHandler);
  return app.listen(0);
};

beforeEach(() => {
  filters = null;
  LeaderMeetingRegistrationRepository.findManagement = async (input) => {
    filters = input;
    return { data: [fixture], totalItems: 1 };
  };
});

afterEach(() => {
  LeaderMeetingRegistrationRepository.findManagement = originalFind;
});

describe("GET /api/leader-meeting-registrations", () => {
  it("documents all filters and token-derived scope", () => {
    const operation = LeaderMeetingRegistrationSwagger[
      "/api/leader-meeting-registrations"
    ].get;
    assert.match(operation.description, /LMR_GET_ALL/);
    assert.match(operation.description, /access token/);
    assert.equal(operation.parameters.some((item) => item.name === "limit"), true);
  });

  it("limits a leader to registrations assigned to that leader", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-registrations?status=PENDING&page=1&limit=10`,
        { headers: { authorization: `Bearer ${token()}` } }
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(filters.leaderId, leaderId);
      assert.equal(filters.status, "PENDING");
      assert.equal(body.data[0].registrationCode, "LD000123");
      assert.equal(body.pagination.pageSize, 10);
    } finally {
      server.close();
    }
  });

  it("allows ADMIN to filter another leader", async () => {
    const otherLeader = "523e4567-e89b-42d3-a456-426614174001";
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-registrations?leaderId=${otherLeader}`,
        { headers: { authorization: `Bearer ${token(["ADMIN"])}` } }
      );
      assert.equal(response.status, 200);
      assert.equal(filters.leaderId, otherLeader);
    } finally {
      server.close();
    }
  });

  it("returns 400 for invalid date range and 403 without permission", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const invalid = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-registrations?fromDate=2099-09-01&toDate=2099-08-01`,
        { headers: { authorization: `Bearer ${token()}` } }
      );
      const forbidden = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-registrations`,
        { headers: { authorization: `Bearer ${token(["LANH_DAO"], [])}` } }
      );
      assert.equal(invalid.status, 400);
      assert.equal(forbidden.status, 403);
    } finally {
      server.close();
    }
  });
});
