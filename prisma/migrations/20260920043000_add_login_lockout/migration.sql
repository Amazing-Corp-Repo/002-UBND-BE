ALTER TABLE "nguoi_dung"
  ADD COLUMN IF NOT EXISTS "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "locked_until" TIMESTAMP(6);

CREATE INDEX IF NOT EXISTS "idx_nguoi_dung_locked_until"
  ON "nguoi_dung"("locked_until");
