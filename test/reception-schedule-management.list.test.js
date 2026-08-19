import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import { PERMISSION } from "../src/constants/permission.constant.js";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import ReceptionScheduleManagementRepository from "../src/repositories/reception-schedule-management.repository.js";
import receptionScheduleManagementRouter from "../src/routes/reception-schedule-management.route.js";
import ReceptionScheduleManagementSwagger from "../src/swagger/reception-schedule-management.swagger.js";
import jwtUtils from "../src/utils/jwt.util.js";

const userId = "123e4567-e89b-42d3-a456-426614174000";
const originalFindAll = ReceptionScheduleManagementRepository.findAll;
let capturedFilters;

const createToken = (permissions) =>
  jwtUtils.signAccessToken(
    {
      id: userId,
      ten_dang_nhap: "staff",
      permissions,
      cate: null,
      roles: ["STAFF"],
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

beforeEach(() => {
  capturedFilters = null;
  ReceptionScheduleManagementRepository.findAll = async (filters) => {
    capturedFilters = filters;
    return [
      {
        id: "323e4567-e89b-42d3-a456-426614174000",
        ngay_tiep_dan: new Date("2099-08-26T00:00:00.000Z"),
        thoi_gian: "13:30 - 16:30",
        is_active: true,
      },
      {
        id: "223e4567-e89b-42d3-a456-426614174000",
        ngay_tiep_dan: new Date("2099-08-25T00:00:00.000Z"),
        thoi_gian: "07:30 - 11:30",
        is_active: true,
      },
    ];
  };
});

afterEach(() => {
  ReceptionScheduleManagementRepository.findAll = originalFindAll;
});

describe("GET /api/reception-schedules/management", () => {
  it("documents authorization, filters and response in Swagger", () => {
    const operation =
      ReceptionScheduleManagementSwagger[
        "/api/reception-schedules/management"
      ].get;

    assert.deepEqual(operation.security, [{ bearerAuth: [] }]);
    assert.ok(operation.description.includes("LTD_GET_ALL"));
    assert.equal(
      operation.responses[200].content["application/json"].schema.properties
        .data.type,
      "array"
    );
    assert.ok(operation.responses[400]);
    assert.ok(operation.responses[401]);
    assert.ok(operation.responses[403]);
  });

  it("returns a filtered and sorted management list", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-schedules/management?monthYear=8/2099&isActive=true`,
        {
          headers: {
            authorization: `Bearer ${createToken([PERMISSION.LTD_GET_ALL])}`,
          },
        }
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.success, true);
      assert.equal(body.data[0].id, "223e4567-e89b-42d3-a456-426614174000");
      assert.equal(capturedFilters.monthYear, "8/2099");
      assert.equal(capturedFilters.isActive, "true");
    } finally {
      server.close();
    }
  });

  it("returns 400 for multiple time filters", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-schedules/management?monthYear=8/2099&date=2099-08-25`,
        {
          headers: {
            authorization: `Bearer ${createToken([PERMISSION.LTD_GET_ALL])}`,
          },
        }
      );

      assert.equal(response.status, 400);
      assert.equal(capturedFilters, null);
    } finally {
      server.close();
    }
  });

  it("returns 400 for an impossible calendar date", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-schedules/management?date=2099-02-30`,
        {
          headers: {
            authorization: `Bearer ${createToken([PERMISSION.LTD_GET_ALL])}`,
          },
        }
      );

      assert.equal(response.status, 400);
      assert.equal(capturedFilters, null);
    } finally {
      server.close();
    }
  });

  it("returns 401 without an access token", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-schedules/management`
      );

      assert.equal(response.status, 401);
    } finally {
      server.close();
    }
  });

  it("returns 403 without LTD_GET_ALL permission", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-schedules/management`,
        {
          headers: { authorization: `Bearer ${createToken([])}` },
        }
      );

      assert.equal(response.status, 403);
    } finally {
      server.close();
    }
  });
});
