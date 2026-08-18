import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import { PERMISSION } from "../src/constants/permission.constant.js";
import prisma from "../src/config/database.config.js";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import LichTiepDanRepository from "../src/repositories/lich-tiep-dan.repository.js";
import lichTiepDanRouter from "../src/routes/lich-tiep-dan.route.js";
import LichTiepDanService from "../src/services/lich-tiep-dan.service.js";
import LichTiepDanSwagger from "../src/swagger/lich-tiep-dan.swagger.js";
import jwtUtils from "../src/utils/jwt.util.js";

const creatorId = "123e4567-e89b-42d3-a456-426614174000";
const scheduleId = "223e4567-e89b-42d3-a456-426614174000";
const originalMethods = {
  findByCanBoAndNgay: LichTiepDanRepository.findByCanBoAndNgay,
  createWithSlots: LichTiepDanRepository.createWithSlots,
  auditCreate: prisma.audit_logs.create,
};

let capturedSlotRows = [];

const validBody = {
  tenCanBo: "Nguyễn Văn An",
  diaDiem: "Bộ phận tiếp công dân",
  ngayTiepDan: "2099-08-25",
  ghiChu: "Tiếp công dân định kỳ",
};

const createToken = (permissions) =>
  jwtUtils.signAccessToken(
    {
      id: creatorId,
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
  app.use("/api/lich-tiep-dan", lichTiepDanRouter);
  app.use(errorHandler);
  return app.listen(0);
};

beforeEach(() => {
  capturedSlotRows = [];
  LichTiepDanRepository.findByCanBoAndNgay = async () => null;
  LichTiepDanRepository.createWithSlots = async (scheduleData, slotRows) => {
    capturedSlotRows = slotRows;
    return {
      id: scheduleId,
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
  LichTiepDanRepository.findByCanBoAndNgay = originalMethods.findByCanBoAndNgay;
  LichTiepDanRepository.createWithSlots = originalMethods.createWithSlots;
  prisma.audit_logs.create = originalMethods.auditCreate;
});

describe("POST /api/lich-tiep-dan", () => {
  it("documents the API contract in Swagger", () => {
    const operation = LichTiepDanSwagger["/api/lich-tiep-dan"].post;

    assert.equal(operation.summary, "Tạo mới lịch tiếp dân");
    assert.ok(operation.description.includes("tự sinh cấu hình slot cho 8 quầy"));
    assert.ok(operation.requestBody.content["application/json"].examples.defaultWorkingHours);
    assert.ok(operation.responses[200]);
    assert.ok(operation.responses[400]);
    assert.ok(operation.responses[403]);
  });

  it("creates seven default hourly slots for all eight counters", async () => {
    const result = await LichTiepDanService.createLichTiepDan(
      validBody.tenCanBo,
      validBody.diaDiem,
      validBody.ngayTiepDan,
      undefined,
      undefined,
      validBody.ghiChu,
      creatorId
    );

    assert.equal(capturedSlotRows.length, 56);
    assert.equal(result.slots.length, 7);
    assert.equal(result.slots[0].timeSlot, "07:30 - 08:30");
    assert.equal(result.slots[0].totalCapacity, 16);
    assert.equal(result.slots[6].timeSlot, "15:30 - 16:30");
    assert.equal(result.slots.every((slot) => slot.counters.length === 8), true);
  });

  it("keeps the legacy batDau and ketThuc request contract", async () => {
    const result = await LichTiepDanService.createLichTiepDan(
      validBody.tenCanBo,
      validBody.diaDiem,
      validBody.ngayTiepDan,
      "07:30",
      "11:30",
      validBody.ghiChu,
      creatorId
    );

    assert.equal(capturedSlotRows.length, 32);
    assert.equal(result.thoi_gian, "07:30 - 11:30");
    assert.equal(result.slots.length, 4);
  });

  it("integrates authentication, authorization, validation and creation", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/lich-tiep-dan`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${createToken([PERMISSION.LTD_CREATE])}`,
        },
        body: JSON.stringify(validBody),
      });
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.success, true);
      assert.equal(body.data.slots.length, 7);
      assert.equal(capturedSlotRows.length, 56);
    } finally {
      server.close();
    }
  });

  it("returns 400 when required schedule data is missing", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/lich-tiep-dan`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${createToken([PERMISSION.LTD_CREATE])}`,
        },
        body: JSON.stringify({ diaDiem: "Bộ phận tiếp công dân" }),
      });

      assert.equal(response.status, 400);
    } finally {
      server.close();
    }
  });

  it("returns 403 without LTD_CREATE permission", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/lich-tiep-dan`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${createToken([])}`,
        },
        body: JSON.stringify(validBody),
      });

      assert.equal(response.status, 403);
    } finally {
      server.close();
    }
  });

  it("rejects overlapping working periods", async () => {
    await assert.rejects(
      () =>
        LichTiepDanService.createLichTiepDan(
          validBody.tenCanBo,
          validBody.diaDiem,
          validBody.ngayTiepDan,
          undefined,
          undefined,
          validBody.ghiChu,
          creatorId,
          [
            { startTime: "07:30", endTime: "11:30" },
            { startTime: "10:30", endTime: "13:30" },
          ]
        ),
      (error) => error.statusCode === 400
    );
  });
});
