import cron from "node-cron";

export const registerCleanupCron = () => {
  cron.schedule(
    "0 17 * * *",
    () => {
      console.log("Cleanup cron chạy mỗi phút!");
    },
    {
      timezone: "utc",
    }
  );
};
