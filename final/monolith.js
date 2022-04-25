const { ApolloServer, gql } = require('apollo-server');
const { buildSubgraphSchema } = require('@apollo/subgraph');

const { readFileSync } = require('fs');

const typeDefs = gql(readFileSync('./schema.graphql', { encoding: 'utf-8' }));
const resolvers = require('./resolvers');
const { BookingsDataSource, ReviewsDataSource, ListingsAPI, AccountsAPI, PaymentsAPI } = require('./services');

const server = new ApolloServer({
  schema: buildSubgraphSchema({ typeDefs, resolvers }),
  dataSources: () => {
    return {
      accountsAPI: new AccountsAPI(),
      bookingsDb: new BookingsDataSource(),
      reviewsDb: new ReviewsDataSource(),
      listingsAPI: new ListingsAPI(),
      paymentsAPI: new PaymentsAPI(),
    };
  },
  context: ({ req }) => {
    return { userId: req.headers.userid, userRole: req.headers.userrole };
  },
});

server
  .listen({ port: 4001 })
  .then(({ url }) => {
    console.log(`🚀 Monolith subgraph running at ${url}`);
  })
  .catch((err) => {
    console.error(err);
  });
