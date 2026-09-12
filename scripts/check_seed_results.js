import 'dotenv/config';
import prisma from '../src/config/database.config.js';

async function main() {
  const catCount = await prisma.linh_vuc_phan_anh.count({ where: { is_delete: false } });
  const mgrCount = await prisma.linh_vuc_phan_anh_nguoi_quan_ly.count();
  const reportCount = await prisma.phan_anh.count();
  const reports = await prisma.phan_anh.findMany({ select: { sdt_nguoi_phan_anh: true } });
  const uniquePhones = new Set(reports.map(r => r.sdt_nguoi_phan_anh).filter(Boolean)).size;
  const extCount = await prisma.de_nghi_gia_han_phan_anh.count();

  console.log('=== DB SEED SUMMARY ===');
  console.log('Lĩnh vực quản lý active:', catCount);
  console.log('Phân công người quản lý (nguoi_quan_ly):', mgrCount);
  console.log('Tổng phản ánh:', reportCount);
  console.log('Số SĐT người dân sử dụng duy nhất:', uniquePhones);
  console.log('Tổng số đề nghị gia hạn:', extCount);
}

main().finally(() => prisma.$disconnect());
