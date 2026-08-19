import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  RECEPTION_V2_BACKFILL_STATEMENTS,
  normalizeReceptionV2Report,
  runReceptionV2Backfill,
} from "../scripts/reception-v2-backfill.logic.js";

const completeReport = {
  invalidCounterSlotFormats: 0n,
  unknownCounterCodes: 0n,
  invalidRegistrationSlotFormats: 0n,
  counterSlotsMissingShift: 0n,
  counterSlotsMissingCounter: 0n,
  counterRegistrationsMissingShift: 0n,
  assignedRegistrationsMissingCounterConfiguration: 0n,
  counterAssignments: 0n,
  legacyLeaderRegistrations: 1n,
};

test("normalizes bigint report values for JSON output", () => {
  assert.deepEqual(normalizeReceptionV2Report(completeReport), {
    invalidCounterSlotFormats: 0,
    unknownCounterCodes: 0,
    invalidRegistrationSlotFormats: 0,
    counterSlotsMissingShift: 0,
    counterSlotsMissingCounter: 0,
    counterRegistrationsMissingShift: 0,
    assignedRegistrationsMissingCounterConfiguration: 0,
    counterAssignments: 0,
    legacyLeaderRegistrations: 1,
  });
});

test("dry-run only reads the report and never opens a write transaction", async () => {
  let transactionCalls = 0;
  const client = {
    $queryRawUnsafe: async () => [completeReport],
    $transaction: async () => {
      transactionCalls += 1;
    },
  };

  const result = await runReceptionV2Backfill(client);

  assert.equal(result.applied, false);
  assert.equal(transactionCalls, 0);
  assert.deepEqual(result.before, result.after);
});

test("apply executes every idempotent statement inside a serializable transaction", async () => {
  const executedStatements = [];
  const transactionClient = {
    $executeRawUnsafe: async (statement) => executedStatements.push(statement),
    $queryRawUnsafe: async () => [completeReport],
  };
  const client = {
    $queryRawUnsafe: async () => [
      { ...completeReport, counterSlotsMissingShift: 104n },
    ],
    $transaction: async (callback, options) => {
      assert.equal(options.isolationLevel, "Serializable");
      return callback(transactionClient);
    },
  };

  const result = await runReceptionV2Backfill(client, { apply: true });

  assert.equal(result.applied, true);
  assert.equal(executedStatements.length, RECEPTION_V2_BACKFILL_STATEMENTS.length);
  assert.equal(result.after.counterSlotsMissingShift, 0);
});

test("stops before writing when source slot or counter data is invalid", async () => {
  let transactionCalls = 0;
  const client = {
    $queryRawUnsafe: async () => [
      { ...completeReport, invalidRegistrationSlotFormats: 1n },
    ],
    $transaction: async () => {
      transactionCalls += 1;
    },
  };

  await assert.rejects(
    () => runReceptionV2Backfill(client, { apply: true }),
    /Backfill bị dừng/
  );
  assert.equal(transactionCalls, 0);
});

test("rolls back when required V2 mappings are still missing after apply", async () => {
  const transactionClient = {
    $executeRawUnsafe: async () => {},
    $queryRawUnsafe: async () => [
      { ...completeReport, counterRegistrationsMissingShift: 1n },
    ],
  };
  const client = {
    $queryRawUnsafe: async () => [completeReport],
    $transaction: async (callback) => callback(transactionClient),
  };

  await assert.rejects(
    () => runReceptionV2Backfill(client, { apply: true }),
    /Backfill chưa hoàn tất/
  );
});

test("assignment migration keeps history and only protects active assignments", async () => {
  const migration = await readFile(
    new URL(
      "../prisma/migrations/20260820200000_reception_v2_active_assignment_unique/migration.sql",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(migration, /BEGIN;/);
  assert.match(migration, /DROP INDEX IF EXISTS "uq_phan_cong_quay_cau_hinh"/);
  assert.match(migration, /CREATE UNIQUE INDEX "uq_phan_cong_quay_cau_hinh_active_v2"/);
  assert.match(migration, /WHERE "is_active" = true AND "is_delete" = false/);
  assert.match(migration, /COMMIT;/);
});
