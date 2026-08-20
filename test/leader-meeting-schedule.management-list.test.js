import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import { PERMISSION } from "../src/constants/permission.constant.js";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import LeaderMeetingScheduleRepository from "../src/repositories/leader-meeting-schedule.repository.js";
import leaderMeetingScheduleRouter from "../src/routes/leader-meeting-schedule.route.js";
import LeaderMeetingScheduleSwagger from "../src/swagger/leader-meeting-schedule.swagger.js";
import jwtUtils from "../src/utils/jwt.util.js";

const leaderId = "123e4567-e89b-42d3-a456-426614174001";
const originalFind = LeaderMeetingScheduleRepository.findManagement;
let capturedFilters;

const token = ({ roles = ["LANH_DAO"], permissions = [PERMISSION.LMS_GET_ALL] } = {}) =>
  jwtUtils.signAccessToken(
    {
      id: leaderId,
      ten_dang_nhap: "leader",
      permissions,
      roles,
      cate: null,
    },
    "127.0.0.1"
  );

const fixture = {
  id: "223e4567-e89b-42d3-a456-426614174001",
  ngay: new Date("2099-08-25T00:00:00.000Z"),
  dia_diem: "Phòng tiếp công dân",
  ghi_chu: null,
  is_active: true,
  thoi_gian_tao: new Date("2099-08-20T00:00:00.000Z"),
  thoi_gian_cap_nhat: null,
  lanh_dao: { id: leaderId, ho_va_ten: "Nguyễn Văn An" },
  khung_gio_gap_lanh_dao: [{
    id: "323e4567-e89b-42d3-a456-426614174001",
    gio_bat_dau: "09:00",
    gio_ket_thuc: "10:30",
    suc_chua: 1,
    is_active: true,
    dang_ky_gap_lanh_dao: [{ id: "registration", trang_thai: "PENDING" }],
  }],
};

const createServer = () => {
  const app = express();
  app.use("/api/leader-meeting-schedules", leaderMeetingScheduleRouter);
  app.use(errorHandler);
  return app.listen(0);
};

beforeEach(() => {
  capturedFilters = null;
  LeaderMeetingScheduleRepository.findManagement = async (filters) => {
    capturedFilters = filters;
    return { data: [fixture], totalItems: 1 };
  };
});

afterEach(() => {
  LeaderMeetingScheduleRepository.findManagement = originalFind;
});

describe("GET /api/leader-meeting-schedules/management", () => {
  it("documents permission and token-derived scope in Vietnamese", () => {
    const operation = LeaderMeetingScheduleSwagger[
      "/api/leader-meeting-schedules/management"
    ].get;
    assert.match(operation.description, /LMS_GET_ALL/);
    assert.match(operation.description, /không nhận leaderId từ client/);
    assert.deepEqual(operation.security, [{ bearerAuth: [] }]);
  });

  it("limits a leader to schedules owned by the token user", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-schedules/management?page=1&size=10&isActive=true`,
        { headers: { authorization: `Bearer ${token()}` } }
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(capturedFilters.leaderId, leaderId);
      assert.equal(body.data[0].registrationCount, 1);
      assert.equal(body.data[0].statusSummary.PENDING, 1);
      assert.equal(body.pagination.totalItems, 1);
    } finally {
      server.close();
    }
  });

  it("allows ADMIN to query all leaders without accepting a leaderId", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-schedules/management?leaderId=ignored`,
        { headers: { authorization: `Bearer ${token({ roles: ["ADMIN"] })}` } }
      );

      assert.equal(response.status, 200);
      assert.equal(capturedFilters.leaderId, undefined);
      assert.equal("leaderId" in capturedFilters, true);
    } finally {
      server.close();
    }
  });

  it("returns 401 without token and 403 without permission", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const noToken = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-schedules/management`
      );
      const forbidden = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-schedules/management`,
        { headers: { authorization: `Bearer ${token({ permissions: [] })}` } }
      );
      assert.equal(noToken.status, 401);
      assert.equal(forbidden.status, 403);
    } finally {
      server.close();
    }
  });

  it("returns 400 when the date range is invalid", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-schedules/management?fromDate=2099-09-01&toDate=2099-08-01`,
        { headers: { authorization: `Bearer ${token()}` } }
      );
      assert.equal(response.status, 400);
      assert.equal(capturedFilters, null);
    } finally {
      server.close();
    }
  });
});
