const nodemailer = require("nodemailer");
const fetch = require("node-fetch");

exports.handler = async (event) => {
  // Add CORS headers to allow GitHub Pages frontend to call this API without restriction issues
  const headers = {
    "Access-Control-Allow-Origin": "*", // Allows any origin, including https://lchauhan09.github.io
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") {
    // Handle CORS preflight request
    return { statusCode: 200, headers, body: "OK" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: "Method Not Allowed" };
  }

  try {
    const { name, email } = JSON.parse(event.body || "{}");

    if (!name || !email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Name and email are required" }),
      };
    }

    // Fetch PDF from GitHub raw content URL
    const pdfUrl = "https://raw.githubusercontent.com/lchauhan09/QRscanner/main/assets/mydoc.pdf";
    const pdfResponse = await fetch(pdfUrl);
    
    if (!pdfResponse.ok) {
        throw new Error("Unable to fetch PDF from GitHub. Ensure assets/mydoc.pdf exists and is pushed.");
    }
    
    const pdfBuffer = await pdfResponse.buffer();

    // Configure Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASS,
      },
    });

    // Send the email with PDF attachment
    await transporter.sendMail({
      from: `"QR App" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Your PDF is Ready",
      text: `Hi ${name},\n\nThanks for submitting your details. Your PDF is attached.\n\nRegards,\nQR App`,
      attachments: [
        {
          filename: "document.pdf",
          content: pdfBuffer,
        },
      ],
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "Email sent successfully" }),
    };
  } catch (err) {
    console.error("Error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to send email. " + err.message }),
    };
  }
};
