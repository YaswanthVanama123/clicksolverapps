const client = require("../../../database/connection");
const { user: userQueries } = require("../../../database/queries");

const createUserAction = async (req, res) => {
  const userId = req.user.id;
  const {
    encodedId,
    screen,
    serviceBooked,
    area,
    city,
    alternateName,
    alternatePhoneNumber,
    pincode,
    location,
    discount,
    tipAmount,
    offer,
  } = req.body;

  try {
    const result = await client.query(userQueries.getUserActionQuery, [
      userId,
    ]);
    const existingUserAction = result.rows[0];

    const hasAdditionalFields =
      area || city || alternateName || alternatePhoneNumber || pincode;

    if (existingUserAction) {
      let updatedTrack = existingUserAction.track;

      if (screen === "") {
        updatedTrack = updatedTrack.filter(
          (item) => item.encodedId !== encodedId
        );
      } else {
        updatedTrack = updatedTrack.filter(
          (item) => item.encodedId !== encodedId
        );

        const newAction = {
          screen,
          encodedId,
          serviceBooked,
        };

        if (hasAdditionalFields) {
          newAction.area = area;
          newAction.city = city;
          newAction.alternateName = alternateName;
          newAction.alternatePhoneNumber = alternatePhoneNumber;
          newAction.pincode = pincode;
          newAction.location = location;
          newAction.discount = discount;
          newAction.tipAmount = tipAmount;
          newAction.offer = offer;
        }

        updatedTrack.push(newAction);
      }

      const updateResult = await client.query(
        userQueries.updateUserActionTrackQuery,
        [JSON.stringify(updatedTrack), userId]
      );
      const updatedTrackScreen = updateResult.rows[0];

      res.json(updatedTrackScreen);
    } else {
      let newTrack = [];

      if (screen) {
        const newAction = {
          screen,
          encodedId,
          serviceBooked,
        };

        if (hasAdditionalFields) {
          newAction.area = area;
          newAction.city = city;
          newAction.alternateName = alternateName;
          newAction.alternatePhoneNumber = alternatePhoneNumber;
          newAction.pincode = pincode;
          newAction.location = location;
          newAction.discount = discount;
          newAction.tipAmount = tipAmount;
          newAction.offer = offer;
        }

        newTrack = [newAction];
      }

      const insertResult = await client.query(
        userQueries.insertUserActionQuery,
        [userId, JSON.stringify(newTrack)]
      );
      const updatedTrackScreen = insertResult.rows[0];

      res.json(updatedTrackScreen);
    }
  } catch (error) {
    console.error("Error inserting or updating user action:", error);
    res
      .status(500)
      .json({ message: "Error inserting or updating user action" });
  }
};

const userActionRemove = async (req, res) => {
  const userId = req.user.id;
  const { screen, encodedId, offer } = req.body;

  console.log("offer applied", offer);

  try {
    if (offer) {
      const offerCodeValue = offer.offer_code;
      console.log("offers applied changes", offerCodeValue);

      await client.query(userQueries.updateUserOffersUsedStatusQuery, [
        offerCodeValue,
        userId,
      ]);
    }

    const result = await client.query(userQueries.getUserActionTrackQuery, [
      userId,
    ]);
    const existingTrack = result.rows[0]?.track;

    if (!existingTrack) {
      return res.status(404).json({ message: "User action not found" });
    }

    const updatedTrack = existingTrack.filter(
      (item) => item.encodedId !== encodedId
    );

    if (updatedTrack.length === existingTrack.length) {
      return res.status(404).json({ message: "No matching encodedId found" });
    }

    const updateResult = await client.query(
      userQueries.updateUserActionTrackQuery,
      [JSON.stringify(updatedTrack), userId]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error("Error removing user action:", error);
    res.status(500).json({ message: "Error removing user action" });
  }
};

module.exports = {
  createUserAction,
  userActionRemove,
};
