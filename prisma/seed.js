// Seed DEV — dữ liệu giả cho các bảng mới (Task 2: đánh giá + thư viện số + đăng ký tiếp dân).
// Chạy: npx prisma db seed
// Idempotent: dùng UUID cố định + upsert → chạy lại không nhân đôi dữ liệu.
//
// Lưu ý Prisma 7: import Prisma client (.ts sinh ra) + driver adapter @prisma/adapter-pg.
// Chạy bằng node --experimental-strip-types (đã khai báo trong prisma.config.ts).

import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.ts';

// --- Khởi tạo client (sao chép logic từ src/config/database.config.js) ---
const connectionString = process.env.DATABASE_URL;
const schemaMatch = connectionString?.match(/[?&]schema=([^&]+)/);
const schema = schemaMatch ? decodeURIComponent(schemaMatch[1]) : undefined;
const options = schema ? `-c search_path="${schema}",public` : undefined;
const adapter = new PrismaPg({ connectionString, options }, schema ? { schema } : undefined);
const prisma = new PrismaClient({ adapter });

// UUID cố định (đảm bảo idempotent). Dạng 8-4-4-4-12 hợp lệ.
const U = (s) => s; // helper đặt tên
const IDS = {
  // roles
  roleAdmin: U('00000000-0000-4000-8000-000000000101'),
  roleChuyenVien: U('00000000-0000-4000-8000-000000000102'),
  // linh_vuc_phan_anh
  lvGiaoThong: U('00000000-0000-4000-8000-000000000201'),
  lvVeSinh: U('00000000-0000-4000-8000-000000000202'),
  // lich_tiep_dan
  lich1: U('00000000-0000-4000-8000-000000000301'),
  lich2: U('00000000-0000-4000-8000-000000000302'),
  // phan_anh
  pa1: U('00000000-0000-4000-8000-000000000401'),
  pa2: U('00000000-0000-4000-8000-000000000402'),
  pa3: U('00000000-0000-4000-8000-000000000403'),
  // thu_vien_danh_muc
  dmSach: U('00000000-0000-4000-8000-000000000501'),
  dmVanBan: U('00000000-0000-4000-8000-000000000502'),
  dmBanDo: U('00000000-0000-4000-8000-000000000503'),
  dmVanHoa: U('00000000-0000-4000-8000-000000000504'), // THÊM MỚI — văn hóa - lịch sử
  dmDiTich: U('00000000-0000-4000-8000-000000000505'), // THÊM MỚI — di tích lịch sử
  // thu_vien_tag
  tagLichSu: U('00000000-0000-4000-8000-000000000601'),
  tagVanHoa: U('00000000-0000-4000-8000-000000000602'),
  tagDiaChinh: U('00000000-0000-4000-8000-000000000603'),
  tagPhapLuat: U('00000000-0000-4000-8000-000000000604'), // THÊM MỚI
  // thu_vien_tai_lieu
  tlSach: U('00000000-0000-4000-8000-000000000701'),
  tlLuat: U('00000000-0000-4000-8000-000000000702'),
  tlBanDo: U('00000000-0000-4000-8000-000000000703'),
  tlVanHoa: U('00000000-0000-4000-8000-000000000704'), // THÊM MỚI — tài liệu văn hóa
  tlPhapLuat: U('00000000-0000-4000-8000-000000000705'), // THÊM MỚI — tài liệu pháp luật
  // thu_vien_tai_lieu_media (THÊM MỚI)
  tlMedia1: U('00000000-0000-4000-8000-000000000b01'),
  tlMedia2: U('00000000-0000-4000-8000-000000000b02'),
  // dang_ky_tiep_dan
  dkCounter: U('00000000-0000-4000-8000-000000000801'),
  dkLeader: U('00000000-0000-4000-8000-000000000802'),
  dkCounterApproved: U('00000000-0000-4000-8000-000000000803'),
  dkCounterRated: U('00000000-0000-4000-8000-000000000804'),
};

async function main() {
  console.log('Seed DEV bắt đầu...');

  // ---------- Dữ liệu nền (cần cho FK) ----------
  await prisma.roles.upsert({
    where: { id: IDS.roleAdmin },
    update: {},
    create: { id: IDS.roleAdmin, name: 'ADMIN', description: 'Quản trị hệ thống' },
  });
  await prisma.roles.upsert({
    where: { id: IDS.roleChuyenVien },
    update: {},
    create: { id: IDS.roleChuyenVien, name: 'CHUYEN_VIEN', description: 'Chuyên viên xử lý' },
  });

  for (const [id, ten, moTa] of [
    [IDS.lvGiaoThong, 'Giao thông', 'Đèn chiếu sáng, ổ gà, biển báo'],
    [IDS.lvVeSinh, 'Vệ sinh môi trường', 'Rác thải, cống rãnh'],
  ]) {
    await prisma.linh_vuc_phan_anh.upsert({
      where: { id },
      update: {},
      create: { id, ten, mo_ta: moTa },
    });
  }

  for (const [id, diaDiem, tenCanBo, ngay] of [
    [IDS.lich1, 'Hội trường UBND xã', 'Nguyễn Văn A', new Date('2026-09-01')],
    [IDS.lich2, 'Phòng tiếp công dân', 'Trần Thị B', new Date('2026-09-08')],
  ]) {
    await prisma.lich_tiep_dan.upsert({
      where: { id },
      update: {},
      create: { id, dia_diem: diaDiem, ten_can_bo: tenCanBo, thoi_gian: '07:30 - 11:30', ngay_tiep_dan: ngay },
    });
  }

  // ---------- quay_tiep_dan đã được seed trong migration SQL ----------

  for (const [id, ma, tieuDe, lv, mucDo, status] of [
    [IDS.pa1, 'PA-2026-0001', 'Cống nghẹt gây ngập đường', IDS.lvVeSinh, 'Khẩn cấp', 'Đã giải quyết'],
    [IDS.pa2, 'PA-2026-0002', 'Đèn chiếu sáng hư hỏng khu 4', IDS.lvGiaoThong, 'Thông thường', 'Đang xử lý'],
    [IDS.pa3, 'PA-2026-0003', 'Ổ gà lớn trước cổng chợ', IDS.lvGiaoThong, 'Thông thường', 'Đã giải quyết'],
  ]) {
    await prisma.phan_anh.upsert({
      where: { id },
      update: {},
      create: {
        id,
        ma_phan_anh: ma,
        id_linh_vuc_phan_anh: lv,
        tieu_de: tieuDe,
        mo_ta: tieuDe,
        muc_do: mucDo,
        vi_tri: 'Xã Tăng Nhơn Phú',
        khu_pho: 'Chưa xác định',
        ten_nguoi_phan_anh: 'Người dân',
        sdt_nguoi_phan_anh: '0900000000',
        id_video: [],
        id_video_giai_quyet: [],
        thoi_gian_tiep_nhan: new Date(),
      },
    });
  }

  // ---------- 1. danh_gia_phan_anh ----------
  const danhGiaPhanAnh = [
    { id_phan_anh: IDS.pa1, diem: 5, nhan_xet: 'Xử lý nhanh, hiệu quả.' },
    { id_phan_anh: IDS.pa3, diem: 4, nhan_xet: 'Ổ gà đã được vá, mức độ hài lòng tốt.' },
  ];
  for (const d of danhGiaPhanAnh) {
    await prisma.danh_gia_phan_anh.upsert({
      where: { id_phan_anh: d.id_phan_anh },
      update: {},
      create: d,
    });
  }

  // ---------- 2. dang_ky_tiep_dan ----------
  await prisma.dang_ky_tiep_dan.upsert({
    where: { id: IDS.dkCounter },
    update: {
      ma_tiep_dan: 'A00001',
      ly_do: 'Cần được hướng dẫn thành phần hồ sơ và trình tự nộp hồ sơ.',
      bo_phan: null,
      trang_thai: 'PENDING',
    },
    create: {
      id: IDS.dkCounter,
      loai: 'COUNTER_RECEPTION',
      ma_tiep_dan: 'A00001',
      id_lich_tiep_dan: IDS.lich1,
      ngay: new Date('2026-09-01'),
      slot: '07:30 - 08:30',
      chu_de: 'Hỗ trợ thủ tục đất đai',
      ly_do: 'Cần được hướng dẫn thành phần hồ sơ và trình tự nộp hồ sơ.',
      ho_ten: 'Lê Văn C',
      sdt: '0911111111',
      cccd: '079123456789',
      dia_chi: 'Khu 3, xã Tăng Nhơn Phú',
      trang_thai: 'PENDING',
    },
  });
  await prisma.dang_ky_tiep_dan.upsert({
    where: { id: IDS.dkCounterApproved },
    update: {},
    create: {
      id: IDS.dkCounterApproved,
      loai: 'COUNTER_RECEPTION',
      ma_tiep_dan: 'A00002',
      id_lich_tiep_dan: IDS.lich1,
      ngay: new Date('2026-09-01'),
      slot: '08:30 - 09:30',
      chu_de: 'Xác nhận thông tin cư trú',
      ly_do: 'Cần xác nhận thông tin cư trú để hoàn thiện hồ sơ hành chính.',
      ho_ten: 'Nguyễn Văn An',
      sdt: '0912345678',
      cccd: '042204001234',
      dia_chi: 'Phường Thành Sen, tỉnh Hà Tĩnh',
      bo_phan: 'QUAY_2',
      ten_lanh_dao: 'Lãnh đạo mẫu',
      chuc_vu_lanh_dao: 'LEADER',
      trang_thai: 'APPROVED',
    },
  });
  await prisma.dang_ky_tiep_dan.upsert({
    where: { id: IDS.dkCounterRated },
    update: {},
    create: {
      id: IDS.dkCounterRated,
      loai: 'COUNTER_RECEPTION',
      ma_tiep_dan: 'A00003',
      id_lich_tiep_dan: IDS.lich2,
      ngay: new Date('2026-09-08'),
      slot: '09:30 - 10:30',
      chu_de: 'Hướng dẫn thủ tục hộ tịch',
      ly_do: 'Cần hướng dẫn bổ sung giấy tờ cho hồ sơ hộ tịch.',
      ho_ten: 'Trần Thị Mai',
      sdt: '0987654321',
      cccd: '042205009876',
      dia_chi: 'Phường Trần Phú, tỉnh Hà Tĩnh',
      bo_phan: 'QUAY_3',
      ten_lanh_dao: 'Lãnh đạo mẫu',
      chuc_vu_lanh_dao: 'LEADER',
      trang_thai: 'APPROVED',
    },
  });
  await prisma.dang_ky_tiep_dan.upsert({
    where: { id: IDS.dkLeader },
    update: {},
    create: {
      id: IDS.dkLeader,
      loai: 'LEADER_MEETING',
      ma_tiep_dan: 'LĐ-0001',
      ngay: new Date('2026-09-05'),
      slot: '09:00 - 10:00',
      chu_de: 'Góp ý quy hoạch',
      ly_do: 'Muốn trao đổi trực tiếp về dự án quy hoạch khu dân cư.',
      ho_ten: 'Phạm Thị D',
      sdt: '0922222222',
      cccd: '079987654321',
      dia_chi: 'Khu 1, xã Tăng Nhơn Phú',
      ten_lanh_dao: 'Chủ tịch UBND xã',
      chuc_vu_lanh_dao: 'Chủ tịch',
      trang_thai: 'COMPLETED',
    },
  });

  // ---------- 3. danh_gia_tiep_dan ----------
  await prisma.danh_gia_tiep_dan.upsert({
    where: { id_dang_ky_tiep_dan: IDS.dkLeader },
    update: {},
    create: {
      id_dang_ky_tiep_dan: IDS.dkLeader,
      diem_tong: 5,
      tieu_chi: { attitude: 5, guidance: 5, waiting: 4 },
      ly_do: ['Được hướng dẫn rõ ràng', 'Thái độ nhiệt tình'],
      nhan_xet: 'Rất hài lòng với buổi làm việc.',
    },
  });
  await prisma.danh_gia_tiep_dan.upsert({
    where: { id_dang_ky_tiep_dan: IDS.dkCounterRated },
    update: {},
    create: {
      id_dang_ky_tiep_dan: IDS.dkCounterRated,
      diem_tong: 5,
      tieu_chi: null,
      ly_do: ['Cán bộ rất tận tình và chuyên nghiệp'],
      nhan_xet: 'Tôi rất hài lòng với buổi tiếp dân.',
    },
  });

  // ---------- 4. thu_vien_danh_muc ----------
  for (const [id, ten, moTa, icon, tone, thuTu] of [
    [IDS.dmSach, 'Tủ sách địa phương', 'Sách về lịch sử, văn hóa', 'BookOpen', 'blue', 1],
    [IDS.dmVanBan, 'Văn bản pháp luật', 'Nghị quyết, quyết định, thông tư', 'ScrollText', 'green', 2],
    [IDS.dmBanDo, 'Bản đồ số', 'Bản đồ quy hoạch, ranh giới', 'Map', 'orange', 3],
    [IDS.dmVanHoa, 'Văn hóa - Lịch sử', 'Tài liệu văn hóa, lịch sử địa phương', 'History', 'red', 4],
    [IDS.dmDiTich, 'Di tích lịch sử', 'Di tích, danh thắng trên địa bàn', 'Landmark', 'purple', 5],
    // Danh mục loại văn bản quy phạm pháp luật
    ['00000000-0000-4000-8000-000000000511', 'Quyết định', 'Quyết định quy phạm pháp luật và cá biệt', 'FileText', 'blue', 10],
    ['00000000-0000-4000-8000-000000000512', 'Nghị định', 'Nghị định của Chính phủ', 'FileText', 'green', 11],
    ['00000000-0000-4000-8000-000000000513', 'Thông tư', 'Thông tư của các Bộ, ngành', 'FileText', 'indigo', 12],
    ['00000000-0000-4000-8000-000000000514', 'Nghị quyết', 'Nghị quyết của Quốc hội, HĐND', 'FileText', 'red', 13],
    ['00000000-0000-4000-8000-000000000515', 'Luật', 'Luật và Bộ luật', 'Book', 'amber', 14],
    ['00000000-0000-4000-8000-000000000516', 'Chỉ thị', 'Chỉ thị điều hành', 'AlertCircle', 'orange', 15],
    ['00000000-0000-4000-8000-000000000517', 'Quy chế / Quy định', 'Quy chế và quy định áp dụng', 'FileCode', 'teal', 16],
    ['00000000-0000-4000-8000-000000000518', 'Kế hoạch', 'Kế hoạch triển khai, thực hiện', 'Calendar', 'purple', 17],
    ['00000000-0000-4000-8000-000000000519', 'Báo cáo', 'Báo cáo định kỳ và chuyên đề', 'BarChart', 'cyan', 18],
    ['00000000-0000-4000-8000-000000000520', 'Công văn', 'Công văn hành chính và hướng dẫn', 'Mail', 'slate', 19],
    ['00000000-0000-4000-8000-000000000521', 'Hướng dẫn', 'Văn bản hướng dẫn chuyên môn', 'HelpCircle', 'sky', 20],
    ['00000000-0000-4000-8000-000000000522', 'Thông báo', 'Thông báo triển khai các quy định', 'Bell', 'rose', 21],
  ]) {
    await prisma.thu_vien_danh_muc.upsert({
      where: { id },
      update: {},
      create: { id, ten, mo_ta: moTa, icon, tone, thu_tu: thuTu },
    });
  }

  // ---------- 5. thu_vien_tag ----------
  for (const [id, ten] of [
    [IDS.tagLichSu, 'lịch sử'],
    [IDS.tagVanHoa, 'văn hóa'],
    [IDS.tagDiaChinh, 'địa chính'],
    [IDS.tagPhapLuat, 'pháp luật'],
  ]) {
    await prisma.thu_vien_tag.upsert({ where: { id }, update: {}, create: { id, ten } });
  }

  // ---------- 6. thu_vien_tai_lieu ----------
  await prisma.thu_vien_tai_lieu.upsert({
    where: { id: IDS.tlSach },
    update: {},
    create: {
      id: IDS.tlSach,
      id_danh_muc: IDS.dmSach,
      loai: 'SACH',
      tieu_de: 'Lịch sử Đảng bộ xã Tăng Nhơn Phú',
      tac_gia: 'Ban Tuyên giáo',
      mo_ta: 'Sách lịch sử địa phương.',
      so_luot_tai: 120n,
      luot_xem: 450n,
      is_featured: true,
      sections: [{ heading: 'Khái quát', content: 'Giới thiệu chung.' }],
      trang_thai: 'DA_DUYET',
      pham_vi: 'CONG_KHAI',
      ngay_dang: 210,
      ngon_ngu: 'vi',
    },
  });
  await prisma.thu_vien_tai_lieu.upsert({
    where: { id: IDS.tlLuat },
    update: {},
    create: {
      id: IDS.tlLuat,
      id_danh_muc: IDS.dmVanBan,
      loai: 'PHAP_LUAT',
      tieu_de: 'Hiến pháp nước Cộng hòa XHCN Việt Nam 2013',
      tac_gia: 'Quốc hội',
      mo_ta: 'Văn bản hiến pháp.',
      so_luot_tai: 500n,
      luot_xem: 2100n,
      is_featured: true,
      so_hieu: 'Hiến pháp 2013',
      co_quan_ban_hanh: 'Quốc hội',
      ngay_ban_hanh: new Date('2013-11-28'),
      ngay_hieu_luc: new Date('2014-01-01'),
      trang_thai_hieu_luc: 'Đang hiệu lực',
      chuong: [{ title: 'Chương I', articles: ['Điều 1'] }],
      trang_thai: 'DA_DUYET',
      pham_vi: 'CONG_KHAI',
      ngon_ngu: 'vi',
    },
  });
  await prisma.thu_vien_tai_lieu.upsert({
    where: { id: IDS.tlBanDo },
    update: {},
    create: {
      id: IDS.tlBanDo,
      id_danh_muc: IDS.dmBanDo,
      loai: 'BAN_DO',
      tieu_de: 'Bản đồ quy hoạch xã Tăng Nhơn Phú 2021-2030',
      tac_gia: 'Phòng Quy hoạch',
      mo_ta: 'Bản đồ quy hoạch sử dụng đất.',
      so_luot_tai: 80n,
      luot_xem: 320n,
      is_featured: false,
      trang_thai: 'DA_DUYET',
      pham_vi: 'CONG_KHAI',
      ngay_dang: 1,
      ngon_ngu: 'vi',
    },
  });
  // THÊM MỚI — Tài liệu Văn hóa - Lịch sử
  await prisma.thu_vien_tai_lieu.upsert({
    where: { id: IDS.tlVanHoa },
    update: {},
    create: {
      id: IDS.tlVanHoa,
      id_danh_muc: IDS.dmVanHoa,
      loai: 'VAN_HOA',
      tieu_de: 'Lịch sử hình thành và phát triển Phường Tăng Nhơn Phú',
      tac_gia: 'UBND Phường Tăng Nhơn Phú',
      mo_ta: 'Tài liệu tổng quan về lịch sử hình thành và phát triển của phường Tăng Nhơn Phú qua các thời kỳ.',
      so_luot_tai: 340n,
      luot_xem: 1250n,
      is_featured: true,
      so_hieu: 'N/A',
      ngay_ban_hanh: new Date('2023-01-15'),
      ten_di_tich: 'UBND Phường Tăng Nhơn Phú',
      dia_chi: 'Số 10 Đường số 4, Khu phố 2, Phường Tăng Nhơn Phú',
      nguon: 'UBND Phường Tăng Nhơn Phú - Phòng Văn hóa',
      nguoi_duyet: null,
      thoi_gian_duyet: new Date('2023-01-16T07:30:00Z'),
      trang_thai: 'DA_DUYET',
      pham_vi: 'CONG_KHAI',
      ngon_ngu: 'vi',
    },
  });
  // THÊM MỚI — Tài liệu Pháp luật
  await prisma.thu_vien_tai_lieu.upsert({
    where: { id: IDS.tlPhapLuat },
    update: {},
    create: {
      id: IDS.tlPhapLuat,
      id_danh_muc: IDS.dmVanBan,
      loai: 'PHAP_LUAT',
      tieu_de: 'Nghị định quy định về quản lý văn bản pháp luật tại địa phương',
      tac_gia: 'Chính phủ',
      mo_ta: 'Nghị định này quy định về quản lý văn bản pháp luật, bao gồm việc soạn thảo, ban hành, lưu trữ và công bố văn bản quy phạm pháp luật tại địa phương.',
      so_luot_tai: 210n,
      luot_xem: 890n,
      is_featured: true,
      so_hieu: '104/2022/NĐ-CP',
      co_quan_ban_hanh: 'Chính phủ',
      ngay_ban_hanh: new Date('2022-12-31'),
      ngay_hieu_luc: new Date('2023-01-15'),
      ngay_het_han: null,
      trang_thai_hieu_luc: 'Đang hiệu lực',
      nguon: 'Cổng thông tin điện tử Chính phủ',
      nguoi_duyet: null,
      thoi_gian_duyet: new Date('2023-01-05T09:00:00Z'),
      trang_thai: 'DA_DUYET',
      pham_vi: 'CONG_KHAI',
      ngon_ngu: 'vi',
    },
  });

  // ---------- 7. thu_vien_tai_lieu_tag (bảng nối) ----------
  const lienKetTag = [
    { id_tai_lieu: IDS.tlSach, id_tag: IDS.tagLichSu },
    { id_tai_lieu: IDS.tlSach, id_tag: IDS.tagVanHoa },
    { id_tai_lieu: IDS.tlLuat, id_tag: IDS.tagVanHoa },
    { id_tai_lieu: IDS.tlBanDo, id_tag: IDS.tagDiaChinh },
    { id_tai_lieu: IDS.tlVanHoa, id_tag: IDS.tagLichSu },       // THÊM MỚI
    { id_tai_lieu: IDS.tlVanHoa, id_tag: IDS.tagVanHoa },       // THÊM MỚI
    { id_tai_lieu: IDS.tlPhapLuat, id_tag: IDS.tagPhapLuat },   // THÊM MỚI
    { id_tai_lieu: IDS.tlPhapLuat, id_tag: IDS.tagVanHoa },     // THÊM MỚI
  ];
  for (const lt of lienKetTag) {
    await prisma.thu_vien_tai_lieu_tag.upsert({
      where: { id_tai_lieu_id_tag: { id_tai_lieu: lt.id_tai_lieu, id_tag: lt.id_tag } },
      update: {},
      create: lt,
    });
  }

  // ---------- 8. thu_vien_tai_lieu_file ----------
  await prisma.thu_vien_tai_lieu_file.upsert({
    where: {
      // upsert cần key duy nhất; bảng không có unique nên dùng createMany bỏ qua trùng lặp thay vì upsert
      id: '00000000-0000-4000-8000-000000000901',
    },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000901',
      id_tai_lieu: IDS.tlSach,
      ten_file: 'lich-su-dang-bo.pdf',
      duong_dan: '/storage/dev/thu_vien/lich-su-dang-bo.pdf',
      dinh_dang: 'application/pdf',
      kich_thuoc_mb: 5.25,
      phien_ban: 1,
      la_phien_ban_hien_tai: true,
    },
  });

  // ---------- 9. thu_vien_tai_lieu_quyen (quyền theo vai trò, tài liệu HAN_CHE) ----------
  await prisma.thu_vien_tai_lieu_quyen.upsert({
    where: {
      id: '00000000-0000-4000-8000-000000000a01',
    },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000a01',
      id_tai_lieu: IDS.tlBanDo,
      id_vai_tro: IDS.roleAdmin,
    },
  });

  // ---------- 10. thu_vien_tai_lieu_media (ảnh/video đính kèm — THÊM MỚI) ----------
  await prisma.thu_vien_tai_lieu_media.upsert({
    where: { id: IDS.tlMedia1 },
    update: {},
    create: {
      id: IDS.tlMedia1,
      id_tai_lieu: IDS.tlVanHoa,
      loai: 'IMAGE',
      ten_file_goc: 'anh_bia.jpg',
      url: '/storage/dev/thu_vien_media/anh_bia.jpg',
      kich_thuoc: 204800n,
      mime_type: 'image/jpeg',
    },
  });
  await prisma.thu_vien_tai_lieu_media.upsert({
    where: { id: IDS.tlMedia2 },
    update: {},
    create: {
      id: IDS.tlMedia2,
      id_tai_lieu: IDS.tlVanHoa,
      loai: 'VIDEO',
      ten_file_goc: 'phong_su.mp4',
      url: '/storage/dev/thu_vien_media/phong_su.mp4',
      kich_thuoc: 52428800n,
      mime_type: 'video/mp4',
    },
  });

  const counts = {
    roles: await prisma.roles.count(),
    lich_tiep_dan: await prisma.lich_tiep_dan.count(),
    quay_tiep_dan: await prisma.quay_tiep_dan.count(),
    phan_anh: await prisma.phan_anh.count(),
    danh_gia_phan_anh: await prisma.danh_gia_phan_anh.count(),
    dang_ky_tiep_dan: await prisma.dang_ky_tiep_dan.count(),
    danh_gia_tiep_dan: await prisma.danh_gia_tiep_dan.count(),
    thu_vien_danh_muc: await prisma.thu_vien_danh_muc.count(),
    thu_vien_tai_lieu: await prisma.thu_vien_tai_lieu.count(),
    thu_vien_tag: await prisma.thu_vien_tag.count(),
    thu_vien_tai_lieu_tag: await prisma.thu_vien_tai_lieu_tag.count(),
    thu_vien_tai_lieu_file: await prisma.thu_vien_tai_lieu_file.count(),
    thu_vien_tai_lieu_quyen: await prisma.thu_vien_tai_lieu_quyen.count(),
    thu_vien_tai_lieu_media: await prisma.thu_vien_tai_lieu_media.count(), // THÊM MỚI
  };
  console.log('Seed hoàn tất:', JSON.stringify(counts));
}

main()
  .catch(async (e) => {
    console.error('Seed thất bại:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
