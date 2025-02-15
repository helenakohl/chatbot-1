// netlify/functions/logButtonClick.ts
import { Handler } from '@netlify/functions';
import { google } from 'googleapis';

// Load the service account key JSON file.
const serviceAccount = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS || '{}');

// Initialize the Google Sheets API
const sheets = google.sheets({ version: 'v4' });
const auth = new google.auth.JWT(
  serviceAccount.client_email,
  undefined,
  serviceAccount.private_key,
  ['https://www.googleapis.com/auth/spreadsheets']
);

interface ClickData {
  userId: string;
  buttonClicked: "Yes" | "No";
}

const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { userId, buttonClicked } = JSON.parse(event.body || '{}') as ClickData;
    if (!userId || !buttonClicked) {
      return { statusCode: 400, body: 'Bad Request: Missing userId or buttonClicked' };
    }

    const timestamp = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Berlin',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date());

    const sheetId = process.env.GOOGLE_SHEET_ID_BUTTON;
    if (!sheetId) {
      return { statusCode: 500, body: 'Internal Server Error: Missing Google Sheet ID' };
    }

    const yesClicked = buttonClicked === "Yes" ? 1 : 0;
    const noClicked = buttonClicked === "No" ? 1 : 0;

    // Log the data being sent to Google Sheets
    console.log('Logging button click:', { userId, buttonClicked, timestamp, yesClicked, noClicked });

    // Write data to Google Sheets
    await sheets.spreadsheets.values.append({
      auth,
      spreadsheetId: sheetId,
      range: 'Sheet1!A:E', // Adjust the range as needed
      valueInputOption: 'RAW',
      requestBody: {
        values: [[userId, timestamp, 1, yesClicked, noClicked]],
      },
    });

    return { statusCode: 200, body: 'Success' };
  } catch (error) {
    console.error('Error handling request:', error);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};

export { handler };