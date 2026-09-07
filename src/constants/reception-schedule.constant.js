export const DEFAULT_RECEPTION_WORKING_PERIODS = Object.freeze([
  Object.freeze({ startTime: "07:30", endTime: "11:30" }),
  Object.freeze({ startTime: "13:30", endTime: "16:30" }),
]);

export const RECEPTION_COUNTER_CODES = Object.freeze(
  Array.from({ length: 8 }, (_, index) => `QUAY_${index + 1}`)
);

export const DEFAULT_RECEPTION_COUNTER_CAPACITY = 2;
