# Bookings Database

A database for all things related to bookings.

This will be hosted and accessed locally in order to keep data isolated for each learner that takes this Odyssey course. Only `payments` data is shared across all learners of Odyssey.

Since bookings are tied to check-in and check-out dates, a script to update the status of a booking (CURRENT, UPCOMING, COMPLETED) will run every time services are launched with the `npm run launch` script.