import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import prisma from "../src/config/database.config.js";
import Repository from "../src/repositories/dang-ky-tiep-dan.repository.js";

const registrationId = "123e4567-e89b-42d3-a456-426614174000";
const shiftId = "223e4567-e89b-42d3-a456-426614174000";
const configurationId = "323e4567-e89b-42d3-a456-426614174000";
const officerId = "423e4567-e89b-42d3-a456-426614174000";
const originalTransaction = prisma.$transaction;
const originalFindDetailById = Repository.findDetailById;
let registration;
let assignment;
let updateData;

const createTransaction = () => ({
  dang_ky_tiep_dan: {
    findFirst: async () => registration,
    count: async () => 0,
    updateMany: async ({ data }) => {
      updateData = data;
      return { count: 1 };
    },
  },
  phan_cong_quay_tiep_dan: {
    findFirst: async () => assignment,
  },
});

beforeEach(() => {
  updateData = null;
  registration = {
    id: registrationId,
    id_lich_tiep_dan: "523e4567-e89b-42d3-a456-426614174000",
    id_ca_tiep_dan: shiftId,
    slot: "07:30 - 08:30",
  };
  assignment = {
    id_cau_hinh_quay: configurationId,
    cau_hinh_quay: {
      id: configurationId,
      id_ca_tiep_dan: shiftId,
      ma_quay: "QUAY_3",
      suc_chua: 2,
      quay_tiep_dan: { ma_quay: "QUAY_3" },
    },
  };
  prisma.$transaction = async (callback) => callback(createTransaction());
  Repository.findDetailById = async () => ({ id: registrationId });
});

afterEach(() => {
  prisma.$transaction = originalTransaction;
  Repository.findDetailById = originalFindDetailById;
});

describe("approvePendingWithCounterGuard assignment validation", () => {
  it("writes the counter resolved from the authenticated officer assignment", async () => {
    const result = await Repository.approvePendingWithCounterGuard(
      registrationId,
      "QUAY_3",
      officerId,
      { trang_thai: "APPROVED", nguoi_duyet_don: officerId }
    );

    assert.equal(result.registration.id, registrationId);
    assert.equal(updateData.bo_phan, "QUAY_3");
    assert.equal(updateData.id_cau_hinh_quay, configurationId);
    assert.equal(updateData.nguoi_duyet_don, officerId);
  });

  it("rejects a client counter that differs from the assignment", async () => {
    const result = await Repository.approvePendingWithCounterGuard(
      registrationId,
      "QUAY_2",
      officerId,
      { trang_thai: "APPROVED" }
    );

    assert.equal(result.conflict, "ASSIGNMENT_MISMATCH");
    assert.equal(updateData, null);
  });

  it("rejects an officer without an active assignment", async () => {
    assignment = null;
    const result = await Repository.approvePendingWithCounterGuard(
      registrationId,
      "QUAY_3",
      officerId,
      { trang_thai: "APPROVED" }
    );

    assert.equal(result.conflict, "ASSIGNMENT_NOT_FOUND");
    assert.equal(updateData, null);
  });
});
