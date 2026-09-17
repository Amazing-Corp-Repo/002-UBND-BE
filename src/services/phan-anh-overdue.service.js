import prisma from "../config/database.config.js";
import PHAN_ANH_STATUS from "../constants/phan-anh-status.constant.js";

let isScanning = false;

const PhanAnhOverdueService = {
  async markOverdueComplaints(now = new Date()) {
    if (isScanning) {
      return { count: 0, skipped: true };
    }

    isScanning = true;
    try {
      // Tìm các phản ánh có hạn xử lý <= now
      const candidates = await prisma.phan_anh.findMany({
        where: {
          ngay_du_kien_hoan_thanh: {
            not: null,
            lte: now,
          },
        },
        select: {
          id: true,
          ma_phan_anh: true,
          ngay_du_kien_hoan_thanh: true,
          lich_su_trang_thai: {
            orderBy: {
              thoi_gian_tao: "desc",
            },
            take: 2,
            select: {
              ten: true,
              thoi_gian_tao: true,
            },
          },
        },
      });

      const FINISHED_STATUSES = [
        PHAN_ANH_STATUS.DA_GIAI_QUYET,
        PHAN_ANH_STATUS.DONG,
        PHAN_ANH_STATUS.TU_CHOI,
      ];

      const toMarkOverdue = candidates.filter((item) => {
        const history = item.lich_su_trang_thai || [];
        const latestHistory = history[0];

        // Nếu đã hoàn thành / đóng / từ chối -> không ghi quá hạn
        if (latestHistory && FINISHED_STATUSES.includes(latestHistory.ten)) {
          return false;
        }

        // Nếu mốc mới nhất đã là "Quá hạn" -> không ghi trùng
        if (latestHistory && latestHistory.ten === PHAN_ANH_STATUS.QUA_HAN) {
          return false;
        }

        // Nếu đang "Xin gia hạn" mà trước đó vừa ghi "Quá hạn" -> không ghi lại
        if (latestHistory && latestHistory.ten === PHAN_ANH_STATUS.XIN_GIA_HAN) {
          const secondLatest = history[1];
          if (secondLatest && secondLatest.ten === PHAN_ANH_STATUS.QUA_HAN) {
            return false;
          }
        }

        return true;
      });

      if (toMarkOverdue.length === 0) {
        return { count: 0 };
      }

      // Ghi nhận mốc Quá hạn dạng Batch Transaction
      const historyRecords = toMarkOverdue.map((item) => {
        const latestTime = item.lich_su_trang_thai?.[0]?.thoi_gian_tao;
        let recordTime = now;
        if (latestTime && new Date(latestTime).getTime() >= now.getTime()) {
          recordTime = new Date(new Date(latestTime).getTime() + 1000);
        }
        return {
          id_phan_anh: item.id,
          ten: PHAN_ANH_STATUS.QUA_HAN,
          ghi_chu: "Phản ánh đã vượt quá thời hạn xử lý cam kết",
          thoi_gian_tao: recordTime,
        };
      });

      await prisma.lich_su_trang_thai.createMany({
        data: historyRecords,
      });

      return { count: toMarkOverdue.length, ids: toMarkOverdue.map((i) => i.id) };

    } catch (error) {
      console.error("[PhanAnhOverdueService] Lỗi quét đơn quá hạn:", error);
      throw error;
    } finally {
      isScanning = false;
    }
  },
};

export default PhanAnhOverdueService;
