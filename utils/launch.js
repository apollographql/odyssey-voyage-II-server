const concurrently = require('concurrently');
const path = require('path');
concurrently(
  [
    {
      command: 'npm start',
      name: 'accounts',
      cwd: path.resolve(__dirname, '../services/accounts'),
      prefixColor: 'blue',
    },
    {
      command: 'npm start',
      name: 'listings',
      cwd: path.resolve(__dirname, '../services/listings'),
      prefixColor: 'magenta',
    },
    {
      command: 'npm run booking:update',
      name: 'bookings',
      cwd: path.resolve(__dirname, '../services/bookings'),
      prefixColor: 'green',
    },
  ],
  {
    prefix: 'name',
    killOthers: ['failure'],
    restartTries: 3,
  }
).then(
  function onSuccess() {
    // This code is necessary to make sure the parent terminates
    // when the application is closed successfully.
    process.exit();
  },
  function onFailure(exitInfo) {
    console.log(exitInfo);
    // This code is necessary to make sure the parent terminates
    // when the application is closed because of a failure.
    process.exit();
  }
);
