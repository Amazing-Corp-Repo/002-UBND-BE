import prisma from "./config/database.config.js";

async function main() {
  const roles = await prisma.roles.findMany({
    include: {
      role_permissions: {
        include: {
          permissions: true
        }
      }
    }
  });

  roles.forEach(r => {
    console.log(`\n=== ROLE: ${r.ten_role} (${r.ma_role}) ===`);
    const perms = r.role_permissions.map(rp => rp.permissions.code);
    console.log("PA perms:", perms.filter(p => p.startsWith("PA_")));
  });

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
});
