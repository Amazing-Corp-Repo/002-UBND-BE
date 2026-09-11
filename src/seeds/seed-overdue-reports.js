import "dotenv/config";
import prisma from "../config/database.config.js";

export const seedOverdueReports = async () => {
  try {
    console.log("🌱 Starting seed overdue reports...");

    // 1. Lấy danh sách Lĩnh vực phản ánh có sẵn
    const linhVucList = await prisma.linh_vuc_phan_anh.findMany({ take: 5 });
    if (!linhVucList || linhVucList.length === 0) {
      console.log("⚠️ Không tìm thấy Lĩnh vực phản ánh trong DB. Hủy seed.");
      return;
    }

    const defaultLinhVucId = linhVucList[0].id;
    const secondLinhVucId = linhVucList[1]?.id || defaultLinhVucId;

    // 2. Tạo mốc thời gian quá hạn (3 ngày trước và 5 ngày trước)
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const overdueData = [
      {
        ma_phan_anh: `OVD88001`,
        tieu_de: "Hư hỏng mố cầu bê tông đường KP 02 gây sụt lở nghiêm trọng",
        mo_ta: "Mố cầu bị sụt lở sau mưa lớn, chuyên viên đã xuống khảo sát nhưng trễ hạn xử lý do chờ vật tư gia cố.",
        muc_do: "Khẩn cấp",
        khu_pho: "KP 02",
        vi_tri: "Cầu Tổ 4, Khu phố 2",
        id_linh_vuc_phan_anh: defaultLinhVucId,
        ngay_du_kien_hoan_thanh: threeDaysAgo,
        ten_nguoi_phan_anh: "Nguyễn Văn Hùng",
        sdt_nguoi_phan_anh: "0908123456",
        thoi_gian_tao: sevenDaysAgo,
        is_approve: true,
        id_video: [],
        id_video_giai_quyet: [],
        lich_su_trang_thai: {
          create: [
            {
              ten: "Đã gửi",
              ghi_chu: "Người dân gửi phản ánh qua ứng dụng",
              thoi_gian_tao: sevenDaysAgo,
            },
            {
              ten: "Đang xử lý",
              ghi_chu: "Đã phân công bộ phận chuyên môn xuống hiện trường kiểm tra",
              thoi_gian_tao: fiveDaysAgo,
            },
          ],
        },
      },
      {
        ma_phan_anh: `OVD88002`,
        tieu_de: "Tắc nghẽn hệ thống thoát nước gây ngập cục bộ tại KP 05",
        mo_ta: "Tuyến đường chính KP 05 bị ngập sâu 40cm mỗi khi mưa, quá hạn giải quyết do cần điều máy hút công suất lớn.",
        muc_do: "Thông thường",
        khu_pho: "KP 05",
        vi_tri: "Số 120 Đường 14, Khu phố 5",
        id_linh_vuc_phan_anh: secondLinhVucId,
        ngay_du_kien_hoan_thanh: fiveDaysAgo,
        ten_nguoi_phan_anh: "Trần Thị Mai",
        sdt_nguoi_phan_anh: "0918987654",
        thoi_gian_tao: sevenDaysAgo,
        is_approve: true,
        id_video: [],
        id_video_giai_quyet: [],
        lich_su_trang_thai: {
          create: [
            {
              ten: "Đã gửi",
              ghi_chu: "Người dân phản ánh sự cố ngập nước",
              thoi_gian_tao: sevenDaysAgo,
            },
            {
              ten: "Đang xử lý",
              ghi_chu: "Chuyên viên đô thị đang phối hợp với công ty môt trường xử lý",
              thoi_gian_tao: fiveDaysAgo,
            },
          ],
        },
      },
      {
        ma_phan_anh: `OVD88003`,
        tieu_de: "Cây xanh cổ thụ gãy nhánh có nguy cơ sập đường dây điện KP 01",
        mo_ta: "Cây xanh có nhánh lớn bị tét nát sau bão, quá hạn xử lý do chưa phối hợp được với Điện lực cắt điện.",
        muc_do: "Khẩn cấp",
        khu_pho: "KP 01",
        vi_tri: "Đối diện UBND Khu phố 1",
        id_linh_vuc_phan_anh: defaultLinhVucId,
        ngay_du_kien_hoan_thanh: threeDaysAgo,
        ten_nguoi_phan_anh: "Lê Hoàng Nam",
        sdt_nguoi_phan_anh: "0933456789",
        thoi_gian_tao: fiveDaysAgo,
        is_approve: true,
        id_video: [],
        id_video_giai_quyet: [],
        lich_su_trang_thai: {
          create: [
            {
              ten: "Đã gửi",
              ghi_chu: "Gửi phản ánh nguy cơ mất an toàn cây xanh",
              thoi_gian_tao: fiveDaysAgo,
            },
            {
              ten: "Đang xử lý",
              ghi_chu: "Đã giăng dây cảnh báo hiện trường và lên lịch cắt tỉa",
              thoi_gian_tao: threeDaysAgo,
            },
          ],
        },
      },
    ];

    for (const report of overdueData) {
      // Upsert or create
      const created = await prisma.phan_anh.upsert({
        where: { ma_phan_anh: report.ma_phan_anh },
        update: {
          tieu_de: report.tieu_de,
          mo_ta: report.mo_ta,
          muc_do: report.muc_do,
          khu_pho: report.khu_pho,
          vi_tri: report.vi_tri,
          ngay_du_kien_hoan_thanh: report.ngay_du_kien_hoan_thanh,
          ten_nguoi_phan_anh: report.ten_nguoi_phan_anh,
          sdt_nguoi_phan_anh: report.sdt_nguoi_phan_anh,
        },
        create: report,
        include: {
          lich_su_trang_thai: true,
        },
      });
      console.log(`✅ Seeded Overdue Report: [${created.ma_phan_anh}] ${created.tieu_de}`);
    }

    console.log("🎉 Seed overdue reports completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding overdue reports:", error);
  }
};

export const cleanOverdueReports = async () => {
  try {
    console.log("🧹 Starting clean overdue reports...");
    // 1. Tìm danh sách ID các phản ánh có mã PA-OVERDUE- hoặc OVD
    const overdueReports = await prisma.phan_anh.findMany({
      where: {
        OR: [
          { ma_phan_anh: { startsWith: "PA-OVERDUE-" } },
          { ma_phan_anh: { startsWith: "OVD" } },
        ],
      },
      select: { id: true, ma_phan_anh: true },
    });

    const reportIds = overdueReports.map((r) => r.id);

    if (reportIds.length === 0) {
      console.log("ℹ️ Không tìm thấy phản ánh PA-OVERDUE- hoặc OVD nào trong DB để xóa.");
      return { count: 0 };
    }

    // 2. Xóa các bản ghi liên quan ở bảng de_nghi_gia_han_phan_anh
    await prisma.de_nghi_gia_han_phan_anh.deleteMany({
      where: { id_phan_anh: { in: reportIds } },
    });

    // 3. Xóa các bản ghi liên quan ở bảng lich_su_trang_thai
    await prisma.lich_su_trang_thai.deleteMany({
      where: { id_phan_anh: { in: reportIds } },
    });

    // 4. Xóa các bản ghi liên quan ở bảng dinh_kem_phan_anh
    if (prisma.dinh_kem_phan_anh) {
      await prisma.dinh_kem_phan_anh.deleteMany({
        where: { id_phan_anh: { in: reportIds } },
      });
    }

    // 5. Xóa các phản ánh trong phan_anh
    const deletedCount = await prisma.phan_anh.deleteMany({
      where: { id: { in: reportIds } },
    });

    console.log(`✅ Cleaned ${deletedCount.count} overdue reports (OVD* / PA-OVERDUE-*).`);
    return deletedCount;
  } catch (error) {
    console.error("❌ Error cleaning overdue reports:", error);
  }
};


// Nếu chạy trực tiếp script bằng node
if (process.argv[1].includes("seed-overdue-reports")) {
  const isClean = process.argv.includes("--clean") || process.argv.includes("clean");
  if (isClean) {
    cleanOverdueReports()
      .then(() => process.exit(0))
      .catch((err) => {
        console.error(err);
        process.exit(1);
      });
  } else {
    seedOverdueReports()
      .then(() => process.exit(0))
      .catch((err) => {
        console.error(err);
        process.exit(1);
      });
  }
}

