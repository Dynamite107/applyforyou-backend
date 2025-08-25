// =============================================================
// File: helpers/googleDriveHelper.js
// Google Drive mein files upload karne ke liye functions.
// =============================================================
import { google } from 'googleapis';
import { Readable } from 'stream';

let drive;
const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

// Google Drive API ko initialize karein
try {
    // .env file se credentials ko parse karein (Yeh surakshit tarika hai)
    const credentials = JSON.parse(process.env.GOOGLE_API_CREDENTIALS);
    
    // Google Auth object banayein
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive'],
    });

    // Authenticated drive object banayein
    drive = google.drive({ version: 'v3', auth });
} catch (error) {
    console.error("Google API credentials load karne mein error:", error.message);
    drive = null;
}


// Google Drive mein file upload karne ke liye function
const uploadToDrive = async (fileName, fileContent) => {
  // Check karein ki Drive aur Folder ID set hai ya nahi
  if (!drive || !FOLDER_ID) {
    console.error("Google Drive is not configured. .env file mein credentials aur folder ID check karein.");
    return;
  }

  const fileMetadata = {
    name: fileName,
    parents: [FOLDER_ID], // File ko kis folder mein save karna hai
  };

  const media = {
    mimeType: 'text/plain',
    body: Readable.from(fileContent), // File ka content
  };

  try {
    // File create karne ki request bhejein
    await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',
    });
    console.log(`File '${fileName}' Google Drive mein upload ho gayi.`);
  } catch (error) {
    console.error('Google Drive mein file upload karne mein error:', error.message);
  }
};

// Naye user ki details save karein
export const saveUserDataToDrive = (userData) => {
  const fileName = `NewUser_${userData.email}_${new Date().toISOString()}.txt`;
  const fileContent = `
    New User Registration
    ---------------------
    Date: ${new Date().toLocaleString('en-IN')}
    Name: ${userData.name}
    Email: ${userData.email}
    Mobile: ${userData.mobile}
    Firebase UID: ${userData.uid}
  `;
  uploadToDrive(fileName, fileContent);
};

// Nayi application/payment ki details save karein
export const saveApplicationDataToDrive = (appData) => {
  const fileName = `NewApplication_${appData.customerName}_${new Date().toISOString()}.txt`;
  const fileContent = `
    New Service Application
    -----------------------
    Date: ${new Date().toLocaleString('en-IN')}
    Customer Name: ${appData.customerName}
    Customer Email: ${appData.customerEmail}
    Customer Mobile: ${appData.customerMobile}
    Service Title: ${appData.serviceTitle}
    Amount Paid: ${appData.amountPaid}
    Payment ID: ${appData.paymentId}
    Order ID: ${appData.orderId}
    User ID: ${appData.userId}
    Token ID: ${appData.tokenId}
    Time Slot: ${appData.timeSlot}
  `;
  uploadToDrive(fileName, fileContent);
};
