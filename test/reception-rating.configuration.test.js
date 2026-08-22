import assert from "node:assert/strict";
import { describe, it } from "node:test";
import express from "express";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import receptionRatingRouter from "../src/routes/reception-rating.route.js";
import ReceptionRatingSwagger from "../src/swagger/reception-rating.swagger.js";

const createTestServer = () => {
  const app = express();
  app.use("/api/reception-ratings", receptionRatingRouter);
  app.use(errorHandler);
  return app.listen(0);
};

describe("GET /api/reception-ratings/configuration", () => {
  it("documents the full configuration response in Swagger", () => {
    const operation =
      ReceptionRatingSwagger["/api/reception-ratings/configuration"].get;
    const dataSchema =
      operation.responses[200].content["application/json"].schema.properties.data;

    assert.deepEqual(dataSchema.properties.scale.properties.min.enum, [1]);
    assert.deepEqual(dataSchema.properties.scale.properties.max.enum, [5]);
    assert.deepEqual(
      dataSchema.properties.comment.properties.maxLength.enum,
      [2000]
    );
    assert.equal(dataSchema.properties.suggestionsByScore, undefined);
    assert.equal(dataSchema.properties.counters.minItems, 8);
  });

  it("returns the 1-5 scale, comment limit and counters without suggestions", async () => {
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
      assert.deepEqual(
        body.data.counters.map((counter) => counter.code),
        Array.from({ length: 8 }, (_, index) => `QUAY_${index + 1}`)
      );
      assert.equal(body.data.suggestionsByScore, undefined);
    } finally {
      server.close();
    }
  });
});
