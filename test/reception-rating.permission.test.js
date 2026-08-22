import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PERMISSION, PERMISSION_TYPE } from "../src/constants/permission.constant.js";
import PermissionService from "../src/services/permission.service.js";

describe("Reception rating permission metadata", () => {
  it("exposes GET_STATS so the permission API can render the statistics column", async () => {
    const result = await PermissionService.getAllPermissions();
    const ratingPermissions = result.grouped.RRT;

    assert.equal(PERMISSION_TYPE.GET_STATS, "Xem thống kê");
    assert.ok(
      ratingPermissions.some(
        (permission) =>
          permission.code === PERMISSION.RRT_GET_STATS &&
          permission.type === "GET_STATS"
      )
    );
    assert.equal(result.type.GET_STATS, "Xem thống kê");
  });
});
