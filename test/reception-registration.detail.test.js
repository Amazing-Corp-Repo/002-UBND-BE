import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import { PERMISSION } from "../src/constants/permission.constant.js";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import DangKyTiepDanRepository from "../src/repositories/dang-ky-tiep-dan.repository.js";
import dangKyTiepDanRouter from "../src/routes/dang-ky-tiep-dan.route.js";
import jwtUtils from "../src/utils/jwt.util.js";

const originalFindDetailById = DangKyTiepDanRepository.findDetailById;
const registrationId = "123e4567-e89b-42d3-a456-426614174000";

const detail = {
  id: registrationId,
  ma_tiep_dan: "A00123",
  loai: "COUNTER_RECEPTION",
  ngay: new Date("2099-08-20T00:00:00.000Z"),
  slot: "08:00 - 09:00",
  chu_de: "Hướng dẫn thủ tục",
  ly_do: "Nội dung do người dân đăng ký",
  ho_ten: "Nguyễn Văn An",
  sdt: "0912345678",
  cccd: "042204001234",
  dia_chi: "Thành phố Hà Tĩnh",
  bo_phan: "QUAY_1",
  trang_thai: "APPROVED",
  ten_lanh_dao: "Lãnh đạo A",
  chuc_vu_lanh_dao: "Phó Chủ tịch",
  thoi_gian_tao: new Date(),
  thoi_gian_cap_nhat: new Date(),
  lich_tiep_dan: {
    id: "223e4567-e89b-42d3-a456-426614174000",
    ten_can_bo: "Trần Văn Bình",
    dia_diem: "Trụ sở UBND",
    ngay_tiep_dan: new Date("2099-08-20T00:00:00.000Z"),
    thoi_gian: "08:00 - 11:00",
    ghi_chu: null,
  },
  danh_gia_tiep_dan: [],
};

const createToken = (permissions) =>
  jwtUtils.signAccessToken(
    {
      id: "323e4567-e89b-42d3-a456-426614174000",
      ten_dang_nhap: "staff",
      permissions,
      cate: null,
      roles: [],
    },
    "127.0.0.1"
  );

const createTestServer = () => {
  const app = express();
  app.use("/api/reception-registrations", dangKyTiepDanRouter);
  app.use(errorHandler);
  return app.listen(0);
};

beforeEach(() => {
  DangKyTiepDanRepository.findDetailById = async () => detail;
});

afterEach(() => {
  DangKyTiepDanRepository.findDetailById = originalFindDetailById;
});

describe("GET /api/reception-registrations/:id", () => {
  it("returns all citizen-submitted details", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-registrations/${registrationId}`,
        {
          headers: {
            authorization: `Bearer ${createToken([PERMISSION.RR_GET_DETAIL])}`,
          },
        }
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.data.applicant.citizenId, "042204001234");
      assert.equal(body.data.workingContent, "Nội dung do người dân đăng ký");
      assert.equal(body.data.ratingStatus, "NOT_RATED");
    } finally {
      server.close();
    }
  });

  it("returns 404 when the registration does not exist", async () => {
    DangKyTiepDanRepository.findDetailById = async () => null;
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-registrations/${registrationId}`,
        {
          headers: {
            authorization: `Bearer ${createToken([PERMISSION.RR_GET_DETAIL])}`,
          },
        }
      );
      assert.equal(response.status, 404);
    } finally {
      server.close();
    }
  });

  it("returns 403 without detail permission", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-registrations/${registrationId}`,
        { headers: { authorization: `Bearer ${createToken([])}` } }
      );
      assert.equal(response.status, 403);
    } finally {
      server.close();
    }
  });
});
