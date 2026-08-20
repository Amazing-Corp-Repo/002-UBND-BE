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
const originalCreate = LeaderMeetingScheduleRepository.createManagement;
const originalDetail = LeaderMeetingScheduleRepository.findManagementDetail;
const originalAudit = prisma.audit_logs.create;
let createInput;

const token = (roles = ["LANH_DAO"], permissions = [PERMISSION.LMS_CREATE]) =>
  jwtUtils.signAccessToken(
    { id: leaderId, ten_dang_nhap: "leader", permissions, roles, cate: null },
    "127.0.0.1"
  );

const detailFixture = {
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
    email: null,
    so_dien_thoai: null,
  },
  khung_gio_gap_lanh_dao: [{
    id: "323e4567-e89b-42d3-a456-426614174001",
    gio_bat_dau: "09:00",
    gio_ket_thuc: "10:30",
    suc_chua: 1,
    is_active: true,
    dang_ky_gap_lanh_dao: [],
  }],
};

const validBody = {
  receptionDate: "2099-08-25",
  location: "Phòng tiếp công dân",
  slots: [{ startTime: "09:00", endTime: "10:30" }],
};

const createServer = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/leader-meeting-schedules", leaderMeetingScheduleRouter);
  app.use(errorHandler);
  return app.listen(0);
};

beforeEach(() => {
  createInput = null;
  LeaderMeetingScheduleRepository.createManagement = async (input) => {
    createInput = input;
    return { id: scheduleId };
  };
  LeaderMeetingScheduleRepository.findManagementDetail = async () => detailFixture;
  prisma.audit_logs.create = async () => ({ id: "audit" });
});

afterEach(() => {
  LeaderMeetingScheduleRepository.createManagement = originalCreate;
  LeaderMeetingScheduleRepository.findManagementDetail = originalDetail;
  prisma.audit_logs.create = originalAudit;
});

describe("POST /api/leader-meeting-schedules/management", () => {
  it("documents token-derived leader, default capacity and custom slots", () => {
    const operation = LeaderMeetingScheduleSwagger[
      "/api/leader-meeting-schedules/management"
    ].post;
    assert.match(operation.description, /không nhận leaderId từ body/);
    assert.match(operation.description, /sức chứa mặc định 1/);
    assert.ok(operation.requestBody.content["application/json"].examples.valid);
  });

  it("creates a schedule for the authenticated leader", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-schedules/management`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${token()}`,
            "content-type": "application/json",
          },
          body: JSON.stringify(validBody),
        }
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(createInput.leaderId, leaderId);
      assert.equal(createInput.slots[0].startTime, "09:00");
      assert.equal(body.data.slots[0].capacity, 1);
    } finally {
      server.close();
    }
  });

  it("rejects overlapping slots and a non-leader role", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const overlap = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-schedules/management`,
        {
          method: "POST",
          headers: { authorization: `Bearer ${token()}`, "content-type": "application/json" },
          body: JSON.stringify({
            ...validBody,
            slots: [
              { startTime: "08:00", endTime: "09:30" },
              { startTime: "09:00", endTime: "10:30" },
            ],
          }),
        }
      );
      const nonLeader = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-schedules/management`,
        {
          method: "POST",
          headers: { authorization: `Bearer ${token(["ADMIN"])}`, "content-type": "application/json" },
          body: JSON.stringify(validBody),
        }
      );

      assert.equal(overlap.status, 400);
      assert.equal(nonLeader.status, 403);
    } finally {
      server.close();
    }
  });

  it("returns 409 when the leader already has a schedule that day", async () => {
    LeaderMeetingScheduleRepository.createManagement = async () => {
      const error = new Error("unique");
      error.code = "P2002";
      throw error;
    };
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-schedules/management`,
        {
          method: "POST",
          headers: { authorization: `Bearer ${token()}`, "content-type": "application/json" },
          body: JSON.stringify(validBody),
        }
      );
      assert.equal(response.status, 409);
    } finally {
      server.close();
    }
  });
});
