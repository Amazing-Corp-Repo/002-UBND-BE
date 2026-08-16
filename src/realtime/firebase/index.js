import admin from "firebase-admin";
import env from "../../config/environment.config.js";

// An toàn khi CHƯA có credentials Firebase (chỉ có .env database): vẫn cho app boot để
// dev/test các module khác. Khi có đủ FIREBASE_PRIVATE_KEY thì init/serviceAccount bình thường.
const hasFirebaseCreds = Boolean(env.FIREBASE_PRIVATE_KEY && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PROJECT_ID);

let defaultExport = admin;

if (hasFirebaseCreds) {
  const serviceAccount = {
    type: env.FIREBASE_FIREBASE_TYPE,
    project_id: env.FIREBASE_PROJECT_ID,
    private_key_id: env.FIREBASE_PRIVATE_KEY_ID,
    private_key: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: env.FIREBASE_CLIENT_EMAIL,
    client_id: env.FIREBASE_CLIENT_ID,
    auth_uri: env.FIREBASE_AUTH_URI,
    token_uri: env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: env.FIREBASE_CLIENT_X509_CERT_URL,
    universe_domain: env.FIREBASE_UNIVERSE_DOMAIN,
  };

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  }
} else {
  // Firebase chưa cấu hình → xuất ra Proxy bao ngoài admin, chặn `.messaging()` trả về no-op.
  // (firebase-admin định nghĩa messaging là getter-only → không gán đè trực tiếp được.)
  console.warn('[Firebase] Thiếu FIREBASE_PRIVATE_KEY / CLIENT_EMAIL / PROJECT_ID — push notification tạm tắt.');

  const noopMsg = {
    send: async (message) => {
      void message;
      console.warn('[Firebase] Bỏ qua push vì Firebase chưa được cấu hình.');
      return { messageId: 'skipped-no-firebase' };
    },
  };

  defaultExport = new Proxy(admin, {
    get(target, prop, receiver) {
      if (prop === 'messaging') {
        return () => noopMsg;
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}

export default defaultExport;