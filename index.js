import { Client, Databases, Query } from "node-appwrite";
import dotenv from "dotenv";
dotenv.config();


export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_URL)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  const databaseId = process.env.VITE_APPWRITE_DATABASE_ID;
  const requestCollectionId = process.env.VITE_APPWRITE_REQUEST_ID;
  const bookingCollectionId = process.env.VITE_APPWRITE_BOOKING_COLLECTION_ID;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // start of today

    let offset = 0;
    let offset2 = 0;
    let offset3 = 0;
    const limit = 50;
    let requestUpdatedCount = 0;
    let bookingUpdatedCount = 0;
    let bookingTravellingCount = 0;

    while (true) {
      const response = await databases.listDocuments(databaseId, requestCollectionId, [
        Query.lessThanEqual("returnDate", today.toISOString()),
        Query.equal("status", "Booking Confirmed"),
        Query.limit(limit),
        Query.offset(offset),
        Query.orderAsc("$createdAt"), 
        Query.select(["$id", "status"])
      ]);

      console.log('request response', response.total, response.documents.length)

      if (response.documents.length === 0 || requestUpdatedCount >= response.total) break;
      // if (response.documents.length === 0 || updatedCount === 10) break;

      for (const doc of response.documents) {
        await databases.updateDocument(databaseId, requestCollectionId, doc.$id, {
          status: "Adventure Completed",
        });

        requestUpdatedCount++;
        console.log(`✅ Updated request ${doc.$id} to Adventure Completed`);
      }

      offset += limit;
    }

      while (true) {
   const response = await databases.listDocuments(databaseId, bookingCollectionId, [
  Query.lessThanEqual("onwardDate", today.toISOString()),
  Query.greaterThanEqual("returnDate", today.toISOString()),
  Query.limit(limit),
  Query.offset(offset2),
  Query.orderAsc("$createdAt"),
        Query.equal("bookingCancelled", false),
        Query.notEqual("status", "Travelling"),
        Query.select(["$id", "status"])
]);


      console.log('booking travelling response', response.total, response.documents.length)

      if (response.documents.length === 0 || bookingUpdatedCount >= response.total) break;
      // if (response.documents.length === 0 || updatedCount === 10) break;

      for (const doc of response.documents) {
        await databases.updateDocument(databaseId, bookingCollectionId, doc.$id, {
          status: "Travelling",
        });

        bookingUpdatedCount++;
        console.log(`✅ Updated booking ${doc.$id} to Travelling on ${today.toISOString()}`);
      }

      offset2 += limit;
    }


     while (true) {
      const response = await databases.listDocuments(databaseId, bookingCollectionId, [
        Query.lessThanEqual("returnDate", today.toISOString()),
        Query.limit(limit),
        Query.offset(offset3),
        Query.orderAsc("$createdAt"),
        Query.notEqual("status", "Travel completed"),
        Query.equal("bookingCancelled", false),
        Query.select(["$id", "status"])
      ]);

      console.log('booking completed response', response.total, response.documents.length)

      if (response.documents.length === 0 || bookingTravellingCount >= response.total) break;
      // if (response.documents.length === 0 || updatedCount === 10) break;

      for (const doc of response.documents) {
        await databases.updateDocument(databaseId, bookingCollectionId, doc.$id, {
          status: "Travel completed",
        });

        bookingTravellingCount++;
        console.log(`✅ Updated booking ${doc.$id} to Travel completed`);
      }

      offset3 += limit;
    }
   
    return {
      success: true,
      message: "Daily request status update completed",
      requestUpdatedCount,
      bookingUpdatedCount,
      bookingTravellingCount
    };
  } catch (err) {
    console.error("❌ Error updating request statuses: " + err.message);

    return {
      success: false,
      error: err.message,
    };
  }
};


