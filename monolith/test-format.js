const BookingsDb = require('./datasources/bookings');
async function test() {
  const db = new BookingsDb();
  const bookings = await db.getBookingsForListing('listing-3');
  bookings.forEach(b => {
    try {
      console.log(db.getHumanReadableDate(b.checkInDate));
    } catch (e) {
      console.error("Failed on", b.checkInDate, e);
    }
  });
}
test().catch(console.error);
