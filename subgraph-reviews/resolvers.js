const { AuthenticationError, ForbiddenError } = require("./utils/errors");

const resolvers = {
  Query: {},
  Mutation: {
    submitGuestReview: async (
      _,
      { bookingId, guestReview },
      { dataSources, userId }
    ) => {
      console.log(`[Reviews Subgraph] Submitting guest review for booking ${bookingId} by user ${userId}...`);
      if (!userId) throw AuthenticationError();

      const { rating, text } = guestReview;
      const guestId =
        await dataSources.bookingsDb.getGuestIdForBooking(bookingId);

      const createdReview = await dataSources.reviewsDb.createReviewForGuest({
        bookingId,
        guestId,
        authorId: userId,
        text,
        rating,
      });
      return {
        code: 200,
        success: true,
        message: 'Successfully submitted review for guest',
        guestReview: createdReview,
      };
    },
    submitHostAndLocationReviews: async (
      _,
      { bookingId, hostReview, locationReview },
      { dataSources, userId }
    ) => {
      console.log(`[Reviews Subgraph] Submitting host & location reviews for booking ${bookingId} by user ${userId}...`);
      if (!userId) throw AuthenticationError();

      const listingId =
        await dataSources.bookingsDb.getListingIdForBooking(bookingId);
      const createdLocationReview =
        await dataSources.reviewsDb.createReviewForListing({
          bookingId,
          listingId,
          authorId: userId,
          text: locationReview.text,
          rating: locationReview.rating,
        });

      const { hostId } = await dataSources.listingsAPI.getListing(listingId);
      const createdHostReview = await dataSources.reviewsDb.createReviewForHost(
        {
          bookingId,
          hostId,
          authorId: userId,
          text: hostReview.text,
          rating: hostReview.rating,
        }
      );

      return {
        code: 200,
        success: true,
        message: 'Successfully submitted review for host and location',
        hostReview: createdHostReview,
        locationReview: createdLocationReview,
      };
    },
  },
  User: {
    __resolveType(user) {
      return user.role;
    },
  },
  Review: {
    __resolveReference: ({ id }, { dataSources }) => {
      console.log(`[Reviews Subgraph] Resolving Reference for Review ID: ${id}`);
      return dataSources.reviewsDb.getReview(id);
    },
    author: (review) => {
      let role = '';
      if (review.targetType === 'LISTING' || review.targetType === 'HOST') {
        role = 'Guest';
      } else {
        role = 'Host';
      }
      return { id: review.authorId, role };
    },
  },
  Listing: {
    overallRating: ({ id }, _, { dataSources }) => {
      console.log(`[Reviews Subgraph] Getting overallRating for Listing: ${id}`);
      return dataSources.reviewsDb.getOverallRatingForListing(id);
    },
    reviews: ({ id }, _, { dataSources }) => {
      console.log(`[Reviews Subgraph] Getting reviews for Listing: ${id}`);
      return dataSources.reviewsDb.getReviewsForListing(id);
    },
  },

  Host: {
    overallRating: ({ id }, _, { dataSources }) => {
      console.log(`[Reviews Subgraph] Getting overallRating for Host: ${id}`);
      return dataSources.reviewsDb.getOverallRatingForHost(id);
    },
  },
};

module.exports = resolvers;
