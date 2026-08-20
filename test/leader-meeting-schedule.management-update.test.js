import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import prisma from "../src/config/database.config.js";
import { PERMISSION } from "../src/constants/permission.constant.js";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import LeaderMeetingScheduleRepository from "../src/repositories/leader-meeting-schedule.repository.js";
import leaderMeetingScheduleRouter from "../src/routes/leader-meeting-schedule.route.js";
import LeaderMeetingScheduleSwagger from "../src/swagger/leader-meeting-schedule.swagger.js";
import jwtUtils from "../src/utils/jwt.util.js";

const leaderId = "123e4567-e89b-42d3-a456-426614174001";
const scheduleId = "223e4567-e89b-42d3-a456-426614174001";
const originalUpdate = LeaderMeetingScheduleRepository.updateManagement;
const originalDetail = LeaderMeetingScheduleRepository.findManagementDetail;
const originalAudit = prisma.audit_logs.create;
let updateArgs;

const token = (permissions = [PERMISSION.LMS_UPDATE]) =>
  jwtUtils.signAccessToken(
    { id: leaderId, ten_dang_nhap: "leader", permissions, roles: ["LANH_DAO"], cate: null },
    "127.0.0.1"
  );

const body = {
  receptionDate: "2099-08-26",
  location: "Phòng họp số 2",
  slots: [{ startTime: "13:30", endTime: "15:00" }],
};

const detail = {
  id: scheduleId,
  ngay: new Date("2099-08-26T00:00:00.000Z"),
  dia_diem: "Phòng họp số 2",
  ghi_chu: null,
  is_active: true,
  thoi_gian_tao: new Date(),
  thoi_gian_cap_nhat: new Date(),
  lanh_dao: { id: leaderId, ho_va_ten: "Nguyễn Văn An", email: null, so_dien_thoai: null },
  khung_gio_gap_lanh_dao: [{
    id: "323e4567-e89b-42d3-a456-426614174001",
    gio_bat_dau: "13:30",
    gio_ket_thuc: "15:00",
    suc_chua: 1,
    is_active: true,
    dang_ky_gap_lanh_dao: [],
  }],
};

const createServer = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/leader-meeting-schedules", leaderMeetingScheduleRouter);
  app.use(errorHandler);
  return app.listen(0);
};

beforeEach(() => {
  updateArgs = null;
  LeaderMeetingScheduleRepository.updateManagement = async (...args) => {
    updateArgs = args;
    return { updated: true };
  };
  LeaderMeetingScheduleRepository.findManagementDetail = async () => detail;
  prisma.audit_logs.create = async () => ({ id: "audit" });
});

afterEach(() => {
  LeaderMeetingScheduleRepository.updateManagement = originalUpdate;
  LeaderMeetingScheduleRepository.findManagementDetail = originalDetail;
  prisma.audit_logs.create = originalAudit;
});

describe("PUT /api/leader-meeting-schedules/management/:id", () => {
  it("documents ownership, held-registration guard and soft deletion", () => {
    const operation = LeaderMeetingScheduleSwagger[
      "/api/leader-meeting-schedules/management/{id}"
    ].put;
    assert.match(operation.description, /đúng lãnh đạo sở hữu/);
    assert.match(operation.description, /xóa mềm/);
    assert.ok(operation.responses[409]);
  });

  it("updates an owned schedule without registrations", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-schedules/management/${scheduleId}`,
        {
          method: "PUT",
          headers: { authorization: `Bearer ${token()}`, "content-type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const result = await response.json();

      assert.equal(response.status, 200);
      assert.equal(updateArgs[0], scheduleId);
      assert.equal(updateArgs[1], leaderId);
      assert.equal(result.data.receptionDate, "2099-08-26");
    } finally {
      server.close();
    }
  });

  it("returns 409 when the schedule has registrations", async () => {
    LeaderMeetingScheduleRepository.updateManagement = async () => ({
      conflict: "HAS_REGISTRATIONS",
    });
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-schedules/management/${scheduleId}`,
        {
          method: "PUT",
          headers: { authorization: `Bearer ${token()}`, "content-type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      assert.equal(response.status, 409);
    } finally {
      server.close();
    }
  });

  it("returns 404 outside ownership and 403 without permission", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      LeaderMeetingScheduleRepository.updateManagement = async () => ({ conflict: "NOT_FOUND" });
      const missing = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-schedules/management/${scheduleId}`,
        {
          method: "PUT",
          headers: { authorization: `Bearer ${token()}`, "content-type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const forbidden = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-schedules/management/${scheduleId}`,
        {
          method: "PUT",
          headers: { authorization: `Bearer ${token([])}`, "content-type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      assert.equal(missing.status, 404);
      assert.equal(forbidden.status, 403);
    } finally {
      server.close();
    }
  });
});
