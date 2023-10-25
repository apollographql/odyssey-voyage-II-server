const axios = require('axios');
require('dotenv').config();

async function getToken(username, password) {
  const response = await axios.post(
    `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
    {
      audience: process.env.AUTH0_AUDIENCE,
      client_id: process.env.AUTH0_CLIENT_ID_GRAPHQL,
      client_secret: process.env.AUTH0_CLIENT_SECRET_GRAPHQL,
      grant_type: 'http://auth0.com/oauth/grant-type/password-realm',
      password,
      realm: 'Username-Password-Authentication',
      scope: 'openid',
      username,
    },
    {
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
    }
  );

  const { access_token } = JSON.parse(response);
  if (!access_token) {
    throw new Error(body.error_description || 'Cannot retrieve access token.');
  }

  return access_token;
}

(async function () {
  const [email, password] = process.argv.slice(2);
  const access_token = await getToken(email, password).catch((error) => {
    console.log('something went wrong');
    console.log(error);
  });
  console.log(access_token);
})();
