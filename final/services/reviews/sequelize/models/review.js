'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Review extends Model {}
  Review.init(
    {
      id: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
      rating: DataTypes.INTEGER,
      text: DataTypes.STRING,
      targetId: DataTypes.STRING,
      authorId: DataTypes.STRING,
      targetType: DataTypes.STRING,
      bookingId: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'Review',
      timestamps: false,
    }
  );
  return Review;
};
