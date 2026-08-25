import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import prisma from "../src/config/database.config.js";
import { PERMISSION } from "../src/constants/permission.constant.js";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import LeaderMeetingScheduleRepository from "../src/repositories/leader-meeting-schedule.repository.js";
import leaderMeetingScheduleRouter from "../src/routes/leader-meeting-schedule.route.js";
import LeaderMeetingScheduleSwagger from "../src/swagger/leader-meeting-schedule.swagger.js";
import jwtUtils from "../src/utils/jwt.util.js";

const leaderId = "123e4567-e89b-42d3-a456-426614174001";
const scheduleId = "223e4567-e89b-42d3-a456-426614174001";
const slotId = "323e4567-e89b-42d3-a456-426614174001";
const originalFindDaily = LeaderMeetingScheduleRepository.findDailySchedule;
const originalFindLeader = LeaderMeetingScheduleRepository.findLeaderIdentity;
const originalUpdateSlot = LeaderMeetingScheduleRepository.updateDailySlotStatus;
const originalAudit = prisma.audit_logs.create;
let dailySchedule;
let updateInput;

const token = (
  roles = ["LANH_DAO"],
  permissions = [PERMISSION.LMS_GET_ALL, PERMISSION.LMS_UPDATE_STATUS]
) =>
  jwtUtils.signAccessToken(
    { id: leaderId, ten_dang_nhap: "leader", permissions, roles, cate: null },
    "127.0.0.1"
  );

const openSlot = (startTime, endTime) => ({
  id: slotId,
  gio_bat_dau: startTime,
  gio_ket_thuc: endTime,
  suc_chua: 1,
  is_active: true,
  is_delete: false,
  dang_ky_gap_lanh_dao: [],
});

const createServer = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/leader-meeting-schedules", leaderMeetingScheduleRouter);
  app.use(errorHandler);
  return app.listen(0);
};

beforeEach(() => {
  updateInput = null;
  dailySchedule = {
    id: scheduleId,
    ngay: new Date("2099-08-29T00:00:00.000Z"),
    dia_diem: "Phòng tiếp công dân",
    ghi_chu: "Lịch tiếp công dân định kỳ của lãnh đạo",
    is_active: true,
    is_delete: false,
    lanh_dao: { id: leaderId, ho_va_ten: "Nguyễn Văn An" },
    khung_gio_gap_lanh_dao: [
      openSlot("08:30", "09:00"),
      {
        ...openSlot("11:00", "11:30"),
        id: "423e4567-e89b-42d3-a456-426614174001",
      },
    ],
  };
  LeaderMeetingScheduleRepository.findDailySchedule = async () => dailySchedule;
  LeaderMeetingScheduleRepository.findLeaderIdentity = async () => ({
    id: leaderId,
    ho_va_ten: "Nguyễn Văn An",
  });
  LeaderMeetingScheduleRepository.updateDailySlotStatus = async (input) => {
    updateInput = input;
    return { scheduleId, slotId };
  };
  prisma.audit_logs.create = async () => ({ id: "audit" });
});

afterEach(() => {
  LeaderMeetingScheduleRepository.findDailySchedule = originalFindDaily;
  LeaderMeetingScheduleRepository.findLeaderIdentity = originalFindLeader;
  LeaderMeetingScheduleRepository.updateDailySlotStatus = originalUpdateSlot;
  prisma.audit_logs.create = originalAudit;
});

describe("Lưới ca tiếp công dân cố định của lãnh đạo", () => {
  it("được mô tả trên Swagger bằng tiếng Việt", () => {
    const dailyGet = LeaderMeetingScheduleSwagger[
      "/api/leader-meeting-schedules/management"
    ].get;
    const toggle = LeaderMeetingScheduleSwagger[
      "/api/leader-meeting-schedules/management/daily-slots/status"
    ].patch;
    assert.ok(dailyGet.parameters.some((parameter) => parameter.name === "date"));
    assert.ok(
      dailyGet.responses[200].content["application/json"].examples.dailyGrid
    );
    assert.match(toggle.summary, /Mở hoặc đóng/);
    assert.ok(toggle.requestBody.content["application/json"].examples.open);
  });

  it("GET management theo date luôn trả đủ 15 ca, 8 sáng và 7 chiều", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-schedules/management?date=2099-08-29`,
        { headers: { authorization: `Bearer ${token()}` } }
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.data.summary.totalSlots, 15);
      assert.equal(body.data.summary.openSlots, 2);
      assert.equal(body.data.periods[0].slots.length, 8);
      assert.equal(body.data.periods[1].slots.length, 7);
      assert.equal(body.data.periods[0].slots[2].isOpen, true);
    } finally {
      server.close();
    }
  });

  it("không cho tài khoản không phải lãnh đạo xem bảng ca cá nhân", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-schedules/management?date=2099-08-29`,
        { headers: { authorization: `Bearer ${token(["ADMIN"])}` } }
      );
      assert.equal(response.status, 403);
    } finally {
      server.close();
    }
  });

  it("PATCH mở một ca chuẩn bằng lãnh đạo lấy từ access token", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-schedules/management/daily-slots/status`,
        {
          method: "PATCH",
          headers: {
            authorization: `Bearer ${token()}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            receptionDate: "2099-08-29",
            startTime: "09:00",
            endTime: "09:30",
            isOpen: true,
          }),
        }
      );

      assert.equal(response.status, 200);
      assert.equal(updateInput.leaderId, leaderId);
      assert.equal(updateInput.startTime, "09:00");
      assert.equal(updateInput.isOpen, true);
    } finally {
      server.close();
    }
  });

  it("từ chối giờ không thuộc 15 ca chuẩn và request thiếu quyền", async () => {
    const server = createServer();
    const { port } = server.address();
    const url = `http://127.0.0.1:${port}/api/leader-meeting-schedules/management/daily-slots/status`;
    const request = (authorization, payload) =>
      fetch(url, {
        method: "PATCH",
        headers: { authorization, "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
    try {
      const invalidSlot = await request(`Bearer ${token()}`, {
        receptionDate: "2099-08-29",
        startTime: "09:00",
        endTime: "10:00",
        isOpen: true,
      });
      const forbidden = await request(`Bearer ${token(["LANH_DAO"], [])}`, {
        receptionDate: "2099-08-29",
        startTime: "09:00",
        endTime: "09:30",
        isOpen: true,
      });

      assert.equal(invalidSlot.status, 400);
      assert.equal(forbidden.status, 403);
    } finally {
      server.close();
    }
  });

  it("không cho đóng ca đã có công dân đăng ký giữ chỗ", async () => {
    LeaderMeetingScheduleRepository.updateDailySlotStatus = async () => ({
      conflict: "HAS_REGISTRATIONS",
    });
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-schedules/management/daily-slots/status`,
        {
          method: "PATCH",
          headers: {
            authorization: `Bearer ${token()}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            receptionDate: "2099-08-29",
            startTime: "08:30",
            endTime: "09:00",
            isOpen: false,
          }),
        }
      );
      assert.equal(response.status, 409);
    } finally {
      server.close();
    }
  });
});
