import "dotenv/config";
import prisma from "../src/config/database.config.js";

async function main() {
  const codes = ["0DKA7EBP", "3M8DZF3Y", "1R0SEAOP"];
  console.log("Finding reports to delete:", codes);

  for (const code of codes) {
    const report = await prisma.phan_anh.findFirst({
      where: { ma_phan_anh: code }
    });

    if (!report) {
      console.log(`Report with code ${code} not found.`);
      continue;
    }

    const id = report.id;
    console.log(`Deleting report ${code} (ID: ${id})...`);

    if (prisma.lich_su_trang_thai) await prisma.lich_su_trang_thai.deleteMany({ where: { id_phan_anh: id } });
    if (prisma.phan_cong_xu_ly) await prisma.phan_cong_xu_ly.deleteMany({ where: { id_phan_anh: id } });
    if (prisma.dinh_kem_phan_anh) await prisma.dinh_kem_phan_anh.deleteMany({ where: { id_phan_anh: id } });
    
    await prisma.phan_anh.delete({ where: { id } });
    console.log(`Successfully deleted report ${code}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
