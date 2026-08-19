import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import { PERMISSION } from "../src/constants/permission.constant.js";
import prisma from "../src/config/database.config.js";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import Repository from "../src/repositories/reception-counter-assignment.repository.js";
import router from "../src/routes/reception-counter-assignment.route.js";
import Swagger from "../src/swagger/reception-counter-assignment.swagger.js";
import jwtUtils from "../src/utils/jwt.util.js";

const assignmentId = "423e4567-e89b-42d3-a456-426614174001";
const userId = "123e4567-e89b-42d3-a456-426614174000";
const originalFindById = Repository.findById;
const originalAudit = prisma.audit_logs.create;
const token = (permissions) => jwtUtils.signAccessToken(
  { id: userId, ten_dang_nhap: "staff", permissions, roles: ["STAFF"] },
  "127.0.0.1"
);
const createServer = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/reception-counter-assignments", router);
  app.use(errorHandler);
  return app.listen(0);
};

beforeEach(() => {
  Repository.findById = async (id) => id === assignmentId ? {
    id,
    id_cau_hinh_quay: "223e4567-e89b-42d3-a456-426614174001",
    is_active: true,
    can_bo: { id: userId, ho_va_ten: "Nguyễn Văn An", ten_dang_nhap: "canbo" },
    cau_hinh_quay: {
      id_ca_tiep_dan: "323e4567-e89b-42d3-a456-426614174001",
      quay_tiep_dan: {
        id: "523e4567-e89b-42d3-a456-426614174001",
        ma_quay: "QUAY_1",
        ten_quay: "Quầy số 1",
      },
      ca_tiep_dan: {
        gio_bat_dau: "07:30",
        gio_ket_thuc: "08:30",
        lich_tiep_dan: { ngay_tiep_dan: "2026-08-26" },
      },
    },
  } : null;
  prisma.audit_logs.create = async () => ({});
});

afterEach(() => {
  Repository.findById = originalFindById;
  prisma.audit_logs.create = originalAudit;
});

describe("GET /api/reception-counter-assignments/:id", () => {
  it("documents Vietnamese responses and a prefilled UUID in Swagger", () => {
    const operation = Swagger["/api/reception-counter-assignments/{id}"].get;
    assert.equal(operation.parameters[0].schema.example, assignmentId);
    assert.match(operation.description, /LTD_GET_ALL/);
    assert.ok(operation.responses[200]);
    assert.ok(operation.responses[400]);
    assert.ok(operation.responses[404]);
  });

  it("returns one counter assignment", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-counter-assignments/${assignmentId}`,
        { headers: { authorization: `Bearer ${token([PERMISSION.LTD_GET_ALL])}` } }
      );
      const body = await response.json();
      assert.equal(response.status, 200);
      assert.equal(body.data.id, assignmentId);
      assert.equal(body.data.counter.counterCode, "QUAY_1");
    } finally { server.close(); }
  });

  it("returns 400 for an invalid UUID", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-counter-assignments/not-a-uuid`,
        { headers: { authorization: `Bearer ${token([PERMISSION.LTD_GET_ALL])}` } }
      );
      assert.equal(response.status, 400);
    } finally { server.close(); }
  });

  it("returns 404 when the assignment does not exist", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-counter-assignments/623e4567-e89b-42d3-a456-426614174001`,
        { headers: { authorization: `Bearer ${token([PERMISSION.LTD_GET_ALL])}` } }
      );
      assert.equal(response.status, 404);
    } finally { server.close(); }
  });

  it("returns 403 without permission", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-counter-assignments/${assignmentId}`,
        { headers: { authorization: `Bearer ${token([])}` } }
      );
      assert.equal(response.status, 403);
    } finally { server.close(); }
  });
});
