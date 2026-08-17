import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import prisma from "../src/config/database.config.js";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import ReceptionRatingRepository from "../src/repositories/reception-rating.repository.js";
import receptionRatingRouter from "../src/routes/reception-rating.route.js";

const originalMethods = {
  findRegistrationByCode: ReceptionRatingRepository.findRegistrationByCode,
  create: ReceptionRatingRepository.create,
  auditCreate: prisma.audit_logs.create,
};

const eligibleRegistration = {
  id: "123e4567-e89b-42d3-a456-426614174000",
  ma_tiep_dan: "A00123",
  trang_thai: "APPROVED",
  bo_phan: "QUAY_2",
  danh_gia_tiep_dan: [],
};

const validBody = {
  receptionCode: "A00123",
  score: 5,
  selectedSuggestions: ["Cán bộ rất tận tình và chuyên nghiệp"],
  comment: "Tôi rất hài lòng",
};

const createTestServer = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/reception-ratings", receptionRatingRouter);
  app.use(errorHandler);
  return app.listen(0);
};

beforeEach(() => {
  ReceptionRatingRepository.findRegistrationByCode = async () =>
    eligibleRegistration;
  ReceptionRatingRepository.create = async (data) => ({
    id: "223e4567-e89b-42d3-a456-426614174000",
    ...data,
    thoi_gian_tao: new Date(),
  });
  prisma.audit_logs.create = async () => ({});
});

afterEach(() => {
  ReceptionRatingRepository.findRegistrationByCode =
    originalMethods.findRegistrationByCode;
  ReceptionRatingRepository.create = originalMethods.create;
  prisma.audit_logs.create = originalMethods.auditCreate;
});

describe("POST /api/reception-ratings", () => {
  it("submits a valid rating", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-ratings`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(validBody),
        }
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.data.score, 5);
      assert.deepEqual(body.data.selectedSuggestions, validBody.selectedSuggestions);
    } finally {
      server.close();
    }
  });

  it("rejects missing required data", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-ratings`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{}",
        }
      );
      assert.equal(response.status, 400);
    } finally {
      server.close();
    }
  });

  it("rejects a duplicate rating", async () => {
    ReceptionRatingRepository.findRegistrationByCode = async () => ({
      ...eligibleRegistration,
      danh_gia_tiep_dan: [{ id: "existing-rating" }],
    });
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-ratings`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(validBody),
        }
      );
      assert.equal(response.status, 409);
    } finally {
      server.close();
    }
  });

  it("maps a concurrent unique conflict to 409", async () => {
    ReceptionRatingRepository.create = async () => {
      const error = new Error("Unique constraint failed");
      error.code = "P2002";
      throw error;
    };
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-ratings`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(validBody),
        }
      );
      assert.equal(response.status, 409);
    } finally {
      server.close();
    }
  });

  it("rejects a suggestion from another score", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-ratings`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            ...validBody,
            selectedSuggestions: ["Cán bộ giao tiếp lịch sự"],
          }),
        }
      );
      assert.equal(response.status, 400);
    } finally {
      server.close();
    }
  });
});
