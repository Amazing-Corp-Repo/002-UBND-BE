import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import DangKyTiepDanRepository from "../src/repositories/dang-ky-tiep-dan.repository.js";
import dangKyTiepDanRouter from "../src/routes/dang-ky-tiep-dan.route.js";

const originalFindForCitizenLookup =
  DangKyTiepDanRepository.findForCitizenLookup;

const registration = {
  id: "123e4567-e89b-42d3-a456-426614174000",
  ma_tiep_dan: "A00123",
  loai: "COUNTER_RECEPTION",
  ngay: new Date("2099-08-20T00:00:00.000Z"),
  slot: "08:00 - 09:00",
  chu_de: "Hướng dẫn thủ tục",
  ly_do: "Nội dung cần được hướng dẫn",
  ho_ten: "Nguyễn Văn An",
  sdt: "0912345678",
  cccd: "042204001234",
  dia_chi: "Thành phố Hà Tĩnh",
  bo_phan: null,
  ten_lanh_dao: null,
  chuc_vu_lanh_dao: null,
  trang_thai: "PENDING",
  thoi_gian_tao: new Date(),
  thoi_gian_cap_nhat: new Date(),
};

const createTestServer = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/reception-registrations", dangKyTiepDanRouter);
  app.use(errorHandler);
  return app.listen(0);
};

beforeEach(() => {
  DangKyTiepDanRepository.findForCitizenLookup = async () => [registration];
});

afterEach(() => {
  DangKyTiepDanRepository.findForCitizenLookup =
    originalFindForCitizenLookup;
});

describe("POST /api/reception-registrations/lookup", () => {
  it("looks up by code and masks sensitive fields", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-registrations/lookup`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ receptionCode: "a00123" }),
        }
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.data[0].receptionCode, "A00123");
      assert.equal(body.data[0].phoneNumber, "******5678");
      assert.equal(body.data[0].citizenId, "********1234");
    } finally {
      server.close();
    }
  });

  it("rejects missing lookup values", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-registrations/lookup`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{}",
        }
      );
      assert.equal(response.status, 400);
    } finally {
      server.close();
    }
  });

  it("returns 404 when no registration matches", async () => {
    DangKyTiepDanRepository.findForCitizenLookup = async () => [];
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-registrations/lookup`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ phoneNumber: "0912345678" }),
        }
      );
      assert.equal(response.status, 404);
    } finally {
      server.close();
    }
  });
});
