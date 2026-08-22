export const RECEPTION_RATING_SCALE = {
  min: 1,
  max: 5,
};

export const RECEPTION_RATING_COMMENT_MAX_LENGTH = 2000;

export const RECEPTION_RATING_COUNTER_CODES = Array.from(
  { length: 8 },
  (_, index) => `QUAY_${index + 1}`
);
