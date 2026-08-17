const ReceptionRatingSwagger = {
  "/api/reception-ratings/configuration": {
    get: {
      tags: ["ReceptionRating"],
      summary: "Get iPad reception rating configuration",
      description:
        "Returns the 1-5 score scale, 2000-character comment limit, and score-specific suggestion texts used by the iPad UI.",
      responses: {
        200: { description: "Reception rating configuration" },
      },
    },
  },
};

export default ReceptionRatingSwagger;
