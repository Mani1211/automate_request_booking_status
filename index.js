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
  const collectionId = process.env.VITE_APPWRITE_REQUEST_ID;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // start of today

    let offset = 0;
    const limit = 50;
    let updatedCount = 0;

    while (true) {
      const response = await databases.listDocuments(databaseId, collectionId, [
        Query.lessThan("returnDate", today.toISOString()),
        Query.equal("status", "Booking Confirmed"),
        Query.limit(limit),
        Query.offset(offset),
        Query.orderAsc("$createdAt")
      ]);

      console.log('response', response.total, response.documents.length)

      // if (response.documents.length === 0 || updatedCount >= response.total) break;
      if (response.documents.length === 0 || updatedCount === 10) break;

      for (const doc of response.documents) {
        await databases.updateDocument(databaseId, collectionId, doc.$id, {
          status: "Adventure Completed",
        });

        updatedCount++;
        console.log(`✅ Updated request ${doc.$id} to Adventure Completed`);
      }

      offset += limit;
    }

    return {
      success: true,
      message: "Daily request status update completed",
      updatedCount,
    };
  } catch (err) {
    console.error("❌ Error updating request statuses: " + err.message);

    return {
      success: false,
      error: err.message,
    };
  }
};


// const automate = async ()=>{
//    const client = new Client()
//     .setEndpoint(process.env.VITE_APPWRITE_URL)
//     .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
//     .setKey(process.env.APPWRITE_API_KEY);

//   const databases = new Databases(client);

//   const databaseId = process.env.VITE_APPWRITE_DATABASE_ID;
//   const collectionId = process.env.VITE_APPWRITE_REQUEST_ID;

//   try {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0); // start of today

//     let offset = 0;
//     const limit = 30;
//     let updatedCount = 0;

//     while (true) {
//       const response = await databases.listDocuments(databaseId, collectionId, [
//         Query.lessThan("returnDate", today.toISOString()),
//         Query.equal("status", "Booking Confirmed"),
//         Query.limit(limit),
//         Query.offset(offset),
//         Query.orderAsc("$createdAt")
//       ]);

//       console.log('response', response.total, response.documents.length)

//       if (response.documents.length === 0 || updatedCount >= response.total) break;

//       for (const doc of response.documents) {
//         await databases.updateDocument(databaseId, collectionId, doc.$id, {
//           status: "Adventure Completed",
//         });

//         updatedCount++;
//         console.log(`✅ Updated request ${doc.$id} to Adventure Completed`);
//       }

//       offset += limit;
//     }

//     return {
//       success: true,
//       message: "Daily request status update completed",
//       updatedCount,
//     };
//   } catch (err) {
//     console.error("❌ Error updating request statuses: " + err.message);

//     return {
//       success: false,
//       error: err.message,
//     };
//   }
// }


// const res = automate()
// console.log('res', res)