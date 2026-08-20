import {
  LEADER_MEETING_RATING_COMMENT_MAX_LENGTH,
  LEADER_MEETING_RATING_SCALE,
  LEADER_MEETING_RATING_SUGGESTIONS,
} from "../constants/leader-meeting-rating.constant.js";

const LeaderMeetingRatingService = {
  getConfiguration() {
    return {
      scale: LEADER_MEETING_RATING_SCALE,
      comment: { maxLength: LEADER_MEETING_RATING_COMMENT_MAX_LENGTH },
      suggestionsByScore: LEADER_MEETING_RATING_SUGGESTIONS,
      eligibility: { requiredRegistrationStatus: "COMPLETED" },
    };
  },
};

export default LeaderMeetingRatingService;
