import 'dotenv/config';
import prisma from '../src/config/database.config.js';
import crypto from 'crypto';

const CODE_REGEX = /^[A-Z0-9]{8}$/;

const NEW_ADMIN_CATEGORIES = [
  {
    ten: 'Hộ tịch & Chứng thực',
    mo_ta: 'Tiếp nhận phản ánh về thủ tục đăng ký kết hôn, khai sinh, khai tử, chứng thực sao y bản chính, chữ ký và tư pháp.',
  },
  {
    ten: 'Đất đai & Cấp phép xây dựng',
    mo_ta: 'Phản ánh vướng mắc thủ tục đất đai, cấp GCN quyền sử dụng đất, cấp phép xây dựng nhà ở và tranh chấp ranh giới.',
  },
  {
    ten: 'Thủ tục Hành chính công',
    mo_ta: 'Giải quyết phản ánh về hồ sơ một cửa, chậm trễ trả kết quả thủ tục hành chính, thái độ phục vụ của cán bộ.',
  },
  {
    ten: 'Quản lý Đô thị & Trật tự xây dựng',
    mo_ta: 'Kiểm tra xử lý vi phạm trật tự xây dựng, sai phép, lấn chiếm lòng lề đường và hành lang an toàn giao thông.',
  },
  {
    ten: 'Vệ sinh Môi trường & Rác thải',
    mo_ta: 'Phản ánh rác thải sinh hoạt, ô nhiễm nguồn nước, tiếng ồn cơ sở sản xuất và khí thải xưởng công nghiệp.',
  },
  {
    ten: 'An ninh Trật tự & PCCC',
    mo_ta: 'Đảm bảo an ninh trật tự khu dân cư, an toàn phòng cháy chữa cháy, đăng ký tạm trú tạm vắng.',
  },
  {
    ten: 'Chính sách xã hội & Bảo trợ',
    mo_ta: 'Giải quyết chế độ chính sách người có công, bảo hiểm y tế, trợ cấp thất nghiệp và quà tặng bảo trợ xã hội.',
  }
];

const CITIZEN_POOL = [
  { name: 'Nguyễn Văn An', phone: '0912345678' },
  { name: 'Trần Thị Bình', phone: '0923456789' },
  { name: 'Lê Hoàng Cường', phone: '0934567890' },
  { name: 'Phạm Minh Đức', phone: '0945678901' },
  { name: 'Vũ Thị Em', phone: '0956789012' },
  { name: 'Đặng Quốc Hùng', phone: '0967890123' },
  { name: 'Bùi Thanh Hương', phone: '0978901234' },
  { name: 'Đỗ Quang Hải', phone: '0989012345' },
  { name: 'Hoàng Văn Nam', phone: '0990123456' },
  { name: 'Ngô Thị Phương', phone: '0901234567' },
  { name: 'Dương Văn Tấn', phone: '0911223344' },
  { name: 'Lương Thị Ngọc', phone: '0922334455' },
  { name: 'Hồ Thanh Phong', phone: '0933445566' },
  { name: 'Võ Thị Hoa', phone: '0944556677' },
  { name: 'Phan Văn Trí', phone: '0955667788' },
  { name: 'Trịnh Kim Chi', phone: '0966778899' },
  { name: 'Đào Văn Vinh', phone: '0977889900' },
  { name: 'Đinh Thị Thu', phone: '0988990011' },
  { name: 'Lý Văn Phúc', phone: '0999001122' },
  { name: 'Cao Văn Hân', phone: '0900112233' },
  { name: 'Mai Thị Tuyết', phone: '0912121212' },
  { name: 'Tạ Văn Tuấn', phone: '0923232323' },
  { name: 'Nguyễn Đăng Khoa', phone: '0934343434' },
  { name: 'Trần Bảo Anh', phone: '0945454545' },
  { name: 'Lê Khánh Vân', phone: '0956565656' },
  { name: 'Phạm Huỳnh Đức', phone: '0967676767' },
  { name: 'Vũ Hoài Nam', phone: '0978787878' },
  { name: 'Đặng Thảo Nguyên', phone: '0989898989' },
  { name: 'Bùi Anh Tuấn', phone: '0913579246' },
  { name: 'Đỗ Thị Lan', phone: '0924681357' },
  { name: 'Hoàng Gia Bảo', phone: '0935791133' },
  { name: 'Ngô Văn Thành', phone: '0946802244' },
  { name: 'Dương Thị Yến', phone: '0957913355' },
  { name: 'Hồ Văn Lộc', phone: '0968024466' },
  { name: 'Võ Thanh Bình', phone: '0979135577' },
  { name: 'Phan Thị Diệu', phone: '0980246688' },
  { name: 'Trịnh Văn Sang', phone: '0991357799' },
  { name: 'Đào Thị Hồng', phone: '0902468800' },
  { name: 'Đinh Văn Hoàng', phone: '0913579911' },
  { name: 'Lý Thị Thảo', phone: '0924680022' },
  { name: 'Châu Văn Đạt', phone: '0935791144' },
  { name: 'Huỳnh Thị Cúc', phone: '0946802255' },
  { name: 'Trương Văn Hải', phone: '0957913366' },
  { name: 'Nguyễn Thị Loan', phone: '0968024477' },
  { name: 'Phùng Văn Phát', phone: '0979135588' },
  { name: 'Lại Thị Hạnh', phone: '0980246699' },
  { name: 'Bạch Văn Định', phone: '0991357700' },
  { name: 'Nghiêm Thị Quyên', phone: '0902468811' },
  { name: 'Khuất Văn Long', phone: '0913579922' },
  { name: 'Thái Thị Dung', phone: '0924680033' }
];

const ADMIN_TITLES = [
  'Trễ hạn trả kết quả hồ sơ cấp Giấy chứng nhận quyền sử dụng đất',
  'Cán bộ tiếp nhận hồ sơ hộ tịch yêu cầu bổ sung giấy tờ ngoài quy định',
  'Công trình xây dựng nhà ở sai giấy phép làm sụt nứt nhà giáp ranh',
  'Trạm trộn bê tông xả bụi và nước bẩn ra khu dân cư gây ô nhiễm',
  'Cơ sở sản xuất gỗ gây tiếng ồn và bụi gỗ vượt quy chuẩn',
  'Chưa nhận được tiền trợ cấp xã hội quý III theo danh sách duyệt',
  'Vướng mắc đăng ký khai sinh cho trẻ em quá hạn theo quy định',
  'Tụ điểm karaoke tự phát hát âm lượng lớn sau 23h đêm',
  'Hố ga thi công công trình đô thị không có biển cảnh báo an toàn',
  'Chậm trễ xác minh hiện trạng sử dụng đất phục vụ bồi thường',
  'Thái độ phục vụ chưa đúng chuẩn mực của bộ phận tiếp nhận hồ sơ',
  'Cửa hàng kinh doanh lấn chiếm vỉa hè lối đi cho người khuyết tật'
];

const EXTENSION_REASONS = [
  'Do cần phối hợp với Văn phòng Đăng ký Đất đai TP. Thủ Đức để trích đo địa chính lại ranh giới thửa đất, kính đề nghị gia hạn thời gian xử lý thêm 5 ngày.',
  'Công trình cần sự kiểm tra hiện trường phối hợp giữa Đội Thanh tra xây dựng địa bàn và Chi cục Thuế, đề xuất gia hạn xử lý thêm 4 ngày.',
  'Thời tiết mưa bão kéo dài ảnh hưởng việc khắc phục hệ thống thoát nước ngầm, kính đề nghị gia hạn 3 ngày.',
  'Cần thời gian họp xác minh liên ngành và thu thập chứng cứ tranh chấp đất đai giữa các hộ dân giáp ranh, đề xuất gia hạn 7 ngày.',
  'Đang trong thời gian chờ khảo sát địa chất và phê duyệt phương án thi công lại mảng xanh đô thị, xin gia hạn 4 ngày.',
  'Bộ phận chuyên môn đang chờ văn bản hướng dẫn bổ sung từ Sở Tài nguyên và Môi trường, đề nghị gia hạn 5 ngày.'
];

const AUG_1 = new Date('2026-08-01T08:00:00.000Z').getTime();
const SEPT_12 = new Date('2026-09-12T17:00:00.000Z').getTime();

const getRandomDateInAugSept = () => {
  const time = AUG_1 + Math.random() * (SEPT_12 - AUG_1);
  return new Date(time);
};

async function main() {
  console.log('=== SEEDING NEW ADMIN CATEGORIES, MANAGERS, REPORTS & EXTENSION REQUESTS ===');

  const users = await prisma.nguoi_dung.findMany({
    where: { is_active: true, is_delete: false }
  });

  if (users.length === 0) {
    console.error('Error: No active users found in DB.');
    process.exit(1);
  }

  const defaultUser = users.find(u => u.ten_dang_nhap === 'admin') || users[0];

  console.log('\n--- Step 1: Creating Public Administration Categories & Assigning Managers ---');
  const createdCategories = [];

  for (let i = 0; i < NEW_ADMIN_CATEGORIES.length; i++) {
    const catData = NEW_ADMIN_CATEGORIES[i];

    let category = await prisma.linh_vuc_phan_anh.findFirst({
      where: { ten: catData.ten, is_delete: false }
    });

    if (!category) {
      category = await prisma.linh_vuc_phan_anh.create({
        data: {
          ten: catData.ten,
          mo_ta: catData.mo_ta,
          is_active: true,
          nguoi_tao: defaultUser.id,
        }
      });
      console.log(`Created Category: [${category.ten}]`);

      const manager1 = users[i % users.length];
      const manager2 = users[(i + 1) % users.length];
      const managers = [...new Set([manager1.id, manager2.id])];

      for (const mId of managers) {
        await prisma.linh_vuc_phan_anh_nguoi_quan_ly.create({
          data: {
            id_linh_vuc_phan_anh: category.id,
            id_nguoi_dung: mId,
            nguoi_tao: defaultUser.id,
            thoi_gian_tao: new Date().toISOString(),
          }
        });
      }
      console.log(`  Assigned managers: ${managers.length} accounts.`);
    } else {
      console.log(`Category [${category.ten}] already exists.`);
    }

    createdCategories.push(category);
  }

  console.log('\n--- Step 2: Creating Additional Reports with New Categories & 50+ Phone Numbers ---');

  const existingReports = await prisma.phan_anh.findMany({ select: { ma_phan_anh: true } });
  const existingCodes = new Set(existingReports.map(r => r.ma_phan_anh));

  const generateUniqueCode = (kpNumStr) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    do {
      let rand = '';
      for (let i = 0; i < 5; i++) {
        rand += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      code = `K${kpNumStr}${rand}`;
    } while (existingCodes.has(code) || !CODE_REGEX.test(code));
    existingCodes.add(code);
    return code;
  };

  const reportsToInsert = [];
  const historiesToInsert = [];
  const createdReportObjects = [];

  const STATUSES = ['Đang xử lý', 'Đang xử lý', 'Đã giải quyết', 'Đóng', 'Từ chối'];

  for (let kp = 1; kp <= 45; kp++) {
    const kpNumStr = String(kp).padStart(2, '0');
    const khuPhoName = `KP ${kpNumStr}`;

    const extraCount = 3 + (kp % 3);

    for (let r = 1; r <= extraCount; r++) {
      const reportId = crypto.randomUUID();
      const code = generateUniqueCode(kpNumStr);

      if (!CODE_REGEX.test(code)) {
        throw new Error(`Code [${code}] violates Regex /^[A-Z0-9]{8}$/!`);
      }

      const categoryObj = createdCategories[(kp + r) % createdCategories.length];
      const citizenObj = CITIZEN_POOL[(kp * 3 + r * 7) % CITIZEN_POOL.length];
      const titleTemplate = ADMIN_TITLES[(kp + r) % ADMIN_TITLES.length];
      const locationTemplate = `Đường số ${1 + (r % 10)}, ${khuPhoName}`;

      const status = STATUSES[(kp + r) % STATUSES.length];
      const isUrgent = (kp + r) % 4 === 0;
      const mucDo = isUrgent ? 'Khẩn cấp' : 'Thông thường';

      const createdDate = getRandomDateInAugSept();
      let deadlineDate = new Date(createdDate.getTime() + 4 * 24 * 60 * 60 * 1000);

      const reportData = {
        id: reportId,
        ma_phan_anh: code,
        tieu_de: `${titleTemplate} (${khuPhoName})`,
        mo_ta: `Nội dung phản ánh về ${titleTemplate.toLowerCase()} tại vị trí ${locationTemplate}, Phường Tăng Nhơn Phú. Đề nghị cán bộ chuyên trách kiểm tra giải quyết.`,
        khu_pho: khuPhoName,
        vi_tri: `${locationTemplate}, Phường Tăng Nhơn Phú, TP. Thủ Đức`,
        muc_do: mucDo,
        id_linh_vuc_phan_anh: categoryObj.id,
        ten_nguoi_phan_anh: citizenObj.name,
        sdt_nguoi_phan_anh: citizenObj.phone,
        is_approve: status !== 'Đã gửi',
        thoi_gian_tao: createdDate,
        thoi_gian_tiep_nhan: new Date(createdDate.getTime() + 2 * 60 * 60 * 1000),
        thoi_gian_phan_hoi_du_kien: deadlineDate,
        ngay_du_kien_hoan_thanh: deadlineDate,
        nguoi_tao: defaultUser.id,
        id_to: defaultUser.id,
        id_video: [],
        id_video_giai_quyet: [],
      };

      reportsToInsert.push(reportData);
      createdReportObjects.push({ ...reportData, status });

      historiesToInsert.push({
        id: crypto.randomUUID(),
        id_phan_anh: reportId,
        ten: 'Đã gửi',
        ghi_chu: 'Người dân đã gửi đơn phản ánh thành công qua cổng Dịch vụ công.',
        thoi_gian_tao: createdDate,
        nguoi_tao: defaultUser.id,
      });

      if (status === 'Đang xử lý') {
        historiesToInsert.push({
          id: crypto.randomUUID(),
          id_phan_anh: reportId,
          ten: 'Đang xử lý',
          ghi_chu: `Cán bộ chuyên trách thuộc lĩnh vực [${categoryObj.ten}] đã tiếp nhận và đang tiến hành xác minh.`,
          thoi_gian_tao: new Date(createdDate.getTime() + 2 * 60 * 60 * 1000),
          nguoi_tao: defaultUser.id,
        });
      } else if (status === 'Đã giải quyết') {
        historiesToInsert.push({
          id: crypto.randomUUID(),
          id_phan_anh: reportId,
          ten: 'Đang xử lý',
          ghi_chu: `Cán bộ chuyên trách thuộc lĩnh vực [${categoryObj.ten}] đã tiếp nhận và đang tiến hành xác minh.`,
          thoi_gian_tao: new Date(createdDate.getTime() + 2 * 60 * 60 * 1000),
          nguoi_tao: defaultUser.id,
        });
        historiesToInsert.push({
          id: crypto.randomUUID(),
          id_phan_anh: reportId,
          ten: 'Đã giải quyết',
          ghi_chu: 'Đã giải quyết hoàn tất phản ánh theo đúng quy định hành chính.',
          thoi_gian_tao: new Date(createdDate.getTime() + 36 * 60 * 60 * 1000),
          nguoi_tao: defaultUser.id,
        });
      } else if (status === 'Đóng') {
        historiesToInsert.push({
          id: crypto.randomUUID(),
          id_phan_anh: reportId,
          ten: 'Đang xử lý',
          ghi_chu: `Cán bộ chuyên trách thuộc lĩnh vực [${categoryObj.ten}] đã tiếp nhận và đang tiến hành xác minh.`,
          thoi_gian_tao: new Date(createdDate.getTime() + 2 * 60 * 60 * 1000),
          nguoi_tao: defaultUser.id,
        });
        historiesToInsert.push({
          id: crypto.randomUUID(),
          id_phan_anh: reportId,
          ten: 'Đóng',
          ghi_chu: 'Hồ sơ đã nghiệm thu giải quyết xong và đóng lại.',
          thoi_gian_tao: new Date(createdDate.getTime() + 48 * 60 * 60 * 1000),
          nguoi_tao: defaultUser.id,
        });
      } else if (status === 'Từ chối') {
        historiesToInsert.push({
          id: crypto.randomUUID(),
          id_phan_anh: reportId,
          ten: 'Từ chối',
          ghi_chu: 'Đơn từ chối do hồ sơ không đúng thẩm quyền giải quyết.',
          thoi_gian_tao: new Date(createdDate.getTime() + 5 * 60 * 60 * 1000),
          nguoi_tao: defaultUser.id,
        });
      }
    }
  }

  console.log(`Inserting ${reportsToInsert.length} new administrative reports in bulk...`);
  await prisma.phan_anh.createMany({ data: reportsToInsert });

  console.log(`Inserting ${historiesToInsert.length} history records in bulk...`);
  await prisma.lich_su_trang_thai.createMany({ data: historiesToInsert });

  console.log('\n--- Step 3: Creating Extension Requests (PENDING, APPROVED, REJECTED) ---');

  const inProgressReports = createdReportObjects.filter(r => r.status === 'Đang xử lý');
  const extensionsToInsert = [];
  const EXTENSION_STATUSES = ['PENDING', 'PENDING', 'APPROVED', 'REJECTED'];

  for (let i = 0; i < Math.min(inProgressReports.length, 50); i++) {
    const report = inProgressReports[i];
    const extStatus = EXTENSION_STATUSES[i % EXTENSION_STATUSES.length];
    const reason = EXTENSION_REASONS[i % EXTENSION_REASONS.length];

    const requestUser = users[i % users.length];
    const approveUser = users[(i + 1) % users.length];

    const createdDate = new Date(report.thoi_gian_tao.getTime() + 24 * 60 * 60 * 1000);
    const daysRequested = 3 + (i % 5);
    const newDeadline = new Date(report.ngay_du_kien_hoan_thanh.getTime() + daysRequested * 24 * 60 * 60 * 1000);

    const isDecided = extStatus === 'APPROVED' || extStatus === 'REJECTED';

    extensionsToInsert.push({
      id: crypto.randomUUID(),
      id_phan_anh: report.id,
      ly_do_gia_han: reason,
      han_ban_dau: report.ngay_du_kien_hoan_thanh || report.thoi_gian_tao,
      han_de_xuat_moi: newDeadline,
      trang_thai: extStatus,
      id_nguoi_de_nghi: requestUser.id,
      id_nguoi_duyet: isDecided ? approveUser.id : null,
      thoi_gian_duyet: isDecided ? new Date(createdDate.getTime() + 12 * 60 * 60 * 1000) : null,
      thoi_gian_tao: createdDate,
    });
  }

  console.log(`Inserting ${extensionsToInsert.length} extension requests...`);
  await prisma.de_nghi_gia_han_phan_anh.createMany({ data: extensionsToInsert });

  console.log(`\n🎉 ALL SEEDING COMPLETED!`);
  console.log(`- Created ${NEW_ADMIN_CATEGORIES.length} Public Administration Categories with assigned Managers.`);
  console.log(`- Created ${reportsToInsert.length} New Reports with 50+ Unique Citizen Phone Numbers.`);
  console.log(`- Created ${extensionsToInsert.length} Extension Requests (PENDING, APPROVED, REJECTED).`);
}

main()
  .catch(err => {
    console.error('Seed execution error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
