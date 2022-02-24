const concurrently = require('concurrently');
const path = require('path');
concurrently(
  [
    {
      command: 'npm run db:reset',
      name: 'accounts',
      cwd: path.resolve(__dirname, '../services/accounts'),
      prefixColor: 'blue',
    },
    {
      command: 'npm run db:reset',
      name: 'listings',
      cwd: path.resolve(__dirname, '../services/listings'),
      prefixColor: 'magenta',
    },
    {
      command: 'npm run db:reset',
      name: 'bookings',
      cwd: path.resolve(__dirname, '../services/bookings'),
      prefixColor: 'green',
    },
    {
      command: 'npm run db:reset',
      name: 'reviews',
      cwd: path.resolve(__dirname, '../services/reviews'),
      prefixColor: 'yellow',
    },
  ],
  {
    prefix: 'name',
    killOthers: ['failure'],
    restartTries: 3,
  }
).then(
  function onSuccess(exitInfo) {
    console.log('SUCCESS: Databases successfully reset to initial state and data.');
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
