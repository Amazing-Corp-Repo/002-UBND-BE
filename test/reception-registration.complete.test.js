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
  completeApproved: DangKyTiepDanRepository.completeApproved,
  auditCreate: prisma.audit_logs.create,
};

const approvedRegistration = {
  id: registrationId,
  ma_tiep_dan: "A00123",
  loai: "COUNTER_RECEPTION",
  trang_thai: "APPROVED",
  bo_phan: "QUAY_2",
  is_active: true,
  is_delete: false,
  lich_tiep_dan: null,
  danh_gia_tiep_dan: [],
};

const createToken = (permissions) =>
  jwtUtils.signAccessToken(
    {
      id: userId,
      ten_dang_nhap: "counter-officer",
      permissions,
      cate: null,
      roles: ["COUNTER_OFFICER"],
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
  DangKyTiepDanRepository.findActiveById = async () => approvedRegistration;
  DangKyTiepDanRepository.completeApproved = async (_id, data) => ({
    ...approvedRegistration,
    ...data,
  });
  prisma.audit_logs.create = async () => ({});
});

afterEach(() => {
  DangKyTiepDanRepository.findActiveById = originalMethods.findActiveById;
  DangKyTiepDanRepository.completeApproved = originalMethods.completeApproved;
  prisma.audit_logs.create = originalMethods.auditCreate;
});

describe("PATCH /api/reception-registrations/:id/complete", () => {
  it("documents permission, transition and rating eligibility in Swagger", () => {
    const operation =
      DangKyTiepDanSwagger["/api/reception-registrations/{id}/complete"].patch;

    assert.ok(operation.description.includes("RR_COMPLETE"));
    assert.ok(operation.description.includes("APPROVED sang COMPLETED"));
    assert.ok(operation.description.includes("mới được đánh giá"));
    assert.ok(operation.responses[403]);
    assert.ok(
      operation.responses[200].content["application/json"].schema.properties.data
        .properties.completedAt
    );
  });

  it("completes an approved registration with RR_COMPLETE permission", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-registrations/${registrationId}/complete`,
        {
          method: "PATCH",
          headers: {
            authorization: `Bearer ${createToken([PERMISSION.RR_COMPLETE])}`,
          },
        }
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.data.approvalStatus, "COMPLETED");
      assert.ok(body.data.completedAt);
    } finally {
      server.close();
    }
  });

  it("returns 409 when the registration is not approved", async () => {
    DangKyTiepDanRepository.findActiveById = async () => ({
      ...approvedRegistration,
      trang_thai: "PENDING",
    });
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-registrations/${registrationId}/complete`,
        {
          method: "PATCH",
          headers: {
            authorization: `Bearer ${createToken([PERMISSION.RR_COMPLETE])}`,
          },
        }
      );

      assert.equal(response.status, 409);
    } finally {
      server.close();
    }
  });

  it("returns 409 when the approved registration has no counter", async () => {
    DangKyTiepDanRepository.findActiveById = async () => ({
      ...approvedRegistration,
      bo_phan: null,
    });
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-registrations/${registrationId}/complete`,
        {
          method: "PATCH",
          headers: {
            authorization: `Bearer ${createToken([PERMISSION.RR_COMPLETE])}`,
          },
        }
      );

      assert.equal(response.status, 409);
    } finally {
      server.close();
    }
  });

  it("returns 403 without RR_COMPLETE permission", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-registrations/${registrationId}/complete`,
        {
          method: "PATCH",
          headers: { authorization: `Bearer ${createToken([])}` },
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
        `http://127.0.0.1:${port}/api/reception-registrations/${registrationId}/complete`,
        {
          method: "PATCH",
          headers: {
            authorization: `Bearer ${createToken([PERMISSION.RR_COMPLETE])}`,
          },
        }
      );
      assert.equal(response.status, 404);
    } finally {
      server.close();
    }
  });

  it("returns 409 when another request completed the registration first", async () => {
    DangKyTiepDanRepository.completeApproved = async () => null;
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-registrations/${registrationId}/complete`,
        {
          method: "PATCH",
          headers: {
            authorization: `Bearer ${createToken([PERMISSION.RR_COMPLETE])}`,
          },
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
        `http://127.0.0.1:${port}/api/reception-registrations/${registrationId}/complete`,
        { method: "PATCH" }
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
        `http://127.0.0.1:${port}/api/reception-registrations/not-a-uuid/complete`,
        {
          method: "PATCH",
          headers: {
            authorization: `Bearer ${createToken([PERMISSION.RR_COMPLETE])}`,
          },
        }
      );
      assert.equal(response.status, 400);
    } finally {
      server.close();
    }
  });
});
