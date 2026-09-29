import {
  getGoogleSheetsErrorMessage,
  getSheetValues,
} from '../../lib/googleSheets';

const SPREADSHEET_ID = process.env.GOOGLE_DESTINATIONS_SPREADSHEET_ID;
const SHEET_NAME = process.env.GOOGLE_DESTINATIONS_SHEET_NAME;
const SEARCHABLE_CUSTOMER_NAME_COLUMN = Number.parseInt(
  process.env.SEARCHABLE_CUSTOMER_NAME_COLUMN || '17',
  10
);

function columnNumberToLetter(columnNumber) {
  let result = '';
  let remaining = columnNumber;

  while (remaining > 0) {
    const remainder = (remaining - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    remaining = Math.floor((remaining - 1) / 26);
  }

  return result;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    if (!Number.isInteger(SEARCHABLE_CUSTOMER_NAME_COLUMN) || SEARCHABLE_CUSTOMER_NAME_COLUMN < 0) {
      throw new Error('SEARCHABLE_CUSTOMER_NAME_COLUMN must be a non-negative 0-based JavaScript column index');
    }

    const values = await getSheetValues({
      spreadsheetId: SPREADSHEET_ID,
      sheetName: SHEET_NAME,
      columns: `A:${columnNumberToLetter(SEARCHABLE_CUSTOMER_NAME_COLUMN + 1)}`,
    });

    const filteredValues = values
      .filter((row) => {
        const firstColumnValue = String(row[0] ?? '').trim();
        const searchableValue = String(row[SEARCHABLE_CUSTOMER_NAME_COLUMN] ?? '')
          .trim()
          .toLowerCase();

        return firstColumnValue !== '' && !searchableValue.includes('no');
      })
      .map((row) => row.slice(0, 4));

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(filteredValues);
  } catch (error) {
    console.error('Failed to read destinations from Google Sheets:', getGoogleSheetsErrorMessage(error));
    return res.status(500).json({
      error: 'Unable to load destinations right now. Please try again later.',
    });
  }
}
