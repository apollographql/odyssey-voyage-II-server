const { AuthenticationError, ForbiddenError } = require("./utils/errors");

const resolvers = {
  Query: {},
  Mutation: {
    addFundsToWallet: async (_, { amount }, { dataSources, userId }) => {
      console.log(`[Payments Subgraph] Adding ${amount} funds for user ${userId}...`);
      if (!userId) throw AuthenticationError();
      try {
        const updatedWallet = await dataSources.paymentsAPI.addFunds({
          userId,
          amount,
        });
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
  Guest: {
    funds: async (_, __, { dataSources, userId }) => {
      console.log(`[Payments Subgraph] Getting wallet amount for user ${userId}...`);
      const { amount } =
        await dataSources.paymentsAPI.getUserWalletAmount(userId);
      return amount;
    },
  },
};

module.exports = resolvers;
