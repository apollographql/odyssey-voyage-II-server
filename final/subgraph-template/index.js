const { ApolloServer, gql } = require('apollo-server');
const { buildSubgraphSchema } = require('@apollo/subgraph');
const { readFileSync } = require('fs');
const axios = require('axios');

const typeDefs = gql(readFileSync('./schema.graphql', { encoding: 'utf-8' }));
const resolvers = require('./resolvers');

const server = new ApolloServer({
  schema: buildSubgraphSchema({ typeDefs, resolvers }),
  dataSources: () => {
    return {
      // TODO: add data sources here
    };
  },
  context: async ({ req }) => {
    const token = req.headers.authorization || '';
    const userId = token.split(' ')[1]; // get the user name after 'Bearer '
    if (userId) {
      const { data } = await axios.get(`http://localhost:4011/login/${userId}`).catch((error) => {
        throw new AuthenticationError(error.message);
      });

      return { userId: data.id, userRole: data.role };
    }
  },
});

const port = 0; // TODO: change port number
const subgraphName = ''; // TODO: change to subgraph name

server
  .listen({ port })
  .then(({ url }) => {
    console.log(`🚀 Subgraph ${subgraphName} running at ${url}`);
  })
  .catch((err) => {
    console.error(err);
  });
