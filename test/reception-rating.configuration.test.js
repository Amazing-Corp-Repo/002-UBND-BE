import assert from "node:assert/strict";
import { describe, it } from "node:test";
import express from "express";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import receptionRatingRouter from "../src/routes/reception-rating.route.js";

const createTestServer = () => {
  const app = express();
  app.use("/api/reception-ratings", receptionRatingRouter);
  app.use(errorHandler);
  return app.listen(0);
};

describe("GET /api/reception-ratings/configuration", () => {
  it("returns the 1-5 scale, comment limit and suggestions for every score", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-ratings/configuration`
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.deepEqual(body.data.scale, { min: 1, max: 5 });
      assert.equal(body.data.comment.maxLength, 2000);
      assert.deepEqual(Object.keys(body.data.suggestionsByScore), [
        "1",
        "2",
        "3",
        "4",
        "5",
      ]);
      for (const suggestions of Object.values(body.data.suggestionsByScore)) {
        assert.ok(suggestions.length > 0);
      }
    } finally {
      server.close();
    }
  });
});
