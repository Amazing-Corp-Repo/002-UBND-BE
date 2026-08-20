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
const originalDelete = LeaderMeetingScheduleRepository.deleteManagement;
const originalAudit = prisma.audit_logs.create;
let deleteArgs;

const token = (permissions = [PERMISSION.LMS_DELETE], roles = ["LANH_DAO"]) =>
  jwtUtils.signAccessToken(
    { id: leaderId, ten_dang_nhap: "leader", permissions, roles, cate: null },
    "127.0.0.1"
  );

const createServer = () => {
  const app = express();
  app.use("/api/leader-meeting-schedules", leaderMeetingScheduleRouter);
  app.use(errorHandler);
  return app.listen(0);
};

beforeEach(() => {
  deleteArgs = null;
  LeaderMeetingScheduleRepository.deleteManagement = async (...args) => {
    deleteArgs = args;
    return { deleted: true };
  };
  prisma.audit_logs.create = async () => ({ id: "audit" });
});

afterEach(() => {
  LeaderMeetingScheduleRepository.deleteManagement = originalDelete;
  prisma.audit_logs.create = originalAudit;
});

describe("DELETE /api/leader-meeting-schedules/management/:id", () => {
  it("documents soft deletion, ownership and registration guard", () => {
    const operation = LeaderMeetingScheduleSwagger[
      "/api/leader-meeting-schedules/management/{id}"
    ].delete;
    assert.match(operation.description, /xóa mềm/);
    assert.match(operation.description, /đúng lãnh đạo sở hữu/);
    assert.ok(operation.responses[409]);
  });

  it("soft deletes an owned schedule without registrations", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-schedules/management/${scheduleId}`,
        {
          method: "DELETE",
          headers: { authorization: `Bearer ${token()}` },
        }
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.deepEqual(deleteArgs, [scheduleId, leaderId]);
      assert.equal(body.data.deleted, true);
    } finally {
      server.close();
    }
  });

  it("returns 409 when registrations exist", async () => {
    LeaderMeetingScheduleRepository.deleteManagement = async () => ({
      conflict: "HAS_REGISTRATIONS",
    });
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-schedules/management/${scheduleId}`,
        { method: "DELETE", headers: { authorization: `Bearer ${token()}` } }
      );
      assert.equal(response.status, 409);
    } finally {
      server.close();
    }
  });

  it("returns 404 outside ownership and 403 for ADMIN-only role", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      LeaderMeetingScheduleRepository.deleteManagement = async () => ({ conflict: "NOT_FOUND" });
      const missing = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-schedules/management/${scheduleId}`,
        { method: "DELETE", headers: { authorization: `Bearer ${token()}` } }
      );
      const nonLeader = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-schedules/management/${scheduleId}`,
        { method: "DELETE", headers: { authorization: `Bearer ${token(undefined, ["ADMIN"])}` } }
      );
      assert.equal(missing.status, 404);
      assert.equal(nonLeader.status, 403);
    } finally {
      server.close();
    }
  });
});
