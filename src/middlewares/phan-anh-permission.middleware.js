import PHAN_ANH_STATUS from "../constants/phan-anh-status.constant.js";
import { PERMISSION } from "../constants/permission.constant.js";
import { BaseError } from "../utils/base-error.util.js";

export const authorizePhanAnhStatusUpdate = (req, res, next) => {
  const userPermissions = req.payload?.permissions || [];
  const targetStatus = req.body?.trangThai;

  let allowed = false;
  if (targetStatus === PHAN_ANH_STATUS.DANG_XU_LY) {
    // Để chuyển sang "Đang xử lý" (Duyệt), người dùng chỉ cần có một trong các quyền phê duyệt / phân công / cập nhật
    allowed = userPermissions.some((p) =>
      [PERMISSION.PA_APPROVE, PERMISSION.PA_ASSIGN, PERMISSION.PA_UPDATE_STATUS].includes(p)
    );
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
    return next(new BaseError(403, "Bạn không có quyền cập nhật trạng thái phản ánh này"));
  }

  return next();
};

export const authorizeGetAssignableUsers = (req, res, next) => {
  const userPermissions = req.payload?.permissions || [];
  const allowed = userPermissions.some((p) =>
    [PERMISSION.PA_ASSIGN, PERMISSION.PA_APPROVE, PERMISSION.PA_UPDATE_STATUS].includes(p)
  );

  if (!allowed) {
    return next(new BaseError(403, "Bạn không có quyền xem danh sách chuyên viên phân công"));
  }

  return next();
};
