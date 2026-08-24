import "./config/environment.config.js";
import prisma from "./config/database.config.js";

async function main() {
  const counterRatings = await prisma.danh_gia_tiep_dan.findMany({
    orderBy: { thoi_gian_tao: "desc" },
    take: 10
  });
  console.log("COUNTER RATINGS IN DB:", JSON.stringify(counterRatings, null, 2));
}

main().catch(console.error).finally(() => process.exit(0));
