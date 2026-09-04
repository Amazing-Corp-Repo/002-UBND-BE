import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import env from "../../config/environment.config.js";

const hasFirebaseCreds = Boolean(
  env.FIREBASE_PRIVATE_KEY &&
  env.FIREBASE_CLIENT_EMAIL &&
  env.FIREBASE_PROJECT_ID
);

const noopMsg = {
  send: async (message) => {
    void message;
    console.warn(
      "[Firebase] Bỏ qua push vì Firebase chưa được cấu hình."
    );

    return {
      messageId: "skipped-no-firebase",
    };
  },
};

if (hasFirebaseCreds) {
  const serviceAccount = {
    type: env.FIREBASE_FIREBASE_TYPE,
    project_id: env.FIREBASE_PROJECT_ID,
    private_key_id: env.FIREBASE_PRIVATE_KEY_ID,
    private_key: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    client_email: env.FIREBASE_CLIENT_EMAIL,
    client_id: env.FIREBASE_CLIENT_ID,
    auth_uri: env.FIREBASE_AUTH_URI,
    token_uri: env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url:
      env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url:
      env.FIREBASE_CLIENT_X509_CERT_URL,
    universe_domain: env.FIREBASE_UNIVERSE_DOMAIN,
  };

  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  }
} else {
  console.warn(
    "[Firebase] Thiếu FIREBASE_PRIVATE_KEY / CLIENT_EMAIL / PROJECT_ID — push notification tạm tắt."
  );
}

const adminFirebase = {
  messaging() {
    return hasFirebaseCreds ? getMessaging() : noopMsg;
  },
};

export default adminFirebase;