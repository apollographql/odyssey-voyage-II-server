//import { readFileSync } from 'node:fs'
//import { ApolloServer } from 'apollo-server'
//import { Resolvers } from './resolvers-types'  // The file created by codegen

const { readFileSync } = require('node:fs');

const typeDefs = readFileSync('./schema.graphql', 'utf8') 

const { AuthenticationError, ForbiddenError } = require( './utils/errors' );

const resolvers = {
  Query: {
    searchListings: async (
      /** @type {any} */ _,
      // @ts-ignore
      { criteria },
      // @ts-ignore
      { dataSources }
    ) => {
      console.log('📦 [subgraph-listings] handling searchListings');
      const { numOfBeds, checkInDate, checkOutDate, page, limit, sortBy } =
        criteria;
      const listings = await dataSources.listingsAPI.getListings({
        numOfBeds,
        page,
        limit,
        sortBy,
      });

      // check availability for each listing
      const listingAvailability = await Promise.all(
        listings.map((/** @type {any} */ listing) =>
          dataSources.bookingsDb.isListingAvailable({
            listingId: listing.id,
            checkInDate,
            checkOutDate,
          })
        )
      );

      // filter listings data based on availability
      const availableListings = listings.filter(
        // @ts-ignore
        (/** @type {any} */ listing, /** @type {number} */ index) =>
          listingAvailability[index]
      );

      return availableListings;
    },
    hostListings: async (
      /** @type {any} */ _,
      /** @type {any} */ __,
      // @ts-ignore
      { dataSources, userId, userRole }
    ) => {
      console.log('📦 [subgraph-listings] handling hostListings', {
        userId,
        userRole,
      });
      if (!userId) throw AuthenticationError();

      if (userRole === 'Host') {
        return dataSources.listingsAPI.getListingsForUser(userId);
      } else {
        throw ForbiddenError('Only hosts have access to listings.');
      }
    },
    // @ts-ignore
    listing: (/** @type {any} */ _, { id }, { dataSources }) => {
      console.log('📦 [subgraph-listings] handling listing');
      return dataSources.listingsAPI.getListing(id);
    },
    featuredListings: (
      /** @type {any} */ _,
      // @ts-ignore 
      { limit },
      // @ts-ignore
      { dataSources }
    ) => {
      console.log('📦 [subgraph-listings] handling featuredListings');
      // @ts-ignore
      const featuredListings = dataSources.listingsAPI.getFeaturedListings(
        limit
      );
      return featuredListings;
    },
    listingAmenities: (
      /** @type {any} */ _,
      /** @type {any} */ __,
      // @ts-ignore
      { dataSources }
    ) => {
      console.log('📦 [subgraph-listings] handling listingAmenities');
      return dataSources.listingsAPI.getAllAmenities();
    },
  },
  Mutation: {
    createListing: async (
      /** @type {any} */ _,
      // @ts-ignore
      { listing },
      // @ts-ignore
      { dataSources, userId, userRole }
    ) => {
      console.log('📦 [subgraph-listings] handling createListing', {
        userId,
        userRole,
      });
      if (!userId) throw AuthenticationError();

      const {
        title,
        description,
        photoThumbnail,
        numOfBeds,
        costPerNight,
        locationType,
        amenities,
      } = listing;

      if (userRole === 'Host') {
        try {
          const newListing = await dataSources.listingsAPI.createListing({
            title,
            description,
            photoThumbnail,
            numOfBeds,
            costPerNight,
            hostId: userId,
            locationType,
            amenities,
          });

          return {
            code: 200,
            success: true,
            message: 'Listing successfully created!',
            listing: newListing,
          };
        } catch (/** @type {any} */ err) {
          return {
            code: 400,
            success: false,
            message: err.message,
          };
        }
      } else {
        return {
          code: 400,
          success: false,
          message: 'Only hosts can create new listings',
        };
      }
    },
    updateListing: async (
      /** @type {any} */ _,
      // @ts-ignore
      { listingId, listing },
      // @ts-ignore
      { dataSources, userId }
    ) => {
      console.log('📦 [subgraph-listings] handling updateListing', { userId });
      if (!userId) throw AuthenticationError();

      try {
        const updatedListing = await dataSources.listingsAPI.updateListing({
          listingId,
          listing,
        });

        return {
          code: 200,
          success: true,
          message: 'Listing successfully updated!',
          listing: updatedListing,
        };
      } catch (/** @type {any} */ err) {
        return {
          code: 400,
          success: false,
          message: err.message,
        };
      }
    },
  },
  Listing: {
    // @ts-ignore
    __resolveReference: ({ id }, /** @type {any} */ { dataSources }) => {
      console.log('📦 [subgraph-listings] resolving reference for Listing', {
        id,
      });
      return dataSources.listingsAPI.getListing(id);
    },
    host: (/** @type {any} */ { hostId }) => {
      console.log('📦 [subgraph-listings] handling host', { hostId });
      return { id: hostId };
    },
    overallRating: (
      /** @type {any} */ { id },
      /** @type {any} */ _,
      // @ts-ignore
      { dataSources }
    ) => {
      console.log('📦 [subgraph-listings] handling overallRating', { id });
      return dataSources.reviewsDb.getOverallRatingForListing(id);
    },
    reviews: (
      /** @type {any} */ { id },
      /** @type {any} */ _,
      // @ts-ignore
      { dataSources }
    ) => {
      console.log('📦 [subgraph-listings] handling reviews', { id });
      return dataSources.reviewsDb.getReviewsForListing(id);
    },
    totalCost: async (
      /** @type {any} */ { id },
      // @ts-ignore
      { checkInDate, checkOutDate },
      // @ts-ignore
      { dataSources }
    ) => {
      console.log('📦 [subgraph-listings] handling totalCost', {
        id,
        checkInDate,
        checkOutDate,
      });
      const { totalCost } = await dataSources.listingsAPI.getTotalCost({
        id,
        checkInDate,
        checkOutDate,
      });
      return totalCost;
    },
    currentlyBookedDates: (
      /** @type {any} */ { id },
      /** @type {any} */ _,
      // @ts-ignore
      { dataSources }
    ) => {
      console.log('📦 [subgraph-listings] handling currentlyBookedDates', {
        id,
      });
      return dataSources.bookingsDb.getCurrentlyBookedDateRangesForListing(id);
    },
    bookings: (
      /** @type {any} */ { id },
      /** @type {any} */ _,
      // @ts-ignore
      { dataSources }
    ) => {
      console.log('📦 [subgraph-listings] handling bookings', { id });
      return dataSources.bookingsDb.getBookingsForListing(id);
    },
    numberOfUpcomingBookings: async (
      /** @type {any} */ { id },
      /** @type {any} */ _,
      // @ts-ignore
      { dataSources }
    ) => {
      console.log('📦 [subgraph-listings] handling numberOfUpcomingBookings', {
        id,
      });
      const bookings =
        (await dataSources.bookingsDb.getBookingsForListing(id, 'UPCOMING')) ||
        [];
      return bookings.length;
    },
    // @ts-ignore
    coordinates: (listing, { dataSources }) => {
      console.log('📦 [subgraph-listings] handling coordinates', {
        id: listing.id,
      });
      return dataSources.listingsAPI.getListingCoordinates(listing.id);
    },
  },
  AmenityCategory: {
    ACCOMMODATION_DETAILS: 'Accommodation Details',
    SPACE_SURVIVAL: 'Space Survival',
    OUTDOORS: 'Outdoors',
  },
};

module.exports = resolvers;
