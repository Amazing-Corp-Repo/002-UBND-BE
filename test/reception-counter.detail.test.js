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

const counterId = "223e4567-e89b-42d3-a456-426614174001";
const userId = "123e4567-e89b-42d3-a456-426614174000";
const originalFindById = ReceptionCounterRepository.findActiveById;
const originalAuditCreate = prisma.audit_logs.create;

const createToken = (permissions) =>
  jwtUtils.signAccessToken(
    { id: userId, ten_dang_nhap: "staff", permissions, roles: ["STAFF"] },
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
  ReceptionCounterRepository.findActiveById = async (id) =>
    id === counterId
      ? {
          id,
          ma_quay: "QUAY_1",
          ten_quay: "Quầy số 1",
          so_thu_tu: 1,
          suc_chua_mac_dinh: 2,
          is_active: true,
        }
      : null;
  prisma.audit_logs.create = async () => ({});
});

afterEach(() => {
  ReceptionCounterRepository.findActiveById = originalFindById;
  prisma.audit_logs.create = originalAuditCreate;
});

describe("GET /api/reception-counters/:id", () => {
  it("documents Vietnamese responses and a prefilled UUID in Swagger", () => {
    const operation = ReceptionCounterSwagger["/api/reception-counters/{id}"].get;
    assert.equal(operation.parameters[0].schema.example, counterId);
    assert.ok(operation.responses[200]);
    assert.ok(operation.responses[400]);
    assert.ok(operation.responses[404]);
  });

  it("returns one active counter", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/reception-counters/${counterId}`, {
        headers: { authorization: `Bearer ${createToken([PERMISSION.LTD_GET_ALL])}` },
      });
      const body = await response.json();
      assert.equal(response.status, 200);
      assert.equal(body.data.id, counterId);
      assert.equal(body.data.counterCode, "QUAY_1");
    } finally {
      server.close();
    }
  });

  it("returns 400 for an invalid UUID", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/reception-counters/not-a-uuid`, {
        headers: { authorization: `Bearer ${createToken([PERMISSION.LTD_GET_ALL])}` },
      });
      assert.equal(response.status, 400);
    } finally {
      server.close();
    }
  });

  it("returns 404 when the counter does not exist", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-counters/323e4567-e89b-42d3-a456-426614174001`,
        { headers: { authorization: `Bearer ${createToken([PERMISSION.LTD_GET_ALL])}` } }
      );
      assert.equal(response.status, 404);
    } finally {
      server.close();
    }
  });

  it("returns 403 without permission", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/reception-counters/${counterId}`, {
        headers: { authorization: `Bearer ${createToken([])}` },
      });
      assert.equal(response.status, 403);
    } finally {
      server.close();
    }
  });
});
