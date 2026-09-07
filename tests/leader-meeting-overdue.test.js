import assert from "node:assert/strict";
import test from "node:test";

import {
  getLeaderMeetingGraceDeadline,
  getEffectiveLeaderMeetingStatus,
  isLeaderMeetingOverdue,
} from "../src/utils/leader-meeting-overdue.util.js";

const registration = {
  trang_thai: "PENDING",
  is_qua_han: false,
  ngay_hen: new Date("2026-09-07T00:00:00.000Z"),
  khung_gio_gap_lanh_dao: { gio_ket_thuc: "10:00" },
};

test("leader meeting becomes overdue 15 minutes after slot end in Vietnam", () => {
  assert.equal(getLeaderMeetingGraceDeadline(registration.ngay_hen, "10:00").toISOString(), "2026-09-07T03:15:00.000Z");
  assert.equal(isLeaderMeetingOverdue(registration, new Date("2026-09-07T03:14:59.000Z")), false);
  assert.equal(isLeaderMeetingOverdue(registration, new Date("2026-09-07T03:15:00.000Z")), true);
  assert.equal(getEffectiveLeaderMeetingStatus(registration, new Date("2026-09-07T03:15:00.000Z")), "OVERDUE");
});

test("an in-progress meeting is not forcibly changed to overdue", () => {
  assert.equal(isLeaderMeetingOverdue({ ...registration, trang_thai: "IN_PROGRESS" }, new Date("2026-09-07T04:00:00.000Z")), false);
});
