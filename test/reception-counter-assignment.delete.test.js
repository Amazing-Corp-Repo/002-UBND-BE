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
const currentUserId = "123e4567-e89b-42d3-a456-426614174000";
const originalDelete = Repository.softDelete;
const originalAudit = prisma.audit_logs.create;
let exists;
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

beforeEach(() => {
  exists = true;
  received = null;
  Repository.softDelete = async (...args) => {
    received = args;
    return exists;
  };
  prisma.audit_logs.create = async () => ({});
});

afterEach(() => {
  Repository.softDelete = originalDelete;
  prisma.audit_logs.create = originalAudit;
});

describe("DELETE /api/reception-counter-assignments/:id", () => {
  it("documents soft delete and Vietnamese responses in Swagger", () => {
    const operation = Swagger["/api/reception-counter-assignments/{id}"].delete;
    assert.match(operation.description, /xóa logic/);
    assert.match(operation.description, /LTD_UPDATE/);
    assert.ok(operation.responses[404]);
  });

  it("soft deletes an assignment", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-counter-assignments/${assignmentId}`,
        {
          method: "DELETE",
          headers: { authorization: `Bearer ${token([PERMISSION.LTD_UPDATE])}` },
        }
      );
      const body = await response.json();
      assert.equal(response.status, 200);
      assert.equal(body.data, null);
      assert.deepEqual(received, [assignmentId, currentUserId]);
    } finally { server.close(); }
  });

  it("returns 400 for an invalid UUID", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-counter-assignments/not-a-uuid`,
        {
          method: "DELETE",
          headers: { authorization: `Bearer ${token([PERMISSION.LTD_UPDATE])}` },
        }
      );
      assert.equal(response.status, 400);
    } finally { server.close(); }
  });

  it("returns 404 when the assignment does not exist", async () => {
    exists = false;
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-counter-assignments/${assignmentId}`,
        {
          method: "DELETE",
          headers: { authorization: `Bearer ${token([PERMISSION.LTD_UPDATE])}` },
        }
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
        {
          method: "DELETE",
          headers: { authorization: `Bearer ${token([])}` },
        }
      );
      assert.equal(response.status, 403);
    } finally { server.close(); }
  });
});
