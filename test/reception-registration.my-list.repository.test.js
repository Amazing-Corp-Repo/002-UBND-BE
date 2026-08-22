import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import prisma from "../src/config/database.config.js";
import Repository from "../src/repositories/dang-ky-tiep-dan.repository.js";

const originalFindMany = prisma.dang_ky_tiep_dan.findMany;
const originalCount = prisma.dang_ky_tiep_dan.count;

afterEach(() => {
  prisma.dang_ky_tiep_dan.findMany = originalFindMany;
  prisma.dang_ky_tiep_dan.count = originalCount;
});

describe("reception registration MY scope", () => {
  it("matches registrations handled by the authenticated user", async () => {
    const userId = "223e4567-e89b-42d3-a456-426614174000";
    let capturedWhere;
    prisma.dang_ky_tiep_dan.findMany = async ({ where }) => {
      capturedWhere = where;
      return [];
    };
    prisma.dang_ky_tiep_dan.count = async () => 0;

    await Repository.findAllForStaff({
      page: 1,
      size: 10,
      scope: "MY",
      handledByUserId: userId,
    });

    assert.deepEqual(capturedWhere.OR, [
      { nguoi_duyet_don: userId },
      { nguoi_hoan_thanh: userId },
      { nguoi_tu_choi: userId },
    ]);
  });
});
