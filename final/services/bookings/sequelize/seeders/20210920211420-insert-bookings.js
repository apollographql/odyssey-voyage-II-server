'use strict';
const bookingsData = require('./bookings.json');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const bookings = bookingsData.map((b) => ({
      ...b,
      checkInDate: new Date(b.checkInDate),
      checkOutDate: new Date(b.checkOutDate),
    }));
    await queryInterface.bulkInsert('Bookings', bookings, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Bookings', null, {});
  },
};
