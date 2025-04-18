const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// ✅ Initialize Firebase Admin SDK (Only if not already initialized)
if (!admin.apps.length) {
    admin.initializeApp();
}

exports.sendNotification = onRequest(async (req, res) => {
    try {
        const { token, title, body, image, link } = req.body;

        // Validate required fields
        if (!token || !title || !body) {
            return res.status(400).json({ success: false, message: "Token, title, and body are required" });
        }

        // Ensure token is an array
        const tokens = Array.isArray(token) ? token : [token];

        const message = {
            notification: { title, body, image },
            tokens,
            webpush: {
                fcmOptions: { link: link || "https://eridanusmall.vercel.app" }
            }
        };

        // ✅ Send notification via Firebase Cloud Messaging (FCM)
        const response = await admin.messaging().sendEachForMulticast(message);

        return res.status(200).json({ success: true, response });
    } catch (error) {
        console.error("Notification error:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
});
