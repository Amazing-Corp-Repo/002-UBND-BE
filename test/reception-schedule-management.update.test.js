import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import { PERMISSION } from "../src/constants/permission.constant.js";
import prisma from "../src/config/database.config.js";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import ReceptionScheduleManagementRepository from "../src/repositories/reception-schedule-management.repository.js";
import receptionScheduleManagementRouter from "../src/routes/reception-schedule-management.route.js";
import ReceptionScheduleManagementService from "../src/services/reception-schedule-management.service.js";
import ReceptionScheduleManagementSwagger from "../src/swagger/reception-schedule-management.swagger.js";
import jwtUtils from "../src/utils/jwt.util.js";

const updaterId = "123e4567-e89b-42d3-a456-426614174000";
const scheduleId = "223e4567-e89b-42d3-a456-426614174000";
const originalMethods = {
  findById: ReceptionScheduleManagementRepository.findById,
  findDuplicate: ReceptionScheduleManagementRepository.findByCanBoAndNgayExcludeId,
  countRegistrations: ReceptionScheduleManagementRepository.countRegistrations,
  updateWithSlots: ReceptionScheduleManagementRepository.updateWithSlots,
  auditCreate: prisma.audit_logs.create,
};

const existingSchedule = {
  id: scheduleId,
  ten_can_bo: "Nguyễn Văn An",
  dia_diem: "Bộ phận tiếp công dân",
  ngay_tiep_dan: new Date("2099-08-25T00:00:00.000Z"),
  thoi_gian: "07:30 - 11:30, 13:30 - 16:30",
  is_delete: false,
};

const validBody = {
  tenCanBo: "Nguyễn Văn An",
  diaDiem: "Phòng tiếp công dân tầng 1",
  ngayTiepDan: "2099-08-25",
  ghiChu: "Cập nhật địa điểm",
};

let registrationCount = 0;
let capturedSlotRows = [];
let replaceSlots = false;

const createToken = (permissions) =>
  jwtUtils.signAccessToken(
    {
      id: updaterId,
      ten_dang_nhap: "leader",
      permissions,
      cate: null,
      roles: ["LEADER"],
    },
    "127.0.0.1"
  );

const createTestServer = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/reception-schedules/management", receptionScheduleManagementRouter);
  app.use(errorHandler);
  return app.listen(0);
};

beforeEach(() => {
  registrationCount = 0;
  capturedSlotRows = [];
  replaceSlots = false;
  ReceptionScheduleManagementRepository.findById = async () => ({ ...existingSchedule });
  ReceptionScheduleManagementRepository.findByCanBoAndNgayExcludeId = async () => null;
  ReceptionScheduleManagementRepository.countRegistrations = async () => registrationCount;
  ReceptionScheduleManagementRepository.updateWithSlots = async (
    id,
    scheduleData,
    slotRows,
    shouldReplaceSlots
  ) => {
    capturedSlotRows = slotRows;
    replaceSlots = shouldReplaceSlots;
    return {
      id,
      ...scheduleData,
      khung_gio_tiep_dan: slotRows.map((slot, index) => ({
        id: `slot-${index + 1}`,
        ...slot,
        is_active: true,
        is_delete: false,
      })),
    };
  };
  prisma.audit_logs.create = async () => ({});
});
afterEach(() => {
  ReceptionScheduleManagementRepository.findById = originalMethods.findById;
  ReceptionScheduleManagementRepository.findByCanBoAndNgayExcludeId = originalMethods.findDuplicate;
  ReceptionScheduleManagementRepository.countRegistrations = originalMethods.countRegistrations;
  ReceptionScheduleManagementRepository.updateWithSlots = originalMethods.updateWithSlots;
  prisma.audit_logs.create = originalMethods.auditCreate;
});

describe("PUT /api/reception-schedules/management/:id", () => {
  it("documents the update rules in Swagger", () => {
    const operation = ReceptionScheduleManagementSwagger["/api/reception-schedules/management/{id}"].put;

    assert.ok(operation.description.includes("Không được đổi ngày hoặc giờ"));
    assert.ok(operation.requestBody.content["application/json"].example.workingPeriods);
    assert.ok(operation.responses[200]);
    assert.ok(operation.responses[400]);
    assert.ok(operation.responses[403]);
  });

  it("updates metadata without rebuilding existing slots", async () => {
    const result = await ReceptionScheduleManagementService.updateLichTiepDan(
      scheduleId,
      validBody.tenCanBo,
      validBody.diaDiem,
      validBody.ngayTiepDan,
      undefined,
      undefined,
      validBody.ghiChu,
      updaterId
    );

    assert.equal(result.dia_diem, validBody.diaDiem);
    assert.equal(result.thoi_gian, existingSchedule.thoi_gian);
    assert.equal(replaceSlots, false);
    assert.equal(capturedSlotRows.length, 0);
  });

  it("rebuilds eight-counter slots when working periods change and no slot is held", async () => {
    const periods = [
      { startTime: "08:00", endTime: "11:00" },
      { startTime: "13:00", endTime: "16:00" },
    ];
    const result = await ReceptionScheduleManagementService.updateLichTiepDan(
      scheduleId,
      validBody.tenCanBo,
      validBody.diaDiem,
      validBody.ngayTiepDan,
      undefined,
      undefined,
      validBody.ghiChu,
      updaterId,
      periods
    );

    assert.equal(replaceSlots, true);
    assert.equal(capturedSlotRows.length, 48);
    assert.equal(result.slots.length, 6);
    assert.equal(result.slots[0].totalCapacity, 16);
  });

  it("rejects a date or time change after any registration has held a slot", async () => {
    registrationCount = 1;

    await assert.rejects(
      () =>
        ReceptionScheduleManagementService.updateLichTiepDan(
          scheduleId,
          validBody.tenCanBo,
          validBody.diaDiem,
          "2099-08-26",
          undefined,
          undefined,
          validBody.ghiChu,
          updaterId
        ),
      (error) =>
        error.statusCode === 400 && error.message.includes("đăng ký giữ chỗ")
    );
  });

  it("integrates authentication, authorization and update", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-schedules/management/${scheduleId}`,
        {
          method: "PUT",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${createToken([PERMISSION.LTD_UPDATE])}`,
          },
          body: JSON.stringify(validBody),
        }
      );

      assert.equal(response.status, 200);
      assert.equal((await response.json()).success, true);
    } finally {
      server.close();
    }
  });

  it("returns 400 when only one legacy time boundary is provided", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-schedules/management/${scheduleId}`,
        {
          method: "PUT",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${createToken([PERMISSION.LTD_UPDATE])}`,
          },
          body: JSON.stringify({ ...validBody, batDau: "07:30" }),
        }
      );

      assert.equal(response.status, 400);
    } finally {
      server.close();
    }
  });

  it("returns 403 without LTD_UPDATE permission", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-schedules/management/${scheduleId}`,
        {
          method: "PUT",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${createToken([])}`,
          },
          body: JSON.stringify(validBody),
        }
      );

      assert.equal(response.status, 403);
    } finally {
      server.close();
    }
  });
});
