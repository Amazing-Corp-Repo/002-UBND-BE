import assert from "node:assert/strict";
import { describe, it } from "node:test";
import express from "express";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import router from "../src/routes/leader-meeting-rating.route.js";
import Swagger from "../src/swagger/leader-meeting-rating.swagger.js";

const createServer = () => {
  const app = express();
  app.use("/api/leader-meeting-ratings", router);
  app.use(errorHandler);
  return app.listen(0);
};

describe("GET /api/leader-meeting-ratings/configuration", () => {
  it("documents iPad configuration and the COMPLETED requirement", () => {
    const operation = Swagger["/api/leader-meeting-ratings/configuration"].get;
    assert.match(operation.summary, /iPad/);
    assert.match(operation.description, /1-5 sao/);
    assert.match(operation.description, /2000/);
    assert.match(operation.description, /COMPLETED/);
  });

  it("returns only the star scale, comment limit and eligibility", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-ratings/configuration`
      );
      const body = await response.json();
      assert.equal(response.status, 200);
      assert.deepEqual(body.data.scale, { min: 1, max: 5 });
      assert.equal(body.data.comment.maxLength, 2000);
      assert.equal(body.data.eligibility.requiredRegistrationStatus, "COMPLETED");
      assert.equal("suggestionsByScore" in body.data, false);
    } finally {
      server.close();
    }
  });
});
