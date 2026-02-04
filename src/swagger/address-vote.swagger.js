const AddressVoteSwagger = {
  "/api/address-vote/import": {
    post: {
      tags: ["AddressVote"],
      summary: "Import address vote file Excel",
      parameters: [
        {
          name: "username",
          in: "query",
          required: true,
        },
        {
          name: "password",
          in: "query",
          required: true,
        },
      ],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                file: {
                  type: "string",
                  format: "binary",
                  description: "File Excel chứa dữ liệu address vote",
                },
              },
            },
          },
        },
      },
      responses: {},
    },
  },
};

export default AddressVoteSwagger;
