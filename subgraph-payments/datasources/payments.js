const { RESTDataSource } = require("@apollo/datasource-rest");

class PaymentsAPI extends RESTDataSource {
  baseURL = "https://rt-airlock-services-payments.herokuapp.com/";

  constructor(config) {
    super({ ...config, fetch: globalThis.fetch });
  }

  async getUserWalletAmount(userId) {
    console.log(`[Payments REST API] GET /wallet/${userId}`);
    return this.get(`wallet/${userId}`).catch(this.handleError);
  }

  async addFunds({ userId, amount }) {
    console.log(`[Payments REST API] PATCH /wallet/${userId}/add with amount: ${amount}`);
    return this.patch(`wallet/${userId}/add`, { body: { amount } }).catch(this.handleError);
  }

  async subtractFunds({ userId, amount }) {
    console.log(`[Payments REST API] PATCH /wallet/${userId}/subtract with amount: ${amount}`);
    return this.patch(`wallet/${userId}/subtract`, { body: { amount } }).catch(this.handleError);
  }

  handleError(error) {
    console.error(`[Payments REST API] Request Failed!`);
    console.error(`Status: ${error?.extensions?.response?.status}`);
    console.error(`Body:`, error?.extensions?.response?.body);
    console.error(error.message);
    throw error;
  }
}

module.exports = PaymentsAPI;
