import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import { PERMISSION } from "../src/constants/permission.constant.js";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import DangKyTiepDanRepository from "../src/repositories/dang-ky-tiep-dan.repository.js";
import dangKyTiepDanRouter from "../src/routes/dang-ky-tiep-dan.route.js";
import jwtUtils from "../src/utils/jwt.util.js";

const originalFindAllForStaff = DangKyTiepDanRepository.findAllForStaff;

const registration = {
  id: "123e4567-e89b-42d3-a456-426614174000",
  ma_tiep_dan: "A00123",
  ho_ten: "Nguyễn Văn An",
  sdt: "0912345678",
  ngay: new Date("2099-08-20T00:00:00.000Z"),
  slot: "08:00 - 09:00",
  chu_de: "Hướng dẫn thủ tục",
  ly_do: "Nội dung làm việc",
  bo_phan: "QUAY_1",
  trang_thai: "APPROVED",
  ten_lanh_dao: "Lãnh đạo A",
  thoi_gian_cap_nhat: new Date("2099-08-19T01:00:00.000Z"),
  danh_gia_tiep_dan: [{ id: "rating-id" }],
};

const createTestServer = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/reception-registrations", dangKyTiepDanRouter);
  app.use(errorHandler);
  return app.listen(0);
};

const tokenWithPermissions = (permissions) =>
  jwtUtils.signAccessToken(
    {
      id: "223e4567-e89b-42d3-a456-426614174000",
      ten_dang_nhap: "staff",
      permissions,
      cate: null,
      roles: [],
    },
    "127.0.0.1"
  );

beforeEach(() => {
  DangKyTiepDanRepository.findAllForStaff = async () => ({
    data: [registration],
    totalItems: 1,
  });
});

afterEach(() => {
  DangKyTiepDanRepository.findAllForStaff = originalFindAllForStaff;
});

describe("GET /api/reception-registrations", () => {
  it("returns a paginated staff list and derived rating status", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-registrations?page=1&size=10`,
        {
          headers: {
            authorization: `Bearer ${tokenWithPermissions([PERMISSION.RR_GET_ALL])}`,
          },
        }
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.data[0].ratingStatus, "RATED");
      assert.equal(body.pagination.totalItems, 1);
    } finally {
      server.close();
    }
  });

  it("returns 401 without an access token", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-registrations`
      );
      assert.equal(response.status, 401);
    } finally {
      server.close();
    }
  });

  it("returns 403 without the list permission", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-registrations`,
        { headers: { authorization: `Bearer ${tokenWithPermissions([])}` } }
      );
      assert.equal(response.status, 403);
    } finally {
      server.close();
    }
  });
});
