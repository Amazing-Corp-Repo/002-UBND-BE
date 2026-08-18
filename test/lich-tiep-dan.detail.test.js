import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import LichTiepDanRepository from "../src/repositories/lich-tiep-dan.repository.js";
import lichTiepDanRouter from "../src/routes/lich-tiep-dan.route.js";
import LichTiepDanService from "../src/services/lich-tiep-dan.service.js";
import LichTiepDanSwagger from "../src/swagger/lich-tiep-dan.swagger.js";

const scheduleId = "223e4567-e89b-42d3-a456-426614174000";
const originalFindDetailById = LichTiepDanRepository.findDetailById;

const scheduleDetail = {
  id: scheduleId,
  ten_can_bo: "Nguyễn Văn An",
  dia_diem: "Bộ phận tiếp công dân",
  ngay_tiep_dan: new Date("2099-08-25T00:00:00.000Z"),
  thoi_gian: "07:30 - 08:30",
  is_delete: false,
  khung_gio_tiep_dan: Array.from({ length: 8 }, (_, index) => ({
    id: `slot-${index + 1}`,
    khung_gio: "07:30 - 08:30",
    ma_quay: `QUAY_${index + 1}`,
    suc_chua: 2,
    is_active: true,
    is_delete: false,
  })),
  dang_ky_tiep_dan: [
    { slot: "07:30 - 08:30", bo_phan: null },
    { slot: "07:30 - 08:30", bo_phan: "QUAY_1" },
    { slot: "07:30 - 08:30", bo_phan: "QUAY_1" },
  ],
};

const createTestServer = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/lich-tiep-dan", lichTiepDanRouter);
  app.use(errorHandler);
  return app.listen(0);
};

beforeEach(() => {
  LichTiepDanRepository.findDetailById = async () => ({
    ...scheduleDetail,
    khung_gio_tiep_dan: scheduleDetail.khung_gio_tiep_dan.map((slot) => ({
      ...slot,
    })),
    dang_ky_tiep_dan: scheduleDetail.dang_ky_tiep_dan.map((item) => ({
      ...item,
    })),
  });
});

afterEach(() => {
  LichTiepDanRepository.findDetailById = originalFindDetailById;
});

describe("GET /api/lich-tiep-dan/:id", () => {
  it("documents slot occupancy in Swagger", () => {
    const operation = LichTiepDanSwagger["/api/lich-tiep-dan/{id}"].get;

    assert.ok(operation.description.includes("số đăng ký đã giữ chỗ"));
    assert.ok(operation.responses[200]);
    assert.ok(operation.responses[404]);
  });

  it("returns slot, counter and held-capacity details", async () => {
    const result = await LichTiepDanService.getLichTiepDanById(scheduleId);
    const slot = result.slots[0];
    const firstCounter = slot.counters[0];

    assert.equal(slot.totalCapacity, 16);
    assert.equal(slot.heldCount, 3);
    assert.equal(slot.unassignedHeldCount, 1);
    assert.equal(slot.remainingCapacity, 13);
    assert.equal(slot.isFull, false);
    assert.equal(firstCounter.counterCode, "QUAY_1");
    assert.equal(firstCounter.heldCount, 2);
    assert.equal(firstCounter.remainingCapacity, 0);
    assert.equal(firstCounter.isFull, true);
    assert.equal("dang_ky_tiep_dan" in result, false);
  });

  it("integrates the public detail route with the service", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/lich-tiep-dan/${scheduleId}`
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.success, true);
      assert.equal(body.data.slots[0].heldCount, 3);
    } finally {
      server.close();
    }
  });

  it("returns 404 when the schedule does not exist", async () => {
    LichTiepDanRepository.findDetailById = async () => null;
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/lich-tiep-dan/${scheduleId}`
      );

      assert.equal(response.status, 404);
    } finally {
      server.close();
    }
  });
});
