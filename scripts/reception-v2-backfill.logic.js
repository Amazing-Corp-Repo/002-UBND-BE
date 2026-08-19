const COUNTER_SLOT_PATTERN = String.raw`^\s*[0-9]{1,2}:[0-9]{2}\s*-\s*[0-9]{1,2}:[0-9]{2}\s*$`;

export const RECEPTION_V2_REPORT_SQL = `
SELECT
  (SELECT COUNT(*) FROM "khung_gio_tiep_dan"
    WHERE "khung_gio" !~ '${COUNTER_SLOT_PATTERN}') AS "invalidCounterSlotFormats",
  (SELECT COUNT(*) FROM "khung_gio_tiep_dan" kg
    LEFT JOIN "quay_tiep_dan" q ON q."ma_quay" = kg."ma_quay"
    WHERE q."id" IS NULL) AS "unknownCounterCodes",
  (SELECT COUNT(*) FROM "dang_ky_tiep_dan"
    WHERE "loai" = 'COUNTER_RECEPTION'
      AND ("slot" IS NULL OR "slot" !~ '${COUNTER_SLOT_PATTERN}')) AS "invalidRegistrationSlotFormats",
  (SELECT COUNT(*) FROM "khung_gio_tiep_dan"
    WHERE "id_ca_tiep_dan" IS NULL) AS "counterSlotsMissingShift",
  (SELECT COUNT(*) FROM "khung_gio_tiep_dan"
    WHERE "id_quay" IS NULL) AS "counterSlotsMissingCounter",
  (SELECT COUNT(*) FROM "dang_ky_tiep_dan"
    WHERE "loai" = 'COUNTER_RECEPTION'
      AND "id_ca_tiep_dan" IS NULL) AS "counterRegistrationsMissingShift",
  (SELECT COUNT(*) FROM "dang_ky_tiep_dan"
    WHERE "loai" = 'COUNTER_RECEPTION'
      AND "trang_thai" IN ('APPROVED', 'COMPLETED')
      AND "id_cau_hinh_quay" IS NULL) AS "assignedRegistrationsMissingCounterConfiguration",
  (SELECT COUNT(*) FROM "phan_cong_quay_tiep_dan") AS "counterAssignments",
  (SELECT COUNT(*) FROM "dang_ky_tiep_dan"
    WHERE "loai" = 'LEADER_MEETING') AS "legacyLeaderRegistrations";
`;

export const RECEPTION_V2_BACKFILL_STATEMENTS = [
  `
    INSERT INTO "ca_tiep_dan" (
      "id", "id_lich_tiep_dan", "gio_bat_dau", "gio_ket_thuc"
    )
    SELECT
      public.uuid_generate_v4(),
      kg."id_lich_tiep_dan",
      trim(split_part(kg."khung_gio", '-', 1))::time,
      trim(split_part(kg."khung_gio", '-', 2))::time
    FROM "khung_gio_tiep_dan" kg
    WHERE kg."khung_gio" ~ '${COUNTER_SLOT_PATTERN}'
    GROUP BY
      kg."id_lich_tiep_dan",
      trim(split_part(kg."khung_gio", '-', 1))::time,
      trim(split_part(kg."khung_gio", '-', 2))::time
    ON CONFLICT ("id_lich_tiep_dan", "gio_bat_dau", "gio_ket_thuc")
    DO NOTHING;
  `,
  `
    UPDATE "khung_gio_tiep_dan" kg
    SET
      "id_ca_tiep_dan" = ca."id",
      "id_quay" = q."id"
    FROM "ca_tiep_dan" ca, "quay_tiep_dan" q
    WHERE kg."khung_gio" ~ '${COUNTER_SLOT_PATTERN}'
      AND ca."id_lich_tiep_dan" = kg."id_lich_tiep_dan"
      AND ca."gio_bat_dau" = trim(split_part(kg."khung_gio", '-', 1))::time
      AND ca."gio_ket_thuc" = trim(split_part(kg."khung_gio", '-', 2))::time
      AND q."ma_quay" = kg."ma_quay"
      AND (
        kg."id_ca_tiep_dan" IS DISTINCT FROM ca."id"
        OR kg."id_quay" IS DISTINCT FROM q."id"
      );
  `,
  `
    UPDATE "dang_ky_tiep_dan" dk
    SET "id_ca_tiep_dan" = ca."id"
    FROM "ca_tiep_dan" ca
    WHERE dk."loai" = 'COUNTER_RECEPTION'
      AND dk."slot" ~ '${COUNTER_SLOT_PATTERN}'
      AND ca."id_lich_tiep_dan" = dk."id_lich_tiep_dan"
      AND ca."gio_bat_dau" = trim(split_part(dk."slot", '-', 1))::time
      AND ca."gio_ket_thuc" = trim(split_part(dk."slot", '-', 2))::time
      AND dk."id_ca_tiep_dan" IS DISTINCT FROM ca."id";
  `,
  `
    UPDATE "dang_ky_tiep_dan" dk
    SET "id_cau_hinh_quay" = kg."id"
    FROM "khung_gio_tiep_dan" kg
    JOIN "quay_tiep_dan" q ON q."id" = kg."id_quay"
    WHERE dk."loai" = 'COUNTER_RECEPTION'
      AND dk."trang_thai" IN ('APPROVED', 'COMPLETED')
      AND dk."id_ca_tiep_dan" = kg."id_ca_tiep_dan"
      AND dk."bo_phan" = q."ma_quay"
      AND dk."id_cau_hinh_quay" IS DISTINCT FROM kg."id";
  `,
];

const REPORT_FIELDS = [
  "invalidCounterSlotFormats",
  "unknownCounterCodes",
  "invalidRegistrationSlotFormats",
  "counterSlotsMissingShift",
  "counterSlotsMissingCounter",
  "counterRegistrationsMissingShift",
  "assignedRegistrationsMissingCounterConfiguration",
  "counterAssignments",
  "legacyLeaderRegistrations",
];

function normalizeCount(value) {
  if (typeof value === "bigint") return Number(value);
  const count = Number(value ?? 0);
  return Number.isFinite(count) ? count : 0;
}

export function normalizeReceptionV2Report(row = {}) {
  return Object.fromEntries(
    REPORT_FIELDS.map((field) => [field, normalizeCount(row[field])])
  );
}

export async function collectReceptionV2BackfillReport(client) {
  const [row = {}] = await client.$queryRawUnsafe(RECEPTION_V2_REPORT_SQL);
  return normalizeReceptionV2Report(row);
}

function assertPreconditions(report) {
  const invalidInput =
    report.invalidCounterSlotFormats +
    report.unknownCounterCodes +
    report.invalidRegistrationSlotFormats;
  if (invalidInput > 0) {
    throw new Error(
      "Backfill bị dừng: còn khung giờ sai định dạng hoặc mã quầy không tồn tại"
    );
  }
}

function assertBackfillResult(report) {
  const missingMappings =
    report.counterSlotsMissingShift +
    report.counterSlotsMissingCounter +
    report.counterRegistrationsMissingShift +
    report.assignedRegistrationsMissingCounterConfiguration;
  if (missingMappings > 0) {
    throw new Error(
      "Backfill chưa hoàn tất: vẫn còn bản ghi tiếp dân thiếu quan hệ V2"
    );
  }
}

export async function runReceptionV2Backfill(client, { apply = false } = {}) {
  const before = await collectReceptionV2BackfillReport(client);
  assertPreconditions(before);

  if (!apply) {
    return { applied: false, before, after: before };
  }

  return client.$transaction(
    async (transaction) => {
      for (const statement of RECEPTION_V2_BACKFILL_STATEMENTS) {
        await transaction.$executeRawUnsafe(statement);
      }

      const after = await collectReceptionV2BackfillReport(transaction);
      assertBackfillResult(after);
      return { applied: true, before, after };
    },
    { isolationLevel: "Serializable", timeout: 120000 }
  );
}
