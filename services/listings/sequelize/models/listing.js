'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Listing extends Model {
    static associate(models) {
      Listing.belongsToMany(models.Amenity, { through: models.ListingAmenities });
    }
  }
  Listing.init(
    {
      id: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
      title: DataTypes.STRING,
      description: DataTypes.STRING,
      costPerNight: DataTypes.FLOAT,
      hostId: DataTypes.STRING,
      locationType: DataTypes.STRING,
      numOfBeds: DataTypes.INTEGER,
      photoThumbnail: DataTypes.STRING,
      isFeatured: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: 'Listing',
      timestamps: false,
    }
  );
  return Listing;
};
