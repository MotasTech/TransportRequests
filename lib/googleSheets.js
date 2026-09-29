import { google } from 'googleapis';

const GOOGLE_SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

let sheetsClientPromise;

function getServiceAccountCredentials() {
  const rawCredentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!rawCredentials) {
    throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_JSON');
  }

  let credentials;
  try {
    credentials = JSON.parse(rawCredentials);
  } catch (error) {
    throw new Error('The Google service-account credentials are not valid JSON');
  }

  if (!credentials.client_email || !credentials.private_key) {
    throw new Error('Google service-account credentials must include client_email and private_key');
  }

  return {
    client_email: credentials.client_email,
    private_key: credentials.private_key.replace(/\\n/g, '\n'),
  };
}

export async function getSheetsClient() {
  if (!sheetsClientPromise) {
    sheetsClientPromise = (async () => {
      const credentials = getServiceAccountCredentials();
      const auth = new google.auth.JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: [GOOGLE_SHEETS_SCOPE],
      });

      await auth.authorize();
      return google.sheets({ version: 'v4', auth });
    })();
  }

  return sheetsClientPromise;
}

function quoteSheetName(sheetName) {
  return `'${sheetName.replace(/'/g, "''")}'`;
}

async function resolveSheetName(sheets, spreadsheetId, configuredSheetName) {
  if (configuredSheetName) return configuredSheetName;

  const metadata = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties(title,index)',
  });

  const firstSheet = (metadata.data.sheets || [])
    .sort((a, b) => (a.properties?.index || 0) - (b.properties?.index || 0))[0];

  if (!firstSheet?.properties?.title) {
    throw new Error(`No worksheets were found in spreadsheet ${spreadsheetId}`);
  }

  return firstSheet.properties.title;
}

export async function getSheetValues({ spreadsheetId, sheetName, columns = 'A:Z' }) {
  if (!spreadsheetId) throw new Error('A Google spreadsheet ID is required');

  const sheets = await getSheetsClient();
  const resolvedSheetName = await resolveSheetName(sheets, spreadsheetId, sheetName);
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${quoteSheetName(resolvedSheetName)}!${columns}`,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });

  return response.data.values || [];
}

export async function appendSheetRows({ spreadsheetId, sheetName, rows }) {
  if (!spreadsheetId) throw new Error('A Google spreadsheet ID is required');
  if (!rows?.length) return;

  const sheets = await getSheetsClient();
  const resolvedSheetName = await resolveSheetName(sheets, spreadsheetId, sheetName);

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    // Column T is reserved for the Apps Script Email Sent checkbox.
    range: `${quoteSheetName(resolvedSheetName)}!A:S`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      majorDimension: 'ROWS',
      values: rows,
    },
  });
}

export function getGoogleSheetsErrorMessage(error) {
  return error?.response?.data?.error?.message || error?.message || 'Unknown Google Sheets error';
}
