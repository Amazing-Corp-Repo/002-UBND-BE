import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  PERMISSION,
  PERMISSION_DESC,
} from "../src/constants/permission.constant.js";
import { authorize } from "../src/middlewares/auth.middleware.js";

const NEW_COMPLAINT_PERMISSIONS = [
  "PA_APPROVE",
  "PA_REJECT",
  "PA_UPDATE_LINH_VUC",
  "PA_GET_STATS",
];

test("complaint permissions have unique codes and descriptions", () => {
  const codes = Object.values(PERMISSION);
  assert.equal(new Set(codes).size, codes.length);

  for (const code of NEW_COMPLAINT_PERMISSIONS) {
    assert.equal(PERMISSION[code], code);
    assert.ok(PERMISSION_DESC[code]);
  }
});

test("authorize requires every requested permission", () => {
  const middleware = authorize([
    PERMISSION.PA_APPROVE,
    PERMISSION.PA_ASSIGN,
  ]);

  assert.throws(
    () => middleware({ payload: { permissions: [PERMISSION.PA_APPROVE] } }, {}, () => {}),
    (error) => error.statusCode === 403
  );

  let called = false;
  middleware(
    {
      payload: {
        permissions: [PERMISSION.PA_APPROVE, PERMISSION.PA_ASSIGN],
      },
    },
    {},
    () => {
      called = true;
    }
  );
  assert.equal(called, true);
});

test("permission synchronization is additive-only", async () => {
  const source = await readFile(
    new URL("../src/repositories/permission.repository.js", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(source, /prisma\.permissions\.(?:delete|deleteMany|update|updateMany)/);
  assert.match(source, /prisma\.permissions\.createMany/);
});

test("sensitive complaint reads and actions are permission protected", async () => {
  const source = await readFile(
    new URL("../src/routes/phan-anh.route.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /authorize\(\[PERMISSION\.PA_GET_DETAIL\]\)/);
  assert.match(source, /authorize\(\[PERMISSION\.PA_GET_STATS\]\)/);
  assert.match(source, /authorize\(\[PERMISSION\.PA_UPDATE_LINH_VUC\]\)/);
});
