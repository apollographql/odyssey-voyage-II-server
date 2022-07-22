'use strict';
const { Model } = require('sequelize');
const { Listing } = require('./listing');
module.exports = (sequelize, DataTypes) => {
  class Amenity extends Model {}

  Amenity.init(
    {
      id: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
      category: DataTypes.STRING,
      name: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'Amenity',
      timestamps: false,
    }
  );

  return Amenity;
};
