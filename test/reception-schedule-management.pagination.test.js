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
const originalFindAllWithPagination =
  ReceptionScheduleManagementRepository.findAllWithPagination;
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
  capturedFilters = null;
  ReceptionScheduleManagementRepository.findAllWithPagination = async (
    filters
  ) => {
    capturedFilters = filters;
    return {
      data: [
        {
          id: "323e4567-e89b-42d3-a456-426614174000",
          ngay_tiep_dan: new Date("2099-08-26T00:00:00.000Z"),
          thoi_gian: "13:30 - 16:30",
        },
        {
          id: "223e4567-e89b-42d3-a456-426614174000",
          ngay_tiep_dan: new Date("2099-08-25T00:00:00.000Z"),
          thoi_gian: "07:30 - 11:30",
        },
      ],
      totalItems: 12,
    };
  };
});

afterEach(() => {
  ReceptionScheduleManagementRepository.findAllWithPagination =
    originalFindAllWithPagination;
});

describe("GET /api/reception-schedules/management/pagination", () => {
  it("documents authorization, page limits and pagination response", () => {
    const operation =
      ReceptionScheduleManagementSwagger[
        "/api/reception-schedules/management/pagination"
      ].get;
    const sizeParameter = operation.parameters.find(
      (parameter) => parameter.name === "size"
    );

    assert.deepEqual(operation.security, [{ bearerAuth: [] }]);
    assert.ok(operation.description.includes("LTD_GET_ALL"));
    assert.equal(sizeParameter.schema.maximum, 100);
    assert.equal(
      operation.responses[200].content["application/json"].schema.properties
        .pagination.type,
      "object"
    );
  });

  it("returns data and pagination with validated filters", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-schedules/management/pagination?page=2&size=5&isActive=false`,
        {
          headers: {
            authorization: `Bearer ${createToken([PERMISSION.LTD_GET_ALL])}`,
          },
        }
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.data[0].id, "223e4567-e89b-42d3-a456-426614174000");
      assert.deepEqual(body.pagination, {
        currentPage: 2,
        pageSize: 5,
        totalPages: 3,
        totalItems: 12,
      });
      assert.equal(capturedFilters.isActive, "false");
      assert.equal(capturedFilters.page, 2);
      assert.equal(capturedFilters.size, 5);
    } finally {
      server.close();
    }
  });

  it("uses page and size defaults", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-schedules/management/pagination`,
        {
          headers: {
            authorization: `Bearer ${createToken([PERMISSION.LTD_GET_ALL])}`,
          },
        }
      );

      assert.equal(response.status, 200);
      assert.equal(capturedFilters.page, 1);
      assert.equal(capturedFilters.size, 10);
    } finally {
      server.close();
    }
  });

  it("returns 400 when size exceeds 100", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-schedules/management/pagination?size=101`,
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
        `http://127.0.0.1:${port}/api/reception-schedules/management/pagination`
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
        `http://127.0.0.1:${port}/api/reception-schedules/management/pagination`,
        { headers: { authorization: `Bearer ${createToken([])}` } }
      );
      assert.equal(response.status, 403);
    } finally {
      server.close();
    }
  });
});
