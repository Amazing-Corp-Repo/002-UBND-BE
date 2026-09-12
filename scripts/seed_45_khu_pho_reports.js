import 'dotenv/config';
import prisma from '../src/config/database.config.js';
import crypto from 'crypto';

const CODE_REGEX = /^[A-Z0-9]{8}$/;

const SAMPLE_TITLES = [
  'Tụ điểm rác thải ô nhiễm bốc mùi hôi thối',
  'Đèn chiếu sáng công cộng hỏng đêm tối nguy hiểm',
  'Hố ga bít nắp đường giao thông mất an toàn',
  'Cống thoát nước ngập tắc bẩn tràn ra vỉa hè',
  'Hàng quán lấn chiếm lòng lề đường kinh doanh',
  'Cây xanh gãy nhánh có nguy cơ ngã đổ mùa mưa',
  'Tổ chức hát karaoke gây ồn quá giờ quy định',
  'Vạch sang đường cho người đi bộ mờ nét',
  'Dây cáp viễn thông chùng võng sát mái nhà dân',
  'Tập kết vật liệu xây dựng chắn ngang hẻm',
  'Đường ống nước sinh hoạt bị rò rỉ ngập úng',
  'Bảng hiệu quảng cáo che khuất tầm nhìn giao thông',
  'Xe tải chở vật liệu rơi vãi ra mặt đường',
  'Tụ tập kinh doanh hàng rong gây mất trật tự',
  'Nước thải sinh hoạt chảy tràn ra đường dân sinh'
];

const LOCATIONS = [
  'Đường số 1', 'Đường số 2', 'Đường số 3', 'Đường số 4', 'Đường số 5',
  'Đường số 6', 'Đường số 7', 'Đường số 8', 'Đường số 9', 'Đường số 10',
  'Hẻm 12', 'Hẻm 45', 'Hẻm 78', 'Hẻm 102', 'Đường Lê Văn Việt'
];

const CITIZENS = [
  { name: 'Nguyễn Văn An', phone: '0912345678' },
  { name: 'Trần Thị Bình', phone: '0923456789' },
  { name: 'Lê Hoàng Cường', phone: '0934567890' },
  { name: 'Phạm Minh Đức', phone: '0945678901' },
  { name: 'Vũ Thị Em', phone: '0956789012' },
  { name: 'Đặng Quốc Hùng', phone: '0967890123' },
  { name: 'Bùi Thanh Hương', phone: '0978901234' },
  { name: 'Đỗ Quang Hải', phone: '0989012345' },
  { name: 'Hoàng Văn Nam', phone: '0990123456' },
  { name: 'Ngô Thị Phương', phone: '0901234567' }
];

const AUG_1 = new Date('2026-08-01T08:00:00.000Z').getTime();
const SEPT_12 = new Date('2026-09-12T17:00:00.000Z').getTime();

const getRandomDateInAugSept = () => {
  const time = AUG_1 + Math.random() * (SEPT_12 - AUG_1);
  return new Date(time);
};

const HIGH_PERFORMANCE_KP = [3, 7, 12, 15, 21, 28, 35, 43];
const LOW_PERFORMANCE_KP = [8, 11, 18, 26, 39];

const getReportCountForKP = (kp) => {
  if ([1, 5, 10, 15, 20, 25, 30, 38, 45].includes(kp)) return 20 + Math.floor(Math.random() * 8);
  if ([2, 6, 11, 18, 24, 33, 39].includes(kp)) return 5 + Math.floor(Math.random() * 5);
  if ([4, 9, 14, 19, 27, 34, 41].includes(kp)) return 14 + Math.floor(Math.random() * 6);
  return 8 + Math.floor(Math.random() * 7);
};

async function main() {
  console.log('=== SEEDING DIVERSE REPORTS FOR 45 KHU PHỐ (AUG & SEPT 2026) ===');

  const categories = await prisma.linh_vuc_phan_anh.findMany({
    where: { is_delete: false }
  });
  const users = await prisma.nguoi_dung.findMany({
    where: { is_delete: false }
  });

  if (categories.length === 0 || users.length === 0) {
    console.error('Error: No active categories or users found in DB.');
    process.exit(1);
  }

  const defaultUser = users.find(u => u.ten_dang_nhap === 'admin') || users[0];

  console.log('Cleaning up existing reports...');
  const allReports = await prisma.phan_anh.findMany({ select: { id: true } });
  const allIds = allReports.map(r => r.id);

  if (allIds.length > 0) {
    const extensions = await prisma.de_nghi_gia_han_phan_anh.findMany({
      where: { id_phan_anh: { in: allIds } },
      select: { id: true }
    });
    const extIds = extensions.map(e => e.id);
    if (extIds.length > 0) {
      await prisma.de_nghi_gia_han_file.deleteMany({ where: { id_de_nghi_gia_han: { in: extIds } } });
      await prisma.de_nghi_gia_han_phan_anh.deleteMany({ where: { id: { in: extIds } } });
    }
    await prisma.dinh_kem_phan_anh.deleteMany({ where: { id_phan_anh: { in: allIds } } });
    await prisma.danh_gia_phan_anh.deleteMany({ where: { id_phan_anh: { in: allIds } } });
    await prisma.lich_su_trang_thai.deleteMany({ where: { id_phan_anh: { in: allIds } } });
    await prisma.phan_anh.deleteMany({ where: { id: { in: allIds } } });
  }
  console.log('Cleanup completed.');

  const reportsToInsert = [];
  const historiesToInsert = [];

  for (let kp = 1; kp <= 45; kp++) {
    const kpNumStr = String(kp).padStart(2, '0');
    const khuPhoName = `KP ${kpNumStr}`;
    const reportCountForKP = getReportCountForKP(kp);

    for (let r = 1; r <= reportCountForKP; r++) {
      const reportId = crypto.randomUUID();
      const seqStr = String(r).padStart(4, '0');
      const code = `K${kpNumStr}P${seqStr}`;

      if (!CODE_REGEX.test(code)) {
        throw new Error(`Code [${code}] violates Regex /^[A-Z0-9]{8}$/!`);
      }

      let status = 'Đang xử lý';
      const rand = Math.random();

      if (HIGH_PERFORMANCE_KP.includes(kp)) {
        if (rand < 0.70) status = 'Đã giải quyết';
        else if (rand < 0.90) status = 'Đóng';
        else if (rand < 0.96) status = 'Đang xử lý';
        else status = 'Đã gửi';
      } else if (LOW_PERFORMANCE_KP.includes(kp)) {
        if (rand < 0.20) status = 'Đã giải quyết';
        else if (rand < 0.65) status = 'Đang xử lý';
        else if (rand < 0.85) status = 'Đã gửi';
        else status = 'Từ chối';
      } else {
        if (rand < 0.45) status = 'Đã giải quyết';
        else if (rand < 0.60) status = 'Đóng';
        else if (rand < 0.85) status = 'Đang xử lý';
        else if (rand < 0.95) status = 'Đã gửi';
        else status = 'Từ chối';
      }

      const isUrgent = Math.random() < 0.25;
      const mucDo = isUrgent ? 'Khẩn cấp' : 'Thông thường';

      const citizenObj = CITIZENS[(kp + r) % CITIZENS.length];
      const categoryObj = categories[(kp + r) % categories.length];
      const titleTemplate = SAMPLE_TITLES[(kp + r) % SAMPLE_TITLES.length];
      const locationTemplate = LOCATIONS[(kp + r) % LOCATIONS.length];

      const createdDate = getRandomDateInAugSept();

      let deadlineDate = null;
      if (status === 'Đang xử lý') {
        const slaRand = Math.random();
        if (slaRand < 0.50) {
          deadlineDate = new Date(createdDate.getTime() + (3 + Math.floor(Math.random() * 5)) * 24 * 60 * 60 * 1000);
        } else if (slaRand < 0.75) {
          deadlineDate = new Date(createdDate.getTime() + 1 * 24 * 60 * 60 * 1000);
        } else {
          deadlineDate = new Date(createdDate.getTime() + 2 * 24 * 60 * 60 * 1000);
        }
      } else if (status === 'Đã giải quyết' || status === 'Đóng') {
        deadlineDate = new Date(createdDate.getTime() + 3 * 24 * 60 * 60 * 1000);
      }

      reportsToInsert.push({
        id: reportId,
        ma_phan_anh: code,
        tieu_de: `${titleTemplate} tại ${khuPhoName}`,
        mo_ta: `Nội dung chi tiết phản ánh về ${titleTemplate.toLowerCase()} tại vị trí ${locationTemplate}, ${khuPhoName}, Phường Tăng Nhơn Phú. Đề nghị cơ quan chức năng kiểm tra và xử lý kịp thời.`,
        khu_pho: khuPhoName,
        vi_tri: `${locationTemplate}, ${khuPhoName}, Phường Tăng Nhơn Phú, TP. Thủ Đức`,
        muc_do: mucDo,
        id_linh_vuc_phan_anh: categoryObj.id,
        ten_nguoi_phan_anh: citizenObj.name,
        sdt_nguoi_phan_anh: citizenObj.phone,
        is_approve: status !== 'Đã gửi',
        thoi_gian_tao: createdDate,
        thoi_gian_tiep_nhan: status !== 'Đã gửi' ? new Date(createdDate.getTime() + 2 * 60 * 60 * 1000) : createdDate,
        thoi_gian_phan_hoi_du_kien: deadlineDate,
        ngay_du_kien_hoan_thanh: deadlineDate,
        nguoi_tao: defaultUser.id,
        id_to: defaultUser.id,
        id_video: [],
        id_video_giai_quyet: [],
      });

      historiesToInsert.push({
        id: crypto.randomUUID(),
        id_phan_anh: reportId,
        ten: 'Đã gửi',
        ghi_chu: 'Người dân đã gửi đơn phản ánh thành công qua ứng dụng.',
        thoi_gian_tao: createdDate,
        nguoi_tao: defaultUser.id,
      });

      if (status === 'Đang xử lý') {
        historiesToInsert.push({
          id: crypto.randomUUID(),
          id_phan_anh: reportId,
          ten: 'Đang xử lý',
          ghi_chu: 'Cán bộ quản lý đã phê duyệt và giao đơn cho đơn vị phụ trách xử lý.',
          thoi_gian_tao: new Date(createdDate.getTime() + 2 * 60 * 60 * 1000),
          nguoi_tao: defaultUser.id,
        });
      } else if (status === 'Đã giải quyết') {
        historiesToInsert.push({
          id: crypto.randomUUID(),
          id_phan_anh: reportId,
          ten: 'Đang xử lý',
          ghi_chu: 'Cán bộ quản lý đã phê duyệt và giao đơn cho đơn vị phụ trách xử lý.',
          thoi_gian_tao: new Date(createdDate.getTime() + 2 * 60 * 60 * 1000),
          nguoi_tao: defaultUser.id,
        });
        historiesToInsert.push({
          id: crypto.randomUUID(),
          id_phan_anh: reportId,
          ten: 'Đã giải quyết',
          ghi_chu: 'Đã hoàn thành khắc phục và xử lý xong nội dung phản ánh.',
          thoi_gian_tao: new Date(createdDate.getTime() + (12 + Math.floor(Math.random() * 24)) * 60 * 60 * 1000),
          nguoi_tao: defaultUser.id,
        });
      } else if (status === 'Đóng') {
        historiesToInsert.push({
          id: crypto.randomUUID(),
          id_phan_anh: reportId,
          ten: 'Đang xử lý',
          ghi_chu: 'Cán bộ quản lý đã phê duyệt và giao đơn cho đơn vị phụ trách xử lý.',
          thoi_gian_tao: new Date(createdDate.getTime() + 2 * 60 * 60 * 1000),
          nguoi_tao: defaultUser.id,
        });
        historiesToInsert.push({
          id: crypto.randomUUID(),
          id_phan_anh: reportId,
          ten: 'Đóng',
          ghi_chu: 'Hồ sơ phản ánh đã hoàn thành kiểm tra nghiệm thu và đóng lại.',
          thoi_gian_tao: new Date(createdDate.getTime() + (24 + Math.floor(Math.random() * 24)) * 60 * 60 * 1000),
          nguoi_tao: defaultUser.id,
        });
      } else if (status === 'Từ chối') {
        historiesToInsert.push({
          id: crypto.randomUUID(),
          id_phan_anh: reportId,
          ten: 'Từ chối',
          ghi_chu: 'Phản ánh không thuộc phạm vi xử lý của UBND hoặc thông tin trùng lặp.',
          thoi_gian_tao: new Date(createdDate.getTime() + 4 * 60 * 60 * 1000),
          nguoi_tao: defaultUser.id,
        });
      }
    }
  }

  console.log(`Inserting ${reportsToInsert.length} reports in bulk...`);
  await prisma.phan_anh.createMany({ data: reportsToInsert });

  console.log(`Inserting ${historiesToInsert.length} status history records in bulk...`);
  await prisma.lich_su_trang_thai.createMany({ data: historiesToInsert });

  console.log(`\n🎉 SUCCESS! Created ${reportsToInsert.length} reports across all 45 Khu phố!`);
  console.log('Features: Varied counts per KP, High/Low resolution rate curves, Random dates in Aug & Sept 2026!');
}

main()
  .catch(err => {
    console.error('Seed execution error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
