-- Additive-only migration. Effective OVERDUE is represented by these fields so
-- the existing constrained trang_thai column and historical data remain intact.
ALTER TABLE "dang_ky_gap_lanh_dao"
  ADD COLUMN "is_qua_han" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "thoi_gian_qua_han" TIMESTAMP(6);

CREATE INDEX "idx_dang_ky_gap_lanh_dao_is_qua_han"
  ON "dang_ky_gap_lanh_dao"("is_qua_han");
