export const DEFAULT_LEADER_MEETING_LOCATION = "Phòng tiếp công dân";
export const DEFAULT_LEADER_MEETING_NOTE =
  "Lịch tiếp công dân định kỳ của lãnh đạo";
export const LEADER_MEETING_SLOT_CAPACITY = 1;
export const LEADER_MEETING_SLOT_DURATION_MINUTES = 30;

const createSlots = (period, startHour, startMinute, count) => {
  let totalMinutes = startHour * 60 + startMinute;
  return Array.from({ length: count }, () => {
    const start = totalMinutes;
    const end = start + LEADER_MEETING_SLOT_DURATION_MINUTES;
    totalMinutes = end;
    const format = (value) =>
      `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(
        value % 60
      ).padStart(2, "0")}`;
    return {
      period,
      startTime: format(start),
      endTime: format(end),
    };
  });
};

export const LEADER_MEETING_PERIODS = [
  {
    code: "MORNING",
    name: "Buổi sáng",
    startTime: "07:30",
    endTime: "11:30",
    slots: createSlots("MORNING", 7, 30, 8),
  },
  {
    code: "AFTERNOON",
    name: "Buổi chiều",
    startTime: "13:30",
    endTime: "17:00",
    slots: createSlots("AFTERNOON", 13, 30, 7),
  },
];

export const LEADER_MEETING_STANDARD_SLOTS = LEADER_MEETING_PERIODS.flatMap(
  (period) => period.slots
);

export const leaderMeetingSlotKey = (startTime, endTime) =>
  `${startTime}|${endTime}`;

export const LEADER_MEETING_STANDARD_SLOT_KEYS = new Set(
  LEADER_MEETING_STANDARD_SLOTS.map((slot) =>
    leaderMeetingSlotKey(slot.startTime, slot.endTime)
  )
);
