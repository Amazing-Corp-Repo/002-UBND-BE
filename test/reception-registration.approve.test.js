import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import { PERMISSION } from "../src/constants/permission.constant.js";
import prisma from "../src/config/database.config.js";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import DangKyTiepDanRepository from "../src/repositories/dang-ky-tiep-dan.repository.js";
import UserRepository from "../src/repositories/user.repository.js";
import dangKyTiepDanRouter from "../src/routes/dang-ky-tiep-dan.route.js";
import jwtUtils from "../src/utils/jwt.util.js";
import DangKyTiepDanSwagger from "../src/swagger/dang-ky-tiep-dan.swagger.js";

const registrationId = "123e4567-e89b-42d3-a456-426614174000";
const originalMethods = {
  findActiveById: DangKyTiepDanRepository.findActiveById,
  approvePendingWithCounterGuard:
    DangKyTiepDanRepository.approvePendingWithCounterGuard,
  findUserById: UserRepository.findById,
  auditCreate: prisma.audit_logs.create,
};

const pendingRegistration = {
  id: registrationId,
  trang_thai: "PENDING",
  is_active: true,
  is_delete: false,
};

const approvedDetail = {
  ...pendingRegistration,
  ma_tiep_dan: "A00123",
  loai: "COUNTER_RECEPTION",
  trang_thai: "APPROVED",
  bo_phan: "QUAY_3",
  ten_lanh_dao: "Nguyễn Văn Lãnh đạo",
  chuc_vu_lanh_dao: "LEADER",
  lich_tiep_dan: null,
  danh_gia_tiep_dan: [],
};

const createToken = (permissions) =>
  jwtUtils.signAccessToken(
    {
      id: "223e4567-e89b-42d3-a456-426614174000",
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
  app.use("/api/reception-registrations", dangKyTiepDanRouter);
  app.use(errorHandler);
  return app.listen(0);
};

beforeEach(() => {
  DangKyTiepDanRepository.findActiveById = async () => pendingRegistration;
  DangKyTiepDanRepository.approvePendingWithCounterGuard = async () => ({
    registration: approvedDetail,
  });
  UserRepository.findById = async () => ({
    id: "223e4567-e89b-42d3-a456-426614174000",
    ho_va_ten: "Nguyễn Văn Lãnh đạo",
    user_roles: [{ roles: { name: "LEADER" } }],
  });
  prisma.audit_logs.create = async () => ({});
});

afterEach(() => {
  DangKyTiepDanRepository.findActiveById = originalMethods.findActiveById;
  DangKyTiepDanRepository.approvePendingWithCounterGuard =
    originalMethods.approvePendingWithCounterGuard;
  UserRepository.findById = originalMethods.findUserById;
  prisma.audit_logs.create = originalMethods.auditCreate;
});

describe("PATCH /api/reception-registrations/:id/approve", () => {
  it("documents counter-capacity validation in Swagger", () => {
    const operation =
      DangKyTiepDanSwagger["/api/reception-registrations/{id}/approve"].patch;

    assert.ok(operation.description.includes("sức chứa riêng của quầy"));
    assert.ok(operation.responses[409].description.includes("quầy"));
    assert.ok(operation.responses[503]);
    assert.ok(
      operation.responses[200].content["application/json"].schema.properties.data
        .properties.approvalStatus
    );
  });

  it("approves a pending registration and assigns a counter", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-registrations/${registrationId}/approve`,
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${createToken([PERMISSION.RR_APPROVE])}`,
          },
          body: JSON.stringify({ department: "QUAY_3" }),
        }
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.data.department, "QUAY_3");
      assert.equal(body.data.approver.name, "Nguyễn Văn Lãnh đạo");
    } finally {
      server.close();
    }
  });

  it("rejects an already processed registration", async () => {
    DangKyTiepDanRepository.findActiveById = async () => ({
      ...pendingRegistration,
      trang_thai: "APPROVED",
    });
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-registrations/${registrationId}/approve`,
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${createToken([PERMISSION.RR_APPROVE])}`,
          },
          body: JSON.stringify({ department: "QUAY_3" }),
        }
      );
      assert.equal(response.status, 409);
    } finally {
      server.close();
    }
  });

  it("returns 409 when the selected counter is full", async () => {
    DangKyTiepDanRepository.approvePendingWithCounterGuard = async () => ({
      conflict: "COUNTER_FULL",
    });
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-registrations/${registrationId}/approve`,
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${createToken([PERMISSION.RR_APPROVE])}`,
          },
          body: JSON.stringify({ department: "QUAY_3" }),
        }
      );
      const body = await response.json();

      assert.equal(response.status, 409);
      assert.ok(body.message.includes("đủ sức chứa"));
    } finally {
      server.close();
    }
  });

  it("returns 403 without approve permission", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-registrations/${registrationId}/approve`,
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${createToken([])}`,
          },
          body: JSON.stringify({ department: "QUAY_3" }),
        }
      );
      assert.equal(response.status, 403);
    } finally {
      server.close();
    }
  });

  it("returns 503 after concurrent approval retries are exhausted", async () => {
    DangKyTiepDanRepository.approvePendingWithCounterGuard = async () => {
      const error = new Error("Serializable transaction conflict");
      error.code = "P2034";
      throw error;
    };
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-registrations/${registrationId}/approve`,
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${createToken([PERMISSION.RR_APPROVE])}`,
          },
          body: JSON.stringify({ department: "QUAY_3" }),
        }
      );
      const body = await response.json();

      assert.equal(response.status, 503);
      assert.match(body.message, /nhiều yêu cầu phê duyệt/i);
    } finally {
      server.close();
    }
  });
});
