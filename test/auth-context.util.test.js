import test from "node:test";
import assert from "node:assert/strict";
import { normalizeRoleNames } from "../src/utils/auth-context.util.js";

test("normalizes legacy comma-separated role claims", () => {
  assert.deepEqual(normalizeRoleNames("LANH_DAO, ADMIN"), ["LANH_DAO", "ADMIN"]);
});

test("keeps array role claims and safely handles missing claims", () => {
  assert.deepEqual(normalizeRoleNames(["LANH_DAO", "ADMIN"]), ["LANH_DAO", "ADMIN"]);
  assert.deepEqual(normalizeRoleNames(null), []);
});
