const express = require("express");
const router = express.Router();

// Import messaging chat controllers
const {
  sendMessageWorker,
  sendMessageUser,
  workerGetMessage,
  translateText,
} = require("../controllers/index");

/**
 * POST /send/message/worker
 * Send message to worker and update the accepted table with FCM notifications
 */
router.post("/send/message/worker", sendMessageWorker);

/**
 * POST /send/message/user
 * Send message to user and update the accepted table with FCM notifications
 */
router.post("/send/message/user", sendMessageUser);

/**
 * GET /worker/getMessages
 * Get messages for a worker by request_id from query parameters
 */
router.get("/worker/getMessages", workerGetMessage);

/**
 * POST /translate
 * Translate text using Azure Translator API
 * Request body: { text, fromLang, toLang }
 */
router.post("/translate", translateText);

module.exports = router;
