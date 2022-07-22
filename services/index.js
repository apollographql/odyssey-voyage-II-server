const BookingsDataSource = require('../monolith/datasources/bookings');
const ReviewsDataSource = require('../monolith/datasources/reviews');
const ListingsAPI = require('../monolith/datasources/listings');
const AccountsAPI = require('../monolith/datasources/accounts');
const PaymentsAPI = require('../monolith/datasources/payments');

module.exports = {
  BookingsDataSource,
  ReviewsDataSource,
  ListingsAPI,
  AccountsAPI,
  PaymentsAPI,
};
