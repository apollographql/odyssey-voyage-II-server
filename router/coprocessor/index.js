const express = require('express');

const axios = require('axios');

const app = express();
const port = 8081;

app.use(express.json());

app.post('/', async (req, res) => {
  //  Router request
  console.log(`request headers ${JSON.stringify(req.headers, null, 2)}`);
  const request = req.body;
  console.log('✉️ Got payload:');
  console.log(JSON.stringify(request, null, 2));
  try {
    // TODO: switch from hardcoded to something from the JWT claim
    const user_id = 'user-1';

    const { data } = await axios.get(
      `https://rt-airlock-services-account.herokuapp.com/login/${user_id}`
    );

    console.log({ data });

    const claims = {
      ...request.context.entries['apollo_authentication::JWT::claims'],
      userId: data.id,
      userRole: data.role,
      somethingToTest: 'WOW',
    };

    const requestWithClaims = {
      ...request,
      context: {
        entries: {
          'apollo_authentication::JWT::claims': claims,
        },
      },
      headers: {
        userId: data.id,
        userRole: data.role,
        somethingToTest: 'WOW',
      },
    };

    const resultToReturn = {
      ...req.body,
      control: 'continue',
      headers: {
        userid: data.id,
        userrole: data.role,
        somethingToTest: 'WOW',
      },
    };

    console.log(resultToReturn);
    res.json(resultToReturn);

    // res.json(requestWithClaims);
  } catch (e) {
    throw new Error('Unauthorized');
  }
});

app.listen(port, () => {
  console.log(`🚀 Coprocessor running on port ${port}`);
});
