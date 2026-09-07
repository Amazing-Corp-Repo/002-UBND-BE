import assert from "node:assert/strict";
import test from "node:test";

import {
  aggregatePhanAnhByKhuPho,
  normalizeKhuPhoLabel,
} from "../src/utils/phan-anh-statistics.util.js";

test("neighborhood labels trim and collapse repeated whitespace", () => {
  assert.equal(normalizeKhuPhoLabel("  Khu   phố  3 "), "Khu phố 3");
  assert.equal(normalizeKhuPhoLabel(null), "");
});

test("neighborhood statistics group case and whitespace variants", () => {
  const result = aggregatePhanAnhByKhuPho([
    { khu_pho: "Khu phố 2" },
    { khu_pho: " khu   phố 2 " },
    { khu_pho: "KHU PHỐ 2" },
    { khu_pho: "Khu phố 10" },
    { khu_pho: "" },
  ]);

  assert.deepEqual(result, [
    { khu_pho: "Khu phố 2", count: 3 },
    { khu_pho: "Khu phố 10", count: 1 },
  ]);
});
