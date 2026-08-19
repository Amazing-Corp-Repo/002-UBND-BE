import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import prisma from "../src/config/database.config.js";
import DangKyTiepDanRepository from "../src/repositories/dang-ky-tiep-dan.repository.js";
import dangKyTiepDanRouter from "../src/routes/dang-ky-tiep-dan.route.js";
import DangKyTiepDanService from "../src/services/dang-ky-tiep-dan.service.js";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import {
  createReceptionRegistrationRateLimiter,
  RECEPTION_REGISTRATION_RATE_LIMIT,
} from "../src/middlewares/reception-registration-rate-limit.middleware.js";
import DangKyTiepDanSwagger from "../src/swagger/dang-ky-tiep-dan.swagger.js";

const originalRepository = { ...DangKyTiepDanRepository };
const originalAuditCreate = prisma.audit_logs.create;
const originalTransaction = prisma.$transaction;

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
  thoi_gian: "08:00 - 09:00",
  khung_gio_tiep_dan: Array.from({ length: 8 }, (_, index) => ({
    id: `${index + 1}23e4567-e89b-42d3-a456-426614174000`,
    khung_gio: "08:00 - 09:00",
    ma_quay: `QUAY_${index + 1}`,
    suc_chua: 2,
  })),
  is_active: true,
  is_delete: false,
};

let guardResult;
let capturedGuardInput;

const createTestServer = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/reception-registrations", dangKyTiepDanRouter);
  app.use(errorHandler);
  return app.listen(0);
};

beforeEach(() => {
  guardResult = null;
  capturedGuardInput = null;
  DangKyTiepDanRepository.findScheduleById = async () => futureSchedule;
  DangKyTiepDanRepository.createWithGuards = async (input) => {
    capturedGuardInput = input;
    if (guardResult) return guardResult;
    return {
      registration: {
        id: "223e4567-e89b-42d3-a456-426614174000",
        ...input.data,
        ngay: futureSchedule.ngay_tiep_dan,
      },
    };
  };
  prisma.audit_logs.create = async () => ({});
});

afterEach(() => {
  Object.assign(DangKyTiepDanRepository, originalRepository);
  prisma.audit_logs.create = originalAuditCreate;
  prisma.$transaction = originalTransaction;
});

describe("POST /api/reception-registrations", () => {
  it("documents capacity, daily limits and rate limit in Swagger", () => {
    const operation = DangKyTiepDanSwagger["/api/reception-registrations"].post;

    assert.ok(operation.description.includes("không hoàn lại"));
    assert.ok(operation.description.includes("tối đa 2 đơn"));
    assert.ok(operation.responses[409]);
    assert.ok(operation.responses[429]);
    assert.ok(operation.responses[503]);
    assert.ok(operation.requestBody.content["application/json"].schema.properties.slotId);
    assert.ok(operation.description.includes("tương thích phiên bản cũ"));
    assert.ok(operation.description.includes("cả SĐT và CCCD"));
  });

  it("creates a valid counter reception registration", async () => {
    const result = await DangKyTiepDanService.createCounterReception(validBody);

    assert.match(result.ma_tiep_dan, /^[A-Z]\d{5}$/);
    assert.equal(result.loai, "COUNTER_RECEPTION");
    assert.equal(result.trang_thai, "PENDING");
    assert.equal(result.ngay, futureSchedule.ngay_tiep_dan);
    assert.equal(capturedGuardInput.totalCapacity, 16);
    assert.equal(result.slotId, futureSchedule.khung_gio_tiep_dan[0].id);
  });

  it("creates a registration from slotId without requiring the legacy slot string", async () => {
    const { slot: _legacySlot, ...bodyWithoutSlot } = validBody;
    const result = await DangKyTiepDanService.createCounterReception({
      ...bodyWithoutSlot,
      slotId: futureSchedule.khung_gio_tiep_dan[0].id,
    });

    assert.equal(capturedGuardInput.slot, "08:00 - 09:00");
    assert.equal(
      capturedGuardInput.slotId,
      futureSchedule.khung_gio_tiep_dan[0].id
    );
    assert.equal(result.slotId, futureSchedule.khung_gio_tiep_dan[0].id);
  });

  it("rejects slotId that does not belong to the selected schedule", async () => {
    await assert.rejects(
      () =>
        DangKyTiepDanService.createCounterReception({
          ...validBody,
          slotId: "923e4567-e89b-42d3-a456-426614174000",
        }),
      (error) => error.statusCode === 404
    );
  });

  it("rejects mismatched slotId and legacy slot values", async () => {
    await assert.rejects(
      () =>
        DangKyTiepDanService.createCounterReception({
          ...validBody,
          slotId: futureSchedule.khung_gio_tiep_dan[0].id,
          slot: "09:00 - 10:00",
        }),
      (error) => error.statusCode === 400
    );
  });

  it("rejects a time slot that has already started today", async () => {
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    DangKyTiepDanRepository.findScheduleById = async () => ({
      ...futureSchedule,
      ngay_tiep_dan: new Date(`${today}T00:00:00.000Z`),
      khung_gio_tiep_dan: futureSchedule.khung_gio_tiep_dan.map((slot) => ({
        ...slot,
        khung_gio: "00:00 - 01:00",
      })),
    });

    await assert.rejects(
      () =>
        DangKyTiepDanService.createCounterReception({
          ...validBody,
          slot: "00:00 - 01:00",
        }),
      (error) =>
        error.statusCode === 409 && error.message.includes("đã qua")
    );
  });

  it("rejects a duplicate phone in the same schedule and slot", async () => {
    guardResult = { conflict: "DUPLICATE_SLOT_PHONE" };

    await assert.rejects(
      () => DangKyTiepDanService.createCounterReception(validBody),
      (error) => error.statusCode === 409
    );
  });

  it("rejects a duplicate citizen ID in the same schedule and slot", async () => {
    guardResult = { conflict: "DUPLICATE_SLOT_CITIZEN" };

    await assert.rejects(
      () => DangKyTiepDanService.createCounterReception(validBody),
      (error) =>
        error.statusCode === 409 && error.message.includes("CCCD")
    );
  });

  it("maps database phone and citizen unique constraints to 409", async () => {
    for (const [target, expectedMessage] of [
      [["id_lich_tiep_dan", "slot", "sdt"], "Số điện thoại"],
      [["id_lich_tiep_dan", "slot", "cccd"], "CCCD"],
    ]) {
      DangKyTiepDanRepository.createWithGuards = async () => {
        const error = new Error("Unique constraint failed");
        error.code = "P2002";
        error.meta = { target };
        throw error;
      };

      await assert.rejects(
        () => DangKyTiepDanService.createCounterReception(validBody),
        (error) =>
          error.statusCode === 409 && error.message.includes(expectedMessage)
      );
    }
  });

  it("retries serialization conflicts and succeeds without duplicating", async () => {
    let attempts = 0;
    DangKyTiepDanRepository.createWithGuards = async (input) => {
      attempts += 1;
      if (attempts < 3) {
        const error = new Error("Transaction conflict");
        error.code = "P2034";
        throw error;
      }
      return {
        registration: {
          id: "223e4567-e89b-42d3-a456-426614174000",
          ...input.data,
          ngay: futureSchedule.ngay_tiep_dan,
        },
      };
    };

    const result = await DangKyTiepDanService.createCounterReception(validBody);

    assert.equal(attempts, 3);
    assert.match(result.ma_tiep_dan, /^[A-Z]\d{5}$/);
  });

  it("returns 503 after serialization retries are exhausted", async () => {
    let attempts = 0;
    DangKyTiepDanRepository.createWithGuards = async () => {
      attempts += 1;
      const error = new Error("Transaction conflict");
      error.code = "P2034";
      throw error;
    };

    await assert.rejects(
      () => DangKyTiepDanService.createCounterReception(validBody),
      (error) => error.statusCode === 503
    );
    assert.equal(attempts, 10);
  });

  it("rejects a full slot", async () => {
    guardResult = { conflict: "SLOT_FULL" };

    await assert.rejects(
      () => DangKyTiepDanService.createCounterReception(validBody),
      (error) => error.statusCode === 409 && error.message.includes("đủ sức chứa")
    );
  });

  it("counts every stored registration when enforcing capacity", async () => {
    let capacityWhere;
    let createCalled = false;
    const tx = {
      lich_tiep_dan: {
        findFirst: async () => futureSchedule,
      },
      khung_gio_tiep_dan: {
        findMany: async () => futureSchedule.khung_gio_tiep_dan,
      },
      dang_ky_tiep_dan: {
        findFirst: async () => null,
        count: async ({ where }) => {
          if (where.id_lich_tiep_dan && where.slot) {
            capacityWhere = where;
            return 16;
          }
          return 0;
        },
        create: async () => {
          createCalled = true;
          return {};
        },
      },
    };
    prisma.$transaction = async (callback) => callback(tx);

    const result = await originalRepository.createWithGuards({
      scheduleId: validBody.idLichTiepDan,
      slot: validBody.slot,
      phoneNumber: validBody.sdt,
      citizenId: validBody.cccd,
      totalCapacity: 16,
      data: {},
    });

    assert.equal(result.conflict, "SLOT_FULL");
    assert.equal(createCalled, false);
    assert.equal("is_delete" in capacityWhere, false);
    assert.equal("trang_thai" in capacityWhere, false);
  });

  it("checks duplicate citizen ID inside the serializable transaction", async () => {
    let createCalled = false;
    const tx = {
      lich_tiep_dan: {
        findFirst: async () => futureSchedule,
      },
      khung_gio_tiep_dan: {
        findMany: async () => futureSchedule.khung_gio_tiep_dan,
      },
      dang_ky_tiep_dan: {
        findFirst: async ({ where }) =>
          where.cccd === validBody.cccd ? { id: "duplicate-citizen" } : null,
        count: async () => 0,
        create: async () => {
          createCalled = true;
          return {};
        },
      },
    };
    prisma.$transaction = async (callback, options) => {
      assert.equal(options.isolationLevel, "Serializable");
      return callback(tx);
    };

    const result = await originalRepository.createWithGuards({
      scheduleId: validBody.idLichTiepDan,
      slot: validBody.slot,
      phoneNumber: validBody.sdt,
      citizenId: validBody.cccd,
      totalCapacity: 16,
      data: {},
    });

    assert.equal(result.conflict, "DUPLICATE_SLOT_CITIZEN");
    assert.equal(createCalled, false);
  });

  it("rejects daily limits for phone number and citizen ID", async () => {
    guardResult = { conflict: "PHONE_DAILY_LIMIT" };
    await assert.rejects(
      () => DangKyTiepDanService.createCounterReception(validBody),
      (error) => error.statusCode === 409 && error.message.includes("Số điện thoại")
    );

    guardResult = { conflict: "CITIZEN_DAILY_LIMIT" };
    await assert.rejects(
      () => DangKyTiepDanService.createCounterReception(validBody),
      (error) => error.statusCode === 409 && error.message.includes("CCCD")
    );
  });

  it("rejects a slot that does not belong to the selected schedule", async () => {
    await assert.rejects(
      () =>
        DangKyTiepDanService.createCounterReception({
          ...validBody,
          slot: "09:00 - 10:00",
        }),
      (error) => error.statusCode === 400
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

  it("integrates route validation with slotId and no legacy slot", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const { slot: _legacySlot, ...bodyWithoutSlot } = validBody;
      const response = await fetch(`http://127.0.0.1:${port}/api/reception-registrations`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...bodyWithoutSlot,
          slotId: futureSchedule.khung_gio_tiep_dan[0].id,
        }),
      });
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.success, true);
      assert.equal(body.data.slotId, futureSchedule.khung_gio_tiep_dan[0].id);
    } finally {
      server.close();
    }
  });

  it("limits registration traffic to 30 requests per 10 minutes per IP", async () => {
    const app = express();
    app.post("/", createReceptionRegistrationRateLimiter(), (_req, res) => {
      res.status(200).json({ success: true });
    });
    const server = app.listen(0);
    const { port } = server.address();
    try {
      let lastResponse;
      for (
        let index = 0;
        index < RECEPTION_REGISTRATION_RATE_LIMIT.limit + 1;
        index += 1
      ) {
        lastResponse = await fetch(`http://127.0.0.1:${port}`, {
          method: "POST",
        });
      }

      assert.equal(lastResponse.status, 429);
    } finally {
      server.close();
    }
  });
});
