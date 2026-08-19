import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import prisma from "../src/config/database.config.js";
import Repository from "../src/repositories/reception-schedule.repository.js";

const scheduleId = "223e4567-e89b-42d3-a456-426614174000";
const slotId = "323e4567-e89b-42d3-a456-426614174000";
const userId = "123e4567-e89b-42d3-a456-426614174000";
const originalTransaction = prisma.$transaction;
let countQueries;

beforeEach(() => {
  countQueries = [];
  prisma.$transaction = async (callback) => callback({
    khung_gio_tiep_dan: {
      findFirst: async () => ({
        id: slotId,
        id_lich_tiep_dan: scheduleId,
        khung_gio: "07:30 - 08:30",
        ma_quay: "QUAY_1",
        suc_chua: 2,
      }),
      findMany: async () => [{ suc_chua: 2 }, { suc_chua: 2 }],
      update: async ({ data }) => ({
        id: slotId,
        id_lich_tiep_dan: scheduleId,
        khung_gio: "07:30 - 08:30",
        ma_quay: "QUAY_1",
        suc_chua: data.suc_chua,
      }),
    },
    dang_ky_tiep_dan: {
      count: async ({ where }) => {
        countQueries.push(where);
        return countQueries.length === 1 ? 2 : 1;
      },
    },
  });
});

afterEach(() => {
  prisma.$transaction = originalTransaction;
});

describe("ReceptionScheduleRepository.updateSlotCapacity", () => {
  it("counts assigned registrations by the V2 relation with a legacy fallback", async () => {
    const result = await Repository.updateSlotCapacity(
      scheduleId,
      slotId,
      3,
      userId
    );

    assert.equal(result.slot.suc_chua, 3);
    assert.equal(countQueries[0].loai, "COUNTER_RECEPTION");
    assert.deepEqual(countQueries[1].OR[0], { id_cau_hinh_quay: slotId });
    assert.equal(countQueries[1].OR[1].id_cau_hinh_quay, null);
    assert.equal(countQueries[1].OR[1].bo_phan, "QUAY_1");
  });
});
