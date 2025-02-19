// const express = require("express");
// const path = require("path");
// const cors = require("cors");
// const router = require("./router");
// const cookieParser = require("cookie-parser");
// const bodyParser = require("body-parser");
// const jwt = require("jsonwebtoken");

// const crypto = require("crypto");
// const app = express();
// const port = 80; // Change the port to 80
// // const axios = require('axios')
// // const uniqid = require('uniqid')
// // const sha256 = require("sha256");
// // const { request } = require("http");

// // Enable CORS for all routes
// app.use(cors());
// app.get("/api/test", (req, res) => {
//   res.json({ message: "Hello from the backend!" });
// });
// app.use(express.json());
// app.use(cookieParser());
// app.use(bodyParser.json());
// app.use("/api", router);

// // const generatePhonePeQR = async () => {
// //     // Test setup details
// //     const baseURL = 'https://mercury-uat.phonepe.com/enterprise-sandbox';
// //     const endpoint = '/v3/qr/init';
// //     const transactionId = uniqid()
// //     const merchantId = 'PGTESTPAYUAT';
// //     const saltKey = '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399';
// //     const saltIndex = '1';

// //     // Payload for QR generation
// //     const payload = {
// //         merchantId: 'PGTESTPAYUAT',
// //         transactionId: transactionId, // Unique Transaction ID
// //         merchantOrderId: 'TX12345678901234',
// //         amount: 1000, // Amount in paise (1 INR)
// //         storeId: 'STORE123',
// //         terminalId: 'TERMINAL123',
// //         expiresIn: 1800, // 30 minutes expiry
// //         gstBreakup: {
// //             gst: 100,
// //             cgst: 25,
// //             cess: 25,
// //             sgst: 25,
// //             igst: 25,
// //             gstIncentive: 100,
// //             gstPercentage: 10
// //         },
// //         invoiceDetails: {
// //             invoiceNumber: 'INV123456',
// //             invoiceDate: '2023-09-02T10:00:00.000Z',
// //             invoiceName: 'Sample Invoice'
// //         }
// //     };

// //     // Convert payload to base64

// //     const payloadBase64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64");

// //     // Generate X-VERIFY header
// //     const xVerify = sha256(payloadBase64 + endpoint + saltKey) + "###" + saltIndex;
// //     try {
// //         const response = await axios.post(`${baseURL}${endpoint}`, {
// //             request: payloadBase64
// //         }, {
// //             headers: {
// //                 accept: "application/json",
// //                 "Content-Type": "application/json",
// //                 "X-VERIFY": xVerify
// //             }
// //         });
// //         console.log('QR Code Generated Successfully:', response.data);
// //     } catch (error) {
// //         console.error('Error generating QR code:', error.response ? error.response.data : error.message);
// //     }
// // };

// // // Call the function
// // generatePhonePeQR();

// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });

// const express = require("express");
// const path = require("path");
// const cors = require("cors");
// const fs = require("fs");
// const https = require("https");
// const http = require("http");
// const router = require("./router");
// const cookieParser = require("cookie-parser");
// const bodyParser = require("body-parser");

// const app = express();

// // Ports for HTTP and HTTPS
// const httpsPort = 443; // HTTPS Port
// const httpPort = 80; // HTTP Port (for redirection)

// // Enable CORS for all routes
// app.use(cors());

// // Middleware setup
// app.use(express.json());
// app.use(cookieParser());
// app.use(bodyParser.json());

// // Example route
// app.get("/api/test", (req, res) => {
//   res.json({ message: "Hello from the secure backend!" });
// });

// // Use the router for API routes
// app.use("/api", router);

// // Load SSL certificate and key
// const httpsOptions = {
//   key: fs.readFileSync(path.join(__dirname, "certs/private.key")), // Your private key
//   cert: fs.readFileSync(path.join(__dirname, "certs/certificate.crt")), // Your SSL certificate
//   ca: fs.readFileSync(path.join(__dirname, "certs/ca_bundle.crt")), // Optional, CA bundle
// };

// // HTTPS Server
// https.createServer(httpsOptions, app).listen(httpsPort, () => {
//   console.log(`Secure server is running on port ${httpsPort}`);
// });

// // HTTP to HTTPS Redirect Server
// http
//   .createServer((req, res) => {
//     res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
//     res.end();
//   })
//   .listen(httpPort, () => {
//     console.log(`HTTP redirect server is running on port ${httpPort}`);
//   });

const express = require("express");
const cors = require("cors");
const router = require("./router");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

const app = express();
const port = 5000; // Use port 5000 for the backend server

// Enable CORS for all routes
app.use(cors());
app.use(cors({ origin: '*' }));

// Middleware setup
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());

// Example route
app.get("/api/test", (req, res) => {
  res.json({ message: "Hello from the backend!" });
});

// Use the router for API routes
app.use("/api", router);

// Start the server
// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });

app.listen(5000, '0.0.0.0', () => {
  console.log('Server running on port 5000');
});

