import test from "node:test";
import assert from "node:assert/strict";
import ScheduleSwagger from "../src/swagger/leader-meeting-schedule.swagger.js";
import RegistrationSwagger from "../src/swagger/leader-meeting-registration.swagger.js";
import RatingSwagger from "../src/swagger/leader-meeting-rating.swagger.js";
import { LEADER_MEETING_SWAGGER_DEMO as DEMO } from "../src/swagger/leader-meeting-swagger-demo.fixture.js";

const swagger = { ...ScheduleSwagger, ...RegistrationSwagger, ...RatingSwagger };
const operations = Object.entries(swagger).flatMap(([path, pathItem]) =>
  Object.entries(pathItem)
    .filter(([method]) => ["get", "post", "put", "patch", "delete"].includes(method))
    .map(([method, operation]) => ({ path, method, operation }))
);

const parameterExample = (operation, name) =>
  operation.parameters.find((parameter) => parameter.name === name).schema.example;

test("Swagger documents all 23 leader meeting APIs in Vietnamese", () => {
  assert.equal(operations.length, 23);
  for (const { operation } of operations) {
    assert.ok(operation.summary?.length > 5);
    assert.ok(operation.description?.length > 20);
    assert.ok(Object.keys(operation.responses || {}).length > 0);
  }
});

test("schedule mutation APIs use independent seeded DEV fixtures", () => {
  const path = SwaggerPath("/api/leader-meeting-schedules/management/{id}");
  assert.equal(parameterExample(path.get, "id"), DEMO.schedules.main);
  assert.equal(parameterExample(path.put, "id"), DEMO.schedules.update);
  assert.equal(parameterExample(path.delete, "id"), DEMO.schedules.deletion);
  assert.equal(
    parameterExample(SwaggerPath("/api/leader-meeting-schedules/management/{id}/status").put, "id"),
    DEMO.schedules.status
  );
});

test("registration actions and attachment use seeded records in the required states", () => {
  const actionCases = ["approve", "reject", "process", "complete", "cancel"];
  for (const action of actionCases) {
    const operation = SwaggerPath(`/api/leader-meeting-registrations/{id}/${action}`).patch;
    assert.equal(parameterExample(operation, "id"), DEMO.registrations[action].id);
  }
  const attachment = SwaggerPath(
    "/api/leader-meeting-registrations/{id}/attachments/{attachmentId}"
  ).get;
  assert.equal(parameterExample(attachment, "id"), DEMO.registrations.detail.id);
  assert.equal(parameterExample(attachment, "attachmentId"), DEMO.attachmentId);
});

test("rating create and detail examples point to independent seeded fixtures", () => {
  const createExample = SwaggerPath("/api/leader-meeting-ratings").post
    .requestBody.content["application/json"].examples.valid.value;
  assert.equal(createExample.registrationCode, DEMO.registrations.ratingCreate.code);
  assert.equal(
    parameterExample(SwaggerPath("/api/leader-meeting-ratings/{id}").get, "id"),
    DEMO.ratingId
  );
});

function SwaggerPath(path) {
  assert.ok(swagger[path], `Thiếu Swagger path ${path}`);
  return swagger[path];
}
