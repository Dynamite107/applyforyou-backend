// =============================================================
// File: helpers/googleDriveHelper.js
// Google Sheet mein data save karne ke liye function.
// =============================================================
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// Google Sheet ID ko .env file se load karein
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
let doc;
let isInitialized = false;

// Google Sheet API ko initialize karein
try {
    if (!process.env.GOOGLE_API_CREDENTIALS || !SHEET_ID) {
        throw new Error("Google credentials ya Sheet ID .env file mein nahi hai.");
    }
    
    // .env file se credentials ko parse karein
    const credentials = JSON.parse(process.env.GOOGLE_API_CREDENTIALS);
    
    // Google Auth object banayein
    const serviceAccountAuth = new JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive.file',
        ],
    });

    // Spreadsheet object ko initialize karein
    doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
    isInitialized = true;

} catch (error) {
    console.error("Google Sheet Helper ko initialize karne mein error:", error.message);
    isInitialized = false;
}

/**
 * Nayi application/payment ki details Google Sheet mein save karein
 * @param {object} appData - Application ka poora data
 */
export const saveApplicationDataToDrive = async (appData) => {
    if (!isInitialized) {
        console.error("Google Sheet service initialize nahi hui. Data save nahi ho sakta.");
        return;
    }

    try {
        // Spreadsheet ki info load karein
        await doc.loadInfo(); 
        
        // Pehli sheet ko select karein (ya naam se bhi kar sakte hain)
        const sheet = doc.sheetsByIndex[0]; 

        // Nayi row add karein. Column headers aur appData ke keys match hone chahiye.
        await sheet.addRow({
            "Customer Name": appData.customerName,
            "WhatsApp No": appData.customerMobile,
            "Email": appData.customerEmail,
            "Service": appData.serviceTitle,
            "Payment Amount": appData.amountPaid,
            "Status": appData.status,
            "Payment ID": appData.paymentId,
            "Token ID": appData.tokenId,
            "Time Slot": appData.timeSlot,
            "Applied Date": new Date(appData.appliedAt).toLocaleString('en-IN'),
            "Delivery Date": appData.deliveryDate
        });

        console.log(`Data safaltapoorvak Google Sheet mein save ho gaya.`);

    } catch (error) {
        console.error('Google Sheet mein data save karne mein error:', error.message);
    }
};

// Purana function (ab istemal nahi hoga, lekin rakha hai)
export const saveUserDataToDrive = (userData) => {
  console.log("saveUserDataToDrive function ab istemal nahi ho raha hai.");
};
