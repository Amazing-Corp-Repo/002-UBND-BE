import assert from "node:assert/strict";
import { describe, it } from "node:test";
import express from "express";
import path from "node:path";
import XLSX from "../src/utils/xlsx.util.js";
import { PERMISSION } from "../src/constants/permission.constant.js";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import receptionScheduleManagementRouter from "../src/routes/reception-schedule-management.route.js";
import ReceptionScheduleManagementSwagger from "../src/swagger/reception-schedule-management.swagger.js";
import jwtUtils from "../src/utils/jwt.util.js";

const userId = "123e4567-e89b-42d3-a456-426614174000";
const templatePath = path.resolve(
  "src/public/static/template-lich-tiep-dan.xlsx"
);

const createToken = (permissions) =>
  jwtUtils.signAccessToken(
    {
      id: userId,
      ten_dang_nhap: "admin",
      permissions,
      cate: null,
      roles: ["ADMIN"],
    },
    "127.0.0.1"
  );

const createTestServer = () => {
  const app = express();
  app.use(express.static("src/public"));
  app.use(
    "/api/reception-schedules/management",
    receptionScheduleManagementRouter
  );
  app.use(errorHandler);
  return app.listen(0);
};

describe("GET /api/reception-schedules/management/template", () => {
  it("documents file contents, authorization and responses", () => {
    const operation =
      ReceptionScheduleManagementSwagger[
        "/api/reception-schedules/management/template"
      ].get;

    assert.deepEqual(operation.security, [{ bearerAuth: [] }]);
    assert.ok(operation.description.includes("LTD_GET_TEMPLATE"));
    assert.ok(operation.description.includes("9 cột"));
    assert.ok(operation.description.includes("RR_APPROVE"));
    assert.ok(operation.responses[200]);
    assert.ok(operation.responses[401]);
    assert.ok(operation.responses[403]);
    assert.ok(operation.responses[500]);
  });

  it("contains an import-first sheet with valid examples and instructions", () => {
    const workbook = XLSX.readFile(templatePath, { cellDates: false });
    assert.deepEqual(workbook.SheetNames, [
      "LichTiepDan",
      "Hướng dẫn",
      "Danh mục quầy",
    ]);

    const rows = XLSX.utils.sheet_to_json(
      workbook.Sheets.LichTiepDan,
      { header: 1, defval: null }
    );
    assert.deepEqual(rows[0], [
      "Ngày tiếp dân",
      "Từ",
      "Đến",
      "Mã quầy",
      "Tài khoản cán bộ",
      "Họ tên cán bộ",
      "Sức chứa / ca",
      "Địa điểm",
      "Ghi chú",
    ]);
    assert.ok(rows.length >= 9);

    const seen = new Set();
    for (const row of rows.slice(1).filter((row) => row.some(Boolean))) {
      const [date, startTime, endTime, counterCode, username, , capacity, location] = row;
      assert.ok(location);
      assert.match(counterCode, /^QUAY_[1-8]$/);
      assert.ok(username);
      assert.ok(Number.isInteger(capacity));
      assert.ok(capacity >= 1);
      assert.match(date, /^\d{2}\/\d{2}\/\d{4}$/);
      assert.match(startTime, /^\d{2}:\d{2}$/);
      assert.match(endTime, /^\d{2}:\d{2}$/);
      const toMinutes = (value) => {
        const [hour, minute] = value.split(":").map(Number);
        return hour * 60 + minute;
      };
      const duration = toMinutes(endTime) - toMinutes(startTime);
      assert.ok(duration > 0);
      assert.equal(duration % 60, 0);
      const duplicateKey = `${date}::${startTime}::${endTime}::${counterCode}`;
      assert.equal(seen.has(duplicateKey), false);
      seen.add(duplicateKey);
    }

    const instructionText = XLSX.utils
      .sheet_to_csv(workbook.Sheets["Hướng dẫn"])
      .toLowerCase();
    assert.ok(instructionText.includes("8 quầy"));
    assert.ok(instructionText.includes("mặc định 2"));
    assert.ok(instructionText.includes("ca 1 giờ"));
    assert.ok(instructionText.includes("rr_approve"));
    assert.ok(instructionText.includes("không được phân công hai quầy"));
  });

  it("returns a URL that downloads the generated workbook", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-schedules/management/template`,
        {
          headers: {
            authorization: `Bearer ${createToken([
              PERMISSION.LTD_GET_TEMPLATE,
            ])}`,
          },
        }
      );
      const body = await response.json();
      assert.equal(response.status, 200);
      assert.equal(body.data.relative_url, "/static/template-lich-tiep-dan.xlsx");

      const downloadResponse = await fetch(
        `http://127.0.0.1:${port}${body.data.relative_url}`
      );
      const file = Buffer.from(await downloadResponse.arrayBuffer());
      assert.equal(downloadResponse.status, 200);
      assert.equal(file.subarray(0, 2).toString(), "PK");
    } finally {
      server.close();
    }
  });

  it("returns 401 without an access token", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-schedules/management/template`
      );
      assert.equal(response.status, 401);
    } finally {
      server.close();
    }
  });

  it("returns 403 without LTD_GET_TEMPLATE permission", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-schedules/management/template`,
        { headers: { authorization: `Bearer ${createToken([])}` } }
      );
      assert.equal(response.status, 403);
    } finally {
      server.close();
    }
  });
});
