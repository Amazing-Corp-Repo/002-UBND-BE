import assert from "node:assert/strict";
import test from "node:test";
import {
  isLeaderMeetingOverdue,
  isLeaderMeetingReadyToProcess,
} from "./leader-meeting-overdue.util.js";

const approvedRegistration = {
  trang_thai: "APPROVED",
  is_qua_han: false,
  ngay_hen: new Date("2026-09-15T00:00:00.000Z"),
  khung_gio_gap_lanh_dao: { gio_bat_dau: "08:30", gio_ket_thuc: "09:00" },
};

test("approved registration starts at its Vietnam slot time", () => {
  assert.equal(
    isLeaderMeetingReadyToProcess(
      approvedRegistration,
      new Date("2026-09-15T01:29:59.999Z"),
    ),
    false,
  );
  assert.equal(
    isLeaderMeetingReadyToProcess(
      approvedRegistration,
      new Date("2026-09-15T01:30:00.000Z"),
    ),
    true,
  );
});

test("approved registration remains eligible for auto-processing after the pending grace period", () => {
  assert.equal(
    isLeaderMeetingReadyToProcess(
      approvedRegistration,
      new Date("2026-09-15T02:15:00.000Z"),
    ),
    true,
  );
});

test("only pending registrations become overdue 15 minutes after the slot starts", () => {
  const now = new Date("2026-09-15T01:45:00.000Z"); // 08:45 tại Việt Nam
  assert.equal(
    isLeaderMeetingOverdue({ ...approvedRegistration, trang_thai: "PENDING" }, now),
    true,
  );
  assert.equal(isLeaderMeetingOverdue(approvedRegistration, now), false);
  assert.equal(
    isLeaderMeetingOverdue(
      { ...approvedRegistration, trang_thai: "REJECTED", is_qua_han: true },
      now,
    ),
    false,
  );
  assert.equal(
    isLeaderMeetingOverdue(
      { ...approvedRegistration, trang_thai: "CANCELED", is_qua_han: true },
      now,
    ),
    false,
  );
});
