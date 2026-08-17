const ReceptionScheduleSwagger = {
  "/api/reception-schedules": {
    get: {
      tags: ["ReceptionSchedule"],
      summary: "Get active reception schedules for Mobile",
      description:
        "Returns active, non-deleted reception schedules from today by default. Each schedule includes display-ready one-hour slots derived from its configured time range.",
      parameters: [
        {
          name: "fromDate",
          in: "query",
          required: false,
          schema: { type: "string", format: "date" },
        },
        {
          name: "toDate",
          in: "query",
          required: false,
          schema: { type: "string", format: "date" },
        },
      ],
      responses: {
        200: { description: "Active reception schedules" },
        400: { description: "Invalid date range" },
      },
    },
  },
};

export default ReceptionScheduleSwagger;
