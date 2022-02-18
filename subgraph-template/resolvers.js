const { AuthenticationError, ForbiddenError } = require('apollo-server');
const authErrMessage = '*** you must be logged in ***';

const resolvers = {
  // TODO: fill in resolvers
  Query: {
    example: () => 'Hello World!',
  },
};

module.exports = resolvers;
