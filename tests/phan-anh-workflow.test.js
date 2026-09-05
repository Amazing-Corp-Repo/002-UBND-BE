import assert from "node:assert/strict";
import test from "node:test";

import PHAN_ANH_MUC_DO from "../src/constants/phan-anh-muc-do.constant.js";
import PHAN_ANH_STATUS, {
  getAllowedPhanAnhStatusTransitions,
} from "../src/constants/phan-anh-status.constant.js";
import { PERMISSION } from "../src/constants/permission.constant.js";
import { authorizePhanAnhStatusUpdate } from "../src/middlewares/phan-anh-permission.middleware.js";
import {
  addVietnamWorkingDays,
  calculatePhanAnhDeadline,
} from "../src/utils/phan-anh-deadline.util.js";
import { UpdatePhanAnhStatusRequest } from "../src/validators/phan-anh.validator.js";

const userId = "550e8400-e29b-41d4-a716-446655440000";

test("normal deadline skips Saturday and Sunday in Vietnam", () => {
  const fridayMorningUtc = new Date("2026-09-04T02:30:00.000Z");
  assert.equal(
    addVietnamWorkingDays(fridayMorningUtc, 3).toISOString(),
    "2026-09-09T02:30:00.000Z",
  );
});

test("urgent deadline is exactly 24 hours from reception", () => {
  const receivedAt = new Date("2026-09-04T15:00:00.000Z");
  assert.equal(
    calculatePhanAnhDeadline({
      receivedAt,
      mucDo: PHAN_ANH_MUC_DO.KHAN_CAP,
    }).toISOString(),
    "2026-09-05T15:00:00.000Z",
  );
});

test("complaint status transitions follow approval and completion flow", () => {
  assert.deepEqual(
    getAllowedPhanAnhStatusTransitions(PHAN_ANH_STATUS.DA_GUI),
    [PHAN_ANH_STATUS.DANG_XU_LY, PHAN_ANH_STATUS.TU_CHOI],
  );
  assert.deepEqual(
    getAllowedPhanAnhStatusTransitions(PHAN_ANH_STATUS.DANG_XU_LY),
    [PHAN_ANH_STATUS.DA_GIAI_QUYET],
  );
  assert.deepEqual(
    getAllowedPhanAnhStatusTransitions(PHAN_ANH_STATUS.DA_GIAI_QUYET),
    [PHAN_ANH_STATUS.DONG],
  );
  assert.deepEqual(
    getAllowedPhanAnhStatusTransitions(PHAN_ANH_STATUS.TU_CHOI),
    [],
  );
});

test("status validator requires assignee on approval and reason on rejection", () => {
  assert.ok(
    UpdatePhanAnhStatusRequest.validate({
      trangThai: PHAN_ANH_STATUS.DANG_XU_LY,
      soNgayXuLy: 3,
    }).error,
  );
  assert.ok(
    UpdatePhanAnhStatusRequest.validate({
      trangThai: PHAN_ANH_STATUS.TU_CHOI,
    }).error,
  );
  assert.equal(
    UpdatePhanAnhStatusRequest.validate({
      trangThai: PHAN_ANH_STATUS.TU_CHOI,
      ghiChu: "Không thuộc thẩm quyền giải quyết",
    }).error,
    undefined,
  );
});

test("approval validator accepts 1 to 90 processing days", () => {
  const valid = UpdatePhanAnhStatusRequest.validate({
    trangThai: PHAN_ANH_STATUS.DANG_XU_LY,
    idNguoiXuLy: userId,
    soNgayXuLy: "10",
  });
  assert.equal(valid.error, undefined);
  assert.equal(valid.value.soNgayXuLy, 10);

  assert.ok(
    UpdatePhanAnhStatusRequest.validate({
      trangThai: PHAN_ANH_STATUS.DANG_XU_LY,
      idNguoiXuLy: userId,
      soNgayXuLy: 91,
    }).error,
  );
});

const runAuthorization = (trangThai, permissions) => {
  let nextCalled = false;
  authorizePhanAnhStatusUpdate(
    { body: { trangThai }, payload: { permissions } },
    {},
    () => {
      nextCalled = true;
    },
  );
  return nextCalled;
};

test("approval requires both approve and assign permissions", () => {
  assert.throws(() =>
    runAuthorization(PHAN_ANH_STATUS.DANG_XU_LY, [PERMISSION.PA_APPROVE]),
  );
  assert.equal(
    runAuthorization(PHAN_ANH_STATUS.DANG_XU_LY, [
      PERMISSION.PA_APPROVE,
      PERMISSION.PA_ASSIGN,
    ]),
    true,
  );
});

test("rejection and regular status updates use separate permissions", () => {
  assert.equal(
    runAuthorization(PHAN_ANH_STATUS.TU_CHOI, [PERMISSION.PA_REJECT]),
    true,
  );
  assert.equal(
    runAuthorization(PHAN_ANH_STATUS.DA_GIAI_QUYET, [
      PERMISSION.PA_UPDATE_STATUS,
    ]),
    true,
  );
});
