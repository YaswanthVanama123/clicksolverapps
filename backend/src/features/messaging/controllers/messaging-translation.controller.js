const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

// Azure Translator API configuration
const subscriptionKey =
  "1rFYPImsvNSHdC4MqvEUBYCUdJNaiCOAObvtk2N6fGhJ3BtIItNxJQQJ99BCACGhslBXJ3w3AAAbACOGxFd0";
const region = "centralindia";
const endpoint = "https://api.cognitive.microsofttranslator.com";
const apiVersion = "3.0";

/**
 * Translate text using Azure Translator API
 */
const translateText = async (req, res) => {
  const { text, fromLang, toLang } = req.body;

  console.log(req.body);

  if (!text || !fromLang || !toLang) {
    return res
      .status(400)
      .json({ error: "Missing required fields: text, fromLang, toLang" });
  }

  try {
    // Construct the API URL with query parameters
    const url = `${endpoint}/translate?api-version=${apiVersion}&from=${fromLang}&to=${toLang}`;

    // Set up headers for authentication and content type
    const headers = {
      "Ocp-Apim-Subscription-Key": subscriptionKey,
      "Ocp-Apim-Subscription-Region": region,
      "Content-Type": "application/json",
      "X-ClientTraceId": uuidv4().toString(),
    };

    // Request body must be an array of objects with a "Text" property
    const body = [{ Text: text }];

    // Send POST request to Azure Translator API
    const response = await axios.post(url, body, { headers });

    // Extract the translated text from response
    const translatedText =
      response.data[0]?.translations[0]?.text || "Translation not available";

    res.json({ translatedText });
  } catch (error) {
    console.error(
      "Error in translation:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Translation failed" });
  }
};

module.exports = {
  translateText,
};
