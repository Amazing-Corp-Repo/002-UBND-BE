import axios from "axios";
import env from "../../config/environment.config.js";

const RECAPTCHA_SECRET = env.RECAPTCHA_SECRET;
const RECAPTCHA_VERIFY_URL = env.RECAPTCHA_VERIFY_URL;

const CaptchaRepository = {
  async verify(token, ip) {
    const response = await axios.post(RECAPTCHA_VERIFY_URL, null, {
      params: {
        secret: RECAPTCHA_SECRET,
        response: token,
        remoteip: ip,
      },
    });

    return response.data;
  }
}

export default CaptchaRepository;
