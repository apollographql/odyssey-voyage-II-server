'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Amenities', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING,
      },
      category: {
        type: Sequelize.STRING,
      },
      name: {
        type: Sequelize.STRING,
      },
    });
    await queryInterface.createTable('Listings', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING,
      },
      title: {
        type: Sequelize.STRING,
      },
      description: {
        type: Sequelize.STRING,
      },
      costPerNight: {
        type: Sequelize.FLOAT,
      },
      hostId: {
        type: Sequelize.STRING,
      },
      locationType: {
        type: Sequelize.STRING,
      },
      numOfBeds: {
        type: Sequelize.INTEGER,
      },
      photoThumbnail: {
        type: Sequelize.STRING,
      },
      isFeatured: {
        type: Sequelize.BOOLEAN,
      },
    });
    await queryInterface.createTable('ListingAmenities', {
      ListingId: {
        allowNull: false,
        type: Sequelize.STRING,
        references: {
          model: 'Listings',
          key: 'id',
        },
      },
      AmenityId: {
        allowNull: false,
        type: Sequelize.STRING,
        references: {
          model: 'Amenities',
          key: 'id',
        },
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ListingAmenities');
    await queryInterface.dropTable('Listings');
    await queryInterface.dropTable('Amenities');
  },
};
