import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import prisma from "../src/config/database.config.js";
import Repository from "../src/repositories/reception-schedule-management.repository.js";

const originalTransaction = prisma.$transaction;

afterEach(() => {
  prisma.$transaction = originalTransaction;
});

describe("ReceptionScheduleManagementRepository.createManyWithSlots", () => {
  it("creates schedule, shift, counter configuration and officer assignment atomically", async () => {
    let createdSlots = [];
    let createdAssignments = [];
    prisma.$transaction = async (callback) => callback({
      lich_tiep_dan: {
        create: async () => ({ id: "schedule-1" }),
      },
      quay_tiep_dan: {
        findMany: async () => [{ id: "counter-1", ma_quay: "QUAY_1" }],
      },
      $queryRawUnsafe: async () => [{ id: "shift-1" }],
      khung_gio_tiep_dan: {
        createMany: async ({ data }) => {
          createdSlots = data;
        },
        findMany: async () => [{
          id: "configuration-1",
          khung_gio: "07:30 - 08:30",
          ma_quay: "QUAY_1",
        }],
      },
      phan_cong_quay_tiep_dan: {
        createMany: async ({ data }) => {
          createdAssignments = data;
        },
      },
    });

    await Repository.createManyWithSlots([{
      scheduleData: {
        ten_can_bo: "Nguyễn Văn An",
        dia_diem: "Bộ phận tiếp công dân",
        ngay_tiep_dan: new Date("2099-09-01T00:00:00.000Z"),
        thoi_gian: "07:30 - 08:30",
        nguoi_tao: "creator-1",
      },
      slotRows: [{
        khung_gio: "07:30 - 08:30",
        ma_quay: "QUAY_1",
        suc_chua: 2,
        nguoi_tao: "creator-1",
      }],
      assignmentRows: [{
        khung_gio: "07:30 - 08:30",
        ma_quay: "QUAY_1",
        officerId: "officer-1",
      }],
    }]);

    assert.equal(createdSlots.length, 1);
    assert.equal(createdSlots[0].id_ca_tiep_dan, "shift-1");
    assert.equal(createdSlots[0].id_quay, "counter-1");
    assert.deepEqual(createdAssignments, [{
      id_cau_hinh_quay: "configuration-1",
      id_can_bo: "officer-1",
      nguoi_tao: "creator-1",
      nguoi_cap_nhat: "creator-1",
    }]);
  });
});
