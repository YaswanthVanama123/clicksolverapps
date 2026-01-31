const client = require("../../../../connection.js");
const {
  getWorkerByIdQuery,
  updateWorkerQuery,
  getWorkerProfileScreenDetailsQuery,
  upsertWorkerSkillsAndUpdateIssuesQuery,
  getWorkerProfileDetailsQuery,
  getWorkerProfleDetailsQuery,
  updateWorkerProfileImageQuery,
  getWorkerProfileDetailsWithFeedbackQuery,
  getWorkerReviewDetailsQuery,
} = require("../../../database/queries/worker.queries.js");

// Profile Management Functions

const workerProfileScreenDetails = async (req, res) => {
  const workerId = req.worker.id;

  try {
    const result = await client.query(getWorkerProfileScreenDetailsQuery, [
      workerId,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "No worker details found for the provided worker ID.",
      });
    }

    const { name, email, phone_number, profile } = result.rows[0];

    return res.json({ name, email, phone_number, profile });
  } catch (error) {
    console.error("Error fetching worker details:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching worker details." });
  }
};

const profileChangesSubmit = async (req, res) => {
  const { formData, selectedStatus } = req.body;

  console.log("Received formData:", formData);
  console.log("Received selectedStatus:", selectedStatus);

  // Ensure we get a string value for selectedStatus
  const statusValue =
    typeof selectedStatus === "object" && selectedStatus.selectedStatus
      ? selectedStatus.selectedStatus
      : selectedStatus;
  console.log("Using selectedStatus value:", statusValue);

  // Extract data from formData
  const workerId = req.worker.id;
  console.log("Worker ID:", workerId);
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
      statusValue,
    ];

    console.log("Executing query with values:", values);
    const result = await client.query(
      upsertWorkerSkillsAndUpdateIssuesQuery,
      values
    );
    console.log(
      "CTE query executed successfully. Update result:",
      JSON.stringify(result.rows, null, 2)
    );

    res
      .status(200)
      .json({ message: "Registration successful", updatedData: result.rows });
  } catch (error) {
    console.error(
      "Error inserting/updating workerskills or updating issues in workers table:",
      error
    );
    res.status(500).json({ message: "Error registering worker", error });
  }
};

const getWorkerProfileDetails = async (req, res) => {
  const workerId = req.worker.id;

  try {
    const result = await client.query(getWorkerProfileDetailsQuery, [
      workerId,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Worker not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching worker profile details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getWorkerProfleDetails = async (req, res) => {
  const workerId = req.worker.id;
  try {
    const { rows } = await client.query(getWorkerProfleDetailsQuery, [
      workerId,
    ]);

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching worker profile:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching worker profile" });
  }
};

const workerProfileUpdate = async (req, res) => {
  const worker_id = req.worker.id;
  console.log("called");
  const { profileImage } = req.body;

  if (!worker_id || !profileImage) {
    return res
      .status(400)
      .json({ error: "user_id and profileImage are required." });
  }

  try {
    const values = [profileImage, worker_id];

    const result = await client.query(updateWorkerProfileImageQuery, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json({
      message: "Profile updated successfully.",
      updatedUser: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

const workerProfileDetails = async (req, res) => {
  const workerId = req.worker.id;

  try {
    const profileResult = await client.query(
      getWorkerProfileDetailsWithFeedbackQuery,
      [workerId]
    );

    if (profileResult.rows.length === 0) {
      return res.status(404).json({ error: "Worker profile not found" });
    }

    const averageRating = profileResult.rows[0].average_rating;

    const workerProfile = {
      profileDetails: profileResult.rows,
      averageRating,
    };

    return res.status(200).json(workerProfile);
  } catch (error) {
    console.error("Error getting worker profile details:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getWorkerReviewDetails = async (req, res) => {
  const workerId = req.worker.id;
  try {
    const { rows } = await client.query(getWorkerReviewDetailsQuery, [
      workerId,
    ]);

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching worker reviews:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching worker reviews" });
  }
};

module.exports = {
  workerProfileScreenDetails,
  profileChangesSubmit,
  getWorkerProfileDetails,
  getWorkerProfleDetails,
  workerProfileUpdate,
  workerProfileDetails,
  getWorkerReviewDetails,
};
