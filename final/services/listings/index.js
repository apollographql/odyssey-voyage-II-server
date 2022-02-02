const express = require('express');
const { getDifferenceInDays, transformListingWithAmenities } = require('./helpers');
const { v4: uuidv4 } = require('uuid');
const app = express();
const port = 4010 || process.env.PORT;

const listingsDb = require('./sequelize/models');
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// get listing matching query params
app.get('/listings', async (req, res) => {
  // default: page = 1, limit 20 results per page
  const { page = 1, limit = 5, sortBy } = req.query;
  const skipValue = (parseInt(page, 10) - 1) * parseInt(limit, 10); // 0 indexed for page

  const { numOfBeds: minNumOfBeds } = req.query;
  const { gte } = listingsDb.Sequelize.Op;

  let sortOrder = ['costPerNight', 'DESC']; // default descending cost
  if (sortBy === 'COST_ASC') {
    sortOrder = ['costPerNight', 'ASC'];
  }

  const listings = await listingsDb.Listing.findAll({
    where: {
      numOfBeds: {
        [gte]: minNumOfBeds,
      },
    },
    order: [sortOrder],
    limit: parseInt(limit, 10),
    offset: skipValue,
  });

  return res.json(listings);
});

// get 3 featured listings
app.get('/featured-listings', async (req, res) => {
  const { limit } = req.query;
  const listings = await listingsDb.Listing.findAll({
    where: {
      isFeatured: true,
    },
    limit,
  });

  return res.json(listings);
});
// get all listings for a specific user
app.get('/user/:userId/listings', async (req, res) => {
  const listings = await listingsDb.Listing.findAll({ where: { hostId: req.params.userId } });
  return res.json(listings);
});

// get listing info for a specific listing
app.get('/listings/:listingId', async (req, res) => {
  const listingInstance = await listingsDb.Listing.findOne({
    where: { id: req.params.listingId },
    include: listingsDb.Amenity,
  });
  const listingToReturn = transformListingWithAmenities(listingInstance);

  return res.json(listingToReturn);
});

// get listing info for a specific listing
app.get('/listings/:listingId/totalCost', async (req, res) => {
  const { costPerNight } = await listingsDb.Listing.findOne({
    where: { id: req.params.listingId },
    attributes: ['costPerNight'],
  });

  if (!costPerNight) {
    return res.status(400).send('Could not find listing with specified ID');
  }

  const { checkInDate, checkOutDate } = req.query;
  const diffInDays = getDifferenceInDays(checkInDate, checkOutDate);

  if (diffInDays === NaN) {
    return res
      .status(400)
      .send('Could not calculate total cost. Please double check the check-in and check-out date format.');
  }

  return res.json({ totalCost: costPerNight * diffInDays });
});

// get all possible listing amenities
app.get('/listing/amenities', async (req, res) => {
  const amenities = await listingsDb.Amenity.findAll();
  return res.json(amenities);
});

// create a listing
app.post('/listings', async (req, res) => {
  /*
    // this should never be triggered when called from the mutation resolver as the input will be validated,
    // do we keep it in case we call the REST endpoint directly
    if (!(title && photoThumbnail && description && numOfBeds && costPerNight && hostId && locationType && amenities)) {
      return res.status(400).send('missing data to create a new listing');
    }
  */
  const listingData = req.body.listing;
  const amenitiesData = req.body.listing.amenities;
  const id = uuidv4();

  const listing = await listingsDb.Listing.create({
    id,
    ...listingData,
  });

  await listing.setAmenities(amenitiesData);

  let updatedListing = await listingsDb.Listing.findOne({
    include: listingsDb.Amenity,
    where: { id },
  });
  const listingToReturn = transformListingWithAmenities(updatedListing);

  return res.json(listingToReturn);
});

// edit a listing
app.patch('/listings/:listingId', async (req, res) => {
  let listing = await listingsDb.Listing.findOne({
    include: listingsDb.Amenity,
    where: { id: req.params.listingId },
  });

  const newListing = req.body.listing;
  const newAmenities = req.body.listing.amenities;

  await listing.update({ ...newListing });
  await listing.setAmenities(newAmenities);

  let updatedListing = await listingsDb.Listing.findOne({
    include: listingsDb.Amenity,
    where: { id: req.params.listingId },
  });
  const listingToReturn = transformListingWithAmenities(updatedListing);

  return res.json(listingToReturn);
});

app.listen(port, () => {
  console.log(`Listing API running at http://localhost:${port}`);
});
