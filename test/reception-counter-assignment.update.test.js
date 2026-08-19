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
const officerId = "523e4567-e89b-42d3-a456-426614174001";
const currentUserId = "123e4567-e89b-42d3-a456-426614174000";
const originalUpdate = Repository.updateWithGuards;
const originalAudit = prisma.audit_logs.create;
let result;
let received;
const token = (permissions) => jwtUtils.signAccessToken(
  { id: currentUserId, ten_dang_nhap: "manager", permissions, roles: ["STAFF"] },
  "127.0.0.1"
);
const createServer = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/reception-counter-assignments", router);
  app.use(errorHandler);
  return app.listen(0);
};
const assignmentRecord = {
  id: assignmentId,
  id_cau_hinh_quay: "223e4567-e89b-42d3-a456-426614174001",
  is_active: false,
  can_bo: { id: officerId, ho_va_ten: "Nguyễn Văn An", ten_dang_nhap: "canbo" },
  cau_hinh_quay: {
    id_ca_tiep_dan: "323e4567-e89b-42d3-a456-426614174001",
    quay_tiep_dan: {
      id: "623e4567-e89b-42d3-a456-426614174001",
      ma_quay: "QUAY_1",
      ten_quay: "Quầy số 1",
    },
    ca_tiep_dan: {
      gio_bat_dau: "07:30",
      gio_ket_thuc: "08:30",
      lich_tiep_dan: { ngay_tiep_dan: "2026-08-26" },
    },
  },
};

beforeEach(() => {
  received = null;
  result = { assignment: assignmentRecord };
  Repository.updateWithGuards = async (...args) => {
    received = args;
    return result;
  };
  prisma.audit_logs.create = async () => ({});
});

afterEach(() => {
  Repository.updateWithGuards = originalUpdate;
  prisma.audit_logs.create = originalAudit;
});

describe("PATCH /api/reception-counter-assignments/:id", () => {
  it("documents Vietnamese examples and responses in Swagger", () => {
    const operation = Swagger["/api/reception-counter-assignments/{id}"].patch;
    assert.match(operation.description, /LTD_UPDATE/);
    assert.ok(operation.requestBody.content["application/json"].examples.deactivate);
    assert.ok(operation.responses[409]);
  });

  it("deactivates an assignment", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-counter-assignments/${assignmentId}`,
        {
          method: "PATCH",
          headers: {
            authorization: `Bearer ${token([PERMISSION.LTD_UPDATE])}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({ isActive: false }),
        }
      );
      const body = await response.json();
      assert.equal(response.status, 200);
      assert.equal(body.data.isActive, false);
      assert.deepEqual(received, [assignmentId, { isActive: false }, currentUserId]);
    } finally { server.close(); }
  });

  it("returns 400 when no update field is supplied", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-counter-assignments/${assignmentId}`,
        {
          method: "PATCH",
          headers: {
            authorization: `Bearer ${token([PERMISSION.LTD_UPDATE])}`,
            "content-type": "application/json",
          },
          body: "{}",
        }
      );
      assert.equal(response.status, 400);
    } finally { server.close(); }
  });

  it("returns 404 when the assignment does not exist", async () => {
    result = { conflict: "NOT_FOUND" };
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-counter-assignments/${assignmentId}`,
        {
          method: "PATCH",
          headers: {
            authorization: `Bearer ${token([PERMISSION.LTD_UPDATE])}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({ isActive: true }),
        }
      );
      assert.equal(response.status, 404);
    } finally { server.close(); }
  });

  it("returns 409 when the officer is already assigned in the shift", async () => {
    result = { conflict: "OFFICER_ALREADY_ASSIGNED" };
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-counter-assignments/${assignmentId}`,
        {
          method: "PATCH",
          headers: {
            authorization: `Bearer ${token([PERMISSION.LTD_UPDATE])}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({ officerId }),
        }
      );
      assert.equal(response.status, 409);
    } finally { server.close(); }
  });

  it("returns 403 without permission", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-counter-assignments/${assignmentId}`,
        {
          method: "PATCH",
          headers: {
            authorization: `Bearer ${token([])}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({ isActive: false }),
        }
      );
      assert.equal(response.status, 403);
    } finally { server.close(); }
  });
});
