-- Chống một người đăng ký lặp lại cùng lịch và khung giờ.
-- Không lọc is_delete, is_active hoặc trạng thái vì đăng ký đã tạo không trả chỗ.
CREATE UNIQUE INDEX "uq_reception_registration_schedule_slot_phone"
ON "dang_ky_tiep_dan" ("id_lich_tiep_dan", "slot", "sdt")
WHERE
  "loai" = 'COUNTER_RECEPTION'
  AND "id_lich_tiep_dan" IS NOT NULL
  AND "slot" IS NOT NULL
  AND "sdt" IS NOT NULL;

CREATE UNIQUE INDEX "uq_reception_registration_schedule_slot_citizen"
ON "dang_ky_tiep_dan" ("id_lich_tiep_dan", "slot", "cccd")
WHERE
  "loai" = 'COUNTER_RECEPTION'
  AND "id_lich_tiep_dan" IS NOT NULL
  AND "slot" IS NOT NULL
  AND "cccd" IS NOT NULL;
