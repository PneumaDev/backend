import nodemailer from "nodemailer";


// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
});



// Controller function to send email
export const sendEmail = async (order) => {
  const mailOptions = {
    from: `"Eridanus Mall" <info@eridanus.com>`,
    to: order.address.email,
    subject: `Order Confirmation - Eridanus Mall`,
    html: `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
  body {
    font-family: 'Inter', Arial, sans-serif;
    margin: 0;
    padding: 0;
    background: linear-gradient(135deg, #f3f4f6, #ffffff);
    color: #333;
  }
  .container {
    max-width: 600px;
    margin: 40px auto;
    background-color: #ffffff;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.05);
    border: 1px solid #e5e7eb; /* Light border added */
    padding: 20px; /* Inner padding added */
  }
  .header {
    background-color: #1a56db;
    color: #ffffff;
    text-align: center;
    padding: 30px 20px;
    border-radius: 10px 10px 0 0;
  }
  .header h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
  }
  .header p {
    margin: 8px 0 0;
    font-size: 16px;
    color: #dbeafe;
  }
  .content {
    padding: 30px;
  }
  .section-title {
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 20px;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 8px;
  }
  .order-item {
    display: flex;
    align-items: center;
    padding: 16px 0;
    border-bottom: 1px solid #e2e8f0;
  }
  .order-item:last-child {
    border-bottom: none;
  }
  .order-item img {
    width: 70px;
    height: 70px;
    object-fit: cover;
    border-radius: 8px;
    margin-right: 16px;
  }
  .order-item-details {
    flex-grow: 1;
  }
  .order-item-details h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
  }
  .order-item-details p {
    margin: 4px 0;
    font-size: 14px;
    color: #6b7280;
  }
  .totals {
    margin-top: 20px;
    padding: 16px;
    background-color: #f9fafb;
    border-radius: 8px;
  }
  .totals .total-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    font-size: 15px;
  }
  .totals .total-row span {
    font-weight: 600;
  }
  .footer {
    text-align: center;
    padding: 24px;
    background-color: #f9fafb;
    color: #6b7280;
    font-size: 14px;
    border-top: 1px solid #e2e8f0;
  }
  .footer a {
    color: #1a56db;
    text-decoration: none;
    margin: 0 8px;
    font-weight: 500;
  }
  .footer p {
    margin: 8px 0;
    font-size: 12px;
    color: #9ca3af;
  }
</style>

      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <h1>Order Confirmation</h1>
            <p>Thank you for your purchase!</p>
          </div>

          <!-- Content -->
          <div class="content">
            <p>Hi ${order.address.firstName} ${order.address.lastName},</p>
            <p>Your order has been confirmed. Below is the summary:</p>

            <!-- Order Summary -->
            <div>
              <h2 class="section-title">Order Summary</h2>
              ${order.items
        .map(
          (item) => `
                  <div class="order-item">
                    <img src="${item.image[0]}" alt="${item.name}">
                    <div class="order-item-details">
                      <h3>${item.name}</h3>
                      <p>Quantity: ${item.quantity}</p>
                      <p>Price: Ksh. ${item.price.toLocaleString()}</p>
                    </div>
                  </div>`
        )
        .join('')}
            </div>

<div class="totals" style="margin-top: 20px; padding: 16px; background-color: #f9fafb; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
  <table style="width: 100%; border-collapse: collapse;">
    <!-- Subtotal Row -->
    <tr style="border-bottom: 1px solid #e5e7eb; padding: 8px 0;">
      <td style="text-align: left; font-size: 15px; color: #6b7280; font-weight: 500; padding: 8px 0;">Subtotal(Ksh):</td>
      <td style="text-align: right; font-size: 16px; color: #111827; font-weight: 600; padding: 8px 0;">${order.items.reduce((total, item) => total + item.quantity * item.price, 0).toLocaleString()}</td>
    </tr>
    <!-- Shipping Row -->
    <tr style="border-bottom: 1px solid #e5e7eb; padding: 8px 0;">
      <td style="text-align: left; font-size: 15px; color: #6b7280; font-weight: 500; padding: 8px 0;">Shipping(Ksh) (${order.shippingMethod.method}):</td>
      <td style="text-align: right; font-size: 16px; color: #111827; font-weight: 600; padding: 8px 0;">${order.shippingMethod.price == 0 ? "FREE" : `${order.shippingMethod.price.toLocaleString()}`}</td>
    </tr>
    <!-- Total Row -->
    <tr>
      <td style="text-align: left; font-size: 17px; color: #111827; font-weight: 700; padding: 8px 0;">Total(Ksh):</td>
      <td style="text-align: right; font-size: 18px; color: #1a56db; font-weight: 700; padding: 8px 0;">${order.items.reduce((total, item) => total + item.quantity * item.price, 0).toLocaleString()}</td>
    </tr>
  </table>
</div>


            <!-- Shipping Details -->
            <div>
              <h2 class="section-title">Shipping Details</h2>
              <p>${order.address.street}, ${order.address.constituency}, ${order.address.county}</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>If you have any questions, contact us:</p>
            <a href="https://eridanusmall.vercel.app/contact">Support</a> | 
            <a href="https://eridanusmall.vercel.app/orders">Track Order</a> | 
            <a href="https://eridanusmall.vercel.app/contact">Return Policy</a>
            <p>This is an automated email. Do not reply.</p>
          </div>
        </div>
      </body>
    </html>
  `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { message: 'Email sent successfully', status: 200 };
  } catch (error) {
    console.error('Error sending email:', error);
    return { message: 'Failed to send email', status: 301 };
  }
};