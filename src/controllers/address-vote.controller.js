import { successResponse } from "../utils/response.util.js";

const AddressVoteController = {
  async uploadFileAddress(req, res) {
    return successResponse(res, null, "Upload file thành công");
  },
};

export default AddressVoteController;