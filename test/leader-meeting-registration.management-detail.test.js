import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import { PERMISSION } from "../src/constants/permission.constant.js";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import LeaderMeetingRegistrationRepository from "../src/repositories/leader-meeting-registration.repository.js";
import leaderMeetingRegistrationRouter from "../src/routes/leader-meeting-registration.route.js";
import LeaderMeetingRegistrationSwagger from "../src/swagger/leader-meeting-registration.swagger.js";
import { LEADER_MEETING_SWAGGER_DEMO as DEMO } from "../src/swagger/leader-meeting-swagger-demo.fixture.js";
import jwtUtils from "../src/utils/jwt.util.js";

const leaderId = "123e4567-e89b-42d3-a456-426614174001";
const registrationId = "423e4567-e89b-42d3-a456-426614174001";
const attachmentId = "623e4567-e89b-42d3-a456-426614174001";
const originalFind = LeaderMeetingRegistrationRepository.findManagementDetail;
let capturedLeaderId;

const token = (permissions = [PERMISSION.LMR_GET_DETAIL], roles = ["LANH_DAO"]) =>
  jwtUtils.signAccessToken(
    { id: leaderId, ten_dang_nhap: "leader", permissions, roles, cate: null },
    "127.0.0.1"
  );

const fixture = {
  id: registrationId,
  ma_dang_ky: "LD000123",
  ngay_hen: new Date("2099-08-25T00:00:00.000Z"),
  ngay_lam_don: new Date("2099-08-20T00:00:00.000Z"),
  chu_de: "Kiến nghị về đất đai",
  ly_do: "Đề nghị hướng dẫn giải quyết hồ sơ.",
  ho_ten: "Nguyễn Văn Bình",
  sdt: "0901234567",
  cccd: "012345678901",
  ngay_cap_cccd: new Date("2021-05-20T00:00:00.000Z"),
  noi_cap_cccd: "Cục Cảnh sát QLHC về TTXH",
  dia_chi: "Phường Thành Sen, Hà Tĩnh",
  trang_thai: "PENDING",
  ly_do_tu_choi: null,
  ly_do_huy: null,
  ghi_chu_xu_ly: null,
  ghi_chu_hoan_thanh: null,
  thoi_gian_phe_duyet: null,
  thoi_gian_bat_dau_xu_ly: null,
  thoi_gian_hoan_thanh: null,
  thoi_gian_tu_choi: null,
  thoi_gian_huy: null,
  thoi_gian_tao: new Date(),
  thoi_gian_cap_nhat: new Date(),
  khung_gio_gap_lanh_dao: {
    id: "323e4567-e89b-42d3-a456-426614174001",
    gio_bat_dau: "09:00",
    gio_ket_thuc: "10:30",
    lich_gap_lanh_dao: {
      id: "223e4567-e89b-42d3-a456-426614174001",
      ngay: new Date("2099-08-25T00:00:00.000Z"),
      dia_diem: "Phòng tiếp công dân",
      ghi_chu: null,
      lanh_dao: {
        id: leaderId,
        ho_va_ten: "Nguyễn Văn An",
        email: "leader@example.com",
        so_dien_thoai: "0912345678",
      },
    },
  },
  nguoi_duyet: null,
  nguoi_bat_dau_xu_ly_ref: null,
  nguoi_hoan_thanh_ref: null,
  nguoi_tu_choi_ref: null,
  nguoi_huy_ref: null,
  dinh_kem_dang_ky_gap_lanh_dao: [
    {
      id: attachmentId,
      loai_dinh_kem: "SUPPORTING_DOCUMENT",
      ten_file_goc: "ho-so.pdf",
      duong_dan_file: "uploads/private/secret.pdf",
      mime_type: "application/pdf",
      kich_thuoc: 245760,
      thoi_gian_tao: new Date(),
    },
  ],
  danh_gia_gap_lanh_dao: null,
};

const createServer = () => {
  const app = express();
  app.use("/api/leader-meeting-registrations", leaderMeetingRegistrationRouter);
  app.use(errorHandler);
  return app.listen(0);
};

beforeEach(() => {
  capturedLeaderId = null;
  LeaderMeetingRegistrationRepository.findManagementDetail = async (
    _id,
    scopedLeaderId
  ) => {
    capturedLeaderId = scopedLeaderId;
    return fixture;
  };
});

afterEach(() => {
  LeaderMeetingRegistrationRepository.findManagementDetail = originalFind;
});

describe("GET /api/leader-meeting-registrations/:id", () => {
  it("documents permission, leader scope and safe attachment metadata", () => {
    const operation = LeaderMeetingRegistrationSwagger[
      "/api/leader-meeting-registrations/{id}"
    ].get;
    assert.match(operation.description, /LMR_GET_DETAIL/);
    assert.match(operation.description, /không trả đường dẫn lưu trữ vật lý/);
    assert.equal(operation.parameters[0].schema.example, DEMO.registrations.detail.id);
  });

  it("returns owned registration detail without exposing a physical path", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-registrations/${registrationId}`,
        { headers: { authorization: `Bearer ${token()}` } }
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(capturedLeaderId, leaderId);
      assert.equal(body.data.applicant.citizenId, "012345678901");
      assert.equal(body.data.attachments[0].canDownload, true);
      assert.equal("physicalPath" in body.data.attachments[0], false);
      assert.equal(JSON.stringify(body).includes("uploads/private"), false);
      assert.equal("counterId" in body.data.appointment, false);
    } finally {
      server.close();
    }
  });

  it("allows ADMIN to view details across leaders", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-registrations/${registrationId}`,
        { headers: { authorization: `Bearer ${token(undefined, ["ADMIN"])}` } }
      );
      assert.equal(response.status, 200);
      assert.equal(capturedLeaderId, undefined);
    } finally {
      server.close();
    }
  });

  it("returns 400 for invalid UUID, 403 without permission and 404 outside scope", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const invalid = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-registrations/invalid`,
        { headers: { authorization: `Bearer ${token()}` } }
      );
      const forbidden = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-registrations/${registrationId}`,
        { headers: { authorization: `Bearer ${token([])}` } }
      );
      LeaderMeetingRegistrationRepository.findManagementDetail = async () => null;
      const missing = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-registrations/${registrationId}`,
        { headers: { authorization: `Bearer ${token()}` } }
      );

      assert.equal(invalid.status, 400);
      assert.equal(forbidden.status, 403);
      assert.equal(missing.status, 404);
    } finally {
      server.close();
    }
  });
});
