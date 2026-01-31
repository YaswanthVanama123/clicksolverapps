const admin = require("../../../config/firebase.config.js");
const { getMessaging } = require("firebase-admin/messaging");
const db = admin.firestore();
const {
  getAllServices: getAllServicesQuery,
  getHomeServices: getHomeServicesQuery,
  getServiceCategories: getServiceCategoriesQuery,
  getElectricianServices: getElectricianServicesQuery,
  getPlumberServices: getPlumberServicesQuery,
  getCleaningServices: getCleaningServicesQuery,
  getPaintingServices: getPaintingServicesQuery,
  getVehicleServices: getVehicleServicesQuery,
  getIndividualServicesByTitle,
  getServiceByName: getServiceByNameQuery,
  getSubservices: getSubservicesQuery,
  insertRelatedService: insertRelatedServiceQuery,
} = require("../../../database/queries/service.queries");

// Main functions
const homeServices = async (req, res) => {
  try {
    const rows = await getHomeServicesQuery();
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching home services:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching home services" });
  }
}

const getServices = async () => {
  try {
    return await getServiceCategoriesQuery();
  } catch (err) {
    console.error("Error fetching servicecategories:", err);
    throw err;
  }
}

const getElectricianServices = async () => {
  try {
    return await getElectricianServicesQuery();
  } catch (err) {
    console.error("Error fetching electrician services:", err);
    throw err;
  }
}

const getPlumberServices = async () => {
  try {
    return await getPlumberServicesQuery();
  } catch (err) {
    console.error("Error fetching Plumber services:", err);
    throw err;
  }
}

const getCleaningServices = async () => {
  try {
    return await getCleaningServicesQuery();
  } catch (err) {
    console.error("Error fetching Cleaning services:", err);
    throw err;
  }
}

const getPaintingServices = async () => {
  try {
    return await getPaintingServicesQuery();
  } catch (err) {
    console.error("Error fetching Painter services:", err);
    throw err;
  }
}

const getVehicleServices = async () => {
  try {
    return await getVehicleServicesQuery();
  } catch (err) {
    console.error("Error fetching Vehicle services:", err);
    throw err;
  }
}

const getIndividualServices = async (req, res) => {
  // Extract serviceObject from the body of the POST request
  const { serviceObject } = req.body;

  try {
    // Use query layer to fetch individual services
    const result = await getIndividualServicesByTitle(serviceObject);
    res.json(result);
  } catch (err) {
    console.error("Error fetching services:", err);
    res.status(500).send("Internal Server Error");
  }
}

const getServicesBySearch = async (req, res) => {
  // Get the search query in lowercase and trim any extra spaces
  const searchQuery = req.query.search
    ? req.query.search.toLowerCase().trim()
    : "";

  try {
    const allServices = await getAllServicesQuery();

    // Split the search query into keywords
    const searchKeywords = searchQuery.split(" ").filter(Boolean);

    // Define a function to calculate a score for each service based on different match criteria
    const calculateScore = (service) => {
      let score = 0;
      // Define the fields to check
      const fields = ["service_tag", "service_category", "service_name"];

      fields.forEach((field) => {
        const value = service[field];
        if (value) {
          const valueLower = value.toLowerCase();

          // Prioritize if the field starts with the full search query
          if (valueLower.startsWith(searchQuery)) {
            score += 3;
          } else if (valueLower.includes(searchQuery)) {
            score += 2;
          }

          // Check each keyword separately
          searchKeywords.forEach((keyword) => {
            if (valueLower.startsWith(keyword)) {
              score += 2;
            } else if (valueLower.includes(keyword)) {
              score += 1;
            }
          });
        }
      });

      return score;
    };

    // Map services to include a computed score
    const scoredServices = allServices.map((service) => ({
      ...service,
      score: calculateScore(service),
    }));

    // Filter out services with no matches (score === 0)
    const filteredServices = scoredServices.filter(
      (service) => service.score > 0
    );

    // Sort the results by score (highest score first)
    filteredServices.sort((a, b) => b.score - a.score);

    res.json(filteredServices);
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

const getServiceByName = async (req, res) => {
  const { serviceName } = req.body; // Get the service name from the request body
  if (!serviceName) {
    return res.status(400).json({ error: "Service name is required" });
  }

  try {
    const result = await getServiceByNameQuery(serviceName);

    if (result.length === 0) {
      return res.status(404).json({ error: "Service not found" });
    }

    // Extract the main service (first row) and the related services (all matching rows)
    const serviceData = result[0]; // First matching row is the main service
    const relatedServicesData = result; // All rows including the first are related services

    // Return the service and related services as response
    res.status(200).json({
      service: serviceData, // The primary service
      relatedServices: relatedServicesData, // All related services including the primary one
    });
  } catch (error) {
    console.error("Error fetching service:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the service" });
  }
}

const subservices = async (req, res) => {
  const { selectedService } = req.body;
  console.log(selectedService);
  try {
    const result = await getSubservicesQuery(selectedService);
    if (result.length === 0) {
      return res.status(404).json({ error: "worker not found" });
    } else {
      return res.status(200).json(result);
    }
  } catch (error) {
    console.error("Error updating skill registration:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

const insertRelatedService = async (req, res) => {
  const { service, service_category, related_services } = req.body;

  try {
    // Use query layer to insert related service
    const result = await insertRelatedServiceQuery(service, service_category, related_services);

    // Send a success response with the inserted row details
    res.status(201).json({
      message: "Related service added successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error inserting related service:", error);

    // Send an error response if something goes wrong
    res.status(500).json({
      message: "Error adding related service",
      error: error.message,
    });
  }
}


module.exports = {
  homeServices,
  getServices,
  getElectricianServices,
  getPlumberServices,
  getCleaningServices,
  getPaintingServices,
  getVehicleServices,
  getIndividualServices,
  getServicesBySearch,
  getServiceByName,
  subservices,
  insertRelatedService
};
