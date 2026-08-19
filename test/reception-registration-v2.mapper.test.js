import test from "node:test";
import assert from "node:assert/strict";
import {
  buildReceptionDepartmentFilter,
  hasAssignedReceptionCounter,
  resolveReceptionDepartment,
} from "../src/mapper/reception-registration-v2.mapper.js";

test("uses the V2 counter relation before legacy snapshot fields", () => {
  const registration = {
    bo_phan: "QUAY_1",
    id_cau_hinh_quay: "configuration-id",
    cau_hinh_quay: {
      id: "configuration-id",
      ma_quay: "QUAY_2",
      quay_tiep_dan: { ma_quay: "QUAY_3" },
    },
  };

  assert.equal(resolveReceptionDepartment(registration), "QUAY_3");
  assert.equal(hasAssignedReceptionCounter(registration), true);
});

test("falls back to legacy bo_phan only when no V2 relation is available", () => {
  const registration = { bo_phan: "QUAY_4" };

  assert.equal(resolveReceptionDepartment(registration), "QUAY_4");
  assert.equal(hasAssignedReceptionCounter(registration), true);
});

test("does not accept an invalid legacy counter as an assignment", () => {
  assert.equal(hasAssignedReceptionCounter({ bo_phan: "OTHER" }), false);
  assert.equal(hasAssignedReceptionCounter(null), false);
});

test("builds a relation-first filter with a legacy fallback", () => {
  assert.deepEqual(buildReceptionDepartmentFilter("QUAY_5"), {
    OR: [
      {
        cau_hinh_quay: {
          is: {
            quay_tiep_dan: { is: { ma_quay: "QUAY_5" } },
          },
        },
      },
      { id_cau_hinh_quay: null, bo_phan: "QUAY_5" },
    ],
  });
  assert.equal(buildReceptionDepartmentFilter(undefined), null);
});
