import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatDatabaseTime,
  formatVietnamDate,
  formatVietnamDateTime,
  getVietnamDayUtcRange,
  normalizeReceptionTimes,
  parseVietnamImportDate,
  parseVietnamImportTime,
  toDatabaseDate,
} from "../src/utils/vietnam-time.util.js";

describe("Reception Vietnam time contract", () => {
  it("returns business dates without an artificial UTC time", () => {
    assert.equal(
      formatVietnamDate(new Date("2026-08-26T00:00:00.000Z")),
      "2026-08-26"
    );
    assert.equal(toDatabaseDate("2026-02-29"), null);
    assert.equal(toDatabaseDate("2028-02-29")?.toISOString(), "2028-02-29T00:00:00.000Z");
  });

  it("keeps PostgreSQL TIME values as Vietnam wall-clock time", () => {
    const databaseTime = new Date("1970-01-01T07:30:00.000Z");
    assert.equal(formatDatabaseTime(databaseTime), "07:30");
    assert.equal(formatDatabaseTime("16:30:00"), "16:30");
  });

  it("returns operational timestamps with the Vietnam offset", () => {
    assert.equal(
      formatVietnamDateTime("2026-08-20T11:00:00.123Z"),
      "2026-08-20T18:00:00.123+07:00"
    );
  });

  it("interprets spreadsheet dates and times as Vietnam wall-clock values", () => {
    assert.equal(parseVietnamImportDate("26/08/2026"), "2026-08-26");
    assert.equal(
      parseVietnamImportDate(new Date("2026-08-26T00:00:00.000Z")),
      "2026-08-26"
    );
    assert.equal(parseVietnamImportTime("7:30"), "07:30");
    assert.equal(
      parseVietnamImportTime(new Date("1899-12-30T07:30:00.000Z")),
      "07:30"
    );
    assert.equal(parseVietnamImportTime(7.5 / 24), "07:30");
  });

  it("uses Vietnam calendar-day boundaries for timestamp filters", () => {
    const range = getVietnamDayUtcRange({
      fromDate: "2026-08-20",
      toDate: "2026-08-20",
    });
    assert.equal(range.gte.toISOString(), "2026-08-19T17:00:00.000Z");
    assert.equal(range.lte.toISOString(), "2026-08-20T16:59:59.999Z");
  });

  it("normalizes nested reception responses consistently", () => {
    const result = normalizeReceptionTimes({
      receptionDate: new Date("2026-08-26T00:00:00.000Z"),
      startTime: new Date("1970-01-01T07:30:00.000Z"),
      approvedAt: new Date("2026-08-20T11:00:00.000Z"),
      nested: { thoi_gian_cap_nhat: "2026-08-20T12:00:00.000Z" },
    });

    assert.deepEqual(result, {
      receptionDate: "2026-08-26",
      startTime: "07:30",
      approvedAt: "2026-08-20T18:00:00.000+07:00",
      nested: { thoi_gian_cap_nhat: "2026-08-20T19:00:00.000+07:00" },
    });
  });
});
