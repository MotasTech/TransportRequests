import {
  getGoogleSheetsErrorMessage,
  getSheetValues,
} from '../../lib/googleSheets';

const SPREADSHEET_ID = process.env.GOOGLE_ORDERS_SPREADSHEET_ID;
const SHEET_NAME = process.env.GOOGLE_PASSCODES_SHEET_NAME || 'Passcodes';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const values = await getSheetValues({
      spreadsheetId: SPREADSHEET_ID,
      sheetName: SHEET_NAME,
      columns: 'A:B',
    });

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(values);
  } catch (error) {
    console.error('Failed to read passcodes from Google Sheets:', getGoogleSheetsErrorMessage(error));
    return res.status(500).json({
      error: 'Unable to load passcodes right now. Please try again later.',
    });
  }
}
