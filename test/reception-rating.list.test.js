import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import { PERMISSION } from "../src/constants/permission.constant.js";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import ReceptionRatingRepository from "../src/repositories/reception-rating.repository.js";
import receptionRatingRouter from "../src/routes/reception-rating.route.js";
import ReceptionRatingSwagger from "../src/swagger/reception-rating.swagger.js";
import jwtUtils from "../src/utils/jwt.util.js";

const originalFindAllForLeader = ReceptionRatingRepository.findAllForLeader;
const rating = {
  id: "123e4567-e89b-42d3-a456-426614174000",
  diem_tong: 5,
  ly_do: ["Cán bộ rất tận tình và chuyên nghiệp"],
  nhan_xet: "Tôi rất hài lòng",
  thoi_gian_tao: new Date(),
  dang_ky_tiep_dan: {
    ma_tiep_dan: "A00123",
    ho_ten: "Nguyễn Văn An",
    bo_phan: "QUAY_1",
    ngay: new Date("2099-08-20T00:00:00.000Z"),
    slot: "08:00 - 09:00",
    chu_de: "Hướng dẫn thủ tục",
  },
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
  app.use("/api/reception-ratings", receptionRatingRouter);
  app.use(errorHandler);
  return app.listen(0);
};

beforeEach(() => {
  ReceptionRatingRepository.findAllForLeader = async () => ({
    data: [rating],
    totalItems: 1,
  });
});

afterEach(() => {
  ReceptionRatingRepository.findAllForLeader = originalFindAllForLeader;
});

describe("GET /api/reception-ratings", () => {
  it("documents the paginated response contract in Swagger", () => {
    const operation = ReceptionRatingSwagger["/api/reception-ratings"].get;
    const responseSchema =
      operation.responses[200].content["application/json"].schema;

    assert.equal(
      operation.summary,
      "Lấy danh sách đánh giá tiếp dân dành cho lãnh đạo"
    );
    assert.equal(responseSchema.properties.data.type, "array");
    assert.equal(
      responseSchema.properties.data.items.properties.score.maximum,
      5
    );
    assert.equal(responseSchema.properties.pagination.type, "object");
  });

  it("returns a paginated rating list for leaders", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-ratings?page=1&size=10&score=5`,
        {
          headers: {
            authorization: `Bearer ${createToken([PERMISSION.RRT_GET_ALL])}`,
          },
        }
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.data[0].receptionCode, "A00123");
      assert.equal(body.data[0].score, 5);
      assert.equal(body.pagination.totalItems, 1);
    } finally {
      server.close();
    }
  });

  it("returns 401 without an access token", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-ratings`
      );
      assert.equal(response.status, 401);
    } finally {
      server.close();
    }
  });

  it("returns 403 without rating list permission", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-ratings`,
        { headers: { authorization: `Bearer ${createToken([])}` } }
      );
      assert.equal(response.status, 403);
    } finally {
      server.close();
    }
  });

  it("rejects an inverted date range", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-ratings?fromDate=2099-09-01&toDate=2099-08-01`,
        {
          headers: {
            authorization: `Bearer ${createToken([PERMISSION.RRT_GET_ALL])}`,
          },
        }
      );
      assert.equal(response.status, 400);
    } finally {
      server.close();
    }
  });

  for (const invalidDate of [
    "2099-08-20T00:00:00.000Z",
    "2099-02-30",
  ]) {
    it(`rejects invalid fromDate ${invalidDate}`, async () => {
      const server = createTestServer();
      const { port } = server.address();
      try {
        const response = await fetch(
          `http://127.0.0.1:${port}/api/reception-ratings?fromDate=${encodeURIComponent(invalidDate)}`,
          {
            headers: {
              authorization: `Bearer ${createToken([PERMISSION.RRT_GET_ALL])}`,
            },
          }
        );
        assert.equal(response.status, 400);
      } finally {
        server.close();
      }
    });
  }
});
