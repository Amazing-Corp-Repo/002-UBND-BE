import assert from "node:assert/strict";
import { describe, it } from "node:test";
import DangKyTiepDanSwagger from "../src/swagger/dang-ky-tiep-dan.swagger.js";
import ReceptionRatingSwagger from "../src/swagger/reception-rating.swagger.js";
import ReceptionScheduleManagementSwagger from "../src/swagger/reception-schedule-management.swagger.js";
import ReceptionScheduleSwagger from "../src/swagger/reception-schedule.swagger.js";

const HTTP_METHODS = ["get", "post", "put", "patch", "delete"];
const swaggerGroups = [
  ReceptionScheduleSwagger,
  DangKyTiepDanSwagger,
  ReceptionRatingSwagger,
  ReceptionScheduleManagementSwagger,
];

const operations = swaggerGroups.flatMap((swagger) =>
  Object.entries(swagger).flatMap(([path, pathItem]) =>
    HTTP_METHODS.filter((method) => pathItem[method]).map((method) => ({
      path,
      method,
      operation: pathItem[method],
    }))
  )
);

describe("Reception Swagger demo examples", () => {
  it("covers all 25 agreed English API operations", () => {
    assert.equal(operations.length, 25);
  });

  it("provides a named JSON demo for every documented response", () => {
    for (const { path, method, operation } of operations) {
      for (const [status, response] of Object.entries(operation.responses)) {
        const examples = response.content?.["application/json"]?.examples;
        assert.ok(
          examples && Object.keys(examples).length > 0,
          `${method.toUpperCase()} ${path} response ${status} thiếu demo Swagger`
        );
        for (const example of Object.values(examples)) {
          assert.equal(typeof example.summary, "string");
          assert.equal(typeof example.value?.success, "boolean");
        }
      }
    }
  });

  it("prefills every path and query parameter with a test value", () => {
    for (const { path, method, operation } of operations) {
      for (const parameter of operation.parameters || []) {
        assert.notEqual(
          parameter.example,
          undefined,
          `${method.toUpperCase()} ${path} thiếu giá trị test cho ${parameter.name}`
        );
        if (["id", "scheduleId", "slotId"].includes(parameter.name)) {
          assert.ok(parameter.description.includes("thay bằng"));
        }
      }
    }
  });

  it("provides selectable valid and invalid request demos for main write flows", () => {
    const registrationExamples =
      DangKyTiepDanSwagger["/api/reception-registrations"].post.requestBody
        .content["application/json"].examples;
    const ratingExamples =
      ReceptionRatingSwagger["/api/reception-ratings"].post.requestBody.content[
        "application/json"
      ].examples;
    const approvalExamples =
      DangKyTiepDanSwagger["/api/reception-registrations/{id}/approve"].patch
        .requestBody.content["application/json"].examples;
    const statusExamples =
      ReceptionScheduleManagementSwagger[
        "/api/reception-schedules/management/{id}/status"
      ].put.requestBody.content["application/json"].examples;

    assert.ok(registrationExamples.validRegistration);
    assert.ok(registrationExamples.missingRequiredFields);
    assert.ok(ratingExamples.validFiveStarRating);
    assert.ok(ratingExamples.suggestionDoesNotMatchScore);
    assert.ok(approvalExamples.validCounter);
    assert.ok(approvalExamples.invalidCounter);
    assert.ok(statusExamples.activateSchedule);
    assert.ok(statusExamples.missingStatus);
  });

  it("documents multiple business conflicts where one status has several causes", () => {
    const registrationConflict =
      DangKyTiepDanSwagger["/api/reception-registrations"].post.responses[409]
        .content["application/json"].examples;
    const ratingConflict =
      ReceptionRatingSwagger["/api/reception-ratings"].post.responses[409]
        .content["application/json"].examples;
    const deleteConflict =
      ReceptionScheduleManagementSwagger[
        "/api/reception-schedules/management/{id}"
      ].delete.responses[409].content["application/json"].examples;

    assert.ok(registrationConflict.duplicateRegistration);
    assert.ok(registrationConflict.fullSlot);
    assert.ok(ratingConflict.notCompleted);
    assert.ok(ratingConflict.duplicateRating);
    assert.ok(deleteConflict.activeSchedule);
    assert.ok(deleteConflict.heldRegistration);
  });
});
