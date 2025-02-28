const adminClients = []; // Stores connected admin clients

// SSE Endpoint: Admin listens for order notifications
export const adminNotifications = (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    res.flushHeaders(); // ✅ Ensures headers are sent immediately

    // Store admin connection
    adminClients.push(res);

    // Send an initial message to confirm connection
    res.write("data: " + JSON.stringify({ message: "Connected to notifications" }) + "\n\n");

    // Remove admin when they disconnect
    req.on("close", () => {
        adminClients.splice(adminClients.indexOf(res), 1);
        res.end();
    });
};

// Function to notify admins when a new order is made
export const sendOrderNotification = (orderData) => {
    const message = {
        type: "order",
        message: `New order received at ${new Date().toLocaleTimeString()}`,
        data: orderData,
    };

    adminClients.forEach((client) => {
        client.write(`data: ${JSON.stringify(message)}\n\n`);
    });
};