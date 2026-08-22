import assert from "node:assert/strict";
import { describe, it } from "node:test";
import DangKyTiepDanSwagger from "../src/swagger/dang-ky-tiep-dan.swagger.js";
import ReceptionRatingSwagger from "../src/swagger/reception-rating.swagger.js";
import ReceptionScheduleManagementSwagger from "../src/swagger/reception-schedule-management.swagger.js";
import ReceptionScheduleSwagger from "../src/swagger/reception-schedule.swagger.js";
import { RECEPTION_SWAGGER_DEMO as DEMO } from "../src/swagger/reception-swagger-demo.fixture.js";

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

  it("prefills every required path parameter with a real DEV fixture value", () => {
    for (const { path, method, operation } of operations) {
      for (const parameter of operation.parameters || []) {
        if (parameter.in !== "path") continue;
        assert.notEqual(
          parameter.example,
          undefined,
          `${method.toUpperCase()} ${path} thiếu giá trị test cho ${parameter.name}`
        );
      }
    }
  });

  it("uses independent real DEV fixtures for state-changing APIs", () => {
    const parameter = (operation, name) =>
      operation.parameters.find((item) => item.name === name).example;

    assert.equal(
      parameter(DangKyTiepDanSwagger["/api/reception-registrations/{id}/approve"].patch, "id"),
      DEMO.registrations.approve.id
    );
    assert.equal(
      parameter(DangKyTiepDanSwagger["/api/reception-registrations/{id}/complete"].patch, "id"),
      DEMO.registrations.complete.id
    );
    assert.equal(
      parameter(DangKyTiepDanSwagger["/api/reception-registrations/{id}/reject"].patch, "id"),
      DEMO.registrations.reject.id
    );
    assert.equal(
      parameter(ReceptionRatingSwagger["/api/reception-ratings/{id}"].get, "id"),
      DEMO.ratingId
    );
    assert.equal(
      ReceptionRatingSwagger["/api/reception-ratings"].post.requestBody.content["application/json"]
        .examples.validManualRating.value.receptionCode,
      "TD-20260822-001"
    );
    assert.equal(
      parameter(ReceptionScheduleManagementSwagger["/api/reception-schedules/management/{id}"].delete, "id"),
      DEMO.schedules.deletion
    );
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
    assert.ok(ratingExamples.validManualRating);
    assert.ok(ratingExamples.missingOfficerName);
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
    assert.ok(ratingConflict.error409);
    assert.ok(deleteConflict.activeSchedule);
    assert.ok(deleteConflict.heldRegistration);
  });
});
