import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, beforeEach, describe, it } from "node:test";
import express from "express";
import XLSX from "xlsx";
import { PERMISSION } from "../src/constants/permission.constant.js";
import prisma from "../src/config/database.config.js";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import ReceptionScheduleManagementRepository from "../src/repositories/reception-schedule-management.repository.js";
import receptionScheduleManagementRouter from "../src/routes/reception-schedule-management.route.js";
import FileService from "../src/services/file.service.js";
import ReceptionScheduleManagementService from "../src/services/reception-schedule-management.service.js";
import ReceptionScheduleManagementSwagger from "../src/swagger/reception-schedule-management.swagger.js";
import jwtUtils from "../src/utils/jwt.util.js";

const userId = "123e4567-e89b-42d3-a456-426614174000";
const originalMethods = {
  readSpreadsheetFile: FileService.readSpreadsheetFile,
  findImportConflicts: ReceptionScheduleManagementRepository.findImportConflicts,
  createManyWithSlots: ReceptionScheduleManagementRepository.createManyWithSlots,
  auditCreate: prisma.audit_logs.create,
};

let capturedRecords = [];
const validRows = [
  {
    "Địa điểm": "Bộ phận tiếp công dân",
    "Tên cán bộ": "Nguyễn Văn An",
    "Ngày tiếp dân": "25/08/2099",
    "Ghi chú": "Lịch định kỳ",
    Từ: "07:30",
    Đến: "11:30",
  },
];

const createToken = (permissions) =>
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

const createTestServer = () => {
  const app = express();
  app.use("/api/reception-schedules/management", receptionScheduleManagementRouter);
  app.use(errorHandler);
  return app.listen(0);
};

beforeEach(() => {
  capturedRecords = [];
  FileService.readSpreadsheetFile = async () => validRows;
  ReceptionScheduleManagementRepository.findImportConflicts = async () => [];
  ReceptionScheduleManagementRepository.createManyWithSlots = async (records) => {
    capturedRecords = records;
  };
  prisma.audit_logs.create = async () => ({});
});

after(() => {
  FileService.readSpreadsheetFile = originalMethods.readSpreadsheetFile;
  ReceptionScheduleManagementRepository.findImportConflicts =
    originalMethods.findImportConflicts;
  ReceptionScheduleManagementRepository.createManyWithSlots =
    originalMethods.createManyWithSlots;
  prisma.audit_logs.create = originalMethods.auditCreate;
});

describe("POST /api/reception-schedules/management/import", () => {
  it("documents file limits, transaction behavior and responses in Swagger", () => {
    const operation =
      ReceptionScheduleManagementSwagger[
        "/api/reception-schedules/management/import"
      ].post;

    assert.equal(
      operation.requestBody.content["multipart/form-data"].schema.required[0],
      "file"
    );
    assert.ok(operation.description.includes("một transaction"));
    assert.ok(operation.responses[200]);
    assert.ok(operation.responses[400]);
    assert.ok(operation.responses[401]);
    assert.ok(operation.responses[403]);
    assert.ok(operation.responses[409]);
  });

  it("builds hourly slots for all eight counters before one bulk write", async () => {
    const result = await ReceptionScheduleManagementService.handleImport(
      [{ path: "mock.xlsx" }],
      userId
    );

    assert.equal(result.importedCount, 1);
    assert.equal(result.totalCounterSlots, 32);
    assert.equal(capturedRecords.length, 1);
    assert.equal(capturedRecords[0].slotRows.length, 32);
    assert.equal(capturedRecords[0].slotRows[0].suc_chua, 2);
    assert.equal(capturedRecords[0].slotRows[0].ma_quay, "QUAY_1");
  });

  it("reads a real legacy .xls file accepted by the upload contract", async () => {
    const tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "ubnd-import-"));
    const filePath = path.join(tempDirectory, "reception-schedules.xls");
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(validRows);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Lịch tiếp dân");
    XLSX.writeFile(workbook, filePath, { bookType: "biff8" });
    FileService.readSpreadsheetFile = originalMethods.readSpreadsheetFile;

    const rows = await FileService.readSpreadsheetFile(filePath);

    assert.equal(rows.length, 1);
    assert.equal(rows[0]["Tên cán bộ"], "Nguyễn Văn An");
    await assert.rejects(() => fs.access(tempDirectory));
  });

  it("rejects an invalid row before writing any schedule", async () => {
    FileService.readSpreadsheetFile = async () => [
      { ...validRows[0], Đến: "07:30" },
    ];

    await assert.rejects(
      () =>
        ReceptionScheduleManagementService.handleImport(
          [{ path: "mock.xlsx" }],
          userId
        ),
      (error) => error.statusCode === 400 && error.message.includes("Dòng 2")
    );
    assert.equal(capturedRecords.length, 0);
  });

  it("rejects duplicate officer and date rows inside the file", async () => {
    FileService.readSpreadsheetFile = async () => [
      validRows[0],
      { ...validRows[0] },
    ];

    await assert.rejects(
      () =>
        ReceptionScheduleManagementService.handleImport(
          [{ path: "mock.xlsx" }],
          userId
        ),
      (error) => error.statusCode === 409
    );
    assert.equal(capturedRecords.length, 0);
  });

  it("rejects a schedule that already exists in the database", async () => {
    ReceptionScheduleManagementRepository.findImportConflicts = async () => [
      { id: "223e4567-e89b-42d3-a456-426614174000" },
    ];

    await assert.rejects(
      () =>
        ReceptionScheduleManagementService.handleImport(
          [{ path: "mock.xlsx" }],
          userId
        ),
      (error) => error.statusCode === 409
    );
  });

  it("returns 401 without an access token", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-schedules/management/import`,
        { method: "POST" }
      );
      assert.equal(response.status, 401);
    } finally {
      server.close();
    }
  });

  it("returns 403 without LTD_CREATE permission", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-schedules/management/import`,
        {
          method: "POST",
          headers: { authorization: `Bearer ${createToken([])}` },
        }
      );
      assert.equal(response.status, 403);
    } finally {
      server.close();
    }
  });

  it("returns 400 when the file is missing", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-schedules/management/import`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${createToken([PERMISSION.LTD_CREATE])}`,
          },
        }
      );
      assert.equal(response.status, 400);
    } finally {
      server.close();
    }
  });
});
