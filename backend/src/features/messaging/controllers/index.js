// Controllers index - aggregating all messaging controller functions

// Import all chat/messaging functions
const {
  sendMessageWorker,
  sendMessageUser,
  workerGetMessage,
  workerMessage,
} = require("./messaging-chat.controller");

// Import all call-related functions
const {
  phoneCall,
  UserPhoneCall,
  userTrackingCall,
  workerTrackingCall,
  callMasking,
  initiateCall,
} = require("./messaging-call.controller");

// Import translation function
const { translateText } = require("./messaging-translation.controller");

// Export all functions as a single module
module.exports = {
  // Chat/Messaging functions
  sendMessageWorker,
  sendMessageUser,
  workerGetMessage,
  workerMessage,

  // Call-related functions
  phoneCall,
  UserPhoneCall,
  userTrackingCall,
  workerTrackingCall,
  callMasking,
  initiateCall,

  // Translation function
  translateText,
};
