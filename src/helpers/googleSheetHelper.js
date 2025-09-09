// =============================================================
// File: src/helpers/googleSheetHelper.js
// Google Sheet mein data save karne ke liye function.
// =============================================================
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

let doc;
let isInitialized = false;

// Google Sheet API ko initialize karein
try {
    // Check karein ki zaroori environment variables मौजूद hain ya nahi
    if (!process.env.GOOGLE_API_CREDENTIALS || !process.env.GOOGLE_SHEET_ID) {
        throw new Error("Google credentials ya Sheet ID .env file mein nahi hai.");
    }
    
    // .env file se credentials ko parse karein
    const credentials = JSON.parse(process.env.GOOGLE_API_CREDENTIALS);
    
    // Google Auth object banayein
    const serviceAccountAuth = new JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // Spreadsheet object ko initialize karein
    doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    isInitialized = true;
    console.log("Google Sheet Helper safaltapoorvak initialize ho gaya.");

} catch (error)
 {
    console.error("Google Sheet Helper ko initialize karne mein error:", error.message);
    isInitialized = false;
}

/**
 * Nayi application/payment ki details Google Sheet mein save karein
 * @param {object} appData - Application ka poora data
 */
export const saveApplicationDataToSheet = async (appData) => {
    if (!isInitialized) {
        console.error("Google Sheet service initialize nahi hui. Data save nahi ho sakta.");
        return; // Function ko yahin rok dein
    }

    try {
        await doc.loadInfo(); 
        const sheet = doc.sheetsByIndex[0]; // Pehli sheet ko select karein

        // Nayi row add karein (Aapke screenshot ke column headers se milte-julte naam)
        await sheet.addRow({
            'Customer Name': appData.customerName,
            'WhatsApp No': appData.whatsappNo,
            'Service': appData.service,
            'Payment Amount': appData.amount,
            'Status': appData.status,
            'Payment ID': appData.paymentId,
            'Token ID': appData.tokenId,
            'Time Slot': appData.timeSlot,
            'Applied Date': new Date(appData.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }),
        });

        console.log(`Data safaltapoorvak Google Sheet mein save ho gaya.`);

    } catch (error) {
        console.error('Google Sheet mein data save karne mein error:', error.message);
    }
};

