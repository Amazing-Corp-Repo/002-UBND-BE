const ReceptionRatingSwagger = {
  "/api/reception-ratings": {
    get: {
      tags: ["ReceptionRating"],
      summary: "Get reception ratings for leaders",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
        { name: "size", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 10 } },
        { name: "search", in: "query", schema: { type: "string", maxLength: 100 } },
        { name: "score", in: "query", schema: { type: "integer", minimum: 1, maximum: 5 } },
        { name: "department", in: "query", schema: { type: "string", example: "QUAY_1" } },
        { name: "fromDate", in: "query", schema: { type: "string", format: "date" } },
        { name: "toDate", in: "query", schema: { type: "string", format: "date" } },
      ],
      responses: {
        200: { description: "Paginated reception ratings" },
        400: { description: "Invalid filters" },
        401: { description: "Missing or invalid access token" },
        403: { description: "Missing RRT_GET_ALL permission" },
      },
    },
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
