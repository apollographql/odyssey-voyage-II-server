const { RESTDataSource } = require('@apollo/datasource-rest');

class PaymentsAPI extends RESTDataSource {
  baseURL = 'https://rt-airlock-services-payments.herokuapp.com/';

  getUserWalletAmount(userId) {
    return this.get(`wallet/${userId}`);
  }

  addFunds({ userId, amount }) {
    return this.patch(`wallet/${userId}/add`, { body: { amount } });
  }

  subtractFunds({ userId, amount }) {
    return this.patch(`wallet/${userId}/subtract`, { body: { amount } });
  }
}

module.exports = PaymentsAPI;
