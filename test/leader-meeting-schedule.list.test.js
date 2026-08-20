import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import LeaderMeetingScheduleRepository from "../src/repositories/leader-meeting-schedule.repository.js";
import leaderMeetingScheduleRouter from "../src/routes/leader-meeting-schedule.route.js";
import LeaderMeetingScheduleSwagger from "../src/swagger/leader-meeting-schedule.swagger.js";

const originalFind = LeaderMeetingScheduleRepository.findAvailableBetweenDates;

const scheduleFixture = {
  id: "223e4567-e89b-42d3-a456-426614174001",
  id_lanh_dao: "123e4567-e89b-42d3-a456-426614174001",
  ngay: new Date("2099-08-25T00:00:00.000Z"),
  dia_diem: "Phòng tiếp công dân",
  ghi_chu: null,
  lanh_dao: {
    id: "123e4567-e89b-42d3-a456-426614174001",
    ho_va_ten: "Nguyễn Văn An",
  },
  khung_gio_gap_lanh_dao: [
    {
      id: "323e4567-e89b-42d3-a456-426614174001",
      gio_bat_dau: "09:00",
      gio_ket_thuc: "10:30",
      suc_chua: 2,
      dang_ky_gap_lanh_dao: [{ id: "423e4567-e89b-42d3-a456-426614174001" }],
    },
  ],
};

const createServer = () => {
  const app = express();
  app.use("/api/leader-meeting-schedules", leaderMeetingScheduleRouter);
  app.use(errorHandler);
  return app.listen(0);
};

beforeEach(() => {
  LeaderMeetingScheduleRepository.findAvailableBetweenDates = async () => [
    scheduleFixture,
  ];
});

afterEach(() => {
  LeaderMeetingScheduleRepository.findAvailableBetweenDates = originalFind;
});

describe("GET /api/leader-meeting-schedules", () => {
  it("documents the Vietnamese public contract without counter fields", () => {
    const operation =
      LeaderMeetingScheduleSwagger["/api/leader-meeting-schedules"].get;
    const example =
      operation.responses[200].content["application/json"].examples.success.value;

    assert.match(operation.summary, /lịch gặp lãnh đạo/i);
    assert.match(operation.description, /không gắn với quầy tiếp dân/i);
    assert.equal(example.data[0].slots[0].status, "AVAILABLE");
    assert.equal("counterId" in example.data[0].slots[0], false);
    assert.equal("counterCode" in example.data[0].slots[0], false);
  });

  it("returns schedules, leader information and slot availability", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-schedules?fromDate=2099-08-01&toDate=2099-08-31`
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.success, true);
      assert.equal(body.data[0].leader.fullName, "Nguyễn Văn An");
      assert.equal(body.data[0].slots[0].capacity, 2);
      assert.equal(body.data[0].slots[0].heldCount, 1);
      assert.equal(body.data[0].slots[0].remainingCapacity, 1);
      assert.equal(body.data[0].slots[0].isFull, false);
      assert.equal("counterId" in body.data[0], false);
    } finally {
      server.close();
    }
  });

  it("marks a slot full after its independent capacity is held", async () => {
    LeaderMeetingScheduleRepository.findAvailableBetweenDates = async () => [
      {
        ...scheduleFixture,
        khung_gio_gap_lanh_dao: [
          {
            ...scheduleFixture.khung_gio_gap_lanh_dao[0],
            suc_chua: 1,
          },
        ],
      },
    ];
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-schedules?leaderId=123e4567-e89b-42d3-a456-426614174001`
      );
      const body = await response.json();

      assert.equal(body.data[0].slots[0].remainingCapacity, 0);
      assert.equal(body.data[0].slots[0].status, "FULL");
      assert.equal(body.data[0].slots[0].isFull, true);
    } finally {
      server.close();
    }
  });

  it("returns 400 for invalid filters", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const invalidDate = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-schedules?fromDate=2099-02-30`
      );
      const invalidLeader = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-schedules?leaderId=invalid`
      );
      const invalidRange = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-schedules?fromDate=2099-09-01&toDate=2099-08-01`
      );

      assert.equal(invalidDate.status, 400);
      assert.equal(invalidLeader.status, 400);
      assert.equal(invalidRange.status, 400);
    } finally {
      server.close();
    }
  });
});
