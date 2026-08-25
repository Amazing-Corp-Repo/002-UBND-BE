import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import LeaderMeetingRegistrationRepository from "../src/repositories/leader-meeting-registration.repository.js";
import leaderMeetingRegistrationRouter from "../src/routes/leader-meeting-registration.route.js";
import LeaderMeetingRegistrationSwagger from "../src/swagger/leader-meeting-registration.swagger.js";

const originalLookup = LeaderMeetingRegistrationRepository.findForCitizenLookup;

const fixture = {
  id: "423e4567-e89b-42d3-a456-426614174001",
  ma_dang_ky: "LD000123",
  ngay_hen: new Date("2099-08-25T00:00:00.000Z"),
  chu_de: "Kiến nghị về đất đai",
  ly_do: "Đề nghị hướng dẫn hồ sơ đất đai",
  ho_ten: "Nguyễn Văn Bình",
  sdt: "0901234567",
  cccd: "012345678901",
  dia_chi: "Hà Tĩnh",
  trang_thai: "PENDING",
  ly_do_tu_choi: null,
  thoi_gian_tu_choi: null,
  ly_do_huy: null,
  thoi_gian_huy: null,
  thoi_gian_phe_duyet: null,
  thoi_gian_bat_dau_xu_ly: null,
  thoi_gian_hoan_thanh: null,
  thoi_gian_tao: new Date("2099-08-20T00:00:00.000Z"),
  thoi_gian_cap_nhat: null,
  khung_gio_gap_lanh_dao: {
    id: "323e4567-e89b-42d3-a456-426614174001",
    gio_bat_dau: "09:00",
    gio_ket_thuc: "10:30",
    lich_gap_lanh_dao: {
      id: "223e4567-e89b-42d3-a456-426614174001",
      dia_diem: "Phòng tiếp công dân",
      lanh_dao: {
        id: "123e4567-e89b-42d3-a456-426614174001",
        ho_va_ten: "Nguyễn Văn An",
      },
    },
  },
  danh_gia_gap_lanh_dao: null,
};

const createServer = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/leader-meeting-registrations", leaderMeetingRegistrationRouter);
  app.use(errorHandler);
  return app.listen(0);
};

beforeEach(() => {
  LeaderMeetingRegistrationRepository.findForCitizenLookup = async () => [fixture];
});

afterEach(() => {
  LeaderMeetingRegistrationRepository.findForCitizenLookup = originalLookup;
});

describe("POST /api/leader-meeting-registrations/lookup", () => {
  it("documents privacy-safe public output and anti-enumeration limit", () => {
    const operation =
      LeaderMeetingRegistrationSwagger["/api/leader-meeting-registrations/lookup"].post;
    const example = operation.responses[200].content["application/json"].examples.success.value;
    assert.match(operation.description, /kết quả đánh giá đã gửi/);
    assert.match(operation.description, /60 yêu cầu\/10 phút/);
    assert.equal("attachments" in example.data[0], false);
    assert.equal("phoneNumber" in example.data[0].applicant, false);
    assert.equal("citizenId" in example.data[0].applicant, false);
    assert.equal("address" in example.data[0].applicant, false);
    assert.equal(example.data[0].ratingStatus, "RATED");
    assert.equal(example.data[0].rating.score, 5);
  });

  it("looks up by code and omits sensitive citizen values", async () => {
    let lookupInput;
    LeaderMeetingRegistrationRepository.findForCitizenLookup = async (input) => {
      lookupInput = input;
      return [fixture];
    };
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-registrations/lookup`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ registrationCode: "ld000123" }),
        }
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(lookupInput.registrationCode, "LD000123");
      assert.equal(body.data[0].applicant.fullName, "Nguyễn Văn Bình");
      assert.equal("phoneNumber" in body.data[0].applicant, false);
      assert.equal("citizenId" in body.data[0].applicant, false);
      assert.equal("address" in body.data[0].applicant, false);
      assert.equal("topic" in body.data[0], false);
      assert.equal("reason" in body.data[0], false);
      assert.equal("attachments" in body.data[0], false);
    } finally {
      server.close();
    }
  });

  it("returns the saved rating so the citizen cannot rate the same ticket again", async () => {
    LeaderMeetingRegistrationRepository.findForCitizenLookup = async () => [
      {
        ...fixture,
        trang_thai: "COMPLETED",
        danh_gia_gap_lanh_dao: {
          id: "523e4567-e89b-42d3-a456-426614174001",
          diem_tong: 4,
          nhan_xet: "Lãnh đạo hướng dẫn rõ ràng.",
          thoi_gian_tao: new Date("2099-08-25T04:15:00.000Z"),
        },
      },
    ];
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-registrations/lookup`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ registrationCode: "LD000123" }),
        }
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.data[0].ratingStatus, "RATED");
      assert.equal(body.data[0].rating.score, 4);
      assert.equal(body.data[0].rating.comment, "Lãnh đạo hướng dẫn rõ ràng.");
      assert.equal("selectedSuggestions" in body.data[0].rating, false);
    } finally {
      server.close();
    }
  });

  it("returns 400 when both search keys are supplied", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-registrations/lookup`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            registrationCode: "LD000123",
            phoneNumber: "0901234567",
          }),
        }
      );
      assert.equal(response.status, 400);
    } finally {
      server.close();
    }
  });

  it("returns 404 when no registration matches", async () => {
    LeaderMeetingRegistrationRepository.findForCitizenLookup = async () => [];
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-registrations/lookup`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ registrationCode: "LD999999" }),
        }
      );
      assert.equal(response.status, 404);
    } finally {
      server.close();
    }
  });
});
