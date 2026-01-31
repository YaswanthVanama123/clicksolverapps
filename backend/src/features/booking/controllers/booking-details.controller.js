const client = require("../../../database/connection");
const bookingQueries = require("../../../database/queries/booking.queries.js");

// Service Booking Details Functions

const getServiceBookingItemDetails = async (req, res) => {
  try {
    const { tracking_id } = req.body;
    console.log(tracking_id);
    // console.log(tracking_id)
    const query = bookingQueries.getServiceBookingItemDetailsQuery;

    const values = [tracking_id];

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "No service tracking details found for the given accepted ID",
      });
    }

    // const { service_booked } = result.rows[0];

    // if (!service_booked || !Array.isArray(service_booked)) {
    //   return res
    //     .status(400)
    //     .json({ message: "Invalid service_booked data format" });
    // }

    // const gstRate = 0.05;
    // const discountRate = 0.05;

    // const fetchedTotalAmount = service_booked.reduce(
    //   (total, service) => total + (service.cost || 0),
    //   0
    // );

    // const gstAmount = fetchedTotalAmount * gstRate;
    // const cgstAmount = fetchedTotalAmount * gstRate;
    // const discountAmount = fetchedTotalAmount * discountRate;
    // const fetchedFinalTotalAmount =
    //   fetchedTotalAmount + gstAmount + cgstAmount - discountAmount;

    // const paymentDetails = {
    //   gstAmount,
    //   cgstAmount,
    //   discountAmount,
    //   fetchedFinalTotalAmount,
    // };

    res.status(200).json({ data: result.rows[0] });
  } catch (error) {
    console.error(
      "Error fetching service tracking worker item details: ",
      error
    );
    res.status(500).json({
      message: "Failed to fetch service tracking worker item details",
      error: error.message,
    });
  }
};

const getServiceBookingUserItemDetails = async (req, res) => {
  try {
    const { tracking_id } = req.body;
    console.log(tracking_id);
    // console.log(tracking_id)
    const query = bookingQueries.getServiceBookingUserItemDetailsQuery;

    const values = [tracking_id];

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "No service tracking details found for the given accepted ID",
      });
    }

    res.status(200).json({ data: result.rows[0] });
  } catch (error) {
    console.error(
      "Error fetching service tracking worker item details: ",
      error
    );
    res.status(500).json({
      message: "Failed to fetch service tracking worker item details",
      error: error.message,
    });
  }
};

const getServiceOngoingItemDetails = async (req, res) => {
  try {
    const { tracking_id } = req.body;
    // console.log(tracking_id)
    const query = bookingQueries.getServiceOngoingItemDetailsQuery;

    const values = [tracking_id];

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return res.status(305).json({
        message: "No service tracking details found for the given accepted ID",
      });
    }

    res.status(200).json({ data: result.rows[0] });
  } catch (error) {
    console.error(
      "Error fetching service tracking worker item details: ",
      error
    );
    res.status(500).json({
      message: "Failed to fetch service tracking worker item details",
      error: error.message,
    });
  }
};

const getServiceOngoingWorkerItemDetails = async (req, res) => {
  try {
    const { tracking_id } = req.body;
    console.log(tracking_id);

    const query = bookingQueries.getServiceOngoingWorkerItemDetailsQuery;

    const values = [tracking_id];

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return res.status(305).json({
        message: "No service tracking details found for the given accepted ID",
      });
    }

    res.status(200).json({ data: result.rows[0] });
  } catch (error) {
    console.error(
      "Error fetching service tracking worker item details: ",
      error
    );
    res.status(500).json({
      message: "Failed to fetch service tracking worker item details",
      error: error.message,
    });
  }
};

module.exports = {
  getServiceBookingItemDetails,
  getServiceBookingUserItemDetails,
  getServiceOngoingItemDetails,
  getServiceOngoingWorkerItemDetails,
};
