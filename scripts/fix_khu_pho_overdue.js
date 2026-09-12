import 'dotenv/config';
import prisma from '../src/config/database.config.js';

async function main() {
  console.log('--- Step 1: Finding complaints with bad khu_pho ("KP...") ---');
  
  const allReports = await prisma.phan_anh.findMany({
    select: {
      id: true,
      ma_phan_anh: true,
      tieu_de: true,
      khu_pho: true,
    }
  });

  const badReports = allReports.filter(r => 
    r.khu_pho && (
      r.khu_pho.startsWith('KP') || 
      r.khu_pho.startsWith('KP ') || 
      r.khu_pho.includes('KP 0') || 
      r.khu_pho.includes('KP 1')
    )
  );

  console.log(`Found ${badReports.length} complaints with 'KP...' formatting.`);
  const badIds = badReports.map(r => r.id);

  if (badIds.length > 0) {
    console.log('Deleting associated records for bad complaints...');
    
    // Delete de_nghi_gia_han_file & de_nghi_gia_han_phan_anh
    const extensions = await prisma.de_nghi_gia_han_phan_anh.findMany({
      where: { id_phan_anh: { in: badIds } },
      select: { id: true }
    });
    const extIds = extensions.map(e => e.id);
    if (extIds.length > 0) {
      await prisma.de_nghi_gia_han_file.deleteMany({
        where: { id_de_nghi_gia_han: { in: extIds } }
      });
      await prisma.de_nghi_gia_han_phan_anh.deleteMany({
        where: { id: { in: extIds } }
      });
    }

    // Delete dinh_kem_phan_anh
    await prisma.dinh_kem_phan_anh.deleteMany({
      where: { id_phan_anh: { in: badIds } }
    });

    // Delete lich_su_trang_thai
    await prisma.lich_su_trang_thai.deleteMany({
      where: { id_phan_anh: { in: badIds } }
    });

    // Delete phan_anh
    const deletedCount = await prisma.phan_anh.deleteMany({
      where: { id: { in: badIds } }
    });
    console.log(`Successfully deleted ${deletedCount.count} complaints.`);
  }

  console.log('\n--- Step 2: Fetching active Categories and Users ---');
  const categories = await prisma.linh_vuc_phan_anh.findMany({
    where: { is_delete: false }
  });
  console.log(`Found ${categories.length} active categories:`, categories.map(c => c.ten));

  const users = await prisma.nguoi_dung.findMany({
    where: { is_delete: false }
  });
  console.log(`Found ${users.length} active users:`, users.map(u => u.ten_dang_nhap));

  const defaultUser = users.find(u => u.ten_dang_nhap === 'admin') || users[0];
  const defaultCategory = categories[0];

  console.log('\n--- Step 3: Seeding 10 fresh Overdue Complaints with proper "Khu phố X" ---');

  const now = new Date();
  const pastDays = (days) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const overdueSamples = [
    {
      code: 'PA-20260901-0101',
      title: 'Tụ điểm rác thải chưa dọn dẹp gây ô nhiễm bốc mùi',
      description: 'Điểm tập kết rác thải tự phát tại ngã ba Man Thiện ùn ứ 3 ngày chưa được thu gom, gây mùi hôi thối ảnh hưởng người dân xung quanh.',
      khuPho: 'Khu phố 1',
      viTri: 'Ngã ba Man Thiện - Đường D2, Phường Tăng Nhơn Phú B, TP. Thủ Đức',
      mucDo: 'Khẩn cấp',
      citizen: 'Nguyễn Văn Anh',
      phone: '0901234561',
      createdDaysAgo: 12,
      deadlineDaysAgo: 5,
    },
    {
      code: 'PA-20260901-0102',
      title: 'Đèn chiếu sáng công cộng hỏng ngõ 142 Lê Văn Việt',
      description: 'Hệ thống đèn đường chiếu sáng ngõ 142 Lê Văn Việt bị hỏng 5 ngày qua, buổi tối tối om tiềm ẩn nguy cơ tai nạn giao thông.',
      khuPho: 'Khu phố 2',
      viTri: 'Ngõ 142 Lê Văn Việt, Phường Tăng Nhơn Phú B, TP. Thủ Đức',
      mucDo: 'Thông thường',
      citizen: 'Trần Thị Bình',
      phone: '0901234562',
      createdDaysAgo: 14,
      deadlineDaysAgo: 7,
    },
    {
      code: 'PA-20260901-0103',
      title: 'Đường dây cáp viễn thông sà xuống lòng đường nguy hiểm',
      description: 'Đường dây cáp viễn thông đứt thòng lọng sà sát mặt đường hẻm 89 Đình Phong Phú, xe tải đi qua nguy cơ vướng phải.',
      khuPho: 'Khu phố 3',
      viTri: 'Hẻm 89 Đình Phong Phú, Phường Tăng Nhơn Phú B, TP. Thủ Đức',
      mucDo: 'Khẩn cấp',
      citizen: 'Phạm Minh Cường',
      phone: '0901234563',
      createdDaysAgo: 10,
      deadlineDaysAgo: 4,
    },
    {
      code: 'PA-20260901-0104',
      title: 'Cống thoát nước bị nghẹt gây ngập cục bộ mùa mưa',
      description: 'Miệng cống thoát nước trước số nhà 45 Lã Xuân Oai bị đất đá bít kín, nước mưa tràn vào nhà dân.',
      khuPho: 'Khu phố 4',
      viTri: 'Trước số nhà 45 Lã Xuân Oai, Phường Tăng Nhơn Phú B, TP. Thủ Đức',
      mucDo: 'Khẩn cấp',
      citizen: 'Lê Văn Dung',
      phone: '0901234564',
      createdDaysAgo: 11,
      deadlineDaysAgo: 6,
    },
    {
      code: 'PA-20260901-0105',
      title: 'Quán ăn lấn chiếm vỉa hè gây cản trở người đi bộ',
      description: 'Quán nhậu bày bàn ghế chiếm trọn vỉa hè đường Trương Văn Thành từ 18h hàng ngày, người đi bộ phải đi xuống lòng đường.',
      khuPho: 'Khu phố 5',
      viTri: 'Số 78 Trương Văn Thành, Phường Tăng Nhơn Phú B, TP. Thủ Đức',
      mucDo: 'Thông thường',
      citizen: 'Hoàng Thị Giang',
      phone: '0901234565',
      createdDaysAgo: 13,
      deadlineDaysAgo: 6,
    },
    {
      code: 'PA-20260901-0106',
      title: 'Cây xanh nguy cơ gãy đổ mùa mưa bão',
      description: 'Cây phượng già trước hẻm 22 ngả nghiêng có dấu hiệu mục gốc, đề nghị tỉa cành để đảm bảo an toàn.',
      khuPho: 'Khu phố 6',
      viTri: 'Hẻm 22 đường số 6, Phường Tăng Nhơn Phú B, TP. Thủ Đức',
      mucDo: 'Khẩn cấp',
      citizen: 'Đặng Văn Hùng',
      phone: '0901234566',
      createdDaysAgo: 15,
      deadlineDaysAgo: 8,
    },
    {
      code: 'PA-20260901-0107',
      title: 'Tiếng ồn karaoke loa kéo quá giờ quy định',
      description: 'Nhóm thanh niên hát karaoke loa kéo âm lượng lớn sau 23h tại hẻm 102 Man Thiện làm ảnh hưởng giấc ngủ người dân.',
      khuPho: 'Khu phố 1',
      viTri: 'Hẻm 102 Man Thiện, Phường Tăng Nhơn Phú B, TP. Thủ Đức',
      mucDo: 'Thông thường',
      citizen: 'Vũ Thị Hương',
      phone: '0901234567',
      createdDaysAgo: 9,
      deadlineDaysAgo: 3,
    },
    {
      code: 'PA-20260901-0108',
      title: 'Nắp hố ga bị mất gây hố sâu nguy hiểm',
      description: 'Hố ga mất nắp trên đường D1 khu công nghệ cao chỉ được rào tạm bằng cành cây, rất nguy hiểm cho người đi xe máy đêm tối.',
      khuPho: 'Khu phố 2',
      viTri: 'Đường D1, Khu công nghệ cao, Phường Tăng Nhơn Phú B, TP. Thủ Đức',
      mucDo: 'Khẩn cấp',
      citizen: 'Bùi Văn Khoa',
      phone: '0901234568',
      createdDaysAgo: 12,
      deadlineDaysAgo: 5,
    },
    {
      code: 'PA-20260901-0109',
      title: 'Công trình xây dựng xả nước bẩn ra lòng đường',
      description: 'Công trình xây dựng nhà ở xả nước xi măng trực tiếp ra mặt đường gây trơn trượt và ô nhiễm mỹ quan đô thị.',
      khuPho: 'Khu phố 3',
      viTri: 'Số 112 Đình Phong Phú, Phường Tăng Nhơn Phú B, TP. Thủ Đức',
      mucDo: 'Thông thường',
      citizen: 'Đỗ Thị Lan',
      phone: '0901234569',
      createdDaysAgo: 10,
      deadlineDaysAgo: 4,
    },
    {
      code: 'PA-20260901-0110',
      title: 'Vạch kẻ đường sang đường bị mờ tại cổng trường học',
      description: 'Vạch kẻ đường cho người đi bộ trước cổng trường tiểu học Tăng Nhơn Phú B bị mờ nét, học sinh sang đường rất mất an toàn.',
      khuPho: 'Khu phố 4',
      viTri: 'Cổng trường tiểu học Tăng Nhơn Phú B, TP. Thủ Đức',
      mucDo: 'Thông thường',
      citizen: 'Ngô Văn Nam',
      phone: '0901234570',
      createdDaysAgo: 14,
      deadlineDaysAgo: 7,
    },
  ];

  for (let i = 0; i < overdueSamples.length; i++) {
    const sample = overdueSamples[i];
    const createdTime = pastDays(sample.createdDaysAgo);
    const deadlineTime = pastDays(sample.deadlineDaysAgo);

    const catIndex = i % categories.length;
    const catObj = categories[catIndex] || defaultCategory;

    const userIndex = i % users.length;
    const userObj = users[userIndex] || defaultUser;

    const reportData = {
      ma_phan_anh: sample.code,
      tieu_de: sample.title,
      mo_ta: sample.description,
      muc_do: sample.mucDo,
      vi_tri: sample.viTri,
      khu_pho: sample.khuPho, // Format: "Khu phố 1", "Khu phố 2", etc.
      ten_nguoi_phan_anh: sample.citizen,
      sdt_nguoi_phan_anh: sample.phone,
      is_approve: true,
      thoi_gian_tao: createdTime,
      thoi_gian_tiep_nhan: createdTime,
      thoi_gian_phan_hoi_du_kien: deadlineTime,
      ngay_du_kien_hoan_thanh: deadlineTime,
      id_linh_vuc_phan_anh: catObj ? catObj.id : null,
      id_to: userObj ? userObj.id : null,
      nguoi_tao: userObj ? userObj.id : null,
      id_video: [],
      id_video_giai_quyet: [],
    };

    const newReport = await prisma.phan_anh.create({
      data: reportData
    });

    // Create history entry
    await prisma.lich_su_trang_thai.create({
      data: {
        id_phan_anh: newReport.id,
        ten: 'Đang xử lý',
        ghi_chu: 'Phản ánh đã được tiếp nhận và phân công chuyên viên xử lý.',
        thoi_gian_tao: createdTime,
        nguoi_tao: userObj ? userObj.id : null,
      }
    });

    console.log(`[${i + 1}/10] Created ${newReport.ma_phan_anh} | Khu phố: "${newReport.khu_pho}" | Category: "${catObj?.ten}" | User: "${userObj?.ten_dang_nhap}" | Deadline: ${deadlineTime.toISOString()}`);
  }

  console.log('\n--- SUCCESS: Database successfully updated with 10 clean overdue complaints! ---');
}

main()
  .catch(err => {
    console.error('Error during cleanup and seeding:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
