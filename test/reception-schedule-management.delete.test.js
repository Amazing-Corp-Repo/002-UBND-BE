import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import express from "express";
import { PERMISSION } from "../src/constants/permission.constant.js";
import prisma from "../src/config/database.config.js";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import ReceptionScheduleManagementRepository from "../src/repositories/reception-schedule-management.repository.js";
import receptionScheduleManagementRouter from "../src/routes/reception-schedule-management.route.js";
import ReceptionScheduleManagementSwagger from "../src/swagger/reception-schedule-management.swagger.js";
import jwtUtils from "../src/utils/jwt.util.js";

const userId = "123e4567-e89b-42d3-a456-426614174000";
const scheduleId = "223e4567-e89b-42d3-a456-426614174000";
const originalSoftDelete =
  ReceptionScheduleManagementRepository.softDeleteIfNoRegistrations;
const originalAuditCreate = prisma.audit_logs.create;
let repositoryStatus;
let capturedUpdateData;

const createToken = (permissions) =>
  jwtUtils.signAccessToken(
    {
      id: userId,
      ten_dang_nhap: "admin",
      permissions,
      cate: null,
      roles: ["ADMIN"],
    },
    "127.0.0.1"
  );

const createTestServer = () => {
  const app = express();
  app.use(express.json());
  app.use(
    "/api/reception-schedules/management",
    receptionScheduleManagementRouter
  );
  app.use(errorHandler);
  return app.listen(0);
};

before(() => {
  prisma.audit_logs.create = async () => ({});
  ReceptionScheduleManagementRepository.softDeleteIfNoRegistrations = async (
    id,
    buildUpdateData
  ) => {
    if (repositoryStatus !== "DELETED") return { status: repositoryStatus };
    capturedUpdateData = buildUpdateData({ ten_can_bo: "Nguyễn Văn An" });
    return { status: "DELETED", data: { id, ...capturedUpdateData } };
  };
});

beforeEach(() => {
  repositoryStatus = "DELETED";
  capturedUpdateData = null;
});

after(async () => {
  await new Promise((resolve) => setImmediate(resolve));
  ReceptionScheduleManagementRepository.softDeleteIfNoRegistrations =
    originalSoftDelete;
  prisma.audit_logs.create = originalAuditCreate;
});

const requestDelete = async (port, id = scheduleId, permissions = [PERMISSION.LTD_DELETE]) =>
  fetch(
    `http://127.0.0.1:${port}/api/reception-schedules/management/${id}`,
    {
      method: "DELETE",
      headers: { authorization: `Bearer ${createToken(permissions)}` },
    }
  );

describe("DELETE /api/reception-schedules/management/:id", () => {
  it("documents deletion rules and all responses in Swagger", () => {
    const operation =
      ReceptionScheduleManagementSwagger[
        "/api/reception-schedules/management/{id}"
      ].delete;

    assert.ok(operation.description.includes("LTD_DELETE"));
    assert.ok(operation.description.includes("cùng transaction"));
    assert.equal(operation.parameters[0].schema.format, "uuid");
    for (const status of [200, 400, 401, 403, 404, 409]) {
      assert.ok(operation.responses[status]);
    }
  });

  it("soft deletes an inactive schedule without registrations", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await requestDelete(port);
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.data, null);
      assert.equal(capturedUpdateData.is_delete, true);
      assert.equal(capturedUpdateData.nguoi_cap_nhat, userId);
      assert.match(capturedUpdateData.ten_can_bo, /^[A-Z0-9]{8}_Nguyễn Văn An$/);
    } finally {
      server.close();
    }
  });

  it("returns 400 for an invalid schedule UUID", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await requestDelete(port, "not-a-uuid");
      assert.equal(response.status, 400);
      assert.equal(capturedUpdateData, null);
    } finally {
      server.close();
    }
  });

  it("returns 404 when the schedule does not exist", async () => {
    repositoryStatus = "NOT_FOUND";
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await requestDelete(port);
      assert.equal(response.status, 404);
    } finally {
      server.close();
    }
  });

  it("returns 409 when the schedule is active", async () => {
    repositoryStatus = "ACTIVE";
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await requestDelete(port);
      assert.equal(response.status, 409);
    } finally {
      server.close();
    }
  });

  it("returns 409 when registrations are already holding places", async () => {
    repositoryStatus = "HAS_REGISTRATIONS";
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await requestDelete(port);
      assert.equal(response.status, 409);
    } finally {
      server.close();
    }
  });

  it("returns 401 without an access token", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-schedules/management/${scheduleId}`,
        { method: "DELETE" }
      );
      assert.equal(response.status, 401);
    } finally {
      server.close();
    }
  });

  it("returns 403 without LTD_DELETE permission", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await requestDelete(port, scheduleId, []);
      assert.equal(response.status, 403);
    } finally {
      server.close();
    }
  });
});
