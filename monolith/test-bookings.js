const BookingsDb = require('./datasources/bookings');
async function test() {
  const db = new BookingsDb();
  const bookings = await db.getBookingsForListing('listing-3');
  console.log("Bookings for listing-3:");
  bookings.forEach(b => {
    console.log("checkInDate value:", b.checkInDate);
    console.log("checkInDate type:", typeof b.checkInDate);
    console.log("Is Date instance:", b.checkInDate instanceof Date);
    console.log("new Date:", new Date(b.checkInDate));
    console.log("---");
  });
}
test().catch(console.error);
