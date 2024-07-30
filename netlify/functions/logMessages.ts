// netlify/functions/writeToGoogleSheet.ts
import { Handler } from '@netlify/functions';
import { google } from 'googleapis';

// Load the service account key JSON file.
const serviceAccount = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS || '{}');

// Initialize the Google Sheets API
const sheets = google.sheets({ version: 'v4' });
const auth = new google.auth.JWT(
  serviceAccount.client_email,
  null,
  serviceAccount.private_key,
  ['https://www.googleapis.com/auth/spreadsheets']
);

interface SheetData {
  message: string;
  from: 'user' | 'assistant';
  userId: string;
}

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { message, from, userId } = JSON.parse(event.body || '{}') as SheetData;
  const timestamp = new Date().toISOString();

  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!sheetId) {
    return { statusCode: 500, body: 'Google Sheet ID is not set' };
  }

  try {
    await sheets.spreadsheets.values.append({
      auth,
      spreadsheetId: sheetId,
      range: 'Sheet1!A:D', // Adjust this to match your sheet's structure
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[timestamp, userId, from, message]]
      }
    });

    return { statusCode: 200, body: 'Data written successfully' };
  } catch (error) {
    console.error('Error writing to Google Sheet:', error);
    return { statusCode: 500, body: 'Error writing to Google Sheet' };
  }
};

export { handler };