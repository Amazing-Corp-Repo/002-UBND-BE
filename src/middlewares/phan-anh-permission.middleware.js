import PHAN_ANH_STATUS from "../constants/phan-anh-status.constant.js";
import { PERMISSION } from "../constants/permission.constant.js";
import { authorize } from "./auth.middleware.js";

const STATUS_PERMISSIONS = {
  [PHAN_ANH_STATUS.DANG_XU_LY]: [
    PERMISSION.PA_APPROVE,
    PERMISSION.PA_ASSIGN,
  ],
  [PHAN_ANH_STATUS.TU_CHOI]: [PERMISSION.PA_REJECT],
  [PHAN_ANH_STATUS.DA_GIAI_QUYET]: [PERMISSION.PA_UPDATE_STATUS],
  [PHAN_ANH_STATUS.DONG]: [PERMISSION.PA_UPDATE_STATUS],
};

export const authorizePhanAnhStatusUpdate = (req, res, next) => {
  const requiredPermissions = STATUS_PERMISSIONS[req.body.trangThai] || [
    PERMISSION.PA_UPDATE_STATUS,
  ];
  return authorize(requiredPermissions)(req, res, next);
};
