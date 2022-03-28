const { ApolloGateway, RemoteGraphQLDataSource } = require('@apollo/gateway');
const { ApolloServer, AuthenticationError } = require('apollo-server');
const axios = require('axios');

require('dotenv').config();

class AuthenticatedDataSource extends RemoteGraphQLDataSource {
  willSendRequest({ request, context }) {
    // Pass the user's id from the context to each subgraph
    // as a header called `userid` and `userrole`
    if (context.userId) {
      request.http.headers.set('userid', context.userId);
      request.http.headers.set('userrole', context.userRole);
    }
  }
}

const gateway = new ApolloGateway({
  buildService: ({ url }) => {
    return new AuthenticatedDataSource({ url });
  },
});

const server = new ApolloServer({
  gateway,
  context: async ({ req }) => {
    const token = req.headers.authorization || '';
    const userId = token.split(' ')[1]; // get the user name after 'Bearer '
    if (userId) {
      const { data } = await axios
        .get(`http://localhost:4011/login/${userId}`)
        .catch((error) => {
          throw new AuthenticationError(error.message);
        });

      return { userId: data.id, userRole: data.role };
    }
  },
});

server
  .listen()
  .then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
  })
  .catch((err) => {
    console.error(err);
  });
