'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {}
  User.init(
    {
      id: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
      name: DataTypes.STRING,
      role: DataTypes.STRING,
      profilePicture: DataTypes.STRING,
      profileDescription: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'User',
      timestamps: false,
    }
  );
  return User;
};
