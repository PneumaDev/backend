import admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            type: process.env.FIREBASE_TYPE,
            project_id: process.env.FIREBASE_PROJECT_ID,
            private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
            private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            client_id: process.env.FIREBASE_CLIENT_ID,
            auth_uri: process.env.FIREBASE_AUTH_URI,
            token_uri: process.env.FIREBASE_TOKEN_URI,
            auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
            client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
            universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
        }),
    });
}

/**
 * Send FCM notification
 * @param {Object} contents - Notification details
 * @param {string} contents.token - Target device FCM token
 * @param {string} contents.title - Notification title
 * @param {string} contents.body - Notification body
 * @returns {Object} - Success or error response
 */
export const notifications = async (contents) => {
    try {
        const { token, title, body } = contents;

        // Validate required fields
        if (!token || !title || !body) {
            return { success: false, message: "Token, title, and body are required" };
        }

        const message = {
            notification: { title, body },
            token,
        };

        // Send notification via FCM
        const response = await admin.messaging().send(message);
        return { success: true, response };
    } catch (error) {
        return { success: false, error: error.message };
    }
};
