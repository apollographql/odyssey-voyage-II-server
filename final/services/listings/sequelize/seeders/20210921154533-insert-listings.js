'use strict';
const listingsData = require('./listings.json');
const amenitiesData = require('./amenities.json');
const listingAmenitiesData = require('./listingamenities.json');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Amenities', amenitiesData, {});
    await queryInterface.bulkInsert('Listings', listingsData, {});
    await queryInterface.bulkInsert('ListingAmenities', listingAmenitiesData, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Amenities', null, {});
    await queryInterface.bulkDelete('Listings', null, {});
  },
};
