import fs from "node:fs";
import LeaderMeetingRegistrationRepository from "../repositories/leader-meeting-registration.repository.js";
import { BaseError } from "../utils/base-error.util.js";
import { createPagination } from "../utils/response.util.js";
import { hasPermission } from "../utils/auth-context.util.js";
import { PERMISSION } from "../constants/permission.constant.js";
import { TRANG_THAI_GAP_LANH_DAO } from "../constants/trang-thai-gap-lanh-dao.constant.js";
import {
  getLeaderMeetingGraceDeadline,
  getLeaderMeetingStartTime,
  isLeaderMeetingOverdue,
  isLeaderMeetingReadyToProcess,
} from "../utils/leader-meeting-overdue.util.js";
import {
  MAX_RETRIES,
  PRIVATE_UPLOAD_ROOT,
  createCode,
  vietnamDate,
  vietnamTime,
  refreshLeaderMeetingStatusSchedule,
  buildAttachments,
  conflictMessages,
  mapUniqueConflict,
  mapCreated,
  mapCitizenLookup,
  mapManagementListItem,
  mapManagementDetail,
} from "./leader-meeting-registration.helpers.js";

const LeaderMeetingRegistrationService = {
  async markOverdueRegistrations(now = new Date()) {
    const candidates = await LeaderMeetingRegistrationRepository.findOverdueCandidates(
      vietnamDate(now)
    );
    const ids = candidates
      .filter((registration) => isLeaderMeetingOverdue(registration, now))
      .map((registration) => registration.id);
    if (ids.length === 0) return { transitioned: 0 };
    const result = await LeaderMeetingRegistrationRepository.markOverdue(ids, now);
    return { transitioned: result.count };
  },

  async startDueApprovedRegistrations(now = new Date()) {
    const candidates =
      await LeaderMeetingRegistrationRepository.findAutoProcessCandidates(vietnamDate(now));
    const ids = candidates
      .filter((registration) => isLeaderMeetingReadyToProcess(registration, now))
      .map((registration) => registration.id);
    if (ids.length === 0) return { transitioned: 0 };
    const result = await LeaderMeetingRegistrationRepository.markInProgress(ids, now);
    return { transitioned: result.count };
  },

  async getNextStatusTransitionAt(now = new Date()) {
    const fromDate = vietnamDate(now);
    const [pending, approved] = await Promise.all([
      LeaderMeetingRegistrationRepository.findOverdueCandidates(fromDate),
      LeaderMeetingRegistrationRepository.findAutoProcessCandidates(fromDate),
    ]);
    const candidates = [
      ...pending.map((registration) =>
        getLeaderMeetingGraceDeadline(
          registration.ngay_hen,
          registration.khung_gio_gap_lanh_dao?.gio_bat_dau
        )
      ),
      ...approved.map((registration) =>
        getLeaderMeetingStartTime(
          registration.ngay_hen,
          registration.khung_gio_gap_lanh_dao?.gio_bat_dau
        )
      ),
    ].filter((time) => time && time > now);

    return candidates.length > 0
      ? new Date(Math.min(...candidates.map((time) => time.getTime())))
      : null;
  },

  async create(input, files = {}) {
    const now = new Date();
    const attachments = buildAttachments(files);

    for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
      try {
        const result = await LeaderMeetingRegistrationRepository.createWithGuards({
          slotId: input.slotId,
          phoneNumber: input.phoneNumber,
          citizenId: input.citizenId,
          currentDate: vietnamDate(now),
          currentTime: vietnamTime(now),
          attachments,
          data: {
            ma_dang_ky: createCode(),
            ho_ten: input.fullName,
            sdt: input.phoneNumber,
            cccd: input.citizenId,
            ngay_cap_cccd: input.citizenIdIssuedDate
              ? new Date(`${input.citizenIdIssuedDate}T00:00:00.000Z`)
              : null,
            noi_cap_cccd: input.citizenIdIssuedPlace || null,
            dia_chi: input.address,
            ngay_lam_don: new Date(`${input.applicationDate}T00:00:00.000Z`),
            ly_do: input.reason,
            trang_thai: "PENDING",
          },
        });

        if (result.conflict) {
          const [statusCode, message] = conflictMessages[result.conflict];
          throw new BaseError(statusCode, message);
        }

        return mapCreated(result);
      } catch (error) {
        const uniqueConflict = mapUniqueConflict(error);
        if (uniqueConflict) {
          throw new BaseError(...conflictMessages[uniqueConflict]);
        }
        if (error?.code === "P2034") {
          if (attempt === MAX_RETRIES - 1) {
            throw new BaseError(
              503,
              "Hệ thống đang xử lý nhiều đăng ký cùng lúc, vui lòng thử lại"
            );
          }
          continue;
        }
        if (error?.code === "P2002") {
          if (attempt === MAX_RETRIES - 1) {
            throw new BaseError(500, "Không thể tạo mã đăng ký gặp lãnh đạo");
          }
          continue;
        }
        throw error;
      }
    }

    throw new BaseError(500, "Không thể tạo mã đăng ký gặp lãnh đạo");
  },

  async lookup(input) {
    const registrations =
      await LeaderMeetingRegistrationRepository.findForCitizenLookup({
        registrationCode: input.registrationCode?.toUpperCase(),
        phoneNumber: input.phoneNumber,
      });
    if (registrations.length === 0) {
      throw new BaseError(404, "Không tìm thấy đăng ký gặp lãnh đạo");
    }
    return registrations.map(mapCitizenLookup);
  },

  async getManagementRegistrations(filters, currentUser) {
    if (filters.fromDate && filters.toDate && filters.fromDate > filters.toDate) {
      throw new BaseError(400, "Ngày bắt đầu không được sau ngày kết thúc");
    }
    const canViewAll = hasPermission(currentUser, PERMISSION.LMR_GET_ALL);
    const result = await LeaderMeetingRegistrationRepository.findManagement({
      ...filters,
      leaderId: canViewAll ? (filters.leaderId || undefined) : currentUser.userId,
    });
    return {
      data: result.data.map(mapManagementListItem),
      pagination: createPagination(filters.page, filters.limit, result.totalItems),
    };
  },

  async getManagementDetail(id, currentUser) {
    const canViewAll = hasPermission(currentUser, PERMISSION.LMR_GET_ALL);
    const registration =
      await LeaderMeetingRegistrationRepository.findManagementDetail(
        id,
        canViewAll ? undefined : currentUser.userId
      );
    if (!registration) {
      throw new BaseError(404, "Đăng ký gặp lãnh đạo không tồn tại");
    }
    return mapManagementDetail(registration);
  },

  async approve(id, currentUser) {
    const registration =
      await LeaderMeetingRegistrationRepository.findManagementDetail(
        id,
        currentUser.userId
      );
    if (!registration) {
      throw new BaseError(
        404,
        "Đăng ký gặp lãnh đạo không tồn tại hoặc không thuộc lịch của bạn"
      );
    }
    if (registration.trang_thai !== TRANG_THAI_GAP_LANH_DAO.PENDING) {
      throw new BaseError(409, "Chỉ đăng ký đang chờ mới được phê duyệt");
    }
    if (isLeaderMeetingOverdue(registration)) {
      await LeaderMeetingRegistrationRepository.markOverdue([id], new Date());
      throw new BaseError(409, "Đăng ký đã quá hạn, không thể phê duyệt");
    }

    const updated = await LeaderMeetingRegistrationRepository.approvePending(
      id,
      currentUser.userId,
      {
        trang_thai: TRANG_THAI_GAP_LANH_DAO.APPROVED,
        nguoi_duyet_don: currentUser.userId,
        nguoi_cap_nhat: currentUser.userId,
        thoi_gian_phe_duyet: new Date(),
        thoi_gian_cap_nhat: new Date(),
      }
    );
    if (!updated) {
      throw new BaseError(409, "Đăng ký đã được xử lý bởi yêu cầu khác");
    }
    refreshLeaderMeetingStatusSchedule();
    return mapManagementDetail(updated);
  },

  async reject(id, input, currentUser) {
    const registration =
      await LeaderMeetingRegistrationRepository.findManagementDetail(
        id,
        currentUser.userId
      );
    if (!registration) {
      throw new BaseError(
        404,
        "Đăng ký gặp lãnh đạo không tồn tại hoặc không thuộc lịch của bạn"
      );
    }
    if (registration.trang_thai !== TRANG_THAI_GAP_LANH_DAO.PENDING) {
      throw new BaseError(409, "Chỉ đăng ký đang chờ mới được từ chối");
    }

    const now = new Date();
    const updated = await LeaderMeetingRegistrationRepository.rejectPending(
      id,
      currentUser.userId,
      {
        trang_thai: TRANG_THAI_GAP_LANH_DAO.REJECTED,
        ly_do_tu_choi: input.reason,
        nguoi_tu_choi: currentUser.userId,
        nguoi_cap_nhat: currentUser.userId,
        thoi_gian_tu_choi: now,
        thoi_gian_cap_nhat: now,
      }
    );
    if (!updated) {
      throw new BaseError(409, "Đăng ký đã được xử lý bởi yêu cầu khác");
    }
    return mapManagementDetail(updated);
  },

  async process(id, input, currentUser) {
    const registration =
      await LeaderMeetingRegistrationRepository.findManagementDetail(
        id,
        currentUser.userId
      );
    if (!registration) {
      throw new BaseError(
        404,
        "Đăng ký gặp lãnh đạo không tồn tại hoặc không thuộc lịch của bạn"
      );
    }
    if (registration.trang_thai !== TRANG_THAI_GAP_LANH_DAO.APPROVED) {
      throw new BaseError(
        409,
        "Chỉ đăng ký đã được phê duyệt mới được bắt đầu xử lý"
      );
    }
    if (isLeaderMeetingOverdue(registration)) {
      await LeaderMeetingRegistrationRepository.markOverdue([id], new Date());
      throw new BaseError(409, "Đăng ký đã quá hạn, không thể bắt đầu xử lý");
    }

    const now = new Date();
    const updated = await LeaderMeetingRegistrationRepository.processApproved(
      id,
      currentUser.userId,
      {
        trang_thai: TRANG_THAI_GAP_LANH_DAO.IN_PROGRESS,
        ghi_chu_xu_ly: input.note || null,
        nguoi_bat_dau_xu_ly: currentUser.userId,
        nguoi_cap_nhat: currentUser.userId,
        thoi_gian_bat_dau_xu_ly: now,
        thoi_gian_cap_nhat: now,
      }
    );
    if (!updated) {
      throw new BaseError(409, "Đăng ký đã được xử lý bởi yêu cầu khác");
    }
    return mapManagementDetail(updated);
  },

  async complete(id, input, currentUser) {
    const registration =
      await LeaderMeetingRegistrationRepository.findManagementDetail(
        id,
        currentUser.userId
      );
    if (!registration) {
      throw new BaseError(
        404,
        "Đăng ký gặp lãnh đạo không tồn tại hoặc không thuộc lịch của bạn"
      );
    }
    if (registration.trang_thai !== TRANG_THAI_GAP_LANH_DAO.IN_PROGRESS) {
      throw new BaseError(
        409,
        "Chỉ đăng ký đang xử lý mới được hoàn thành"
      );
    }

    if (!input.note || !input.note.trim()) {
      throw new BaseError(400, "Vui lòng nhập kết quả xử lý của buổi gặp lãnh đạo");
    }

    const now = new Date();
    const currentVnDate = vietnamDate(now);
    const currentVnTime = vietnamTime(now);
    const meetingDate = registration.ngay_hen
      ? vietnamDate(registration.ngay_hen)
      : "";
    const slotStart =
      registration.khung_gio_gap_lanh_dao?.gio_bat_dau || "00:00";

    if (
      meetingDate > currentVnDate ||
      (meetingDate === currentVnDate && slotStart > currentVnTime)
    ) {
      const formattedDate = registration.ngay_hen
        ? new Date(registration.ngay_hen).toLocaleDateString("vi-VN")
        : meetingDate;
      throw new BaseError(
        400,
        `Chưa đến thời gian của ca gặp lãnh đạo (${slotStart} ngày ${formattedDate}), không thể xác nhận tiếp xong!`
      );
    }

    const updated =
      await LeaderMeetingRegistrationRepository.completeInProgress(
        id,
        currentUser.userId,
        {
          trang_thai: TRANG_THAI_GAP_LANH_DAO.COMPLETED,
          ghi_chu_hoan_thanh: input.note.trim(),
          nguoi_hoan_thanh: currentUser.userId,
          nguoi_cap_nhat: currentUser.userId,
          thoi_gian_hoan_thanh: now,
          thoi_gian_cap_nhat: now,
        }
      );
    if (!updated) {
      throw new BaseError(409, "Đăng ký đã được xử lý bởi yêu cầu khác");
    }
    return { ...mapManagementDetail(updated), ratingEligible: true };
  },

  async cancel(id, input, currentUser) {
    const registration = await LeaderMeetingRegistrationRepository.findManagementDetail(
      id,
      currentUser.userId
    );
    if (!registration) {
      throw new BaseError(404, "Đăng ký gặp lãnh đạo không tồn tại hoặc không thuộc lịch của bạn");
    }
    if (registration.trang_thai !== TRANG_THAI_GAP_LANH_DAO.APPROVED) {
      throw new BaseError(409, "Chỉ đăng ký đã được duyệt mới được hủy");
    }
    const now = new Date();
    const updated = await LeaderMeetingRegistrationRepository.cancelApproved(
      id,
      currentUser.userId,
      {
        trang_thai: TRANG_THAI_GAP_LANH_DAO.CANCELED,
        ly_do_huy: input.reason,
        nguoi_huy: currentUser.userId,
        nguoi_cap_nhat: currentUser.userId,
        thoi_gian_huy: now,
        thoi_gian_cap_nhat: now,
      }
    );
    if (!updated) throw new BaseError(409, "Đăng ký đã được xử lý bởi yêu cầu khác");
    return mapManagementDetail(updated);
  },

  async getAttachment(registrationId, attachmentId, download, currentUser) {
    const canViewAll = hasPermission(currentUser, PERMISSION.LMR_GET_ALL);
    const attachment = await LeaderMeetingRegistrationRepository.findAttachment(
      registrationId,
      attachmentId,
      canViewAll ? undefined : currentUser.userId
    );
    if (!attachment) {
      throw new BaseError(404, "Tệp đính kèm không tồn tại hoặc ngoài phạm vi truy cập");
    }
    if (
      download &&
      ["CCCD_FRONT", "CCCD_BACK"].includes(attachment.loai_dinh_kem)
    ) {
      throw new BaseError(403, "Ảnh CCCD chỉ được xem trực tiếp, không được tải xuống");
    }

    const fullPath = path.resolve(process.cwd(), attachment.duong_dan_file);
    if (
      fullPath !== PRIVATE_UPLOAD_ROOT &&
      !fullPath.startsWith(`${PRIVATE_UPLOAD_ROOT}${path.sep}`)
    ) {
      throw new BaseError(404, "Tệp đính kèm không hợp lệ");
    }
    try {
      await fs.promises.access(fullPath, fs.constants.R_OK);
    } catch {
      throw new BaseError(404, "Nội dung tệp đính kèm không tồn tại");
    }

    return {
      fullPath,
      originalName: path.basename(attachment.ten_file_goc).replace(/[\r\n"]/g, "_"),
      mimeType: attachment.mime_type || "application/octet-stream",
      size: attachment.kich_thuoc,
      disposition:
        download && attachment.loai_dinh_kem === "SUPPORTING_DOCUMENT"
          ? "attachment"
          : "inline",
    };
  },
};

export default LeaderMeetingRegistrationService;
