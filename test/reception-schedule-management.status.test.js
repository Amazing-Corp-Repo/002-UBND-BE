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
const originalUpdateStatus =
  ReceptionScheduleManagementRepository.updateStatusIfAllowed;
const originalAuditCreate = prisma.audit_logs.create;
let repositoryStatus;
let capturedArguments;

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
  ReceptionScheduleManagementRepository.updateStatusIfAllowed = async (
    id,
    isActive,
    updateData
  ) => {
    capturedArguments = { id, isActive, updateData };
    if (repositoryStatus !== "UPDATED") return { status: repositoryStatus };
    return {
      status: "UPDATED",
      data: { id, is_active: isActive, is_delete: false, ...updateData },
    };
  };
});

beforeEach(() => {
  repositoryStatus = "UPDATED";
  capturedArguments = null;
});

after(async () => {
  await new Promise((resolve) => setImmediate(resolve));
  ReceptionScheduleManagementRepository.updateStatusIfAllowed =
    originalUpdateStatus;
  prisma.audit_logs.create = originalAuditCreate;
});

const requestStatus = async ({
  port,
  id = scheduleId,
  body = { isActive: false },
  permissions = [PERMISSION.LTD_UPDATE_STATUS],
}) =>
  fetch(
    `http://127.0.0.1:${port}/api/reception-schedules/management/${id}/status`,
    {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${createToken(permissions)}`,
      },
      body: JSON.stringify(body),
    }
  );

describe("PUT /api/reception-schedules/management/:id/status", () => {
  it("documents activation rules and all responses in Swagger", () => {
    const operation =
      ReceptionScheduleManagementSwagger[
        "/api/reception-schedules/management/{id}/status"
      ].put;

    assert.ok(operation.description.includes("LTD_UPDATE_STATUS"));
    assert.ok(operation.description.includes("cùng transaction"));
    assert.equal(operation.parameters[0].schema.format, "uuid");
    for (const status of [200, 400, 401, 403, 404, 409]) {
      assert.ok(operation.responses[status]);
    }
  });

  it("deactivates a schedule without registrations", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await requestStatus({ port });
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.data.is_active, false);
      assert.equal(capturedArguments.isActive, false);
      assert.equal(capturedArguments.updateData.nguoi_cap_nhat, userId);
    } finally {
      server.close();
    }
  });

  it("allows a schedule to be activated", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await requestStatus({
        port,
        body: { isActive: true },
      });
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.data.is_active, true);
      assert.equal(capturedArguments.isActive, true);
    } finally {
      server.close();
    }
  });

  it("returns 400 for an invalid schedule UUID", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await requestStatus({ port, id: "not-a-uuid" });
      assert.equal(response.status, 400);
      assert.equal(capturedArguments, null);
    } finally {
      server.close();
    }
  });

  it("returns 400 when isActive is missing", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await requestStatus({ port, body: {} });
      assert.equal(response.status, 400);
      assert.equal(capturedArguments, null);
    } finally {
      server.close();
    }
  });

  it("returns 404 when the schedule does not exist", async () => {
    repositoryStatus = "NOT_FOUND";
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await requestStatus({ port });
      assert.equal(response.status, 404);
    } finally {
      server.close();
    }
  });

  it("returns 409 when deactivating a schedule with registrations", async () => {
    repositoryStatus = "HAS_REGISTRATIONS";
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await requestStatus({ port });
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
        `http://127.0.0.1:${port}/api/reception-schedules/management/${scheduleId}/status`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ isActive: false }),
        }
      );
      assert.equal(response.status, 401);
    } finally {
      server.close();
    }
  });

  it("returns 403 without LTD_UPDATE_STATUS permission", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await requestStatus({ port, permissions: [] });
      assert.equal(response.status, 403);
    } finally {
      server.close();
    }
  });
});
