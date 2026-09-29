import {
  appendSheetRows,
  getGoogleSheetsErrorMessage,
} from '../../lib/googleSheets';

const SPREADSHEET_ID = process.env.GOOGLE_ORDERS_SPREADSHEET_ID;
const SHEET_NAME = process.env.GOOGLE_REQUESTS_SHEET_NAME || 'Requests';

function buildRequestRows(data) {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  return data.orders.map((order) => {
    const isLayover = data.pickupDate !== order.deliveryDate ? 'PU' : 'PSD';

    return [
      '',
      now,
      data.orderId || '',
      data.pickupDate || '',
      order.deliveryDate || '',
      isLayover,
      '--',
      data.company || '',
      order.destination || '',
      order.medDestinationLicense || '',
      order.auDestinationLicense || '',
      order.paymentTerms || '',
      order.orderSize || '',
      order.deliveryNotes || '',
      data.notes || '',
      order.destinationAddress || '',
      data.passcode || '',
      Boolean(order.newDestination),
      order.licensesNeeded || '',
    ];
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const data = req.body;

  if (!data || !Array.isArray(data.orders) || data.orders.length === 0) {
    return res.status(400).json({ error: 'At least one order is required.' });
  }

  try {
    const rows = buildRequestRows(data);

    await appendSheetRows({
      spreadsheetId: SPREADSHEET_ID,
      sheetName: SHEET_NAME,
      rows,
    });

    return res.status(200).json({
      success: true,
      added: rows.length,
      emailQueued: true,
    });
  } catch (error) {
    console.error('Failed to append order to Google Sheets:', getGoogleSheetsErrorMessage(error));
    return res.status(500).json({
      error: 'Unable to submit the request right now. Please try again later.',
    });
  }
}
