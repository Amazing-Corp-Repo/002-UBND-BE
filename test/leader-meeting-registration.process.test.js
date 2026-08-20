import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import prisma from "../src/config/database.config.js";
import { PERMISSION } from "../src/constants/permission.constant.js";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import LeaderMeetingRegistrationRepository from "../src/repositories/leader-meeting-registration.repository.js";
import leaderMeetingRegistrationRouter from "../src/routes/leader-meeting-registration.route.js";
import LeaderMeetingRegistrationSwagger from "../src/swagger/leader-meeting-registration.swagger.js";
import jwtUtils from "../src/utils/jwt.util.js";

const leaderId = "123e4567-e89b-42d3-a456-426614174001";
const registrationId = "423e4567-e89b-42d3-a456-426614174003";
const originals = {
  find: LeaderMeetingRegistrationRepository.findManagementDetail,
  process: LeaderMeetingRegistrationRepository.processApproved,
  audit: prisma.audit_logs.create,
};
let processArgs;

const token = (permissions = [PERMISSION.LMR_PROCESS]) =>
  jwtUtils.signAccessToken(
    { id: leaderId, ten_dang_nhap: "leader", permissions, roles: ["LANH_DAO"], cate: null },
    "127.0.0.1"
  );

const detail = (status) => ({
  id: registrationId,
  ma_dang_ky: "LD000125",
  ngay_hen: new Date("2099-08-25T00:00:00.000Z"),
  ngay_lam_don: new Date("2099-08-20T00:00:00.000Z"),
  chu_de: "Kiến nghị",
  ly_do: "Đề nghị hướng dẫn.",
  ho_ten: "Nguyễn Văn Bình",
  sdt: "0901234567",
  cccd: "012345678901",
  ngay_cap_cccd: null,
  noi_cap_cccd: null,
  dia_chi: "Hà Tĩnh",
  trang_thai: status,
  ly_do_tu_choi: null,
  ly_do_huy: null,
  ghi_chu_xu_ly: status === "IN_PROGRESS" ? "Đang tiếp tục xử lý" : null,
  ghi_chu_hoan_thanh: null,
  thoi_gian_phe_duyet: new Date(),
  thoi_gian_bat_dau_xu_ly: status === "IN_PROGRESS" ? new Date() : null,
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
      lanh_dao: { id: leaderId, ho_va_ten: "Nguyễn Văn An", email: null, so_dien_thoai: null },
    },
  },
  nguoi_duyet: { id: leaderId, ho_va_ten: "Nguyễn Văn An" },
  nguoi_bat_dau_xu_ly_ref:
    status === "IN_PROGRESS" ? { id: leaderId, ho_va_ten: "Nguyễn Văn An" } : null,
  nguoi_hoan_thanh_ref: null,
  nguoi_tu_choi_ref: null,
  nguoi_huy_ref: null,
  dinh_kem_dang_ky_gap_lanh_dao: [],
  danh_gia_gap_lanh_dao: null,
});

const createServer = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/leader-meeting-registrations", leaderMeetingRegistrationRouter);
  app.use(errorHandler);
  return app.listen(0);
};

beforeEach(() => {
  processArgs = null;
  LeaderMeetingRegistrationRepository.findManagementDetail = async () => detail("APPROVED");
  LeaderMeetingRegistrationRepository.processApproved = async (...args) => {
    processArgs = args;
    return detail("IN_PROGRESS");
  };
  prisma.audit_logs.create = async () => ({ id: "audit" });
});

afterEach(() => {
  LeaderMeetingRegistrationRepository.findManagementDetail = originals.find;
  LeaderMeetingRegistrationRepository.processApproved = originals.process;
  prisma.audit_logs.create = originals.audit;
});

describe("PATCH /api/leader-meeting-registrations/:id/process", () => {
  it("documents the approved-to-processing transition and optional note", () => {
    const operation = LeaderMeetingRegistrationSwagger[
      "/api/leader-meeting-registrations/{id}/process"
    ].patch;
    assert.match(operation.description, /APPROVED sang IN_PROGRESS/);
    assert.match(operation.description, /LMR_PROCESS/);
    assert.equal(operation.requestBody.required, false);
  });

  it("starts processing an owned approved registration", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-registrations/${registrationId}/process`,
        {
          method: "PATCH",
          headers: { authorization: `Bearer ${token()}`, "content-type": "application/json" },
          body: JSON.stringify({ note: "Đang tiếp tục xử lý" }),
        }
      );
      const body = await response.json();
      assert.equal(response.status, 200);
      assert.equal(body.data.status, "IN_PROGRESS");
      assert.equal(processArgs[1], leaderId);
      assert.equal(processArgs[2].trang_thai, "IN_PROGRESS");
      assert.equal(processArgs[2].ghi_chu_xu_ly, "Đang tiếp tục xử lý");
    } finally {
      server.close();
    }
  });

  it("returns 409 for wrong state, 403 without permission and 400 for long note", async () => {
    const server = createServer();
    const { port } = server.address();
    const url = `http://127.0.0.1:${port}/api/leader-meeting-registrations/${registrationId}/process`;
    try {
      LeaderMeetingRegistrationRepository.findManagementDetail = async () => detail("PENDING");
      const conflict = await fetch(url, {
        method: "PATCH",
        headers: { authorization: `Bearer ${token()}`, "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const forbidden = await fetch(url, {
        method: "PATCH",
        headers: { authorization: `Bearer ${token([])}`, "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const invalid = await fetch(url, {
        method: "PATCH",
        headers: { authorization: `Bearer ${token()}`, "content-type": "application/json" },
        body: JSON.stringify({ note: "x".repeat(2001) }),
      });
      assert.equal(conflict.status, 409);
      assert.equal(forbidden.status, 403);
      assert.equal(invalid.status, 400);
    } finally {
      server.close();
    }
  });
});
