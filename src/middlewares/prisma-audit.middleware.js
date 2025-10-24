import prisma from "../config/database.config.js";

export default async function registerPrismaAudit() {
    if (!prisma || typeof prisma.$extends !== "function") {
        console.error("❌ Prisma không hợp lệ hoặc chưa hỗ trợ $extends()");
        return;
    }

    const excludedModels = ["audit_logs", "otp", "refresh_token", "user_session_logs"];

    const prismaWithAudit = prisma.$extends({
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }) {
                    if (excludedModels.includes(model.toLowerCase())) return query(args);
                    if (!["create", "update"].includes(operation)) return query(args);

                    const userId = global.prisma_user_id || null;
                    const now = new Date().toISOString();

                    let oldRecord = null;
                    if (operation === "update" && args?.where?.id) {
                        try {
                            oldRecord = await prisma[model.toLowerCase()].findUnique({
                                where: { id: args.where.id },
                            });
                        } catch (err) {
                            console.warn(`[AUDIT] Không thể lấy old record cho ${model}:`, err.message);
                        }
                    }

                    const extraFields = {};
                    if (operation === "update") {
                        extraFields.thoi_gian_cap_nhap = now;
                        extraFields.nguoi_cap_nhap = userId;
                    } else if (operation === "create") {
                        extraFields.thoi_gian_tao = now;
                        extraFields.nguoi_tao = userId;
                    }

                    if (args.data) args.data = { ...args.data, ...extraFields };

                    const result = await query(args);

                    try {
                        await prisma.audit_logs.create({
                            data: {
                                table_name: model.toLowerCase(),
                                record_id: result.id,
                                action: operation.toUpperCase(),
                                old_data: oldRecord ? JSON.stringify(oldRecord) : null,
                                new_data: JSON.stringify(result),
                                performed_by: userId,
                            },
                        });
                    } catch (err) {
                        console.error(`[AUDIT] Lỗi khi ghi log cho ${model}:`, err.message);
                    }

                    return result;
                },
            },
        },
    });

    // ✅ Ghi đè export mặc định (bắt buộc để repository nhận đúng instance)
    Object.assign(prisma, prismaWithAudit);
    global.prisma = prismaWithAudit;

    console.log("✅ Prisma Audit Middleware (extends) đã được kích hoạt");
}
