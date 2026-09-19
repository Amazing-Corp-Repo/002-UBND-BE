-- REJECTED giải phóng ca; CANCELED tiếp tục giữ chỗ theo nghiệp vụ.
BEGIN;

DROP INDEX IF EXISTS "uq_leader_meeting_slot_phone";
DROP INDEX IF EXISTS "uq_leader_meeting_slot_citizen";

CREATE UNIQUE INDEX "uq_leader_meeting_slot_phone"
  ON "dang_ky_gap_lanh_dao" ("id_khung_gio_gap", "sdt")
  WHERE "trang_thai" IN ('PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED')
    AND "is_active" = true
    AND "is_delete" = false;

CREATE UNIQUE INDEX "uq_leader_meeting_slot_citizen"
  ON "dang_ky_gap_lanh_dao" ("id_khung_gio_gap", "cccd")
  WHERE "trang_thai" IN ('PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED')
    AND "is_active" = true
    AND "is_delete" = false;

COMMIT;
