const ReceptionRatingSwagger = {
  "/api/reception-ratings": {
    post: {
      tags: ["ReceptionRating"],
      summary: "Submit a citizen reception rating from iPad",
      description:
        "Public iPad endpoint. A reception code can be rated exactly once. Selected suggestions must belong to the submitted score configuration.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["receptionCode", "score"],
              properties: {
                receptionCode: { type: "string", example: "A00123" },
                score: { type: "integer", minimum: 1, maximum: 5 },
                selectedSuggestions: {
                  type: "array",
                  maxItems: 5,
                  uniqueItems: true,
                  items: { type: "string", maxLength: 200 },
                },
                comment: { type: "string", maxLength: 2000 },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Rating submitted" },
        400: { description: "Invalid or missing rating data" },
        404: { description: "Reception code not found" },
        409: { description: "Not eligible or already rated" },
      },
    },
  },
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
