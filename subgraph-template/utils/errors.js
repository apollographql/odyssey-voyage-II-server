const { GraphQLError } = require('graphql');

const AuthenticationError = () => {
  const authErrMessage = '*** you must be logged in ***';
  return new GraphQLError(authErrMessage, {
    extensions: {
      code: 'UNAUTHENTICATED',
    },
  });
};

const ForbiddenError = (errMessage) => {
  return new GraphQLError(errMessage, {
    extensions: {
      code: 'FORBIDDEN',
    },
  });
};

module.exports = { AuthenticationError, ForbiddenError };
