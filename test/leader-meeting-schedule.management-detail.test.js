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
const scheduleId = "223e4567-e89b-42d3-a456-426614174001";
const originalFind = LeaderMeetingScheduleRepository.findManagementDetail;
let capturedLeaderId;

const token = (permissions = [PERMISSION.LMS_GET_DETAIL], roles = ["LANH_DAO"]) =>
  jwtUtils.signAccessToken(
    { id: leaderId, ten_dang_nhap: "leader", permissions, roles, cate: null },
    "127.0.0.1"
  );

const fixture = {
  id: scheduleId,
  ngay: new Date("2099-08-25T00:00:00.000Z"),
  dia_diem: "Phòng tiếp công dân",
  ghi_chu: null,
  is_active: true,
  thoi_gian_tao: new Date(),
  thoi_gian_cap_nhat: null,
  lanh_dao: {
    id: leaderId,
    ho_va_ten: "Nguyễn Văn An",
    email: "leader@example.com",
    so_dien_thoai: "0901234567",
  },
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
  capturedLeaderId = null;
  LeaderMeetingScheduleRepository.findManagementDetail = async (_id, scopedLeaderId) => {
    capturedLeaderId = scopedLeaderId;
    return fixture;
  };
});

afterEach(() => {
  LeaderMeetingScheduleRepository.findManagementDetail = originalFind;
});

describe("GET /api/leader-meeting-schedules/management/:id", () => {
  it("documents scope, permission and a real UUID example", () => {
    const operation = LeaderMeetingScheduleSwagger[
      "/api/leader-meeting-schedules/management/{id}"
    ].get;
    assert.match(operation.description, /LMS_GET_DETAIL/);
    assert.match(operation.description, /không chứa dữ liệu quầy/);
    assert.equal(operation.parameters[0].schema.example, scheduleId);
  });

  it("returns owned schedule detail with slot status summary", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-schedules/management/${scheduleId}`,
        { headers: { authorization: `Bearer ${token()}` } }
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(capturedLeaderId, leaderId);
      assert.equal(body.data.slots[0].heldCount, 1);
      assert.equal(body.data.slots[0].statusSummary.PENDING, 1);
      assert.equal("counterId" in body.data, false);
    } finally {
      server.close();
    }
  });

  it("allows ADMIN detail scope across leaders", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-schedules/management/${scheduleId}`,
        { headers: { authorization: `Bearer ${token(undefined, ["ADMIN"])}` } }
      );
      assert.equal(response.status, 200);
      assert.equal(capturedLeaderId, undefined);
    } finally {
      server.close();
    }
  });

  it("returns 400 for invalid UUID, 403 without permission and 404 outside scope", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const invalid = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-schedules/management/invalid`,
        { headers: { authorization: `Bearer ${token()}` } }
      );
      const forbidden = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-schedules/management/${scheduleId}`,
        { headers: { authorization: `Bearer ${token([])}` } }
      );
      LeaderMeetingScheduleRepository.findManagementDetail = async () => null;
      const missing = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-schedules/management/${scheduleId}`,
        { headers: { authorization: `Bearer ${token()}` } }
      );

      assert.equal(invalid.status, 400);
      assert.equal(forbidden.status, 403);
      assert.equal(missing.status, 404);
    } finally {
      server.close();
    }
  });
});
