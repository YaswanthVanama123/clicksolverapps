const axios = require("axios");
const client = require("../../../../connection.js");
const {
  createWorkerQuery,
  insertWorkerWithContactIdQuery,
  upsertWorkerSkillsQuery,
  insertWorkerSkillsRegistrationQuery,
  upsertWorkerLifeQuery,
  checkOnboardingStepsQuery,
  addWorkerVerifiedQuery,
  getServicesWithPhoneNumberQuery,
  getServicesWithRegisterPhoneNumberQuery,
} = require("../../../database/queries/worker.queries.js");
const {
  generateWorkerToken,
} = require("../../../utils/generateToken.js");

// Onboarding and Registration Functions

const workerCompleteSignUp = async (req, res) => {
  const { fullName, email = null, phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({
      message: "No phone number found. Please start the login process again.",
    });
  }

  try {
    // Step 1: Create a contact in Razorpay
    const contactPayload = {
      name: fullName,
      email: email || undefined,
      contact: phoneNumber,
      type: "employee",
    };

    const razorpayResponse = await axios.post(
      "https://api.razorpay.com/v1/contacts",
      contactPayload,
      {
        auth: {
          username: process.env.RAZORPAY_KEY,
          password: process.env.RAZORPAY_SECRET,
        },
        headers: { "Content-Type": "application/json" },
      }
    );

    const contact_id = razorpayResponse.data.id;

    // Step 2: Insert the worker using the query
    const result = await client.query(insertWorkerWithContactIdQuery, [
      phoneNumber,
      fullName,
      email,
      contact_id,
    ]);

    const worker = result.rows[0];
    const token = generateWorkerToken(worker);

    return res.status(200).json({
      token,
      contact_id,
      message: "Sign up complete",
    });
  } catch (error) {
    console.error(
      "Error completing sign up:",
      error.response?.data || error.message
    );
    return res.status(500).json({
      message: "Internal server error",
      error: error.response?.data || error.message,
    });
  }
};

const registrationSubmit = async (req, res) => {
  const formData = req.body;
  const workerId = req.worker.id;
  const profileImageUri = formData.profileImageUri;
  const proofImageUri = formData.proofImageUri;
  const serviceCategory = formData.skillCategory;
  const subskillArray = formData.subSkills;
  const personalDetails = {
    lastName: formData.lastName,
    firstName: formData.firstName,
    gender: formData.gender,
    workExperience: formData.workExperience,
    dob: formData.dob,
    education: formData.education,
  };
  const address = {
    doorNo: formData.doorNo,
    landmark: formData.landmark,
    city: formData.city,
    district: formData.district,
    state: formData.state,
    pincode: formData.pincode,
  };

  try {
    const values = [
      workerId,
      profileImageUri,
      proofImageUri,
      serviceCategory,
      subskillArray,
      personalDetails,
      address,
    ];

    await client.query(upsertWorkerSkillsQuery, values);

    res.status(200).json({ message: "Registration successful" });
  } catch (error) {
    console.error(
      "Error inserting or updating data in workerskill table:",
      error
    );
    res.status(500).json({ message: "Error registering worker", error });
  }
};

const skillWorkerRegistration = async (req, res) => {
  const workerId = req.worker.id;
  const { selectedService, checkedServices, profilePic, proofPic, agree } =
    req.body;
  try {
    await client.query(insertWorkerSkillsRegistrationQuery, [
      workerId,
      selectedService,
      checkedServices,
      profilePic,
      proofPic,
      agree,
    ]);

    await client.query(upsertWorkerLifeQuery, [workerId, 0, 0]);

    res
      .status(200)
      .json({ message: "Skilled worker registration stored successfully" });
  } catch (error) {
    console.error("Error storing user location:", error);
    res
      .status(500)
      .json({ error: "Failed to store Skilled worker registration" });
  }
};

const onboardingSteps = async (req, res) => {
  const workerId = req.worker.id;
  try {
    const result = await client.query(checkOnboardingStepsQuery, [workerId]);

    const { step1, step2, bankaccount, upiid } = result.rows[0];

    const response = {
      step1,
      step2,
      bankAccount: bankaccount,
      upiId: upiid,
    };

    res.status(200).json({
      message: "Onboarding steps checked successfully",
      steps: response,
    });
  } catch (error) {
    console.error("Error checking onboarding steps:", error);
    res.status(500).json({ message: "Error checking onboarding steps", error });
  }
};

// Helper function to get current timestamp
const getCurrentTimestamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const addWorker = async (worker) => {
  const { name, phone_number } = worker;
  const created_at = getCurrentTimestamp();
  try {
    const result = await client.query(addWorkerVerifiedQuery, [
      name,
      phone_number,
      created_at,
    ]);
    return result.rows[0];
  } catch (err) {
    console.error("Error adding user:", err);
    throw err;
  }
};

const getServicesPhoneNumber = async (req, res) => {
  const worker_id = req.worker.id;

  try {
    const result = await client.query(getServicesWithPhoneNumberQuery, [
      worker_id,
    ]);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching services:", err);
    res.status(500).send("Internal Server Error");
  }
};

const getServicesRegisterPhoneNumber = async (req, res) => {
  const worker_id = req.worker.id;

  try {
    const result = await client.query(getServicesWithRegisterPhoneNumberQuery, [
      worker_id,
    ]);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching services:", err);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  workerCompleteSignUp,
  registrationSubmit,
  skillWorkerRegistration,
  onboardingSteps,
  addWorker,
  getServicesPhoneNumber,
  getServicesRegisterPhoneNumber,
};
