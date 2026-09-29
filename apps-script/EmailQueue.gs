/*
 * Add this file to the Apps Script project bound to the orders spreadsheet.
 * It relies on getCustomerEmails(data.company), sendEmail(data), and the
 * ORDERS_SHEET_NAME constant from the existing Code.gs/Email.gs files.
 *
 * Requests use columns A:S. Column T is the Email Sent checkbox.
 */
const REQUEST_EMAIL_SENT_COLUMN = 20; // T
const REQUEST_SHIPPER_COLUMN = 8; // H / company
const REQUEST_HEADER_ROW = 1;

/**
 * Run this once after adding the Email Sent column to the Requests sheet.
 * Do not run it again after the queue has been used because it resets the
 * checkbox values to unchecked.
 */
function setupRequestEmailQueue() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(ORDERS_SHEET_NAME);

  if (!sheet) throw new Error(`Worksheet not found: ${ORDERS_SHEET_NAME}`);

  const headerCell = sheet.getRange(REQUEST_HEADER_ROW, REQUEST_EMAIL_SENT_COLUMN);
  const existingHeader = String(headerCell.getValue() || '').trim();

  if (existingHeader && existingHeader !== 'Email Sent') {
    throw new Error(
      `Column T already has a different header: ${existingHeader}`
    );
  }

  headerCell.setValue('Email Sent');

  const checkboxRowCount = Math.max(sheet.getMaxRows() - REQUEST_HEADER_ROW, 1);
  sheet
    .getRange(REQUEST_HEADER_ROW + 1, REQUEST_EMAIL_SENT_COLUMN, checkboxRowCount, 1)
    .insertCheckboxes();
}

/**
 * Run this once after setupRequestEmailQueue to create the five-minute trigger.
 */
function createRequestEmailTrigger() {
  ScriptApp.getProjectTriggers()
    .filter((trigger) => trigger.getHandlerFunction() === 'processPendingRequestEmails')
    .forEach((trigger) => ScriptApp.deleteTrigger(trigger));

  ScriptApp.newTrigger('processPendingRequestEmails')
    .timeBased()
    .everyMinutes(5)
    .create();
}

function processPendingRequestEmails() {
  const lock = LockService.getDocumentLock();

  if (!lock.tryLock(1000)) return;

  try {
    const sheet = SpreadsheetApp.getActive().getSheetByName(ORDERS_SHEET_NAME);
    if (!sheet) throw new Error(`Worksheet not found: ${ORDERS_SHEET_NAME}`);

    const lastRow = sheet.getLastRow();
    if (lastRow <= REQUEST_HEADER_ROW) return;

    const rowCount = lastRow - REQUEST_HEADER_ROW;
    const rows = sheet
      .getRange(REQUEST_HEADER_ROW + 1, 1, rowCount, REQUEST_EMAIL_SENT_COLUMN)
      .getValues();
    const groups = new Map();

    rows.forEach((row, index) => {
      const emailSent = row[REQUEST_EMAIL_SENT_COLUMN - 1];
      const shipper = requestText(row[REQUEST_SHIPPER_COLUMN - 1]);

      // Blank and unchecked checkboxes are both pending.
      if (requestIsTrue(emailSent) || !shipper) return;

      const key = shipper.toLowerCase();
      if (!groups.has(key)) {
        groups.set(key, { shipper, items: [] });
      }

      groups.get(key).items.push({
        sheetRow: REQUEST_HEADER_ROW + 1 + index,
        values: row,
      });
    });

    groups.forEach((group) => {
      try {
        const data = buildQueuedEmailData(group.shipper, group.items);
        sendEmail(data);

        // Only mark rows after MailApp successfully accepts the email.
        group.items.forEach((item) => {
          sheet.getRange(item.sheetRow, REQUEST_EMAIL_SENT_COLUMN).setValue(true);
        });
      } catch (error) {
        // Leave failed rows unchecked so the next trigger can retry them.
        console.error(
          `Failed to send queued email for ${group.shipper}: ${error.message}`
        );
      }
    });

    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
}

function buildQueuedEmailData(shipper, items) {
  const firstRow = items[0].values;
  const pickupDate = requestDate(firstRow[3]);

  if (!pickupDate) {
    throw new Error(`Missing pickup date for shipper ${shipper}`);
  }

  const notes = [...new Set(
    items
      .map((item) => requestText(item.values[14]))
      .filter(Boolean)
  )].join('\n\n');

  return {
    orderId: requestText(firstRow[2]),
    passcode: requestText(firstRow[16]),
    company: shipper,
    notes,
    pickupDate,
    orders: items.map((item) => {
      const row = item.values;

      return {
        deliveryDate: requestDate(row[4]),
        newDestination: requestIsTrue(row[17]),
        destination: requestText(row[8]),
        licensesNeeded: requestText(row[18]),
        medDestinationLicense: requestText(row[9]),
        auDestinationLicense: requestText(row[10]),
        destinationAddress: requestText(row[15]),
        paymentTerms: requestText(row[11]),
        orderSize: requestText(row[12]),
        deliveryNotes: requestText(row[13]),
      };
    }),
  };
}

function requestText(value) {
  return value === null || value === undefined ? '' : String(value).trim();
}

function requestIsTrue(value) {
  return value === true || requestText(value).toLowerCase() === 'true';
}

function requestDate(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return Utilities.formatDate(
      value,
      SpreadsheetApp.getActive().getSpreadsheetTimeZone(),
      'yyyy-MM-dd'
    );
  }

  return requestText(value);
}
