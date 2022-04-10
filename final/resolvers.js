const { AuthenticationError, ForbiddenError } = require('apollo-server');
const authErrMessage = '*** you must be logged in ***';

const resolvers = {
  Query: {
    searchListings: async (_, { criteria }, { dataSources }) => {
      const { numOfBeds, checkInDate, checkOutDate, page, limit, sortBy } = criteria;
      const listings = await dataSources.listingsAPI.getListings({ numOfBeds, page, limit, sortBy });

      // check availability for each listing
      const listingAvailability = await Promise.all(
        listings.map((listing) =>
          dataSources.bookingsDb.isListingAvailable({ listingId: listing.id, checkInDate, checkOutDate })
        )
      );

      // filter listings data based on availability
      const availableListings = listings.filter((listing, index) => listingAvailability[index]);

      return availableListings;
    },
    hostListings: async (_, __, { dataSources, userId, userRole }) => {
      if (!userId) throw new AuthenticationError(authErrMessage);

      if (userRole === 'Host') {
        return dataSources.listingsAPI.getListingsForUser(userId);
      } else {
        throw new ForbiddenError('Only hosts have access to listings.');
      }
    },
    listing: (_, { id }, { dataSources }) => {
      return dataSources.listingsAPI.getListing(id);
    },
    featuredListings: (_, __, { dataSources }) => {
      const limit = 3;
      return dataSources.listingsAPI.getFeaturedListings(limit);
    },
    listingAmenities: (_, __, { dataSources }) => {
      return dataSources.listingsAPI.getAllAmenities();
    },
    guestBookings: async (_, __, { dataSources, userId, userRole }) => {
      if (!userId) throw new AuthenticationError(authErrMessage);

      if (userRole === 'Guest') {
        const bookings = await dataSources.bookingsDb.getBookingsForUser(userId);
        return bookings;
      } else {
        throw new ForbiddenError('Only guests have access to trips');
      }
    },
    upcomingGuestBookings: async (_, __, { dataSources, userId, userRole }) => {
      if (!userId) throw new AuthenticationError(authErrMessage);

      if (userRole === 'Guest') {
        const bookings = await dataSources.bookingsDb.getBookingsForUser(userId, 'UPCOMING');
        return bookings;
      } else {
        throw new ForbiddenError('Only guests have access to trips');
      }
    },
    pastGuestBookings: async (_, __, { dataSources, userId, userRole }) => {
      if (!userId) throw new AuthenticationError(authErrMessage);

      if (userRole === 'Guest') {
        const bookings = await dataSources.bookingsDb.getBookingsForUser(userId, 'COMPLETED');
        return bookings;
      } else {
        throw new ForbiddenError('Only guests have access to trips');
      }
    },
    bookingsForListing: async (_, { listingId, status }, { dataSources, userId, userRole }) => {
      if (!userId) throw new AuthenticationError(authErrMessage);

      if (userRole === 'Host') {
        // need to check if listing belongs to host
        const listings = await dataSources.listingsAPI.getListingsForUser(userId);
        if (listings.find((listing) => listing.id === listingId)) {
          const bookings = (await dataSources.bookingsDb.getBookingsForListing(listingId, status)) || [];
          return bookings;
        } else {
          throw new Error('Listing does not belong to host');
        }
      } else {
        throw new ForbiddenError('Only hosts have access to listing bookings');
      }
    },
  },
  Mutation: {
    createBooking: async (_, { createBookingInput }, { dataSources, userId }) => {
      if (!userId) throw new AuthenticationError(authErrMessage);

      const { listingId, checkInDate, checkOutDate } = createBookingInput;
      const { totalCost } = await dataSources.listingsAPI.getTotalCost({ id: listingId, checkInDate, checkOutDate });

      try {
        await dataSources.paymentsAPI.subtractFunds({ userId, amount: totalCost });
      } catch (e) {
        return {
          code: 400,
          success: false,
          message: 'We couldn’t complete your request because your funds are insufficient.',
        };
      }

      try {
        const booking = await dataSources.bookingsDb.createBooking({
          listingId,
          checkInDate,
          checkOutDate,
          totalCost,
          guestId: userId,
        });

        return {
          code: 200,
          success: true,
          message: 'Successfully booked!',
          booking,
        };
      } catch (err) {
        return {
          code: 400,
          success: false,
          message: err.message,
        };
      }
    },
    submitGuestReview: async (_, { bookingId, guestReview }, { dataSources, userId }) => {
      if (!userId) throw new AuthenticationError(authErrMessage);

      const { rating, text } = guestReview;
      const guestId = await dataSources.bookingsDb.getGuestIdForBooking(bookingId);

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
    submitHostAndLocationReviews: async (_, { bookingId, hostReview, locationReview }, { dataSources, userId }) => {
      if (!userId) throw new AuthenticationError(authErrMessage);

      const listingId = await dataSources.bookingsDb.getListingIdForBooking(bookingId);
      const createdLocationReview = await dataSources.reviewsDb.createReviewForListing({
        bookingId,
        listingId,
        authorId: userId,
        text: locationReview.text,
        rating: locationReview.rating,
      });

      const { hostId } = await dataSources.listingsAPI.getListing(listingId);
      const createdHostReview = await dataSources.reviewsDb.createReviewForHost({
        bookingId,
        hostId,
        authorId: userId,
        text: hostReview.text,
        rating: hostReview.rating,
      });

      return {
        code: 200,
        success: true,
        message: 'Successfully submitted review for host and location',
        hostReview: createdHostReview,
        locationReview: createdLocationReview,
      };
    },
    addFundsToWallet: async (_, { amount }, { dataSources, userId }) => {
      if (!userId) throw new AuthenticationError(authErrMessage);
      try {
        const updatedWallet = await dataSources.paymentsAPI.addFunds({ userId, amount });
        return {
          code: 200,
          success: true,
          message: 'Successfully added funds to wallet',
          amount: updatedWallet.amount,
        };
      } catch (err) {
        return {
          code: 400,
          success: false,
          message: err.message,
        };
      }
    },
  },
  Host: {
    overallRating: ({ id }, _, { dataSources }) => {
      return dataSources.reviewsDb.getOverallRatingForHost(id);
    },
  },
  Guest: {
    funds: async (_, __, { dataSources, userId }) => {
      const { amount } = await dataSources.paymentsAPI.getUserWalletAmount(userId);
      return amount;
    },
    bookings: async ({ __typename, id }, __, { dataSources }) => {
      if (!__typename || __typename === "Guest") {
        const bookings = await dataSources.bookingsDb.getBookingsForUser(id);
        return bookings;
      }
      throw new ForbiddenError("Only guests have access to trips");
    },
  },
  Listing: {
    host: ({ hostId }) => {
      return { id: hostId };
    },
    overallRating: ({ id }, _, { dataSources }) => {
      return dataSources.reviewsDb.getOverallRatingForListing(id);
    },
    reviews: ({ id }, _, { dataSources }) => {
      return dataSources.reviewsDb.getReviewsForListing(id);
    },
    totalCost: async ({ id }, { checkInDate, checkOutDate }, { dataSources }) => {
      const { totalCost } = await dataSources.listingsAPI.getTotalCost({ id, checkInDate, checkOutDate });
      return totalCost;
    },
    currentlyBookedDates: ({ id }, _, { dataSources }) => {
      return dataSources.bookingsDb.getCurrentlyBookedDateRangesForListing(id);
    },
    bookings: ({ id }, _, { dataSources }) => {
      return dataSources.bookingsDb.getBookingsForListing(id);
    },
    numberOfUpcomingBookings: async ({ id }, _, { dataSources }) => {
      const bookings = (await dataSources.bookingsDb.getBookingsForListing(id, 'UPCOMING')) || [];
      return bookings.length;
    },
  },
  Booking: {
    listing: ({ listingId }, _, { dataSources }) => {
      return dataSources.listingsAPI.getListing(listingId);
    },
    checkInDate: ({ checkInDate }, _, { dataSources }) => {
      return dataSources.bookingsDb.getHumanReadableDate(checkInDate);
    },
    checkOutDate: ({ checkOutDate }, _, { dataSources }) => {
      return dataSources.bookingsDb.getHumanReadableDate(checkOutDate);
    },
    guest: ({ guestId }) => {
      return { id: guestId };
    },
    totalPrice: async ({ listingId, checkInDate, checkOutDate }, _, { dataSources }) => {
      const { totalCost } = await dataSources.listingsAPI.getTotalCost({ id: listingId, checkInDate, checkOutDate });
      return totalCost;
    },
    guestReview: ({ id }, _, { dataSources }) => {
      return dataSources.reviewsDb.getReviewForBooking('GUEST', id);
    },
    hostReview: ({ id }, _, { dataSources }) => {
      return dataSources.reviewsDb.getReviewForBooking('HOST', id);
    },
    locationReview: ({ id }, _, { dataSources }) => {
      return dataSources.reviewsDb.getReviewForBooking('LISTING', id);
    },
  },
  Review: {
    author: (review) => {
      const role = review.targetType === 'LISTING' ? 'Guest' : 'Host';
      return { __typename: role, id: review.authorId };
    },
  },
};

module.exports = resolvers;
