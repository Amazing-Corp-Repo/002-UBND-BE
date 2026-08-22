import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import { PERMISSION } from "../src/constants/permission.constant.js";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import ReceptionRatingRepository from "../src/repositories/reception-rating.repository.js";
import receptionRatingRouter from "../src/routes/reception-rating.route.js";
import ReceptionRatingSwagger from "../src/swagger/reception-rating.swagger.js";
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
    counterGroups: [
      {
        counterCode: "QUAY_1",
        _count: { _all: 4 },
        _avg: { diem_tong: 4.25 },
      },
    ],
    officerGroups: [
      {
        ten_can_bo: "Trần Thị Bình",
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
  it("documents the basic statistics response in Swagger", () => {
    const operation =
      ReceptionRatingSwagger["/api/reception-ratings/statistics"].get;
    const dataSchema =
      operation.responses[200].content["application/json"].schema.properties
        .data;

    assert.equal(dataSchema.properties.averageScore.maximum, 5);
    assert.equal(dataSchema.properties.satisfactionRate.maximum, 100);
    assert.equal(dataSchema.properties.scoreDistribution.minItems, 5);
    assert.equal(dataSchema.properties.byCounter.type, "array");
    assert.equal(dataSchema.properties.byOfficer.type, "array");
    assert.equal(operation.responses[403].description.includes("RRT_GET_STATS"), true);
  });

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
      assert.equal(body.data.byCounter[0].counterCode, "QUAY_1");
      assert.equal(body.data.byDepartment[0].department, "QUAY_1");
      assert.equal(body.data.byOfficer[0].officerName, "Trần Thị Bình");
    } finally {
      server.close();
    }
  });

  it("returns 401 without an access token", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-ratings/statistics`
      );
      assert.equal(response.status, 401);
    } finally {
      server.close();
    }
  });

  it("returns 400 for an invalid counter", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-ratings/statistics?department=QUAY_9`,
        {
          headers: {
            authorization: `Bearer ${createToken([PERMISSION.RRT_GET_STATS])}`,
          },
        }
      );
      assert.equal(response.status, 400);
    } finally {
      server.close();
    }
  });

  it("returns 400 for an inverted date range", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-ratings/statistics?fromDate=2099-09-01&toDate=2099-08-01`,
        {
          headers: {
            authorization: `Bearer ${createToken([PERMISSION.RRT_GET_STATS])}`,
          },
        }
      );
      assert.equal(response.status, 400);
    } finally {
      server.close();
    }
  });

  it("returns 400 for a date that does not exist", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-ratings/statistics?fromDate=2099-02-30`,
        {
          headers: {
            authorization: `Bearer ${createToken([PERMISSION.RRT_GET_STATS])}`,
          },
        }
      );
      assert.equal(response.status, 400);
    } finally {
      server.close();
    }
  });

  it("returns zero-safe statistics when no ratings exist", async () => {
    ReceptionRatingRepository.getStatistics = async () => ({
      overall: { _count: { _all: 0 }, _avg: { diem_tong: null } },
      scoreGroups: [],
      counterGroups: [],
      officerGroups: [],
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
