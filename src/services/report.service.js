import ReportRepository from "../repositories/report.repository.js";
import ExcelJS from "exceljs";
import {
  nowVN,
  toUTCFromVN_End,
  toUTCFromVN_Start,
  toVNDateTimeString,
} from "../utils/string.util.js";
import { createPagination } from "../utils/response.util.js";
import FileService from "./file.service.js";
import PHAN_ANH_STATUS from "../constants/phan-anh-status.constant.js";
import LinhVucPhanAnhRepository from "../repositories/linh-vuc-phan-anh.repository.js";
import { BaseError } from "../utils/base-error.util.js";

const ReportService = {
  async getReportPhanAnh(fromRaw, toRaw, idLinhVuc) {
    const from = fromRaw ? toUTCFromVN_Start(fromRaw) : null;
    const to = toRaw ? toUTCFromVN_End(toRaw) : null;

    let { phanAnh, phanAnhMoiCapNhat, linh_vuc, totalPhanAnh } =
      await ReportRepository.getReportPhanAnh(from, to, idLinhVuc);

    const xu_huong = {};
    const trang_thai = {};
    const totalCount = totalPhanAnh;
    const linh_vuc_phan_anh = {};

    for (let pa of phanAnh) {
      const vnDate = formatDate(pa.thoi_gian_tao);

      const isProcessed =
        pa.lich_su_trang_thai[0]?.ten === PHAN_ANH_STATUS.DA_GIAI_QUYET ||
        pa.lich_su_trang_thai[0]?.ten === PHAN_ANH_STATUS.DONG;

      if (!xu_huong[vnDate]) {
        xu_huong[vnDate] = { tong: 0, da_xu_ly: 0 };
      }

      if (!trang_thai[pa.lich_su_trang_thai[0]?.ten]) {
        trang_thai[pa.lich_su_trang_thai[0]?.ten] = 0;
      }

      if (!linh_vuc_phan_anh[pa.linh_vuc_phan_anh.ten]) {
        linh_vuc_phan_anh[pa.linh_vuc_phan_anh.ten] = 0;
      }

      linh_vuc_phan_anh[pa.linh_vuc_phan_anh.ten]++;

      trang_thai[pa.lich_su_trang_thai[0]?.ten]++;

      xu_huong[vnDate].tong++;
      if (isProcessed) {
        xu_huong[vnDate].da_xu_ly++;
      }
    }
    let phan_anh_moi_cap_nhat = [];
    for (let pa of phanAnhMoiCapNhat) {
      phan_anh_moi_cap_nhat.push({
        ma_phan_anh: pa.ma_phan_anh,
        tieu_de: pa.tieu_de,
        linh_vuc_phan_anh: pa.linh_vuc_phan_anh.ten,
        trang_thai_hien_tai: pa.lich_su_trang_thai[0]?.ten,
        thoi_gian_cap_nhat: pa.thoi_gian_cap_nhat,
      });
    }

    let linh_vuc_1 = {};

    for (let key of linh_vuc) {
      linh_vuc_1[key.ten] = {
        tong_phan_anh: key.phan_anh.length,
        da_xu_ly: 0,
        totalProcessingTime: 0,
      };

      let pa = key.phan_anh;

      for (let p of pa) {
        const isResolved = p.lich_su_trang_thai.some(
          (status) =>
            status.ten === PHAN_ANH_STATUS.DA_GIAI_QUYET ||
            status.ten === PHAN_ANH_STATUS.DONG
        );

        if (isResolved) {
          linh_vuc_1[key.ten].da_xu_ly++;

          const start = p.lich_su_trang_thai.find(
            (status) => status.ten === PHAN_ANH_STATUS.DANG_XU_LY
          );
          const end = p.lich_su_trang_thai.find(
            (status) =>
              status.ten === PHAN_ANH_STATUS.DA_GIAI_QUYET ||
              status.ten === PHAN_ANH_STATUS.DONG
          );

          if (start && end) {
            const timeTaken =
              new Date(end.thoi_gian_tao) - new Date(start.thoi_gian_tao);
            linh_vuc_1[key.ten].totalProcessingTime += timeTaken;
          }
        }
      }

      const avgProcessingTime =
        linh_vuc_1[key.ten].da_xu_ly > 0
          ? linh_vuc_1[key.ten].totalProcessingTime /
            linh_vuc_1[key.ten].da_xu_ly
          : 0;

      linh_vuc_1[key.ten].thoi_gian_xu_ly_tb = Number(
        avgProcessingTime / (1000 * 60 * 60)
      ).toFixed(2);

      delete linh_vuc_1[key.ten].totalProcessingTime;
      linh_vuc_1[key.ten].ty_le = Number(
        (linh_vuc_1[key.ten].tong_phan_anh / totalCount) * 100
      ).toFixed(2);

      linh_vuc_1[key.ten].chua_xu_ly =
        linh_vuc_1[key.ten].tong_phan_anh - linh_vuc_1[key.ten].da_xu_ly;
    }

    const ORDER = [
      PHAN_ANH_STATUS.DA_GUI,
      PHAN_ANH_STATUS.DANG_XU_LY,
      PHAN_ANH_STATUS.DA_GIAI_QUYET,
      PHAN_ANH_STATUS.DONG,
    ];

    const trang_thai_sorted = {};

    for (let status of ORDER) {
      if (trang_thai[status] !== undefined) {
        trang_thai_sorted[status] = trang_thai[status];
      } else {
        trang_thai_sorted[status] = 0; // Nếu chưa có thì set = 0 cho đủ key
      }
    }

    let top_5_linh_vuc_theo_phan_anh = sortLinhVucByTongPhanAnh(linh_vuc_1);

    return {
      bieu_do_tron_chi_tiet: linh_vuc_phan_anh,
      tong_phan_anh: totalCount,
      phan_bo_theo_trang_thai: trang_thai_sorted,
      xu_huong,
      phan_anh_moi_cap_nhat,
      chi_tiet_theo_linh_vuc: linh_vuc_1,
      top_5_linh_vuc_theo_phan_anh: top_5_linh_vuc_theo_phan_anh,
    };
  },

  // Báo cáo phản ánh nhận theo từng tháng (kèm chi tiết từng phản ánh).
  async getPhanAnhTheoThang(fromRaw, toRaw, idLinhVuc) {
    const from = fromRaw ? toUTCFromVN_Start(fromRaw) : null;
    const to = toRaw ? toUTCFromVN_End(toRaw) : null;

    const danhSach = await ReportRepository.getPhanAnhTheoThang(
      from,
      to,
      idLinhVuc,
    );

    // Nhóm theo tháng (YYYY-MM theo giờ VN).
    const map = {};
    for (const pa of danhSach) {
      const thang = formatMonth(pa.thoi_gian_tao);
      if (!map[thang]) {
        map[thang] = { thang, tong: 0, danh_sach: [] };
      }
      map[thang].tong++;
      map[thang].danh_sach.push({
        ma_phan_anh: pa.ma_phan_anh,
        tieu_de: pa.tieu_de,
        linh_vuc_phan_anh: pa.linh_vuc_phan_anh?.ten || null,
        muc_do: pa.muc_do,
        vi_tri: pa.vi_tri,
        trang_thai_hien_tai: pa.lich_su_trang_thai[0]?.ten || null,
        thoi_gian_tao: pa.thoi_gian_tao,
      });
    }

    // Sắp xếp tháng mới nhất trước.
    const theo_thang = Object.values(map).sort((a, b) =>
      b.thang.localeCompare(a.thang),
    );

    return { tong_phan_anh: danhSach.length, theo_thang };
  },

  async getReportThuTuc(fromRaw, toRaw) {
    const from = fromRaw ? toUTCFromVN_Start(fromRaw) : null;
    const to = toRaw ? toUTCFromVN_End(toRaw) : null;

    let { linhVuc, totalThuTuc, totalThuTucCoMauDon } =
      await ReportRepository.getReportThuTuc(from, to);

    let linh_vuc = {};
    for (let thuTuc of linhVuc) {
      for (const item of thuTuc.thu_tuc_hanh_chinh_linh_vuc) {
        const ten = item.linh_vuc.ten_linh_vuc;

        if (!linh_vuc[ten]) {
          linh_vuc[ten] = { count: 0 };
        }

        linh_vuc[ten].count++;
      }
    }

    for (const key in linh_vuc) {
      linh_vuc[key].percent = (
        (linh_vuc[key].count / totalThuTuc) *
        100
      ).toFixed(2);
    }

    return {
      thu_tuc_linh_vuc: linh_vuc,
      tong_thu_tuc: totalThuTuc,
      thu_tuc_co_mau_don: totalThuTucCoMauDon,
      thu_tuc_khong_mau_don: totalThuTuc - totalThuTucCoMauDon,
    };
  },

  async getReportTinTuc(fromRaw, toRaw) {
    const from = fromRaw ? toUTCFromVN_Start(fromRaw) : null;
    const to = toRaw ? toUTCFromVN_End(toRaw) : null;

    let { tinTucLists } = await ReportRepository.getReportTinTuc(from, to);
    const result = {};
    for (const item of tinTucLists) {
      const day = formatDate(item.thoi_gian_tao);

      if (!result[day]) {
        result[day] = {
          tong: 0,
          da_xuat_ban: 0,
          ban_nhap: 0,
          luot_xem: 0,
        };
      }

      result[day].tong++;
      result[day].luot_xem += item._count.tin_tuc_view;

      if (item.is_active === true) {
        result[day].da_xuat_ban++;
      } else {
        result[day].ban_nhap++;
      }
    }
    return result;
  },

  async exportReportPhanAnh(fromRaw, toRaw, idLinhVuc) {
    const data = await this.getReportPhanAnh(fromRaw, toRaw, idLinhVuc);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Báo cáo");

    let rowIndex = 2;

    // HEADER “Thông tin báo cáo”

    sheet.mergeCells(rowIndex, 1, rowIndex + 3, 1);
    const box = sheet.getCell(rowIndex, 1);
    box.value = "Thông tin báo cáo";
    box.font = { bold: true, size: 13 };
    box.alignment = { horizontal: "center", vertical: "middle" };

    sheet.getCell(rowIndex, 2).value = "Ngày xuất báo cáo";
    sheet.getCell(rowIndex, 2).font = { bold: true };
    sheet.getCell(rowIndex, 3).value = nowVN().split(" ")[0];

    sheet.getCell(rowIndex + 1, 2).value = "Khoảng thời gian lọc";
    sheet.getCell(rowIndex + 1, 2).font = { bold: true };

    sheet.getCell(rowIndex + 2, 2).value = "Từ ngày";
    sheet.getCell(rowIndex + 2, 2).font = { italic: true };
    sheet.getCell(rowIndex + 2, 3).value = fromRaw || "Lấy tất cả";

    sheet.getCell(rowIndex + 3, 2).value = "Đến ngày";
    sheet.getCell(rowIndex + 3, 2).font = { italic: true };
    sheet.getCell(rowIndex + 3, 3).value = toRaw || "Lấy tất cả";

    if (idLinhVuc) {
      let tenLinhVuc = await LinhVucPhanAnhRepository.getTenLinhVucById(
        idLinhVuc
      );
      if (!tenLinhVuc) {
        throw new BaseError(400, "Lĩnh vực phản ánh không tồn tại");
      }
      sheet.getCell(rowIndex + 4, 2).value = "Lĩnh vực lọc";
      sheet.getCell(rowIndex + 4, 3).value = tenLinhVuc;
    }

    for (let r = rowIndex; r <= rowIndex + 4; r++) {
      for (let c = 1; c <= 3; c++) {
        sheet.getCell(r, c).border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
      }
    }

    rowIndex += 6;

    // PHÂN BỔ THEO TRẠNG THÁI

    FileService.excelStyles.sectionTitle(
      sheet,
      rowIndex,
      "Phân bố theo trạng thái"
    );
    rowIndex++;

    const headerRow = sheet.addRow(["Trạng thái", "Số lượng"]);
    FileService.excelStyles.tableHeader(headerRow);

    Object.entries(data.phan_bo_theo_trang_thai).forEach(([name, count]) => {
      const row = sheet.addRow([name, count]);
      FileService.excelStyles.tableRow(row);
    });

    rowIndex = sheet.lastRow.number + 2;

    // ============================
    // XU HƯỚNG PHẢN ÁNH
    // ============================

    FileService.excelStyles.sectionTitle(sheet, rowIndex, "Xu hướng phản ánh");
    rowIndex++;

    const trendHeader = sheet.addRow([
      "Ngày",
      "Tổng phản ánh",
      "Đã xử lý",
      "Chưa xử lý",
    ]);
    FileService.excelStyles.tableHeader(trendHeader);

    // Sort ngày ASC để biểu đồ rõ ràng
    const dates = Object.keys(data.xu_huong).sort();

    dates.forEach((day) => {
      const item = data.xu_huong[day];

      const row = sheet.addRow([
        day,
        item.tong,
        item.da_xu_ly,
        item.tong - item.da_xu_ly, // chưa xử lý
      ]);

      FileService.excelStyles.tableRow(row);
    });

    rowIndex = sheet.lastRow.number + 2;

    // CHI TIẾT THEO LĨNH VỰC

    FileService.excelStyles.sectionTitle(
      sheet,
      rowIndex,
      "Chi tiết theo lĩnh vực"
    );
    rowIndex++;

    const lvHeader = sheet.addRow([
      "Lĩnh vực",
      "Tổng",
      "Đã xử lý",
      "Chưa xử lý",
      "Tỉ lệ (%)",
      "Thời gian TB (giờ)",
    ]);
    FileService.excelStyles.tableHeader(lvHeader);

    for (let [lv, obj] of Object.entries(data.chi_tiet_theo_linh_vuc)) {
      const row = sheet.addRow([
        lv,
        obj.tong_phan_anh,
        obj.da_xu_ly,
        obj.chua_xu_ly,
        obj.ty_le,
        obj.thoi_gian_xu_ly_tb,
      ]);
      FileService.excelStyles.tableRow(row);
    }

    sheet.columns = [
      { width: 40 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 12 },
      { width: 22 },
    ];

    return await workbook.xlsx.writeBuffer();
  },

  // Danh sách chi tiết phản ánh có lọc + phân trang (cho bảng "Chi tiết phản ánh").
  async getChiTietPhanAnh(fromRaw, toRaw, idLinhVuc, trangThai, page, size) {
    const from = fromRaw ? toUTCFromVN_Start(fromRaw) : null;
    const to = toRaw ? toUTCFromVN_End(toRaw) : null;

    const { data, totalItems } = await ReportRepository.getChiTietPhanAnh(
      from,
      to,
      idLinhVuc,
      trangThai,
      page,
      size,
    );

    const list = data.map((pa) => ({
      ma_phan_anh: pa.ma_phan_anh,
      tieu_de: pa.tieu_de,
      linh_vuc_phan_anh: pa.linh_vuc,
      trang_thai_hien_tai: pa.trang_thai_hien_tai,
      thoi_gian_cap_nhat: pa.thoi_gian_cap_nhat,
    }));

    return {
      data: list,
      pagination: createPagination(page, size, totalItems),
    };
  },

  // Xuất Excel danh sách chi tiết phản ánh (đồng bộ) — lọc ngày + lĩnh vực + trạng thái.
  async exportChiTietPhanAnhExcel(fromRaw, toRaw, idLinhVuc, trangThai) {
    const from = fromRaw ? toUTCFromVN_Start(fromRaw) : null;
    const to = toRaw ? toUTCFromVN_End(toRaw) : null;

    // size = null → lấy tất cả phản ánh khớp bộ lọc.
    const { data } = await ReportRepository.getChiTietPhanAnh(
      from,
      to,
      idLinhVuc,
      trangThai,
      1,
      null,
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Chi tiết phản ánh");

    FileService.excelStyles.title(sheet, 1, "CHI TIẾT PHẢN ÁNH", 5);

    sheet.getCell(2, 1).value = "Ngày xuất";
    sheet.getCell(2, 1).font = { bold: true };
    sheet.getCell(2, 2).value = nowVN().split(" ")[0];
    sheet.getCell(3, 1).value = "Từ ngày";
    sheet.getCell(3, 1).font = { bold: true };
    sheet.getCell(3, 2).value = fromRaw || "Tất cả";
    sheet.getCell(4, 1).value = "Đến ngày";
    sheet.getCell(4, 1).font = { bold: true };
    sheet.getCell(4, 2).value = toRaw || "Tất cả";
    sheet.getCell(5, 1).value = "Trạng thái lọc";
    sheet.getCell(5, 1).font = { bold: true };
    sheet.getCell(5, 2).value = trangThai || "Tất cả";

    const headerRow = sheet.getRow(7);
    headerRow.values = [
      "STT",
      "Mã phản ánh",
      "Tiêu đề",
      "Lĩnh vực",
      "Trạng thái",
      "Ngày cập nhật",
    ];
    FileService.excelStyles.tableHeader(headerRow);

    data.forEach((pa, idx) => {
      const row = sheet.addRow([
        idx + 1,
        pa.ma_phan_anh,
        pa.tieu_de,
        pa.linh_vuc,
        pa.trang_thai_hien_tai,
        toVNDateTimeString(pa.thoi_gian_cap_nhat),
      ]);
      FileService.excelStyles.tableRow(row);
    });

    sheet.columns = [
      { width: 6 },
      { width: 16 },
      { width: 45 },
      { width: 28 },
      { width: 16 },
      { width: 22 },
    ];

    return await workbook.xlsx.writeBuffer();
  },

  async exportReportThuTuc(fromRaw, toRaw) {
    const data = await this.getReportThuTuc(fromRaw, toRaw);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Báo cáo thủ tục");

    let rowIndex = 2;

    // ============================
    // HEADER “Thông tin báo cáo”
    // ============================
    sheet.mergeCells(rowIndex, 1, rowIndex + 3, 1);
    const box = sheet.getCell(rowIndex, 1);
    box.value = "Thông tin báo cáo";
    box.font = { bold: true, size: 13 };
    box.alignment = { horizontal: "center", vertical: "middle" };

    sheet.getCell(rowIndex, 2).value = "Ngày xuất báo cáo";
    sheet.getCell(rowIndex, 2).font = { bold: true };
    sheet.getCell(rowIndex, 3).value = nowVN().split(" ")[0];

    sheet.getCell(rowIndex + 1, 2).value = "Khoảng thời gian lọc";
    sheet.getCell(rowIndex + 1, 2).font = { bold: true };

    sheet.getCell(rowIndex + 2, 2).value = "Từ ngày";
    sheet.getCell(rowIndex + 2, 3).value = fromRaw || "Lấy tất cả";

    sheet.getCell(rowIndex + 3, 2).value = "Đến ngày";
    sheet.getCell(rowIndex + 3, 3).value = toRaw || "Lấy tất cả";

    // ============================
    // EXTRA INFO CHO THỦ TỤC
    // ============================
    sheet.getCell(rowIndex + 4, 2).value = "Tổng thủ tục";
    sheet.getCell(rowIndex + 4, 3).value = data.tong_thu_tuc;

    sheet.getCell(rowIndex + 5, 2).value = "Thủ tục có mẫu đơn";
    sheet.getCell(rowIndex + 5, 3).value = data.thu_tuc_co_mau_don;

    sheet.getCell(rowIndex + 6, 2).value = "Thủ tục không mẫu đơn";
    sheet.getCell(rowIndex + 6, 3).value = data.thu_tuc_khong_mau_don;

    // border box
    for (let r = rowIndex; r <= rowIndex + 6; r++) {
      for (let c = 1; c <= 3; c++) {
        sheet.getCell(r, c).border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
      }
    }

    rowIndex += 9;

    // ============================
    // BẢNG 1: THỦ TỤC THEO LĨNH VỰC
    // ============================
    FileService.excelStyles.sectionTitle(
      sheet,
      rowIndex,
      "Thủ tục theo lĩnh vực"
    );
    rowIndex++;

    const headerRow = sheet.addRow(["Lĩnh vực", "Số thủ tục", "Tỉ lệ (%)"]);
    FileService.excelStyles.tableHeader(headerRow);

    for (let [lv, obj] of Object.entries(data.thu_tuc_linh_vuc)) {
      const row = sheet.addRow([lv, obj.count, obj.percent]);
      FileService.excelStyles.tableRow(row);
    }

    sheet.columns = [{ width: 40 }, { width: 20 }, { width: 15 }];

    return await workbook.xlsx.writeBuffer();
  },

  async exportReportTinTuc(fromRaw, toRaw) {
    const data = await this.getReportTinTuc(fromRaw, toRaw);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Báo cáo tin tức");

    let rowIndex = 2;

    // ============================
    // HEADER “Thông tin báo cáo”
    // ============================
    sheet.mergeCells(rowIndex, 1, rowIndex + 3, 1);
    const box = sheet.getCell(rowIndex, 1);
    box.value = "Thông tin báo cáo";
    box.font = { bold: true, size: 13 };
    box.alignment = { horizontal: "center", vertical: "middle" };

    sheet.getCell(rowIndex, 2).value = "Ngày xuất báo cáo";
    sheet.getCell(rowIndex, 2).font = { bold: true };
    sheet.getCell(rowIndex, 3).value = nowVN().split(" ")[0];

    sheet.getCell(rowIndex + 1, 2).value = "Khoảng thời gian lọc";
    sheet.getCell(rowIndex + 1, 2).font = { bold: true };

    sheet.getCell(rowIndex + 2, 2).value = "Từ ngày";
    sheet.getCell(rowIndex + 2, 3).value = fromRaw || "Lấy tất cả";

    sheet.getCell(rowIndex + 3, 2).value = "Đến ngày";
    sheet.getCell(rowIndex + 3, 3).value = toRaw || "Lấy tất cả";

    // border
    for (let r = rowIndex; r <= rowIndex + 3; r++) {
      for (let c = 1; c <= 3; c++) {
        sheet.getCell(r, c).border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
      }
    }

    rowIndex += 6;

    // ============================
    // BẢNG THỐNG KÊ TIN TỨC
    // ============================
    FileService.excelStyles.sectionTitle(sheet, rowIndex, "Thống kê tin tức");
    rowIndex++;

    const headerRow = sheet.addRow([
      "Ngày",
      "Tổng tin",
      "Đã xuất bản",
      "Bản nháp",
      "Lượt xem",
    ]);
    FileService.excelStyles.tableHeader(headerRow);

    const sortedDates = Object.keys(data).sort();

    sortedDates.forEach((day) => {
      const item = data[day];
      const row = sheet.addRow([
        day,
        item.tong,
        item.da_xuat_ban,
        item.ban_nhap,
        item.luot_xem,
      ]);
      FileService.excelStyles.tableRow(row);
    });

    sheet.columns = [
      { width: 15 }, // ngày
      { width: 12 }, // tổng
      { width: 15 }, // xuất bản
      { width: 12 }, // bản nháp
      { width: 12 }, // lượt xem
    ];

    return await workbook.xlsx.writeBuffer();
  },
};

const formatDate = (date) => {
  let toVN = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return toVN.toISOString().split("T")[0];
};

const formatMonth = (date) => {
  let toVN = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return toVN.toISOString().slice(0, 7); // YYYY-MM
};

const sortLinhVucByTongPhanAnh = (linhVuc) => {
  const items = Object.entries(linhVuc).map(([key, value]) => ({
    ten_linh_vuc: key,
    ...value,
  }));

  items.sort((a, b) => b.tong_phan_anh - a.tong_phan_anh);

  return items.slice(0, 5);
};

export default ReportService;
