import test from "node:test";
import assert from "node:assert/strict";
import { LEADER_MEETING_SWAGGER_DEMO as DEMO } from "../src/swagger/leader-meeting-swagger-demo.fixture.js";

test("leader meeting Swagger fixtures provide three leaders and independent mutation records", () => {
  assert.equal(DEMO.leaders.length, 3);
  assert.equal(new Set(DEMO.leaders.map((item) => item.id)).size, 3);
  assert.deepEqual(
    Object.values(DEMO.registrations).map((item) => item.status),
    ["PENDING", "PENDING", "APPROVED", "IN_PROGRESS", "APPROVED", "COMPLETED", "COMPLETED", "COMPLETED"]
  );
  assert.equal(new Set(Object.values(DEMO.registrations).map((item) => item.id)).size, 8);
  assert.equal(new Set(Object.values(DEMO.registrations).map((item) => item.code)).size, 8);
});

test("leader meeting Swagger fixture IDs match documented UUID families", () => {
  assert.match(DEMO.schedules.main, /^223e4567-/);
  assert.match(DEMO.slots.publicCreate, /^323e4567-/);
  assert.match(DEMO.registrations.approve.id, /^423e4567-/);
  assert.match(DEMO.attachmentId, /^623e4567-/);
  assert.match(DEMO.ratingId, /^723e4567-/);
});
