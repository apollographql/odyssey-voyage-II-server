const { RESTDataSource } = require('apollo-datasource-rest');

class ListingsAPI extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = 'http://localhost:4010/';
  }

  getListingsForUser(userId) {
    return this.get(`user/${userId}/listings`);
  }

  getListings({ numOfBeds, page, limit, sortBy }) {
    return this.get(`listings?numOfBeds=${numOfBeds}&page=${page}&limit=${limit}&sortBy=${sortBy}`);
  }

  getFeaturedListings(limit = 1) {
    return this.get(`featured-listings?limit=${limit}`);
  }

  getListing(listingId) {
    return this.get(`listings/${listingId}`);
  }

  getAllAmenities() {
    return this.get(`listing/amenities`);
  }

  getTotalCost({ id, checkInDate, checkOutDate }) {
    return this.get(`listings/${id}/totalCost?checkInDate=${checkInDate}&checkOutDate=${checkOutDate}`);
  }

  createListing(listing) {
    return this.post(`listings`, { listing });
  }

  updateListing({ listingId, listing }) {
    return this.patch(`listings/${listingId}`, { listing });
  }
}

module.exports = ListingsAPI;
