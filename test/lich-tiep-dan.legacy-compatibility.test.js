import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import prisma from "../src/config/database.config.js";
import { PERMISSION } from "../src/constants/permission.constant.js";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import LichTiepDanRepository from "../src/repositories/lich-tiep-dan.repository.js";
import lichTiepDanRouter from "../src/routes/lich-tiep-dan.route.js";
import LichTiepDanSwagger from "../src/swagger/lich-tiep-dan.swagger.js";
import jwtUtils from "../src/utils/jwt.util.js";

const userId = "123e4567-e89b-42d3-a456-426614174000";
const scheduleId = "223e4567-e89b-42d3-a456-426614174000";
const originalMethods = {
  findByCanBoAndNgay: LichTiepDanRepository.findByCanBoAndNgay,
  findByCanBoAndNgayExcludeId:
    LichTiepDanRepository.findByCanBoAndNgayExcludeId,
  findById: LichTiepDanRepository.findById,
  create: LichTiepDanRepository.create,
  update: LichTiepDanRepository.update,
  auditCreate: prisma.audit_logs.create,
};

const validBody = {
  tenCanBo: "Nguyễn Văn An",
  diaDiem: "Bộ phận tiếp công dân",
  ngayTiepDan: "2099-08-25",
  batDau: "07:30",
  ketThuc: "11:30",
  ghiChu: "Contract cũ",
};

const token = (permissions) =>
  jwtUtils.signAccessToken(
    {
      id: userId,
      ten_dang_nhap: "leader",
      permissions,
      cate: null,
      roles: ["LEADER"],
    },
    "127.0.0.1"
  );

const createServer = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/lich-tiep-dan", lichTiepDanRouter);
  app.use(errorHandler);
  return app.listen(0);
};

beforeEach(() => {
  LichTiepDanRepository.findByCanBoAndNgay = async () => null;
  LichTiepDanRepository.findByCanBoAndNgayExcludeId = async () => null;
  LichTiepDanRepository.findById = async () => ({
    id: scheduleId,
    ten_can_bo: validBody.tenCanBo,
    dia_diem: validBody.diaDiem,
    ngay_tiep_dan: validBody.ngayTiepDan,
    thoi_gian: "07:30 - 11:30",
    ghi_chu: validBody.ghiChu,
    is_delete: false,
  });
  LichTiepDanRepository.create = async (data) => ({ id: scheduleId, ...data });
  LichTiepDanRepository.update = async (id, data) => ({ id, ...data });
  prisma.audit_logs.create = async () => ({});
});

afterEach(() => {
  LichTiepDanRepository.findByCanBoAndNgay = originalMethods.findByCanBoAndNgay;
  LichTiepDanRepository.findByCanBoAndNgayExcludeId =
    originalMethods.findByCanBoAndNgayExcludeId;
  LichTiepDanRepository.findById = originalMethods.findById;
  LichTiepDanRepository.create = originalMethods.create;
  LichTiepDanRepository.update = originalMethods.update;
  prisma.audit_logs.create = originalMethods.auditCreate;
});

describe("Legacy /api/lich-tiep-dan compatibility", () => {
  it("keeps the original Swagger description instead of slot extensions", () => {
    const createOperation = LichTiepDanSwagger["/api/lich-tiep-dan"].post;
    const detailOperation =
      LichTiepDanSwagger["/api/lich-tiep-dan/{id}"].get;

    assert.equal(
      createOperation.description,
      "Tạo mới một lịch tiếp dân với các thông tin chi tiết liên quan."
    );
    assert.deepEqual(detailOperation.responses, {});
  });

  it("creates a schedule with the original required start and end fields", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/lich-tiep-dan`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token([PERMISSION.LTD_CREATE])}`,
          },
          body: JSON.stringify(validBody),
        }
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.data.thoi_gian, "07:30 - 11:30");
      assert.equal("slots" in body.data, false);
    } finally {
      server.close();
    }
  });

  it("does not accept workingPeriods as a replacement for the old time fields", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const { batDau: _start, ketThuc: _end, ...withoutLegacyTime } = validBody;
      const response = await fetch(
        `http://127.0.0.1:${port}/api/lich-tiep-dan`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token([PERMISSION.LTD_CREATE])}`,
          },
          body: JSON.stringify({
            ...withoutLegacyTime,
            workingPeriods: [{ startTime: "07:30", endTime: "11:30" }],
          }),
        }
      );

      assert.equal(response.status, 400);
    } finally {
      server.close();
    }
  });

  it("returns the original raw detail response without slot capacity fields", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/lich-tiep-dan/${scheduleId}`
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.data.thoi_gian, "07:30 - 11:30");
      assert.equal("slots" in body.data, false);
    } finally {
      server.close();
    }
  });

  it("updates through the original endpoint without rebuilding slots", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/lich-tiep-dan/${scheduleId}`,
        {
          method: "PUT",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token([PERMISSION.LTD_UPDATE])}`,
          },
          body: JSON.stringify({ ...validBody, ghiChu: "Đã sửa theo API cũ" }),
        }
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.data.thoi_gian, "07:30 - 11:30");
      assert.equal("slots" in body.data, false);
    } finally {
      server.close();
    }
  });
});
