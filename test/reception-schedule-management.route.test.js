import assert from "node:assert/strict";
import { describe, it } from "node:test";
import receptionScheduleManagementRouter from "../src/routes/reception-schedule-management.route.js";
import ReceptionScheduleManagementSwagger from "../src/swagger/reception-schedule-management.swagger.js";

const routeSignatures = receptionScheduleManagementRouter.stack
  .filter((layer) => layer.route)
  .flatMap((layer) =>
    Object.keys(layer.route.methods).map(
      (method) => `${method.toUpperCase()} ${layer.route.path}`
    )
  );

describe("Reception schedule management route inventory", () => {
  it("exposes English copies of all ten legacy schedule operations", () => {
    assert.deepEqual(routeSignatures.sort(), [
      "DELETE /:id",
      "GET /",
      "GET /:id",
      "GET /count",
      "GET /pagination",
      "GET /template",
      "POST /",
      "POST /import",
      "PUT /:id",
      "PUT /:id/status",
    ].sort());
  });

  it("documents every copied operation in Swagger", () => {
    const expectedOperations = [
      ["/api/reception-schedules/management", "get"],
      ["/api/reception-schedules/management", "post"],
      ["/api/reception-schedules/management/import", "post"],
      ["/api/reception-schedules/management/pagination", "get"],
      ["/api/reception-schedules/management/count", "get"],
      ["/api/reception-schedules/management/template", "get"],
      ["/api/reception-schedules/management/{id}", "get"],
      ["/api/reception-schedules/management/{id}", "put"],
      ["/api/reception-schedules/management/{id}", "delete"],
      ["/api/reception-schedules/management/{id}/status", "put"],
    ];

    expectedOperations.forEach(([path, method]) => {
      assert.ok(
        ReceptionScheduleManagementSwagger[path]?.[method],
        `Thiếu Swagger ${method.toUpperCase()} ${path}`
      );
    });
  });
});
