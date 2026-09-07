INSERT INTO "permissions" ("code", "description")
VALUES
    ('RR_COMPLETE', 'Hoàn thành buổi tiếp dân'),
    ('RR_REJECT', 'Từ chối đăng ký tiếp dân')
ON CONFLICT ("code") DO UPDATE
SET "description" = EXCLUDED."description";

INSERT INTO "role_permissions" ("role_id", "permission_code")
SELECT role_record."id", permission_record."code"
FROM "roles" AS role_record
CROSS JOIN "permissions" AS permission_record
WHERE role_record."name" IN ('CHUYEN_VIEN', 'LANH_DAO')
  AND role_record."is_active" IS TRUE
  AND role_record."is_delete" IS FALSE
  AND permission_record."code" IN ('RR_COMPLETE', 'RR_REJECT')
ON CONFLICT ("role_id", "permission_code") DO NOTHING;

WITH reception_periods AS (
    SELECT
        schedule."id" AS "schedule_id",
        BTRIM(raw_period."value") AS "raw_period"
    FROM "lich_tiep_dan" AS schedule
    CROSS JOIN LATERAL regexp_split_to_table(
        schedule."thoi_gian",
        '\s*,\s*'
    ) AS raw_period("value")
    WHERE schedule."thoi_gian" IS NOT NULL
      AND schedule."is_delete" IS NOT TRUE
),
normalized_periods AS (
    SELECT
        "schedule_id",
        split_part(regexp_replace("raw_period", '\s', '', 'g'), '-', 1)::time
            AS "start_time",
        split_part(regexp_replace("raw_period", '\s', '', 'g'), '-', 2)::time
            AS "end_time"
    FROM reception_periods
    WHERE "raw_period" ~
        '^([01][0-9]|2[0-3]):[0-5][0-9]\s*-\s*([01][0-9]|2[0-3]):[0-5][0-9]$'
),
hourly_slots AS (
    SELECT
        period."schedule_id",
        slot_start::time AS "start_time",
        (slot_start + INTERVAL '1 hour')::time AS "end_time"
    FROM normalized_periods AS period
    CROSS JOIN LATERAL generate_series(
        CURRENT_DATE + period."start_time",
        CURRENT_DATE + period."end_time" - INTERVAL '1 hour',
        INTERVAL '1 hour'
    ) AS slot_start
)
INSERT INTO "khung_gio_tiep_dan" (
    "id",
    "id_lich_tiep_dan",
    "khung_gio",
    "ma_quay",
    "suc_chua",
    "is_active",
    "is_delete"
)
SELECT
    public.uuid_generate_v4(),
    hourly_slot."schedule_id",
    to_char(hourly_slot."start_time", 'HH24:MI')
        || ' - '
        || to_char(hourly_slot."end_time", 'HH24:MI'),
    'QUAY_' || counter_number."value",
    2,
    TRUE,
    FALSE
FROM hourly_slots AS hourly_slot
CROSS JOIN generate_series(1, 8) AS counter_number("value")
ON CONFLICT ("id_lich_tiep_dan", "khung_gio", "ma_quay") DO NOTHING;
