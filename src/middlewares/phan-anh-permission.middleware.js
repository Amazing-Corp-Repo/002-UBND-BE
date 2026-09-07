import PHAN_ANH_STATUS from "../constants/phan-anh-status.constant.js";
import { PERMISSION } from "../constants/permission.constant.js";
import { BaseError } from "../utils/base-error.util.js";

export const authorizePhanAnhStatusUpdate = (req, res, next) => {
  const userPermissions = req.payload?.permissions || [];
  const targetStatus = req.body?.trangThai;

  let allowed = false;
  if (targetStatus === PHAN_ANH_STATUS.DANG_XU_LY) {
    // Duyệt phản ánh đồng thời là thao tác phê duyệt và phân công.
    allowed =
      userPermissions.includes(PERMISSION.PA_APPROVE) &&
      userPermissions.includes(PERMISSION.PA_ASSIGN);
  } else if (targetStatus === PHAN_ANH_STATUS.TU_CHOI) {
    allowed = userPermissions.some((p) =>
      [PERMISSION.PA_REJECT, PERMISSION.PA_APPROVE, PERMISSION.PA_UPDATE_STATUS].includes(p)
    );
  } else {
    allowed = userPermissions.some((p) =>
      [PERMISSION.PA_UPDATE_STATUS, PERMISSION.PA_APPROVE].includes(p)
    );
  }

  if (!allowed) {
    throw new BaseError(403, "Bạn không có quyền cập nhật trạng thái phản ánh này");
  }

  return next();
};

export const authorizeGetAssignableUsers = (req, res, next) => {
  const userPermissions = req.payload?.permissions || [];
  const allowed = userPermissions.some((p) =>
    [PERMISSION.PA_ASSIGN, PERMISSION.PA_APPROVE, PERMISSION.PA_UPDATE_STATUS].includes(p)
  );

  if (!allowed) {
    throw new BaseError(403, "Bạn không có quyền xem danh sách chuyên viên phân công");
  }

  return next();
};
