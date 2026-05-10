const { RESTDataSource } = require('@apollo/datasource-rest');

class ListingsAPI extends RESTDataSource {
  baseURL = 'http://127.0.0.1:4011/';
  /**
   * @param {any} config
   */
  constructor(config) {
    // node-fetch@2 has a Windows/Node17+ ETIMEDOUT bug; use native fetch instead
    super({ ...config, fetch: globalThis.fetch });
  }

  /**
   * @param {string} userId
   */
  getListingsForUser(userId) {
    return this.get(`user/${userId}/listings`);
  }

  /**
   * @param {{numOfBeds: number, page: number, limit: number, sortBy: string}} param0
   */
  getListings({ numOfBeds, page, limit, sortBy }) {
    return this.get(
      `listings?numOfBeds=${numOfBeds}&page=${page}&limit=${limit}&sortBy=${sortBy}`
    );
  }

  getFeaturedListings(limit = 1) {
    return this.get(`featured-listings?limit=${limit}`);
  }

  /**
   * @param {string} listingId
   */
  getListing(listingId) {
    return this.get(`listings/${listingId}`);
  }

  getAllAmenities() {
    return this.get(`listing/amenities`);
  }

  /**
   * @param {{id: string, checkInDate: string, checkOutDate: string}} param0
   */
  getTotalCost({ id, checkInDate, checkOutDate }) {
    return this.get(
      `listings/${id}/totalCost?checkInDate=${checkInDate}&checkOutDate=${checkOutDate}`
    );
  }

  /**
   * @param {any} listing
   */
  createListing(listing) {
    return this.post(`listings`, { body: { listing } });
  }

  /**
   * @param {{listingId: string, listing: any}} param0
   */
  updateListing({ listingId, listing }) {
    return this.patch(`listings/${listingId}`, { body: { listing } });
  }

  /**
   * @param {string} userId
   */
  getCoordinates(userId) {
    return this.get(`user/${userId}/coordinates`);
  }
}

module.exports = ListingsAPI;
