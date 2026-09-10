import test from "node:test";
import assert from "node:assert/strict";
import {
  getChange,
  getSlaClassification,
  resolveDashboardPeriod,
  resolveDashboardScope,
} from "./dashboard.util.js";

test("resolveDashboardPeriod calculates the current quarter in Vietnam time", () => {
  const period = resolveDashboardPeriod({
    preset: "thisQuarter",
    now: new Date("2026-09-10T05:00:00.000Z"),
  });

  assert.deepEqual(
    [period.current.startDate, period.current.endDate],
    ["2026-07-01", "2026-09-10"],
  );
  assert.deepEqual(
    [period.previous.startDate, period.previous.endDate],
    ["2026-04-20", "2026-06-30"],
  );
  assert.equal(period.today.start.toISOString(), "2026-09-09T17:00:00.000Z");
  assert.equal(period.today.end.toISOString(), "2026-09-10T16:59:59.999Z");
});

test("getChange handles zero baseline and percentage-point differences", () => {
  assert.deepEqual(getChange(12, 0), { value: 100, direction: "up" });
  assert.deepEqual(getChange(0, 0), { value: 0, direction: "flat" });
  assert.deepEqual(getChange(80, 100), { value: 20, direction: "down" });
  assert.deepEqual(getChange(88.5, 85, { percentagePoint: true }), {
    value: 3.5,
    direction: "up",
  });
});

test("resolveDashboardScope uses permissions and cate without role names", () => {
  assert.deepEqual(
    resolveDashboardScope({
      permissions: ["RPT_GET_DETAIL"],
      cate: "field-a, field-b",
      idLinhVuc: "all",
    }),
    {
      isFullAccess: true,
      assignedLinhVucIds: ["field-a", "field-b"],
      effectiveLinhVucIds: undefined,
    },
  );

  assert.deepEqual(
    resolveDashboardScope({
      permissions: ["PA_GET_STATS"],
      cate: "field-a, field-b",
      idLinhVuc: "field-b",
    }).effectiveLinhVucIds,
    ["field-b"],
  );

  assert.deepEqual(
    resolveDashboardScope({
      permissions: ["PA_GET_STATS"],
      cate: "field-a",
      idLinhVuc: "field-b",
    }).effectiveLinhVucIds,
    [],
  );
});

test("getSlaClassification applies the two-thirds remaining-time rule", () => {
  const createdAt = "2026-09-10T00:00:00.000Z";
  const deadline = "2026-09-11T00:00:00.000Z";

  assert.equal(
    getSlaClassification({
      createdAt,
      deadline,
      now: "2026-09-10T07:00:00.000Z",
    }),
    "onTime",
  );
  assert.equal(
    getSlaClassification({
      createdAt,
      deadline,
      now: "2026-09-10T08:00:00.000Z",
    }),
    "soon",
  );
  assert.equal(
    getSlaClassification({
      createdAt,
      deadline,
      now: "2026-09-11T00:00:01.000Z",
    }),
    "overdue",
  );
  assert.equal(
    getSlaClassification({
      createdAt,
      deadline,
      completedAt: "2026-09-11T00:00:01.000Z",
      now: "2026-09-11T00:00:02.000Z",
    }),
    "overdue",
  );
});
