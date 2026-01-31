const client = require("../../../database/connection");
const { user: userQueries } = require("../../../database/queries");

const userUpdateLastLogin = async (req, res) => {
  const userId = req.worker.id;
  const time = getCurrentTimestamp();
  try {
    const result = await client.query(userQueries.updateUserLastActiveQuery, [
      time,
      userId,
    ]);
    return result.rows[0];
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const getCurrentTimestamp = () => {
  return new Date().toISOString();
};

module.exports = {
  userUpdateLastLogin,
};
