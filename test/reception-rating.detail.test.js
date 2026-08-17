import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import { PERMISSION } from "../src/constants/permission.constant.js";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import ReceptionRatingRepository from "../src/repositories/reception-rating.repository.js";
import receptionRatingRouter from "../src/routes/reception-rating.route.js";
import jwtUtils from "../src/utils/jwt.util.js";

const ratingId = "123e4567-e89b-42d3-a456-426614174000";
const originalFindDetailById = ReceptionRatingRepository.findDetailById;
const rating = {
  id: ratingId,
  diem_tong: 5,
  ly_do: ["Cán bộ rất tận tình và chuyên nghiệp"],
  nhan_xet: "Tôi rất hài lòng",
  thoi_gian_tao: new Date(),
  dang_ky_tiep_dan: {
    id: "223e4567-e89b-42d3-a456-426614174000",
    loai: "COUNTER_RECEPTION",
    ma_tiep_dan: "A00123",
    ngay: new Date("2099-08-20T00:00:00.000Z"),
    slot: "08:00 - 09:00",
    chu_de: "Hướng dẫn thủ tục",
    ly_do: "Nội dung do người dân gửi",
    ho_ten: "Nguyễn Văn An",
    sdt: "0912345678",
    cccd: "042204001234",
    dia_chi: "Thành phố Hà Tĩnh",
    bo_phan: "QUAY_1",
    trang_thai: "APPROVED",
    ten_lanh_dao: "Lãnh đạo A",
    chuc_vu_lanh_dao: "LEADER",
    thoi_gian_cap_nhat: new Date(),
    lich_tiep_dan: null,
  },
};

const createToken = (permissions) =>
  jwtUtils.signAccessToken(
    {
      id: "323e4567-e89b-42d3-a456-426614174000",
      ten_dang_nhap: "leader",
      permissions,
      cate: null,
      roles: ["LEADER"],
    },
    "127.0.0.1"
  );

const createTestServer = () => {
  const app = express();
  app.use("/api/reception-ratings", receptionRatingRouter);
  app.use(errorHandler);
  return app.listen(0);
};

beforeEach(() => {
  ReceptionRatingRepository.findDetailById = async () => rating;
});

afterEach(() => {
  ReceptionRatingRepository.findDetailById = originalFindDetailById;
});

describe("GET /api/reception-ratings/:id", () => {
  it("returns rating and original registration details", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-ratings/${ratingId}`,
        {
          headers: {
            authorization: `Bearer ${createToken([PERMISSION.RRT_GET_DETAIL])}`,
          },
        }
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.data.score, 5);
      assert.equal(body.data.registration.receptionCode, "A00123");
      assert.equal(body.data.registration.applicant.citizenId, "042204001234");
    } finally {
      server.close();
    }
  });

  it("returns 404 when rating does not exist", async () => {
    ReceptionRatingRepository.findDetailById = async () => null;
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-ratings/${ratingId}`,
        {
          headers: {
            authorization: `Bearer ${createToken([PERMISSION.RRT_GET_DETAIL])}`,
          },
        }
      );
      assert.equal(response.status, 404);
    } finally {
      server.close();
    }
  });

  it("returns 403 without rating detail permission", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-ratings/${ratingId}`,
        { headers: { authorization: `Bearer ${createToken([])}` } }
      );
      assert.equal(response.status, 403);
    } finally {
      server.close();
    }
  });
});
