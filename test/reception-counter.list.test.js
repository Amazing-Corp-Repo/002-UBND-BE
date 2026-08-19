import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import { PERMISSION } from "../src/constants/permission.constant.js";
import prisma from "../src/config/database.config.js";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import ReceptionCounterRepository from "../src/repositories/reception-counter.repository.js";
import receptionCounterRouter from "../src/routes/reception-counter.route.js";
import ReceptionCounterSwagger from "../src/swagger/reception-counter.swagger.js";
import jwtUtils from "../src/utils/jwt.util.js";

const userId = "123e4567-e89b-42d3-a456-426614174000";
const originalFindAll = ReceptionCounterRepository.findAllActive;
const originalAuditCreate = prisma.audit_logs.create;

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
  app.use("/api/reception-counters", receptionCounterRouter);
  app.use(errorHandler);
  return app.listen(0);
};

beforeEach(() => {
  ReceptionCounterRepository.findAllActive = async () => [
    {
      id: "223e4567-e89b-42d3-a456-426614174001",
      ma_quay: "QUAY_1",
      ten_quay: "Quầy số 1",
      so_thu_tu: 1,
      mo_ta: null,
      suc_chua_mac_dinh: 2,
      vi_tri: "Tầng 1, khu A",
      is_active: true,
      thoi_gian_tao: new Date("2026-08-20T00:00:00.000Z"),
      thoi_gian_cap_nhat: null,
    },
  ];
  prisma.audit_logs.create = async () => ({});
});

afterEach(() => {
  ReceptionCounterRepository.findAllActive = originalFindAll;
  prisma.audit_logs.create = originalAuditCreate;
});

describe("GET /api/reception-counters", () => {
  it("documents the secured Vietnamese Swagger contract", () => {
    const operation = ReceptionCounterSwagger["/api/reception-counters"].get;
    assert.deepEqual(operation.security, [{ bearerAuth: [] }]);
    assert.match(operation.description, /LTD_GET_ALL/);
    assert.equal(
      operation.responses[200].content["application/json"].schema.properties.data.type,
      "array"
    );
    assert.ok(operation.responses[401]);
    assert.ok(operation.responses[403]);
  });

  it("returns active counters mapped to the English API contract", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/reception-counters`, {
        headers: {
          authorization: `Bearer ${createToken([PERMISSION.LTD_GET_ALL])}`,
        },
      });
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.data[0].counterCode, "QUAY_1");
      assert.equal(body.data[0].counterName, "Quầy số 1");
      assert.equal(body.data[0].defaultCapacity, 2);
    } finally {
      server.close();
    }
  });

  it("returns 401 without a token", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/reception-counters`);
      assert.equal(response.status, 401);
    } finally {
      server.close();
    }
  });

  it("returns 403 without LTD_GET_ALL permission", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/reception-counters`, {
        headers: { authorization: `Bearer ${createToken([])}` },
      });
      assert.equal(response.status, 403);
    } finally {
      server.close();
    }
  });
});
