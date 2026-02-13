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
        Query.orderAsc("$createdAt")
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
        Query.lessThanEqual("returnDate", today.toISOString()),
        Query.limit(limit),
        Query.offset(offset),
        Query.orderAsc("$createdAt"),
        Query.equal("status", "Yet to travel")
      ]);

      console.log('booking response', response.total, response.documents.length)

      if (response.documents.length === 0 || bookingUpdatedCount >= response.total) break;
      // if (response.documents.length === 0 || updatedCount === 10) break;

      for (const doc of response.documents) {
        await databases.updateDocument(databaseId, bookingCollectionId, doc.$id, {
          status: "Travel completed",
        });

        bookingUpdatedCount++;
        console.log(`✅ Updated booking ${doc.$id} to Travel completed`);
      }

      offset += limit;
    }
     while (true) {
      const response = await databases.listDocuments(databaseId, bookingCollectionId, [
        Query.greaterThanEqual('onwardDate', today.toISOString()),
        Query.lessThan("returnDate", today.toISOString()),
        Query.limit(limit),
        Query.offset(offset),
        Query.orderAsc("$createdAt"),
        Query.equal("status", "Yet to travel")

      ]);

      console.log('booking yet to travel response', response.total, response.documents.length)

      if (response.documents.length === 0 || bookingUpdatedCount >= response.total) break;
      // if (response.documents.length === 0 || updatedCount === 10) break;

      for (const doc of response.documents) {
        await databases.updateDocument(databaseId, bookingCollectionId, doc.$id, {
          status: "Travelling",
        });

        bookingUpdatedCount++;
        console.log(`✅ Updated booking ${doc.$id} to Yet to travel`);
      }

      offset += limit;
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
