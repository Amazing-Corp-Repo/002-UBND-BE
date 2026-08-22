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
      $queryRawUnsafe: async () => [{
        id: "shift-1",
        gio_bat_dau: "07:30:00",
        gio_ket_thuc: "08:30:00",
      }],
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

  it("blocks overwrite atomically when the existing schedule has registrations", async () => {
    prisma.$transaction = async (callback) => callback({
      lich_tiep_dan: {
        findMany: async () => [{ id: "schedule-old" }],
      },
      dang_ky_tiep_dan: {
        count: async () => 1,
      },
    });

    const result = await Repository.overwriteManyWithSlots([{
      location: "Bộ phận tiếp công dân",
      scheduleData: { ngay_tiep_dan: new Date("2099-09-01T00:00:00.000Z") },
    }]);

    assert.deepEqual(result, {
      status: "HAS_REGISTRATIONS",
      registrationCount: 1,
    });
  });

  it("deletes the old empty schedule before recreating randomized assignments", async () => {
    const deleteOrder = [];
    prisma.$transaction = async (callback) => callback({
      lich_tiep_dan: {
        findMany: async () => [{ id: "schedule-old" }],
        deleteMany: async () => deleteOrder.push("schedules"),
        create: async () => ({ id: "schedule-new" }),
      },
      dang_ky_tiep_dan: { count: async () => 0 },
      quay_tiep_dan: {
        findMany: async () => [{ id: "counter-1", ma_quay: "QUAY_1" }],
      },
      $queryRawUnsafe: async () => [{
        id: "shift-new",
        gio_bat_dau: "07:30:00",
        gio_ket_thuc: "08:30:00",
      }],
      khung_gio_tiep_dan: {
        findMany: async ({ where }) =>
          where.id_lich_tiep_dan?.in
            ? [{ id: "configuration-old" }]
            : [{
                id: "configuration-new",
                khung_gio: "07:30 - 08:30",
                ma_quay: "QUAY_1",
              }],
        deleteMany: async () => deleteOrder.push("configurations"),
        createMany: async () => {},
      },
      ca_tiep_dan: {
        deleteMany: async () => deleteOrder.push("shifts"),
      },
      phan_cong_quay_tiep_dan: {
        deleteMany: async () => deleteOrder.push("assignments"),
        createMany: async () => {},
      },
    });

    const result = await Repository.overwriteManyWithSlots([{
      location: "Bộ phận tiếp công dân",
      scheduleData: {
        ngay_tiep_dan: new Date("2099-09-01T00:00:00.000Z"),
        nguoi_tao: "creator-1",
      },
      slotRows: [{
        khung_gio: "07:30 - 08:30",
        ma_quay: "QUAY_1",
        suc_chua: 2,
      }],
      assignmentRows: [{
        khung_gio: "07:30 - 08:30",
        ma_quay: "QUAY_1",
        officerId: "officer-1",
      }],
    }]);

    assert.deepEqual(deleteOrder, [
      "assignments",
      "configurations",
      "shifts",
      "schedules",
    ]);
    assert.deepEqual(result, { status: "OVERWRITTEN", overwrittenCount: 1 });
  });
});
