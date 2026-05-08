const { AuthenticationError, ForbiddenError } = require('./utils/errors');
const resolvers = {
  Query: {
    user: async (_, { id }, { dataSources }) => {
      console.log('📦 [subgraph-accounts] handling user');
      const user = await dataSources.accountsAPI.getUser(id);
      if (!user) {
        throw new Error('No user found for this Id');
      }
      return user;
    },
    me: async (_, __, { dataSources, userId }) => {
      console.log('📦 [subgraph-accounts] handling me');
      if (!userId) throw AuthenticationError();
      const user = await dataSources.accountsAPI.getUser(userId);
      return user;
    },
  },
  Mutation: {
    updateProfile: async (
      _,
      { updateProfileInput },
      { dataSources, userId }
    ) => {
      console.log('📦 [subgraph-accounts] handling updateProfile');
      if (!userId) throw AuthenticationError();
      try {
        const updatedUser = await dataSources.accountsAPI.updateUser({
          userId,
          userInfo: updateProfileInput,
        });
        return {
          code: 200,
          success: true,
          message: 'Profile successfully updated!',
          user: updatedUser,
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
    __resolveReference: (user, { dataSources }) => {
      console.log('📦 [subgraph-accounts] handling Host');
      return dataSources.accountsAPI.getUser(user.id);
    },
  },
  Guest: {
    __resolveReference: (user, { dataSources }) => {
      console.log('📦 [subgraph-accounts] handling Guest');
      return dataSources.accountsAPI.getUser(user.id);
    },
  },
  User: {
    __resolveType(user) {
      console.log('📦 [subgraph-accounts] handling User');
      return user.role;
    },
  },
};

module.exports = resolvers;
