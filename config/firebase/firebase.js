import admin from "firebase-admin";
import { getFirestore } from 'firebase-admin/firestore';


// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            type: process.env.FIREBASE_TYPE,
            project_id: process.env.FIREBASE_PROJECT_ID,
            private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY
                ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/gm, "\n")
                : undefined,
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

export const db = getFirestore();

console.log("🔥 Firestore connected successfully!");


/**
 * Asynchronously sends an FCM notification to a target device.
 *
 * @async
 * @function notifications
 * @param {Object} contents - Notification details.
 * @param {string} contents.token - The FCM token of the target device.
 * @param {string} contents.title - The title of the notification.
 * @param {string} contents.body - The body text of the notification.
 * @param {string} contents.image - The image of the notification.
 * @param {string} contents.link - The link to redirect to on clicking the notification.
 * @returns {Promise<Object>} A promise resolving to an object indicating success or failure.
 *
 * @example
 * const result = await notifications({
 *     token: "device_fcm_token",
 *     title: "New Message",
 *     body: "You have a new notification!"
 *     link: "https://eridanusmall.vercel.app/"
 *     image: "https://example.com/image.jpg"
 * });
 * console.log(result);
 */
export const notifications = async (contents) => {
    try {
        const { token, title, body, image, link } = contents;

        // Validate required fields
        if (!token || !title || !body) {
            return { success: false, message: "Token, title, and body are required" };
        }

        // Ensure token is an array
        const tokens = Array.isArray(token) ? token : [token];

        const message = {
            notification: { title, body, image },
            tokens,
            webpush: {
                fcmOptions: {
                    link: link || "https://eridanusmall.vercel.app"
                }
            }
        };

        // Send notification via FCM for multiple tokens
        const response = await admin.messaging().sendEachForMulticast(message);

        return { success: true, response };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const subscribeToTopic = async (req, res) => {
    try {
        const { token, topic } = req.body;

        if (!token || !topic) {
            return res.status(400).json({ success: false, message: "Token and topic are required" });
        }

        await admin.messaging().subscribeToTopic(token, topic);
        res.json({ success: true, message: `Subscribed to ${topic}` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};



