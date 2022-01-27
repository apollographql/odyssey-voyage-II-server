'use strict';
const { Model } = require('sequelize');
const { Listing, Amenity } = require('../models');
module.exports = (sequelize, DataTypes) => {
  class ListingAmenities extends Model {}
  ListingAmenities.init(
    {
      ListingId: {
        type: DataTypes.STRING,
        references: {
          model: 'Listings',
          key: 'id',
        },
      },
      AmenityId: {
        type: DataTypes.STRING,
        references: {
          model: 'Amenities',
          key: 'id',
        },
      },
    },
    {
      sequelize,
      modelName: 'ListingAmenities',
      timestamps: false,
    }
  );
  return ListingAmenities;
};
