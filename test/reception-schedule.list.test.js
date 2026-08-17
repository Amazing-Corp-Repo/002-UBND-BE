import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import ReceptionScheduleController from "../src/controllers/reception-schedule.controller.js";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import ReceptionScheduleRepository from "../src/repositories/reception-schedule.repository.js";
import receptionScheduleRouter from "../src/routes/reception-schedule.route.js";
import { buildHourlySlots } from "../src/services/reception-schedule.service.js";

const originalFindActiveBetweenDates =
  ReceptionScheduleRepository.findActiveBetweenDates;

const schedules = [
  {
    id: "123e4567-e89b-42d3-a456-426614174000",
    ten_can_bo: "Trần Văn Bình",
    dia_diem: "Trụ sở UBND",
    ngay_tiep_dan: new Date("2099-08-20T00:00:00.000Z"),
    thoi_gian: "08:00 - 10:30",
    ghi_chu: null,
  },
];

const createTestServer = () => {
  const app = express();
  app.use("/api/reception-schedules", receptionScheduleRouter);
  app.use(errorHandler);
  return app.listen(0);
};

beforeEach(() => {
  ReceptionScheduleRepository.findActiveBetweenDates = async () => schedules;
});

afterEach(() => {
  ReceptionScheduleRepository.findActiveBetweenDates =
    originalFindActiveBetweenDates;
});

describe("GET /api/reception-schedules", () => {
  it("splits a configured time range into display slots", () => {
    assert.deepEqual(buildHourlySlots("08:00 - 10:30"), [
      "08:00 - 09:00",
      "09:00 - 10:00",
      "10:00 - 10:30",
    ]);
    assert.deepEqual(buildHourlySlots("invalid"), []);
  });

  it("returns active schedules through route-controller-service", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-schedules?fromDate=2099-08-01&toDate=2099-08-31`
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.success, true);
      assert.equal(body.data[0].officerName, "Trần Văn Bình");
      assert.deepEqual(body.data[0].availableSlots, [
        "08:00 - 09:00",
        "09:00 - 10:00",
        "10:00 - 10:30",
      ]);
    } finally {
      server.close();
    }
  });

  it("rejects an invalid date range", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-schedules?fromDate=2099-09-01&toDate=2099-08-01`
      );
      assert.equal(response.status, 400);
    } finally {
      server.close();
    }
  });
});
