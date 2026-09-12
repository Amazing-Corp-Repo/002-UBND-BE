import prisma from '../src/config/database.config.js';

async function main() {
  const allReports = await prisma.phan_anh.findMany({
    select: {
      id: true,
      ma_phan_anh: true,
      tieu_de: true,
      khu_pho: true,
      thoi_gian_tao: true,
      thoi_gian_phan_hoi_du_kien: true,
      ngay_du_kien_hoan_thanh: true,
    }
  });
  console.log('Total complaints:', allReports.length);
  console.log('\nComplaints list:');
  allReports.forEach(r => {
    console.log(`- ID: ${r.id} | Code: ${r.ma_phan_anh} | KhuPhố: "${r.khu_pho}" | Title: ${r.tieu_de}`);
  });

  const categories = await prisma.linh_vuc_phan_anh.findMany({
    select: { id: true, ten: true }
  });
  console.log('\nCategories:', categories);

  const users = await prisma.nguoi_dung.findMany({
    select: { id: true, ten_dang_nhap: true, ho_va_ten: true }
  });
  console.log('\nUsers:', users);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
