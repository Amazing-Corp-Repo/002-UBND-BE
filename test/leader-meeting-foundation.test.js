import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PERMISSION, PERMISSION_DESC } from "../src/constants/permission.constant.js";
import {
  TRANG_THAI_GAP_LANH_DAO,
  TRANG_THAI_GAP_LANH_DAO_LIST,
} from "../src/constants/trang-thai-gap-lanh-dao.constant.js";

const LEADER_MEETING_PERMISSIONS = [
  "LMS_GET_ALL",
  "LMS_GET_DETAIL",
  "LMS_CREATE",
  "LMS_UPDATE",
  "LMS_UPDATE_STATUS",
  "LMS_DELETE",
  "LMR_GET_ALL",
  "LMR_GET_DETAIL",
  "LMR_APPROVE",
  "LMR_REJECT",
  "LMR_PROCESS",
  "LMR_COMPLETE",
  "LMR_CANCEL",
  "LMRT_GET_ALL",
  "LMRT_GET_DETAIL",
  "LMRT_GET_STATS",
];

test("declares the complete leader-meeting state machine", () => {
  assert.deepEqual(TRANG_THAI_GAP_LANH_DAO_LIST, [
    "PENDING",
    "APPROVED",
    "IN_PROGRESS",
    "REJECTED",
    "CANCELED",
    "COMPLETED",
  ]);
  assert.equal(TRANG_THAI_GAP_LANH_DAO.IN_PROGRESS, "IN_PROGRESS");
  assert.equal(TRANG_THAI_GAP_LANH_DAO.CANCELED, "CANCELED");
});

test("declares dedicated permissions with Vietnamese descriptions", () => {
  for (const code of LEADER_MEETING_PERMISSIONS) {
    assert.equal(PERMISSION[code], code);
    assert.ok(PERMISSION_DESC[code]);
  }
});

test("leader-meeting migration is transactional and independent from counters", async () => {
  const migration = await readFile(
    new URL(
      "../prisma/migrations/20260820230000_refine_leader_meeting_workflow/migration.sql",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(migration, /BEGIN;/);
  assert.match(migration, /IN_PROGRESS/);
  assert.match(migration, /CANCELED/);
  assert.match(migration, /ALTER COLUMN "suc_chua" SET NOT NULL/);
  assert.match(migration, /uq_dinh_kem_gap_cccd_front/);
  assert.match(migration, /uq_dinh_kem_gap_cccd_back/);
  assert.match(migration, /COMMIT;/);
  assert.doesNotMatch(migration, /quay_tiep_dan|id_quay|id_cau_hinh_quay/);
});
