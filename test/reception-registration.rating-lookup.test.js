import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import DangKyTiepDanRepository from "../src/repositories/dang-ky-tiep-dan.repository.js";
import dangKyTiepDanRouter from "../src/routes/dang-ky-tiep-dan.route.js";

const originalFindForRatingByCode =
  DangKyTiepDanRepository.findForRatingByCode;

const approvedRegistration = {
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
  trang_thai: "APPROVED",
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
    approvedRegistration;
});

afterEach(() => {
  DangKyTiepDanRepository.findForRatingByCode =
    originalFindForRatingByCode;
});

describe("GET /api/reception-registrations/rating-lookup/:receptionCode", () => {
  it("returns approved unrated registration details", async () => {
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

  it("rejects a registration that is not approved", async () => {
    DangKyTiepDanRepository.findForRatingByCode = async () => ({
      ...approvedRegistration,
      trang_thai: "PENDING",
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
      ...approvedRegistration,
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
});
