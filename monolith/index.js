const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');

const { readFileSync } = require('fs');
const axios = require('axios');
const gql = require('graphql-tag');

const { AuthenticationError } = require('./utils/errors');

const typeDefs = gql(readFileSync('./schema.graphql', { encoding: 'utf-8' }));
const resolvers = require('./resolvers');

const BookingsDataSource = require('./datasources/bookings');
const ReviewsDataSource = require('./datasources/reviews');
const ListingsAPI = require('./datasources/listings');
const AccountsAPI = require('./datasources/accounts');
const PaymentsAPI = require('./datasources/payments');

async function startApolloServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  const port = 4000;

  try {
    const { url } = await startStandaloneServer(server, {
      context: async ({ req }) => {
        const token = req.headers.authorization || '';
        const userId = token.split(' ')[1]; // get the user name after 'Bearer '

        let userInfo = {};
        if (userId) {
          const { data } = await axios
            .get(`http://localhost:4011/login/${userId}`)
            .catch((error) => {
              throw AuthenticationError();
            });

          userInfo = { userId: data.id, userRole: data.role };
        }

        const { cache } = server;

        return {
          ...userInfo,
          dataSources: {
            bookingsDb: new BookingsDataSource(),
            reviewsDb: new ReviewsDataSource(),
            listingsAPI: new ListingsAPI({ cache }),
            accountsAPI: new AccountsAPI({ cache }),
            paymentsAPI: new PaymentsAPI({ cache }),
          },
        };
      },
      listen: {
        port,
      },
    });

    console.log(`🚀  Server ready at ${url}`);
  } catch (err) {
    console.error(err);
  }
}

startApolloServer();
