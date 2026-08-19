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
const originalCountAll = ReceptionScheduleManagementRepository.countAll;
let capturedFilters;

const createToken = (permissions) =>
  jwtUtils.signAccessToken(
    {
      id: userId,
      ten_dang_nhap: "leader",
      permissions,
      cate: null,
      roles: ["LEADER"],
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
  capturedFilters = [];
  ReceptionScheduleManagementRepository.countAll = async (filters) => {
    capturedFilters.push(filters);
    if (filters.isActive === "true") return 9;
    if (filters.isActive === "false") return 3;
    return 12;
  };
});

afterEach(() => {
  ReceptionScheduleManagementRepository.countAll = originalCountAll;
});

describe("GET /api/reception-schedules/management/count", () => {
  it("documents authorization and the three counters in Swagger", () => {
    const operation =
      ReceptionScheduleManagementSwagger[
        "/api/reception-schedules/management/count"
      ].get;
    const dataSchema =
      operation.responses[200].content["application/json"].schema.properties
        .data;

    assert.deepEqual(operation.security, [{ bearerAuth: [] }]);
    assert.ok(operation.description.includes("LTD_GET_ALL"));
    assert.ok(dataSchema.properties.total);
    assert.ok(dataSchema.properties.active);
    assert.ok(dataSchema.properties.inactive);
  });

  it("returns total, active and inactive counts for one time filter", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-schedules/management/count?monthYear=8/2099`,
        {
          headers: {
            authorization: `Bearer ${createToken([PERMISSION.LTD_GET_ALL])}`,
          },
        }
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.deepEqual(body.data, { total: 12, active: 9, inactive: 3 });
      assert.equal(capturedFilters.length, 3);
      assert.ok(capturedFilters.every((item) => item.monthYear === "8/2099"));
    } finally {
      server.close();
    }
  });

  it("returns 400 for multiple time filters", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-schedules/management/count?weekYear=32/2099&date=2099-08-10`,
        {
          headers: {
            authorization: `Bearer ${createToken([PERMISSION.LTD_GET_ALL])}`,
          },
        }
      );
      assert.equal(response.status, 400);
      assert.equal(capturedFilters.length, 0);
    } finally {
      server.close();
    }
  });

  it("returns 400 when isActive is sent to the aggregate endpoint", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-schedules/management/count?isActive=true`,
        {
          headers: {
            authorization: `Bearer ${createToken([PERMISSION.LTD_GET_ALL])}`,
          },
        }
      );
      assert.equal(response.status, 400);
      assert.equal(capturedFilters.length, 0);
    } finally {
      server.close();
    }
  });

  it("returns 401 without an access token", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-schedules/management/count`
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
        `http://127.0.0.1:${port}/api/reception-schedules/management/count`,
        { headers: { authorization: `Bearer ${createToken([])}` } }
      );
      assert.equal(response.status, 403);
    } finally {
      server.close();
    }
  });
});
