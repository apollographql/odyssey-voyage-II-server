const { RESTDataSource } = require("@apollo/datasource-rest");

class AccountsAPI extends RESTDataSource {
  baseURL = "http://127.0.0.1:4011/";

  constructor(config) {
    // node-fetch@2 has a Windows/Node17+ ETIMEDOUT bug; use native fetch instead
    super({ ...config, fetch: globalThis.fetch });
  }

  login(username) {
    return this.get(`login/${username}`);
  }

  updateUser({ userId, userInfo }) {
    return this.patch(`user/${userId}`, { body: { ...userInfo } });
  }

  getUser(userId) {
    return this.get(`user/${userId}`);
  }
}

module.exports = AccountsAPI;
