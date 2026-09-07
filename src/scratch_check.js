import "./config/environment.config.js";
import prisma from "./config/database.config.js";

async function main() {
  const ratings = await prisma.danh_gia_gap_lanh_dao.findMany({
    include: {
      dang_ky_gap_lanh_dao: {
        include: {
          khung_gio_gap_lanh_dao: {
            include: {
              lich_gap_lanh_dao: {
                include: {
                  lanh_dao: true
                }
              }
            }
          }
        }
      }
    }
  });
  console.log("ALL RATINGS COUNT:", ratings.length);
  console.log("ALL RATINGS:", JSON.stringify(ratings, null, 2));

  const completedRegistrations = await prisma.dang_ky_gap_lanh_dao.findMany({
    select: {
      id: true,
      ma_dang_ky: true,
      ho_ten: true,
      trang_thai: true,
      is_active: true,
      is_delete: true,
      danh_gia_gap_lanh_dao: true
    }
  });
  console.log("ALL REGISTRATIONS:", JSON.stringify(completedRegistrations, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
