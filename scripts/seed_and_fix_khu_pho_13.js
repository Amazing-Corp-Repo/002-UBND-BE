import 'dotenv/config';
import prisma from '../src/config/database.config.js';

async function main() {
  console.log('--- Step 1: Cleaning up any old invalid hyphenated codes (KP13-000X) ---');

  const oldInvalid = await prisma.phan_anh.findMany({
    where: {
      ma_phan_anh: { startsWith: 'KP13-' }
    }
  });

  for (const item of oldInvalid) {
    console.log(`Deleting invalid code [${item.ma_phan_anh}]...`);
    await prisma.lich_su_trang_thai.deleteMany({ where: { id_phan_anh: item.id } });
    await prisma.phan_anh.delete({ where: { id: item.id } });
  }

  console.log('\n--- Step 2: Fixing ALL existing reports to ensure complete status history ("Đã gửi" -> "Đang xử lý") ---');

  const existingReports = await prisma.phan_anh.findMany({
    include: {
      lich_su_trang_thai: {
        orderBy: { thoi_gian_tao: 'asc' }
      }
    }
  });

  console.log(`Found ${existingReports.length} existing reports to inspect.`);

  for (const rpt of existingReports) {
    const history = rpt.lich_su_trang_thai || [];
    const hasDaGui = history.some(h => (h.ten || '').toLowerCase() === 'đã gửi');

    const createdTime = rpt.thoi_gian_tao || new Date();

    if (!hasDaGui) {
      console.log(`Report [${rpt.ma_phan_anh || rpt.id}] missing 'Đã gửi' history -> Creating 'Đã gửi' history entry...`);
      await prisma.lich_su_trang_thai.create({
        data: {
          id_phan_anh: rpt.id,
          ten: 'Đã gửi',
          ghi_chu: 'Người dân đã gửi đơn phản ánh thành công.',
          thoi_gian_tao: new Date(createdTime.getTime() - 1000 * 60 * 30),
          nguoi_tao: rpt.nguoi_tao || rpt.id_to,
        }
      });
    }
  }

  console.log('\n--- Step 3: Seeding 5 new reports for "Khu phố 13" matching Regex /^[A-Z0-9]{8}$/ ---');

  const categories = await prisma.linh_vuc_phan_anh.findMany({
    where: { is_delete: false }
  });
  const users = await prisma.nguoi_dung.findMany({
    where: { is_delete: false }
  });

  const defaultUser = users.find(u => u.ten_dang_nhap === 'admin') || users[0];
  const defaultCategory = categories[0];

  const now = new Date();
  const hoursFromNow = (h) => new Date(now.getTime() + h * 60 * 60 * 1000);
  const daysFromNow = (d) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);
  const hoursAgo = (h) => new Date(now.getTime() - h * 60 * 60 * 1000);
  const daysAgo = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

  // Strictly 8 characters matching /^[A-Z0-9]{8}$/
  const kp13Reports = [
    {
      code: 'KP130001',
      title: 'Tụ điểm rác thải tự phát ô nhiễm tại đường số 5 Khu phố 13',
      description: 'Đống rác tự phát bốc mùi hôi thối tại đầu hẻm 42 đường số 5 Khu phố 13 ảnh hưởng các hộ dân xung quanh.',
      khuPho: 'Khu phố 13',
      viTri: 'Số 42 Đường số 5, Khu phố 13, Phường Tăng Nhơn Phú, TP. Thủ Đức',
      mucDo: 'Thông thường',
      citizen: 'Nguyễn Thanh Tùng',
      phone: '0988112233',
      status: 'Đang xử lý',
      isApprove: true,
      createdTime: daysAgo(2),
      approvedTime: daysAgo(1),
      deadlineTime: daysFromNow(4), // SLA: Còn hạn
      slaLabel: 'Còn hạn'
    },
    {
      code: 'KP130002',
      title: 'Đường dây điện chùng võng sát mái nhà dân Khu phố 13',
      description: 'Dây cáp điện chùng xuống gần sát mái tôn nhà số 15 đường số 2 Khu phố 13 có nguy cơ chập cháy mưa bão.',
      khuPho: 'Khu phố 13',
      viTri: 'Trước nhà số 15 Đường số 2, Khu phố 13, Phường Tăng Nhơn Phú, TP. Thủ Đức',
      mucDo: 'Khẩn cấp',
      citizen: 'Lê Văn Bình',
      phone: '0977223344',
      status: 'Đang xử lý',
      isApprove: true,
      createdTime: hoursAgo(18),
      approvedTime: hoursAgo(12),
      deadlineTime: hoursFromNow(6), // SLA: Sắp hết hạn (dưới 24h)
      slaLabel: 'Sắp hết hạn'
    },
    {
      code: 'KP130003',
      title: 'Cống thoát nước nghẹt gây tràn nước bẩn hẻm 12 Khu phố 13',
      description: 'Hệ thống cống bít tắc ngập tràn nước thải sinh hoạt ra hẻm 12 Khu phố 13 gây mất vệ sinh công cộng.',
      khuPho: 'Khu phố 13',
      viTri: 'Hẻm 12 Khu phố 13, Phường Tăng Nhơn Phú, TP. Thủ Đức',
      mucDo: 'Khẩn cấp',
      citizen: 'Trần Thị Thu',
      phone: '0966334455',
      status: 'Đang xử lý',
      isApprove: true,
      createdTime: daysAgo(4),
      approvedTime: daysAgo(3),
      deadlineTime: daysAgo(1), // SLA: Quá hạn
      slaLabel: 'Quá hạn'
    },
    {
      code: 'KP130004',
      title: 'Kiến nghị sơn kẻ vạch sang đường trước nhà văn hóa Khu phố 13',
      description: 'Vạch sang đường cho người đi bộ trước Nhà văn hóa Khu phố 13 bị mờ nét hoàn toàn, trẻ em và người già sang đường nguy hiểm.',
      khuPho: 'Khu phố 13',
      viTri: 'Cổng Nhà văn hóa Khu phố 13, Phường Tăng Nhơn Phú, TP. Thủ Đức',
      mucDo: 'Thông thường',
      citizen: 'Phạm Minh Đức',
      phone: '0955445566',
      status: 'Đã gửi',
      isApprove: false,
      createdTime: hoursAgo(5),
      approvedTime: null,
      deadlineTime: null, // SLA: Chưa áp dụng
      slaLabel: 'Chưa áp dụng'
    },
    {
      code: 'KP130005',
      title: 'Quán ăn lấn chiếm vỉa hè lối đi bộ Khu phố 13',
      description: 'Hàng quán kinh doanh chiếm dụng vỉa hè dường số 8 Khu phố 13 để bàn ghế, ép người đi bộ xuống lòng đường.',
      khuPho: 'Khu phố 13',
      viTri: 'Số 88 Đường số 8, Khu phố 13, Phường Tăng Nhơn Phú, TP. Thủ Đức',
      mucDo: 'Thông thường',
      citizen: 'Hoàng Thị Mai',
      phone: '0944556677',
      status: 'Đang xử lý',
      isApprove: true,
      createdTime: daysAgo(1),
      approvedTime: hoursAgo(6),
      deadlineTime: daysFromNow(2), // SLA: Còn hạn
      slaLabel: 'Còn hạn'
    }
  ];

  for (let i = 0; i < kp13Reports.length; i++) {
    const item = kp13Reports[i];
    const catObj = categories[i % categories.length] || defaultCategory;
    const userObj = users[i % users.length] || defaultUser;

    // Remove if already exists with same code
    const existing = await prisma.phan_anh.findFirst({ where: { ma_phan_anh: item.code } });
    if (existing) {
      await prisma.lich_su_trang_thai.deleteMany({ where: { id_phan_anh: existing.id } });
      await prisma.phan_anh.delete({ where: { id: existing.id } });
    }

    const reportData = {
      ma_phan_anh: item.code,
      tieu_de: item.title,
      mo_ta: item.description,
      muc_do: item.mucDo,
      vi_tri: item.viTri,
      khu_pho: item.khuPho,
      ten_nguoi_phan_anh: item.citizen,
      sdt_nguoi_phan_anh: item.phone,
      is_approve: item.isApprove,
      thoi_gian_tao: item.createdTime,
      thoi_gian_tiep_nhan: item.approvedTime || item.createdTime,
      thoi_gian_phan_hoi_du_kien: item.deadlineTime,
      ngay_du_kien_hoan_thanh: item.deadlineTime,
      id_linh_vuc_phan_anh: catObj ? catObj.id : null,
      id_to: userObj ? userObj.id : null,
      nguoi_tao: userObj ? userObj.id : null,
      id_video: [],
      id_video_giai_quyet: [],
    };

    const createdReport = await prisma.phan_anh.create({
      data: reportData
    });

    // 1st history event: Đã gửi (Always required)
    await prisma.lich_su_trang_thai.create({
      data: {
        id_phan_anh: createdReport.id,
        ten: 'Đã gửi',
        ghi_chu: 'Người dân đã gửi đơn phản ánh thành công.',
        thoi_gian_tao: item.createdTime,
        nguoi_tao: userObj ? userObj.id : null,
      }
    });

    // 2nd history event: Đang xử lý (if approved/processing)
    if (item.status === 'Đang xử lý') {
      await prisma.lich_su_trang_thai.create({
        data: {
          id_phan_anh: createdReport.id,
          ten: 'Đang xử lý',
          ghi_chu: 'Phản ánh đã được tiếp nhận và phân công chuyên viên xử lý.',
          thoi_gian_tao: item.approvedTime || new Date(item.createdTime.getTime() + 1000 * 60 * 30),
          nguoi_tao: userObj ? userObj.id : null,
        }
      });
    }

    console.log(`[KP13 Seeded] Code: ${item.code} (Length: ${item.code.length}) | Title: "${item.title}" | Status: "${item.status}" | SLA: "${item.slaLabel}" | History count: ${item.status === 'Đang xử lý' ? 2 : 1}`);
  }

  console.log('\n--- SUCCESS: Cleaned invalid codes & seeded 5 valid 8-character codes matching Regex! ---');
}

main()
  .catch(err => {
    console.error('Error during execution:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
