import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import { PERMISSION } from "../src/constants/permission.constant.js";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import ReceptionRatingRepository from "../src/repositories/reception-rating.repository.js";
import receptionRatingRouter from "../src/routes/reception-rating.route.js";
import ReceptionRatingSwagger from "../src/swagger/reception-rating.swagger.js";
import jwtUtils from "../src/utils/jwt.util.js";

const ratingId = "123e4567-e89b-42d3-a456-426614174000";
const originalFindDetailById = ReceptionRatingRepository.findDetailById;
const rating = {
  id: ratingId,
  id_dang_ky_tiep_dan: null,
  ma_tiep_dan: "TD-20260822-001",
  ten_nguoi_dan: "Nguyễn Văn An",
  ten_can_bo: "Trần Thị Bình",
  ma_quay: "QUAY_1",
  ngay_tiep_dan: new Date("2026-08-22T00:00:00.000Z"),
  khung_gio: "08:00 - 09:00",
  noi_dung_lam_viec: "Hướng dẫn thủ tục",
  diem_tong: 5,
  ly_do: ["Cán bộ rất tận tình và chuyên nghiệp"],
  nhan_xet: "Tôi rất hài lòng",
  thoi_gian_tao: new Date(),
  dang_ky_tiep_dan: null,
};

const createToken = (permissions) =>
  jwtUtils.signAccessToken(
    {
      id: "323e4567-e89b-42d3-a456-426614174000",
      ten_dang_nhap: "leader",
      permissions,
      cate: null,
      roles: ["LEADER"],
    },
    "127.0.0.1"
  );

const createTestServer = () => {
  const app = express();
  app.use("/api/reception-ratings", receptionRatingRouter);
  app.use(errorHandler);
  return app.listen(0);
};

beforeEach(() => {
  ReceptionRatingRepository.findDetailById = async () => rating;
});

afterEach(() => {
  ReceptionRatingRepository.findDetailById = originalFindDetailById;
});

describe("GET /api/reception-ratings/:id", () => {
  it("documents rating, applicant and schedule details in Swagger", () => {
    const operation = ReceptionRatingSwagger["/api/reception-ratings/{id}"].get;
    const dataSchema =
      operation.responses[200].content["application/json"].schema.properties
        .data;

    assert.equal(operation.security[0].bearerAuth.length, 0);
    assert.equal(dataSchema.properties.score.maximum, 5);
    assert.equal(
      dataSchema.properties.registration.properties.applicant.type,
      "object"
    );
    assert.equal(
      dataSchema.properties.registration.properties.schedule.nullable,
      true
    );
  });

  it("returns the full manual rating without a registration relation", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-ratings/${ratingId}`,
        {
          headers: {
            authorization: `Bearer ${createToken([PERMISSION.RRT_GET_DETAIL])}`,
          },
        }
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.data.score, 5);
      assert.equal(body.data.receptionCode, "TD-20260822-001");
      assert.equal(body.data.officerName, "Trần Thị Bình");
      assert.equal(body.data.registration.receptionCode, "TD-20260822-001");
      assert.equal(body.data.registration.applicant.citizenId, null);
    } finally {
      server.close();
    }
  });

  it("returns 400 for an invalid rating UUID", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-ratings/not-a-uuid`,
        {
          headers: {
            authorization: `Bearer ${createToken([PERMISSION.RRT_GET_DETAIL])}`,
          },
        }
      );
      assert.equal(response.status, 400);
    } finally {
      server.close();
    }
  });

  it("returns 401 without an access token", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-ratings/${ratingId}`
      );
      assert.equal(response.status, 401);
    } finally {
      server.close();
    }
  });

  it("returns 404 when rating does not exist", async () => {
    ReceptionRatingRepository.findDetailById = async () => null;
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-ratings/${ratingId}`,
        {
          headers: {
            authorization: `Bearer ${createToken([PERMISSION.RRT_GET_DETAIL])}`,
          },
        }
      );
      assert.equal(response.status, 404);
    } finally {
      server.close();
    }
  });

  it("returns 404 when the rating is not for counter reception", async () => {
    ReceptionRatingRepository.findDetailById = async () => ({
      ...rating,
      id_dang_ky_tiep_dan: "223e4567-e89b-42d3-a456-426614174000",
      dang_ky_tiep_dan: {
        loai: "LEADER_MEETING",
      },
    });
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-ratings/${ratingId}`,
        {
          headers: {
            authorization: `Bearer ${createToken([PERMISSION.RRT_GET_DETAIL])}`,
          },
        }
      );
      assert.equal(response.status, 404);
    } finally {
      server.close();
    }
  });

  it("returns 403 without rating detail permission", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-ratings/${ratingId}`,
        { headers: { authorization: `Bearer ${createToken([])}` } }
      );
      assert.equal(response.status, 403);
    } finally {
      server.close();
    }
  });
});
