import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import { PERMISSION } from "../src/constants/permission.constant.js";
import prisma from "../src/config/database.config.js";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import DangKyTiepDanRepository from "../src/repositories/dang-ky-tiep-dan.repository.js";
import dangKyTiepDanRouter from "../src/routes/dang-ky-tiep-dan.route.js";
import DangKyTiepDanSwagger from "../src/swagger/dang-ky-tiep-dan.swagger.js";
import jwtUtils from "../src/utils/jwt.util.js";

const userId = "123e4567-e89b-42d3-a456-426614174000";
const registrationId = "223e4567-e89b-42d3-a456-426614174000";
const originalMethods = {
  findActiveById: DangKyTiepDanRepository.findActiveById,
  rejectPending: DangKyTiepDanRepository.rejectPending,
  auditCreate: prisma.audit_logs.create,
};

const pendingRegistration = {
  id: registrationId,
  ma_tiep_dan: "A00123",
  loai: "COUNTER_RECEPTION",
  trang_thai: "PENDING",
  bo_phan: null,
  is_active: true,
  is_delete: false,
  lich_tiep_dan: null,
  danh_gia_tiep_dan: [],
};

const createToken = (permissions) =>
  jwtUtils.signAccessToken(
    {
      id: userId,
      ten_dang_nhap: "approver",
      permissions,
      cate: null,
      roles: ["APPROVER"],
    },
    "127.0.0.1"
  );

const createTestServer = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/reception-registrations", dangKyTiepDanRouter);
  app.use(errorHandler);
  return app.listen(0);
};

beforeEach(() => {
  DangKyTiepDanRepository.findActiveById = async () => pendingRegistration;
  DangKyTiepDanRepository.rejectPending = async (_id, data) => ({
    ...pendingRegistration,
    ...data,
  });
  prisma.audit_logs.create = async () => ({});
});

afterEach(() => {
  DangKyTiepDanRepository.findActiveById = originalMethods.findActiveById;
  DangKyTiepDanRepository.rejectPending = originalMethods.rejectPending;
  prisma.audit_logs.create = originalMethods.auditCreate;
});

describe("PATCH /api/reception-registrations/:id/reject", () => {
  it("documents rejection permission and no-refund rule in Swagger", () => {
    const operation =
      DangKyTiepDanSwagger["/api/reception-registrations/{id}/reject"].patch;

    assert.ok(operation.description.includes("RR_REJECT"));
    assert.ok(operation.description.includes("không hoàn lại sức chứa"));
    assert.ok(operation.requestBody.content["application/json"].schema.required.includes("reason"));
    assert.ok(
      operation.responses[200].content["application/json"].schema.properties.data
        .properties.rejectionReason
    );
  });

  it("rejects a pending registration with a required reason", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-registrations/${registrationId}/reject`,
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${createToken([PERMISSION.RR_REJECT])}`,
          },
          body: JSON.stringify({
            reason: "Nội dung không thuộc phạm vi tiếp nhận",
          }),
        }
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.data.approvalStatus, "REJECTED");
      assert.equal(
        body.data.rejectionReason,
        "Nội dung không thuộc phạm vi tiếp nhận"
      );
      assert.ok(body.data.rejectedAt);
    } finally {
      server.close();
    }
  });

  it("returns 400 when rejection reason is missing", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-registrations/${registrationId}/reject`,
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${createToken([PERMISSION.RR_REJECT])}`,
          },
          body: "{}",
        }
      );

      assert.equal(response.status, 400);
    } finally {
      server.close();
    }
  });

  it("returns 409 when the registration is no longer pending", async () => {
    DangKyTiepDanRepository.findActiveById = async () => ({
      ...pendingRegistration,
      trang_thai: "APPROVED",
    });
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-registrations/${registrationId}/reject`,
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${createToken([PERMISSION.RR_REJECT])}`,
          },
          body: JSON.stringify({ reason: "Đơn đã được xử lý trước đó" }),
        }
      );

      assert.equal(response.status, 409);
    } finally {
      server.close();
    }
  });

  it("returns 403 without RR_REJECT permission", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-registrations/${registrationId}/reject`,
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${createToken([])}`,
          },
          body: JSON.stringify({ reason: "Nội dung không hợp lệ" }),
        }
      );

      assert.equal(response.status, 403);
    } finally {
      server.close();
    }
  });

  it("returns 404 when the registration does not exist", async () => {
    DangKyTiepDanRepository.findActiveById = async () => null;
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-registrations/${registrationId}/reject`,
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${createToken([PERMISSION.RR_REJECT])}`,
          },
          body: JSON.stringify({ reason: "Không tìm thấy đơn cần xử lý" }),
        }
      );
      assert.equal(response.status, 404);
    } finally {
      server.close();
    }
  });

  it("returns 409 when another request processed the registration first", async () => {
    DangKyTiepDanRepository.rejectPending = async () => null;
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-registrations/${registrationId}/reject`,
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${createToken([PERMISSION.RR_REJECT])}`,
          },
          body: JSON.stringify({ reason: "Đơn không đủ điều kiện tiếp nhận" }),
        }
      );
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
        `http://127.0.0.1:${port}/api/reception-registrations/${registrationId}/reject`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ reason: "Đơn không đủ điều kiện tiếp nhận" }),
        }
      );
      assert.equal(response.status, 401);
    } finally {
      server.close();
    }
  });

  it("returns 400 for an invalid registration UUID", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-registrations/not-a-uuid/reject`,
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${createToken([PERMISSION.RR_REJECT])}`,
          },
          body: JSON.stringify({ reason: "Đơn không đủ điều kiện tiếp nhận" }),
        }
      );
      assert.equal(response.status, 400);
    } finally {
      server.close();
    }
  });
});
