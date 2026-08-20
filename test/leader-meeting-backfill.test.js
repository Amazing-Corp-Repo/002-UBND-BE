import test from "node:test";
import assert from "node:assert/strict";
import {
  analyzeLegacyLeaderMeetings,
  normalizeLegacyStatus,
  parseLegacySlot,
  runLeaderMeetingBackfill,
} from "../scripts/leader-meeting-backfill.logic.js";

const source = {
  id: "00000000-0000-4000-8000-000000000802",
  ma_tiep_dan: "LD000001",
  ten_lanh_dao: "Chủ tịch UBND xã",
  ngay: new Date("2026-09-05T00:00:00.000Z"),
  slot: "9:00 - 10:00",
  trang_thai: "Hoàn thành",
  ho_ten: "Phạm Thị D",
  sdt: "0922222222",
  cccd: "079987654321",
  dia_chi: "Khu 1",
  ly_do: "Trao đổi quy hoạch",
  thoi_gian_tao: new Date("2026-08-20T00:00:00.000Z"),
  danh_gia_tiep_dan: [],
};
const leaderId = "00000000-0000-4000-8000-000000001001";
const leaderMap = { byLeaderName: { "Chủ tịch UBND xã": leaderId } };

test("normalizes legacy slots and statuses", () => {
  assert.deepEqual(parseLegacySlot("9:00 - 10:30"), { start: "09:00", end: "10:30" });
  assert.equal(parseLegacySlot("10:30 - 09:00"), null);
  assert.equal(normalizeLegacyStatus("Đã phê duyệt"), "APPROVED");
  assert.equal(normalizeLegacyStatus("Hoàn thành"), "COMPLETED");
});

test("reports unresolved leaders instead of guessing", () => {
  const analysis = analyzeLegacyLeaderMeetings([source]);
  assert.equal(analysis.prepared.length, 0);
  assert.equal(analysis.issues[0].reason, "UNMAPPED_LEADER");
});

test("dry-run only reads legacy data and returns a migration report", async () => {
  let transactionCalls = 0;
  const client = {
    dang_ky_tiep_dan: { findMany: async () => [source] },
    $transaction: async () => { transactionCalls += 1; },
  };
  const result = await runLeaderMeetingBackfill(client, { leaderMap });
  assert.equal(result.applied, false);
  assert.equal(result.before.readyRegistrations, 1);
  assert.equal(transactionCalls, 0);
});

test("apply refuses to write while source mappings are incomplete", async () => {
  let transactionCalls = 0;
  const client = {
    dang_ky_tiep_dan: { findMany: async () => [source] },
    $transaction: async () => { transactionCalls += 1; },
  };
  await assert.rejects(
    () => runLeaderMeetingBackfill(client, { apply: true }),
    /chưa thể ánh xạ an toàn/
  );
  assert.equal(transactionCalls, 0);
});

test("apply is idempotent and preserves source identifiers", async () => {
  const created = [];
  const tx = {
    lich_gap_lanh_dao: {
      upsert: async () => ({ id: "00000000-0000-4000-8000-000000002001" }),
    },
    khung_gio_gap_lanh_dao: {
      upsert: async () => ({ id: "00000000-0000-4000-8000-000000002002", suc_chua: 1 }),
      update: async ({ data }) => ({ id: "slot", ...data }),
    },
    dang_ky_gap_lanh_dao: {
      findFirst: async () => null,
      create: async ({ data }) => { created.push(data); return data; },
    },
    danh_gia_gap_lanh_dao: { upsert: async () => {} },
  };
  const client = {
    dang_ky_tiep_dan: { findMany: async () => [source] },
    dang_ky_gap_lanh_dao: { count: async () => 1 },
    danh_gia_gap_lanh_dao: { count: async () => 0 },
    $transaction: async (callback, options) => {
      assert.equal(options.isolationLevel, "Serializable");
      return callback(tx);
    },
  };

  const result = await runLeaderMeetingBackfill(client, { apply: true, leaderMap });
  assert.equal(result.after.migratedRegistrations, 1);
  assert.equal(created[0].id, source.id);
  assert.equal(created[0].ma_dang_ky, source.ma_tiep_dan);
  assert.equal(created[0].ngay_hen.toISOString(), "2026-09-05T00:00:00.000Z");
});
