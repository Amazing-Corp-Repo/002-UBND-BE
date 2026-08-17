import {
  RECEPTION_RATING_COMMENT_MAX_LENGTH,
  RECEPTION_RATING_SCALE,
  RECEPTION_RATING_SUGGESTIONS,
} from "../constants/reception-rating.constant.js";

const ReceptionRatingService = {
  getConfiguration() {
    return {
      scale: RECEPTION_RATING_SCALE,
      comment: {
        maxLength: RECEPTION_RATING_COMMENT_MAX_LENGTH,
      },
      suggestionsByScore: RECEPTION_RATING_SUGGESTIONS,
    };
  },
};

export default ReceptionRatingService;
