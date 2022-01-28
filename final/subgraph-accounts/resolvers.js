const { AuthenticationError, ForbiddenError } = require('apollo-server');
const authErrMessage = '*** you must be logged in ***';

const resolvers = {
  Query: {
    user: async (_, { id }, { dataSources }) => {
      const user = await dataSources.accountsAPI.getUser(id);
      if (!user) {
        throw new Error('No user found for this Id');
      }
      return user;
    },
    me: async (_, __, { dataSources, userId }) => {
      if (!userId) throw new AuthenticationError(authErrMessage);
      const user = await dataSources.accountsAPI.getUser(userId);
      return user;
    },
  },
  User: {
    __resolveType(user) {
      return user.role;
    },
  },
  Host: {
    __resolveReference: (user, { dataSources }) => {
      return dataSources.accountsAPI.getUser(user.id);
    },
  },
  Guest: {
    __resolveReference: (user, { dataSources }) => {
      return dataSources.accountsAPI.getUser(user.id);
    },
  },
};

module.exports = resolvers;
