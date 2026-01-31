/**
 * Service Catalog Routes
 *
 * This module defines all routes related to service catalog functionality including:
 * - Home services discovery
 * - Service categories and listings
 * - Service-specific routes (electrician, plumber, cleaning, painting, vehicle)
 * - Individual and related service lookups
 * - Sub-service operations
 * - Special offers
 */

const express = require('express');
const {
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
  insertRelatedService,
} = require('../controllers/index');
const { getSpecialOffers } = require('../../user/index');

const router = express.Router();

/**
 * GET /home/services
 * Fetch all services available on the home page
 */
router.get('/home/services', homeServices);

/**
 * POST /single/service
 * Get details for a single service by name
 */
router.post('/single/service', getServiceByName);

/**
 * GET /servicecategories
 * Fetch all service categories
 */
router.get('/servicecategories', async (req, res) => {
  try {
    const users = await getServices();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /electrician/services
 * Fetch all electrician services
 */
router.get('/electrician/services', async (req, res) => {
  try {
    const services = await getElectricianServices();
    if (services) {
      res.json(services);
    } else {
      res.status(404).json({ error: 'Electrician services not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /plumber/services
 * Fetch all plumber services
 */
router.get('/plumber/services', async (req, res) => {
  try {
    const services = await getPlumberServices();
    if (services) {
      res.json(services);
    } else {
      res.status(404).json({ error: 'plumber services not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /cleaning/services
 * Fetch all cleaning services
 */
router.get('/cleaning/services', async (req, res) => {
  try {
    const services = await getCleaningServices();
    if (services) {
      res.json(services);
    } else {
      res.status(404).json({ error: 'cleaning services not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /painting/services
 * Fetch all painting services
 */
router.get('/painting/services', async (req, res) => {
  try {
    const services = await getPaintingServices();
    if (services) {
      res.json(services);
    } else {
      res.status(404).json({ error: 'painting services not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /vehicle/services
 * Fetch all vehicle services
 */
router.get('/vehicle/services', async (req, res) => {
  try {
    const services = await getVehicleServices();
    if (services) {
      res.json(services);
    } else {
      res.status(404).json({ error: 'vehicle services not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /individual/service
 * Fetch individual service details
 */
router.post('/individual/service', getIndividualServices);

/**
 * GET /services
 * Search for services by query parameters
 */
router.get('/services', getServicesBySearch);

/**
 * POST /subservice/checkboxes
 * Get subservices with checkbox options
 */
router.post('/subservice/checkboxes', subservices);

/**
 * POST /relatedservices
 * Insert or manage related services
 */
router.post('/relatedservices', insertRelatedService);

/**
 * GET /special/offers
 * Fetch special offers for services
 */
router.get('/special/offers', getSpecialOffers);

module.exports = router;
