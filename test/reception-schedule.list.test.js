import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import ReceptionScheduleController from "../src/controllers/reception-schedule.controller.js";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import ReceptionScheduleRepository from "../src/repositories/reception-schedule.repository.js";
import receptionScheduleRouter from "../src/routes/reception-schedule.route.js";
import {
  buildHourlySlots,
  getReceptionVisibilityWindow,
} from "../src/services/reception-schedule.service.js";
import ReceptionScheduleSwagger from "../src/swagger/reception-schedule.swagger.js";

const originalFindActiveBetweenDates =
  ReceptionScheduleRepository.findActiveBetweenDates;

const visibilityWindow = getReceptionVisibilityWindow();
const tomorrow = new Date(`${visibilityWindow.fromDate}T00:00:00.000Z`);
tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

const schedules = [
  {
    id: "123e4567-e89b-42d3-a456-426614174000",
    ten_can_bo: "Trần Văn Bình",
    dia_diem: "Trụ sở UBND",
    ngay_tiep_dan: tomorrow,
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
  it("documents the public date and common time-range contract in Swagger", () => {
    const operation = ReceptionScheduleSwagger["/api/reception-schedules"].get;
    const example =
      operation.responses[200].content["application/json"].examples.success.value
        .data[0];

    assert.ok(operation.description.includes("khoảng thời gian chung"));
    assert.ok(operation.description.includes("7 ngày"));
    assert.ok(operation.responses[200]);
    assert.equal(example.timeRange, "07:30 - 11:30, 13:30 - 16:30");
    assert.equal(example.slots, undefined);
    assert.equal(example.availableSlots, undefined);
    assert.equal(example.openSlots, undefined);
  });

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
        `http://127.0.0.1:${port}/api/reception-schedules`
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.success, true);
      assert.deepEqual(body.data[0], {
        id: schedules[0].id,
        receptionDate: schedules[0].ngay_tiep_dan.toISOString().slice(0, 10),
        timeRange: "08:00 - 10:30",
      });
    } finally {
      server.close();
    }
  });

  it("queries only the rolling seven-day Vietnam window", async () => {
    let capturedRange;
    ReceptionScheduleRepository.findActiveBetweenDates = async (
      fromDate,
      toDate
    ) => {
      capturedRange = { fromDate, toDate };
      return [];
    };
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-schedules`
      );

      assert.equal(response.status, 200);
      assert.deepEqual(capturedRange, visibilityWindow);
    } finally {
      server.close();
    }
  });

  it("does not expose schedules outside the rolling seven-day window", async () => {
    let repositoryCalled = false;
    ReceptionScheduleRepository.findActiveBetweenDates = async () => {
      repositoryCalled = true;
      return schedules;
    };
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-schedules?fromDate=2099-08-01&toDate=2099-08-31`
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.deepEqual(body.data, []);
      assert.equal(repositoryCalled, false);
    } finally {
      server.close();
    }
  });

  it("keeps today's published common time range visible until the date changes", async () => {
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    ReceptionScheduleRepository.findActiveBetweenDates = async () => [{
      ...schedules[0],
      ngay_tiep_dan: new Date(`${today}T00:00:00.000Z`),
      thoi_gian: "00:00 - 01:00",
    }];
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-schedules`
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.data[0].receptionDate, today);
      assert.equal(body.data[0].timeRange, "00:00 - 01:00");
      assert.equal(body.data[0].slots, undefined);
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

  it("rejects dates that are not real YYYY-MM-DD calendar dates", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const invalidFormat = await fetch(
        `http://127.0.0.1:${port}/api/reception-schedules?fromDate=2099-08-01T00:00:00.000Z`
      );
      const invalidCalendarDate = await fetch(
        `http://127.0.0.1:${port}/api/reception-schedules?fromDate=2099-02-30`
      );

      assert.equal(invalidFormat.status, 400);
      assert.equal(invalidCalendarDate.status, 400);
    } finally {
      server.close();
    }
  });
});
