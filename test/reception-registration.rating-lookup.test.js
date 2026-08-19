import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import DangKyTiepDanRepository from "../src/repositories/dang-ky-tiep-dan.repository.js";
import dangKyTiepDanRouter from "../src/routes/dang-ky-tiep-dan.route.js";
import DangKyTiepDanSwagger from "../src/swagger/dang-ky-tiep-dan.swagger.js";
import {
  createReceptionRatingLookupRateLimiter,
  RECEPTION_RATING_LOOKUP_RATE_LIMIT,
} from "../src/middlewares/reception-registration-rate-limit.middleware.js";

const originalFindForRatingByCode =
  DangKyTiepDanRepository.findForRatingByCode;

const completedRegistration = {
  id: "123e4567-e89b-42d3-a456-426614174000",
  ma_tiep_dan: "A00123",
  ngay: new Date("2099-08-20T00:00:00.000Z"),
  slot: "08:00 - 09:00",
  chu_de: "Hướng dẫn thủ tục",
  ly_do: "Nội dung người dân đã gửi",
  ho_ten: "Nguyễn Văn An",
  sdt: "0912345678",
  cccd: "042204001234",
  dia_chi: "Thành phố Hà Tĩnh",
  bo_phan: "QUAY_5",
  trang_thai: "COMPLETED",
  danh_gia_tiep_dan: [],
};

const createTestServer = () => {
  const app = express();
  app.use("/api/reception-registrations", dangKyTiepDanRouter);
  app.use(errorHandler);
  return app.listen(0);
};

beforeEach(() => {
  DangKyTiepDanRepository.findForRatingByCode = async () =>
    completedRegistration;
});

afterEach(() => {
  DangKyTiepDanRepository.findForRatingByCode =
    originalFindForRatingByCode;
});

describe("GET /api/reception-registrations/rating-lookup/:receptionCode", () => {
  it("documents COMPLETED as the required rating state", () => {
    const operation =
      DangKyTiepDanSwagger[
        "/api/reception-registrations/rating-lookup/{receptionCode}"
      ].get;

    assert.ok(operation.description.includes("COMPLETED"));
    assert.ok(operation.description.includes("APPROVED chưa đủ điều kiện"));
    assert.ok(operation.description.includes("60 lượt"));
    assert.ok(operation.responses[429]);
    assert.ok(
      operation.responses[200].content["application/json"].schema.properties.data
        .properties.applicant
    );
  });

  it("returns completed unrated registration details", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-registrations/rating-lookup/a00123`
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.data.receptionCode, "A00123");
      assert.equal(body.data.department, "QUAY_5");
      assert.equal(body.data.applicant.citizenId, "********1234");
    } finally {
      server.close();
    }
  });

  it("rejects an approved registration that is not completed", async () => {
    DangKyTiepDanRepository.findForRatingByCode = async () => ({
      ...completedRegistration,
      trang_thai: "APPROVED",
    });
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-registrations/rating-lookup/A00123`
      );
      assert.equal(response.status, 409);
    } finally {
      server.close();
    }
  });

  it("rejects a registration that was already rated", async () => {
    DangKyTiepDanRepository.findForRatingByCode = async () => ({
      ...completedRegistration,
      danh_gia_tiep_dan: [{ id: "rating-id" }],
    });
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-registrations/rating-lookup/A00123`
      );
      assert.equal(response.status, 409);
    } finally {
      server.close();
    }
  });

  it("returns 409 when a completed registration has no assigned counter", async () => {
    DangKyTiepDanRepository.findForRatingByCode = async () => ({
      ...completedRegistration,
      bo_phan: null,
    });
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-registrations/rating-lookup/A00123`
      );
      assert.equal(response.status, 409);
    } finally {
      server.close();
    }
  });

  it("returns 404 when the reception code does not exist", async () => {
    DangKyTiepDanRepository.findForRatingByCode = async () => null;
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-registrations/rating-lookup/A00123`
      );
      assert.equal(response.status, 404);
    } finally {
      server.close();
    }
  });

  it("returns 400 for an invalid reception code", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-registrations/rating-lookup/***`
      );
      assert.equal(response.status, 400);
    } finally {
      server.close();
    }
  });

  it("limits public rating lookup traffic to 60 requests per 10 minutes per IP", async () => {
    const app = express();
    app.use(createReceptionRatingLookupRateLimiter());
    app.get("/rating-lookup/A00123", (_req, res) =>
      res.json({ success: true })
    );
    const server = app.listen(0);
    const { port } = server.address();

    try {
      for (
        let index = 0;
        index < RECEPTION_RATING_LOOKUP_RATE_LIMIT.limit;
        index += 1
      ) {
        const response = await fetch(
          `http://127.0.0.1:${port}/rating-lookup/A00123`
        );
        assert.equal(response.status, 200);
      }

      const blockedResponse = await fetch(
        `http://127.0.0.1:${port}/rating-lookup/A00123`
      );
      const blockedBody = await blockedResponse.json();

      assert.equal(blockedResponse.status, 429);
      assert.match(blockedBody.message, /mã đánh giá quá nhiều/i);
    } finally {
      server.close();
    }
  });
});
