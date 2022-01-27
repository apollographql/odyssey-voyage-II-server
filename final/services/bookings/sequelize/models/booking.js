'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {}
  Booking.init(
    {
      id: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
      checkInDate: DataTypes.DATE,
      checkOutDate: DataTypes.DATE,
      totalCost: DataTypes.FLOAT,
      guestId: DataTypes.STRING,
      listingId: DataTypes.STRING,
      status: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'Booking',
      timestamps: false,
    }
  );
  return Booking;
};
