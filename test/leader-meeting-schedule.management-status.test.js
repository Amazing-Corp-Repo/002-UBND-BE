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
const originalStatus = LeaderMeetingScheduleRepository.updateManagementStatus;
const originalDetail = LeaderMeetingScheduleRepository.findManagementDetail;
const originalAudit = prisma.audit_logs.create;
let statusArgs;

const token = (permissions = [PERMISSION.LMS_UPDATE_STATUS]) =>
  jwtUtils.signAccessToken(
    { id: leaderId, ten_dang_nhap: "leader", permissions, roles: ["LANH_DAO"], cate: null },
    "127.0.0.1"
  );

const detail = {
  id: scheduleId,
  ngay: new Date("2099-08-26T00:00:00.000Z"),
  dia_diem: null,
  ghi_chu: null,
  is_active: false,
  thoi_gian_tao: new Date(),
  thoi_gian_cap_nhat: new Date(),
  lanh_dao: { id: leaderId, ho_va_ten: "Nguyễn Văn An", email: null, so_dien_thoai: null },
  khung_gio_gap_lanh_dao: [],
};

const createServer = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/leader-meeting-schedules", leaderMeetingScheduleRouter);
  app.use(errorHandler);
  return app.listen(0);
};

beforeEach(() => {
  statusArgs = null;
  LeaderMeetingScheduleRepository.updateManagementStatus = async (...args) => {
    statusArgs = args;
    return { updated: true };
  };
  LeaderMeetingScheduleRepository.findManagementDetail = async () => detail;
  prisma.audit_logs.create = async () => ({ id: "audit" });
});

afterEach(() => {
  LeaderMeetingScheduleRepository.updateManagementStatus = originalStatus;
  LeaderMeetingScheduleRepository.findManagementDetail = originalDetail;
  prisma.audit_logs.create = originalAudit;
});

describe("PUT /api/leader-meeting-schedules/management/:id/status", () => {
  it("documents ownership and held-registration rule", () => {
    const operation = LeaderMeetingScheduleSwagger[
      "/api/leader-meeting-schedules/management/{id}/status"
    ].put;
    assert.match(operation.description, /LMS_UPDATE_STATUS/);
    assert.match(operation.description, /đăng ký giữ chỗ/);
    assert.ok(operation.requestBody.content["application/json"].examples.disable);
  });

  it("disables an owned schedule", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-schedules/management/${scheduleId}/status`,
        {
          method: "PUT",
          headers: { authorization: `Bearer ${token()}`, "content-type": "application/json" },
          body: JSON.stringify({ isActive: false }),
        }
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.deepEqual(statusArgs, [scheduleId, leaderId, false]);
      assert.equal(body.data.isActive, false);
    } finally {
      server.close();
    }
  });

  it("returns 409 with registrations and 403 without permission", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      LeaderMeetingScheduleRepository.updateManagementStatus = async () => ({
        conflict: "HAS_REGISTRATIONS",
      });
      const conflict = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-schedules/management/${scheduleId}/status`,
        {
          method: "PUT",
          headers: { authorization: `Bearer ${token()}`, "content-type": "application/json" },
          body: JSON.stringify({ isActive: false }),
        }
      );
      const forbidden = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-schedules/management/${scheduleId}/status`,
        {
          method: "PUT",
          headers: { authorization: `Bearer ${token([])}`, "content-type": "application/json" },
          body: JSON.stringify({ isActive: false }),
        }
      );
      assert.equal(conflict.status, 409);
      assert.equal(forbidden.status, 403);
    } finally {
      server.close();
    }
  });

  it("returns 400 when isActive is missing", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-schedules/management/${scheduleId}/status`,
        {
          method: "PUT",
          headers: { authorization: `Bearer ${token()}`, "content-type": "application/json" },
          body: JSON.stringify({}),
        }
      );
      assert.equal(response.status, 400);
    } finally {
      server.close();
    }
  });
});
