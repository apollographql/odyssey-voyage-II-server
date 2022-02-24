const { RESTDataSource } = require('apollo-datasource-rest');

class AccountsAPI extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = 'http://localhost:4011/';
  }

  login(username) {
    return this.get(`login/${username}`);
  }

  updateUser({ userId, userInfo }) {
    return this.patch(`user/${userId}`, { ...userInfo });
  }

  getUser(userId) {
    return this.get(`user/${userId}`);
  }
}

module.exports = AccountsAPI;
