import ReportRepository from "../repositories/report.repository.js";
import ExcelJS from "exceljs";
import { convertBigInt } from "../utils/number.util.js";
import {
  nowVN,
  toUTCFromVN_End,
  toUTCFromVN_Start,
} from "../utils/string.util.js";
import FileService from "./file.service.js";
import PHAN_ANH_STATUS from "../constants/phan-anh-status.constant.js";

const ReportService = {
  async getBaoCaoTongHop(from, to) {
    from = from ? toUTCFromVN_Start(from) : null;
    to = to ? toUTCFromVN_End(to) : null;
    const report = await ReportRepository.getBaoCaoTongHop({ from, to });

    if (!report) return null;
    report.thoi_gian_xu_ly_tb = Number(
      Number(report.thoi_gian_xu_ly_tb || 0).toFixed(2)
    );
    return convertBigInt(report);
  },

  async exportBaoCaoTongHopExcel(from, to) {
    const data = await this.getBaoCaoTongHop(from, to);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Báo cáo tổng hợp");

    let rowIndex = 1;

    FileService.excelStyles.title(sheet, rowIndex++, "BÁO CÁO TỔNG HỢP");

    rowIndex++; // spacing

    FileService.excelStyles.sectionTitle(
      sheet,
      rowIndex++,
      "Thông tin báo cáo"
    );

    const info = [
      ["Ngày xuất báo cáo", nowVN()],
      ["Từ ngày", from || "Tất cả"],
      ["Đến ngày", to || "Tất cả"],
    ];

    info.forEach((row) => FileService.excelStyles.tableRow(sheet.addRow(row)));

    rowIndex = sheet.lastRow.number + 2;

    // ===== SECTION: TỔNG QUAN =====
    FileService.excelStyles.sectionTitle(
      sheet,
      rowIndex++,
      "Tổng quan phản ánh"
    );

    const overview = [
      ["Tổng số phản ánh", data.tong_phan_anh],
      ["Chưa xử lý", data.chua_xu_ly],
      ["Đã xử lý", data.da_xu_ly],
      ["Thời gian xử lý TB (ngày)", data.thoi_gian_xu_ly_tb],
    ];

    overview.forEach((r) => FileService.excelStyles.tableRow(sheet.addRow(r)));

    rowIndex = sheet.lastRow.number + 2;

    // ===== SECTION: TOP 5 LĨNH VỰC =====
    FileService.excelStyles.sectionTitle(
      sheet,
      rowIndex++,
      "Top 5 lĩnh vực được quan tâm"
    );

    const header = [
      "Lĩnh vực",
      ...data.top_5_linh_vuc.map((x) => x.ten_linh_vuc),
    ];
    const values = [
      "Số lượng phản ánh",
      ...data.top_5_linh_vuc.map((x) => x.so_luong),
    ];

    let hRow = sheet.addRow(header);
    FileService.excelStyles.tableHeader(hRow);

    let vRow = sheet.addRow(values);
    FileService.excelStyles.tableRow(vRow);

    FileService.excelStyles.autoFit(sheet);

    return workbook.xlsx.writeBuffer();
  },

  async getBaoCaoLinhVuc(fromRaw, toRaw) {
    const from = fromRaw ? toUTCFromVN_Start(fromRaw) : null;
    const to = toRaw ? toUTCFromVN_End(toRaw) : null;

    const rows = await ReportRepository.getBaoCaoLinhVuc({ from, to });

    if (!rows.length) return [];

    const map = {};

    for (const r of rows) {
      const key = r.ten_linh_vuc || "Khác";

      if (!map[key]) {
        map[key] = {
          ten_linh_vuc: key,
          tong_phan_anh: 0,
          da_xu_ly: 0,
          chua_xu_ly: 0,
          thoi_gian_xu_ly_tb_ngay_arr: [],
        };
      }

      map[key].tong_phan_anh++;

      if (r.is_da_xu_ly) {
        map[key].da_xu_ly++;
        if (r.ngay_xu_ly !== null)
          map[key].thoi_gian_xu_ly_tb_ngay_arr.push(Number(r.ngay_xu_ly));
      } else {
        map[key].chua_xu_ly++;
      }
    }

    const result = Object.values(map);

    const total = result.reduce((sum, e) => sum + e.tong_phan_anh, 0);

    for (const e of result) {
      const avg = e.thoi_gian_xu_ly_tb_ngay_arr.length
        ? e.thoi_gian_xu_ly_tb_ngay_arr.reduce((a, b) => a + b) /
          e.thoi_gian_xu_ly_tb_ngay_arr.length
        : 0;

      e.thoi_gian_xu_ly_tb_ngay = Number(avg.toFixed(2));
      e.ty_le = total
        ? Number(((e.tong_phan_anh / total) * 100).toFixed(2))
        : 0;

      delete e.thoi_gian_xu_ly_tb_ngay_arr;
    }

    return result;
  },

  async exportBaoCaoLinhVucExcel(from, to) {
    const data = await this.getBaoCaoLinhVuc(from, to);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Báo cáo theo lĩnh vực");

    let rowIndex = 1;

    FileService.excelStyles.title(sheet, rowIndex++, "BÁO CÁO THEO LĨNH VỰC");

    rowIndex++;

    FileService.excelStyles.sectionTitle(
      sheet,
      rowIndex++,
      "Thông tin báo cáo"
    );

    const info = [
      ["Ngày xuất báo cáo", nowVN()],
      ["Từ ngày", from || "Tất cả"],
      ["Đến ngày", to || "Tất cả"],
    ];

    info.forEach((row) => FileService.excelStyles.tableRow(sheet.addRow(row)));

    rowIndex = sheet.lastRow.number + 2;

    FileService.excelStyles.sectionTitle(
      sheet,
      rowIndex++,
      "Phản ánh theo lĩnh vực"
    );

    const header1 = ["Lĩnh vực", ...data.map((x) => x.ten_linh_vuc)];
    FileService.excelStyles.tableHeader(sheet.addRow(header1));

    const table1 = [
      ["Tổng số phản ánh", ...data.map((x) => x.tong_phan_anh)],
      ["Đã xử lý", ...data.map((x) => x.da_xu_ly)],
      ["Chưa xử lý", ...data.map((x) => x.chua_xu_ly)],
      [
        "Thời gian xử lý TB (ngày)",
        ...data.map((x) => x.thoi_gian_xu_ly_tb_ngay),
      ],
    ];

    table1.forEach((r) => FileService.excelStyles.tableRow(sheet.addRow(r)));

    rowIndex = sheet.lastRow.number + 2;

    FileService.excelStyles.sectionTitle(
      sheet,
      rowIndex++,
      "Tỷ lệ phản ánh theo lĩnh vực"
    );

    const sumTotal = data.reduce((total, x) => total + x.tong_phan_anh, 0);

    const header2 = [
      "Lĩnh vực",
      ...data.map((x) => x.ten_linh_vuc),
      "Tổng cộng",
    ];
    FileService.excelStyles.tableHeader(sheet.addRow(header2));

    FileService.excelStyles.tableRow(
      sheet.addRow([
        "Số lượng phản ánh",
        ...data.map((x) => x.tong_phan_anh),
        sumTotal,
      ])
    );

    FileService.excelStyles.tableRow(
      sheet.addRow(["Tỷ lệ (%)", ...data.map((x) => x.ty_le + "%"), "100%"])
    );

    FileService.excelStyles.autoFit(sheet);

    return workbook.xlsx.writeBuffer();
  },

  async getBaoCaoTrangThai(fromRaw, toRaw) {
    const from = fromRaw ? toUTCFromVN_Start(fromRaw) : null;
    const to = toRaw ? toUTCFromVN_End(toRaw) : null;

    const rows = await ReportRepository.getBaoCaoTrangThai({ from, to });
    if (!rows.length) return [];

    const map = {};

    for (const r of rows) {
      const key = r.trang_thai || "Không xác định";

      if (!map[key]) {
        map[key] = {
          trang_thai: key,
          so_luong: 0,
        };
      }

      map[key].so_luong++;
    }

    const result = Object.values(map);

    const total = result.reduce((s, e) => s + e.so_luong, 0);

    for (const e of result) {
      e.ty_le = total ? Number(((e.so_luong / total) * 100).toFixed(2)) : 0;
    }

    result.push({
      trang_thai: "Tổng cộng",
      so_luong: total,
      ty_le: 100,
    });

    return result;
  },

  async exportBaoCaoTrangThaiExcel(fromRaw, toRaw) {
    const data = await this.getBaoCaoTrangThai(fromRaw, toRaw);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Báo cáo trạng thái");

    let rowIndex = 1;

    FileService.excelStyles.title(sheet, rowIndex++, "BÁO CÁO THEO TRẠNG THÁI");

    rowIndex++;

    FileService.excelStyles.sectionTitle(
      sheet,
      rowIndex++,
      "Thông tin báo cáo"
    );

    const info = [
      ["Ngày xuất báo cáo", nowVN()],
      ["Từ ngày", fromRaw || "Tất cả"],
      ["Đến ngày", toRaw || "Tất cả"],
    ];
    info.forEach((row) => FileService.excelStyles.tableRow(sheet.addRow(row)));

    rowIndex = sheet.lastRow.number + 2;

    FileService.excelStyles.sectionTitle(
      sheet,
      rowIndex++,
      "Số lượng phản ánh theo trạng thái"
    );

    const header = ["Trạng thái", "Số lượng", "Tỷ lệ (%)"];
    FileService.excelStyles.tableHeader(sheet.addRow(header));

    data.forEach((item) => {
      FileService.excelStyles.tableRow(
        sheet.addRow([item.trang_thai, item.so_luong, item.ty_le])
      );
    });

    FileService.excelStyles.autoFit(sheet);

    return workbook.xlsx.writeBuffer();
  },

  async getReportPhanAnh(from, to, idLinhVuc) {
    let { phanAnh, phanAnhMoiCapNhat, linh_vuc } =
      await ReportRepository.getReportPhanAnh(from, to, idLinhVuc);

    const xu_huong = {};
    const trang_thai = {};
    const totalCount = phanAnh.length;
    const linh_vuc_phan_anh = {};

    for (let pa of phanAnh) {
      const utcDate = new Date(pa.thoi_gian_tao);
      const vnDate = utcDate.toLocaleDateString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
      });

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
            (status) => status.ten === PHAN_ANH_STATUS.DA_TIEP_NHAN
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

    return {
      bieu_do_tron_chi_tiet: linh_vuc_phan_anh,
      tong_phan_anh: totalCount,
      phan_bo_theo_trang_thai: trang_thai,
      xu_huong,
      phan_anh_moi_cap_nhat,
      chi_tiet_theo_linh_vuc: linh_vuc_1,
    };
  },

  async getReportThuTuc(from, to) {
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
};

export default ReportService;
