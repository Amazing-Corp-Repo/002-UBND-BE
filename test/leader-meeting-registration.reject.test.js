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
const registrationId = "423e4567-e89b-42d3-a456-426614174002";
const originals = {
  find: LeaderMeetingRegistrationRepository.findManagementDetail,
  reject: LeaderMeetingRegistrationRepository.rejectPending,
  audit: prisma.audit_logs.create,
};
let rejectArgs;

const token = (permissions = [PERMISSION.LMR_REJECT]) =>
  jwtUtils.signAccessToken(
    { id: leaderId, ten_dang_nhap: "leader", permissions, roles: ["LANH_DAO"], cate: null },
    "127.0.0.1"
  );

const detail = (status) => ({
  id: registrationId,
  ma_dang_ky: "LD000124",
  ngay_hen: new Date("2099-08-25T00:00:00.000Z"),
  ngay_lam_don: new Date("2099-08-20T00:00:00.000Z"),
  chu_de: "Kiến nghị",
  ly_do: "Đề nghị hướng dẫn giải quyết hồ sơ.",
  ho_ten: "Nguyễn Văn Bình",
  sdt: "0901234567",
  cccd: "012345678901",
  ngay_cap_cccd: null,
  noi_cap_cccd: null,
  dia_chi: "Hà Tĩnh",
  trang_thai: status,
  ly_do_tu_choi:
    status === "REJECTED" ? "Nội dung không thuộc thẩm quyền giải quyết" : null,
  ly_do_huy: null,
  ghi_chu_xu_ly: null,
  ghi_chu_hoan_thanh: null,
  thoi_gian_phe_duyet: null,
  thoi_gian_bat_dau_xu_ly: null,
  thoi_gian_hoan_thanh: null,
  thoi_gian_tu_choi: status === "REJECTED" ? new Date() : null,
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
        email: null,
        so_dien_thoai: null,
      },
    },
  },
  nguoi_duyet: null,
  nguoi_bat_dau_xu_ly_ref: null,
  nguoi_hoan_thanh_ref: null,
  nguoi_tu_choi_ref:
    status === "REJECTED" ? { id: leaderId, ho_va_ten: "Nguyễn Văn An" } : null,
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
  rejectArgs = null;
  LeaderMeetingRegistrationRepository.findManagementDetail = async () =>
    detail("PENDING");
  LeaderMeetingRegistrationRepository.rejectPending = async (...args) => {
    rejectArgs = args;
    return detail("REJECTED");
  };
  prisma.audit_logs.create = async () => ({ id: "audit" });
});

afterEach(() => {
  LeaderMeetingRegistrationRepository.findManagementDetail = originals.find;
  LeaderMeetingRegistrationRepository.rejectPending = originals.reject;
  prisma.audit_logs.create = originals.audit;
});

describe("PATCH /api/leader-meeting-registrations/:id/reject", () => {
  it("documents required reason, no-refund rule and permission", () => {
    const operation = LeaderMeetingRegistrationSwagger[
      "/api/leader-meeting-registrations/{id}/reject"
    ].patch;
    assert.match(operation.description, /LMR_REJECT/);
    assert.match(operation.description, /không được hoàn lại/);
    assert.deepEqual(
      operation.requestBody.content["application/json"].schema.required,
      ["reason"]
    );
  });

  it("rejects an owned pending registration with a reason", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-registrations/${registrationId}/reject`,
        {
          method: "PATCH",
          headers: {
            authorization: `Bearer ${token()}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            reason: "Nội dung không thuộc thẩm quyền giải quyết",
          }),
        }
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.data.status, "REJECTED");
      assert.equal(rejectArgs[1], leaderId);
      assert.equal(rejectArgs[2].trang_thai, "REJECTED");
      assert.equal(
        rejectArgs[2].ly_do_tu_choi,
        "Nội dung không thuộc thẩm quyền giải quyết"
      );
    } finally {
      server.close();
    }
  });

  it("returns 400 without reason, 403 without permission and 409 after a race", async () => {
    const server = createServer();
    const { port } = server.address();
    const url = `http://127.0.0.1:${port}/api/leader-meeting-registrations/${registrationId}/reject`;
    try {
      const missingReason = await fetch(url, {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${token()}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      });
      const forbidden = await fetch(url, {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${token([])}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ reason: "Lý do hợp lệ" }),
      });
      LeaderMeetingRegistrationRepository.rejectPending = async () => null;
      const concurrent = await fetch(url, {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${token()}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ reason: "Lý do hợp lệ" }),
      });

      assert.equal(missingReason.status, 400);
      assert.equal(forbidden.status, 403);
      assert.equal(concurrent.status, 409);
    } finally {
      server.close();
    }
  });
});
