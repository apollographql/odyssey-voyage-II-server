const { RESTDataSource } = require('@apollo/datasource-rest');

class AccountsAPI extends RESTDataSource {
  baseURL = 'http://127.0.0.1:4010/';
  /**
   * @param {any} config
   */
  constructor(config) {
    // node-fetch@2 has a Windows/Node17+ ETIMEDOUT bug; use native fetch instead
    super({ ...config, fetch: globalThis.fetch });
  }

  /**
   * @param {string} username
   */
  login(username) {
    return this.get(`login/${username}`);
  }

  /**
   * @param {{userId: string, userInfo: any}} param0
   */
  updateUser({ userId, userInfo }) {
    return this.patch(`user/${userId}`, { body: { ...userInfo } });
  }

  /**
   * @param {string} userId
   */
  getUser(userId) {
    return this.get(`user/${userId}`);
  }
}

module.exports = AccountsAPI;
