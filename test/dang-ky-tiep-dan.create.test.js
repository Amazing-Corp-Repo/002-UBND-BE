import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import prisma from "../src/config/database.config.js";
import DangKyTiepDanRepository from "../src/repositories/dang-ky-tiep-dan.repository.js";
import dangKyTiepDanRouter from "../src/routes/dang-ky-tiep-dan.route.js";
import DangKyTiepDanService from "../src/services/dang-ky-tiep-dan.service.js";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";

const originalRepository = { ...DangKyTiepDanRepository };
const originalAuditCreate = prisma.audit_logs.create;

const validBody = {
  idLichTiepDan: "123e4567-e89b-42d3-a456-426614174000",
  slot: "08:00 - 09:00",
  chuDe: "Hướng dẫn thủ tục",
  lyDo: "Tôi cần được hướng dẫn hồ sơ hành chính",
  hoTen: "Nguyễn Văn An",
  sdt: "0912345678",
  cccd: "042204001234",
  diaChi: "Thành phố Hà Tĩnh",
};

const futureSchedule = {
  id: validBody.idLichTiepDan,
  ngay_tiep_dan: new Date("2099-08-20T00:00:00.000Z"),
  is_active: true,
  is_delete: false,
};

const createTestServer = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/reception-registrations", dangKyTiepDanRouter);
  app.use(errorHandler);
  return app.listen(0);
};

beforeEach(() => {
  DangKyTiepDanRepository.findScheduleById = async () => futureSchedule;
  DangKyTiepDanRepository.findDuplicate = async () => null;
  DangKyTiepDanRepository.create = async (data) => ({
    id: "223e4567-e89b-42d3-a456-426614174000",
    ...data,
  });
  prisma.audit_logs.create = async () => ({});
});

afterEach(() => {
  Object.assign(DangKyTiepDanRepository, originalRepository);
  prisma.audit_logs.create = originalAuditCreate;
});

describe("POST /api/reception-registrations", () => {
  it("creates a valid counter reception registration", async () => {
    const result = await DangKyTiepDanService.createCounterReception(validBody);

    assert.match(result.ma_tiep_dan, /^[A-Z]\d{5}$/);
    assert.equal(result.loai, "COUNTER_RECEPTION");
    assert.equal(result.trang_thai, "PENDING");
    assert.equal(result.ngay, futureSchedule.ngay_tiep_dan);
  });

  it("rejects a duplicate phone in the same schedule and slot", async () => {
    DangKyTiepDanRepository.findDuplicate = async () => ({ id: "duplicate" });

    await assert.rejects(
      () => DangKyTiepDanService.createCounterReception(validBody),
      (error) => error.statusCode === 409
    );
  });

  it("returns 400 when required data is missing", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/reception-registrations`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ hoTen: "Nguyễn Văn An" }),
      });
      const body = await response.json();

      assert.equal(response.status, 400);
      assert.equal(body.success, false);
      assert.ok(body.errors.some((item) => item.field === "idLichTiepDan"));
    } finally {
      server.close();
    }
  });

  it("integrates route, validation, controller and service", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/reception-registrations`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(validBody),
      });
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.success, true);
      assert.match(body.data.ma_tiep_dan, /^[A-Z]\d{5}$/);
    } finally {
      server.close();
    }
  });
});
