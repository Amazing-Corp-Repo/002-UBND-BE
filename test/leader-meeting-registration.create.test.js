import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import LeaderMeetingRegistrationRepository from "../src/repositories/leader-meeting-registration.repository.js";
import leaderMeetingRegistrationRouter from "../src/routes/leader-meeting-registration.route.js";
import LeaderMeetingRegistrationSwagger from "../src/swagger/leader-meeting-registration.swagger.js";
import prisma from "../src/config/database.config.js";

const originalCreate = LeaderMeetingRegistrationRepository.createWithGuards;
const originalAuditCreate = prisma.audit_logs.create;

const successfulResult = {
  registration: {
    id: "423e4567-e89b-42d3-a456-426614174001",
    ma_dang_ky: "LD000123",
    trang_thai: "PENDING",
  },
  slot: {
    gio_bat_dau: "09:00",
    gio_ket_thuc: "10:30",
    lich_gap_lanh_dao: {
      ngay: new Date("2099-08-25T00:00:00.000Z"),
      lanh_dao: { ho_va_ten: "Nguyễn Văn An" },
    },
  },
};

const validInput = {
  slotId: "323e4567-e89b-42d3-a456-426614174001",
  fullName: "Nguyễn Văn Bình",
  phoneNumber: "0901234567",
  citizenId: "012345678901",
  citizenIdIssuedDate: "2021-05-20",
  citizenIdIssuedPlace: "Cục Cảnh sát quản lý hành chính về trật tự xã hội",
  address: "Phường Thành Sen, Hà Tĩnh",
  topic: "Kiến nghị về đất đai",
  reason: "Tôi đề nghị được hướng dẫn giải quyết hồ sơ đất đai.",
};

const toFormData = (input) => {
  const form = new FormData();
  for (const [key, value] of Object.entries(input)) form.append(key, value);
  return form;
};

const createServer = () => {
  const app = express();
  app.use("/api/leader-meeting-registrations", leaderMeetingRegistrationRouter);
  app.use(errorHandler);
  return app.listen(0);
};

beforeEach(() => {
  LeaderMeetingRegistrationRepository.createWithGuards = async () => successfulResult;
  prisma.audit_logs.create = async () => ({ id: "audit-test" });
});

afterEach(() => {
  LeaderMeetingRegistrationRepository.createWithGuards = originalCreate;
  prisma.audit_logs.create = originalAuditCreate;
});

describe("POST /api/leader-meeting-registrations", () => {
  it("documents multipart input, daily guard and rate limit in Vietnamese", () => {
    const operation =
      LeaderMeetingRegistrationSwagger["/api/leader-meeting-registrations"].post;
    const schema = operation.requestBody.content["multipart/form-data"].schema;

    assert.match(operation.description, /ngày hẹn/);
    assert.match(operation.description, /30 yêu cầu\/10 phút/);
    assert.equal(schema.properties.citizenIdFront.description.includes("không bắt buộc"), true);
    assert.equal(schema.properties.supportingDocuments.maxItems, 3);
    assert.equal(operation.responses[200].content["application/json"].examples.success.value.data.status, "PENDING");
  });

  it("creates a valid registration without requiring CCCD images", async () => {
    let repositoryInput;
    LeaderMeetingRegistrationRepository.createWithGuards = async (input) => {
      repositoryInput = input;
      return successfulResult;
    };
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-registrations`,
        { method: "POST", body: toFormData(validInput) }
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.data.registrationCode, "LD000123");
      assert.equal(body.data.leaderName, "Nguyễn Văn An");
      assert.equal(repositoryInput.data.trang_thai, "PENDING");
      assert.ok(repositoryInput.data.ngay_lam_don instanceof Date);
      assert.equal("leaderId" in repositoryInput.data, false);
      assert.deepEqual(repositoryInput.attachments, []);
    } finally {
      server.close();
    }
  });

  it("returns 400 when required citizen data is missing", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-registrations`,
        { method: "POST", body: toFormData({ slotId: validInput.slotId }) }
      );
      assert.equal(response.status, 400);
    } finally {
      server.close();
    }
  });

  it("returns 409 when the slot is full or the phone already holds a daily registration", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      LeaderMeetingRegistrationRepository.createWithGuards = async () => ({
        conflict: "SLOT_FULL",
      });
      const fullResponse = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-registrations`,
        { method: "POST", body: toFormData(validInput) }
      );

      LeaderMeetingRegistrationRepository.createWithGuards = async () => ({
        conflict: "PHONE_DAILY_LIMIT",
      });
      const duplicateResponse = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-registrations`,
        { method: "POST", body: toFormData(validInput) }
      );

      assert.equal(fullResponse.status, 409);
      assert.equal(duplicateResponse.status, 409);
    } finally {
      server.close();
    }
  });

  it("maps the permanent same-slot guard to a choose-another-slot response", async () => {
    LeaderMeetingRegistrationRepository.createWithGuards = async () => {
      const error = new Error("uq_leader_meeting_slot_phone");
      error.code = "P2002";
      throw error;
    };
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-registrations`,
        { method: "POST", body: toFormData(validInput) }
      );
      const body = await response.json();

      assert.equal(response.status, 409);
      assert.match(body.message, /chọn khung giờ khác/);
    } finally {
      server.close();
    }
  });

  it("adds database-level daily guards for concurrent requests", async () => {
    const migration = await readFile(
      new URL(
        "../prisma/migrations/20260820233000_add_leader_meeting_appointment_date_guards/migration.sql",
        import.meta.url
      ),
      "utf8"
    );

    assert.match(migration, /"ngay_hen" DATE/);
    assert.match(migration, /uq_dang_ky_gap_ngay_sdt_dang_giu_cho/);
    assert.match(migration, /uq_dang_ky_gap_ngay_cccd_dang_giu_cho/);
    assert.match(migration, /PENDING.*APPROVED.*IN_PROGRESS.*COMPLETED/s);
    assert.doesNotMatch(migration, /quay_tiep_dan|id_quay/);
  });
});
