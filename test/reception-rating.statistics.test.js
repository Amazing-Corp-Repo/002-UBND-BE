import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import { PERMISSION } from "../src/constants/permission.constant.js";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import ReceptionRatingRepository from "../src/repositories/reception-rating.repository.js";
import receptionRatingRouter from "../src/routes/reception-rating.route.js";
import jwtUtils from "../src/utils/jwt.util.js";

const originalGetStatistics = ReceptionRatingRepository.getStatistics;

const createToken = (permissions) =>
  jwtUtils.signAccessToken(
    {
      id: "123e4567-e89b-42d3-a456-426614174000",
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
  ReceptionRatingRepository.getStatistics = async () => ({
    overall: { _count: { _all: 4 }, _avg: { diem_tong: 4.25 } },
    scoreGroups: [
      { diem_tong: 3, _count: { _all: 1 } },
      { diem_tong: 4, _count: { _all: 1 } },
      { diem_tong: 5, _count: { _all: 2 } },
    ],
    departmentGroups: [
      {
        department: "QUAY_1",
        _count: { _all: 4 },
        _avg: { diem_tong: 4.25 },
      },
    ],
  });
});

afterEach(() => {
  ReceptionRatingRepository.getStatistics = originalGetStatistics;
});

describe("GET /api/reception-ratings/statistics", () => {
  it("returns score distribution and satisfaction rate", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-ratings/statistics?department=QUAY_1`,
        {
          headers: {
            authorization: `Bearer ${createToken([PERMISSION.RRT_GET_STATS])}`,
          },
        }
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.data.totalRatings, 4);
      assert.equal(body.data.averageScore, 4.25);
      assert.equal(body.data.satisfactionRate, 75);
      assert.deepEqual(body.data.scoreDistribution.map((item) => item.count), [
        0,
        0,
        1,
        1,
        2,
      ]);
    } finally {
      server.close();
    }
  });

  it("returns zero-safe statistics when no ratings exist", async () => {
    ReceptionRatingRepository.getStatistics = async () => ({
      overall: { _count: { _all: 0 }, _avg: { diem_tong: null } },
      scoreGroups: [],
      departmentGroups: [],
    });
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-ratings/statistics`,
        {
          headers: {
            authorization: `Bearer ${createToken([PERMISSION.RRT_GET_STATS])}`,
          },
        }
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.data.averageScore, 0);
      assert.equal(body.data.satisfactionRate, 0);
    } finally {
      server.close();
    }
  });

  it("returns 403 without statistics permission", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-ratings/statistics`,
        { headers: { authorization: `Bearer ${createToken([])}` } }
      );
      assert.equal(response.status, 403);
    } finally {
      server.close();
    }
  });
});
