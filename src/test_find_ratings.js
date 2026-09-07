import "./config/environment.config.js";
import LeaderMeetingRatingRepository from "./repositories/leader-meeting-rating.repository.js";
import LeaderMeetingRatingService from "./services/leader-meeting-rating.service.js";

async function main() {
  const adminUser = { userId: "7ee1e0a8-a3df-4bc0-820e-0b75acd540e0", roles: ["ADMIN"] };
  const leaderUser = { userId: "0a7cdce7-99c6-438e-86b4-48c1fbcf7456", roles: ["LANH_DAO"] };

  console.log("=== ADMIN GET ALL ===");
  const adminRes = await LeaderMeetingRatingService.getAll({ page: 1, limit: 10 }, adminUser);
  console.log("Admin total:", adminRes.pagination.totalItems, "Data count:", adminRes.data.length);
  console.log("Admin Data:", JSON.stringify(adminRes.data, null, 2));

  console.log("=== LEADER GET ALL ===");
  const leaderRes = await LeaderMeetingRatingService.getAll({ page: 1, limit: 10 }, leaderUser);
  console.log("Leader total:", leaderRes.pagination.totalItems, "Data count:", leaderRes.data.length);
  console.log("Leader Data:", JSON.stringify(leaderRes.data, null, 2));
}

main().catch(console.error).finally(() => process.exit(0));
