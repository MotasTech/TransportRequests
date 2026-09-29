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
 * Processes all unchecked request rows in the Requests sheet.
 *
 * Rows are grouped by shipper/company so each shipper receives one digest
 * email per trigger run. A row is checked only after the grouped email is
 * accepted by MailApp; failed groups remain unchecked for a later retry.
 */
function processPendingRequestEmails() {
  const lock = LockService.getDocumentLock();

  if (!lock.tryLock(1000)) return;

  try {
    const sheet = SpreadsheetApp.getActive().getSheetByName(ORDERS_SHEET_NAME);
    if (!sheet) throw new Error(`Worksheet not found: ${ORDERS_SHEET_NAME}`);

    const lastRow = sheet.getLastRow();
    if (lastRow <= REQUEST_HEADER_ROW) return;

    const groups = getPendingRequestEmailGroups(sheet);

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

/**
 * Preview the first pending shipper batch without sending it or changing
 * any checkbox values.
 */
function previewPendingRequestEmail() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(ORDERS_SHEET_NAME);
  const firstGroup = getPendingRequestEmailGroups(sheet).values().next().value;

  if (!firstGroup) {
    throw new Error('There are no unchecked request rows to preview.');
  }

  showRequestEmailPreview(
    buildQueuedEmailData(firstGroup.shipper, firstGroup.items)
  );
}

/**
 * Preview the newest request row regardless of whether its checkbox is
 * checked. This is useful after the existing historical rows were checked.
 */
function previewLatestRequestEmail() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(ORDERS_SHEET_NAME);
  const lastRow = sheet.getLastRow();

  if (lastRow <= REQUEST_HEADER_ROW) {
    throw new Error('There are no request rows to preview.');
  }

  const values = sheet
    .getRange(lastRow, 1, 1, REQUEST_EMAIL_SENT_COLUMN)
    .getValues()[0];
  const shipper = requestText(values[REQUEST_SHIPPER_COLUMN - 1]);

  if (!shipper) {
    throw new Error(`The newest row is missing a shipper in column H (row ${lastRow}).`);
  }

  showRequestEmailPreview(
    buildQueuedEmailData(shipper, [{ sheetRow: lastRow, values }])
  );
}

/**
 * Returns pending request rows grouped by shipper/company.
 *
 * Both blank and unchecked values in the Email Sent checkbox column are
 * considered pending. Checked rows and rows without a shipper are skipped.
 */
function getPendingRequestEmailGroups(sheet) {
  if (!sheet) throw new Error(`Worksheet not found: ${ORDERS_SHEET_NAME}`);

  const lastRow = sheet.getLastRow();
  const groups = new Map();

  if (lastRow <= REQUEST_HEADER_ROW) return groups;

  const rowCount = lastRow - REQUEST_HEADER_ROW;
  const rows = sheet
    .getRange(REQUEST_HEADER_ROW + 1, 1, rowCount, REQUEST_EMAIL_SENT_COLUMN)
    .getValues();

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

  return groups;
}

function showRequestEmailPreview(data) {
  const recipients = getCustomerEmails(data.company);
  const cc = recipients.cc
    ? `${recipients.cc},orders@motasmi.com`
    : 'orders@motasmi.com';
  const subject = `${data.company} - your request has been received!`;
  const emailHtml = buildEmailHtml(data);
  const previewHtml = `
    <style>
      body { font-family: Arial, sans-serif; color: #222; padding: 16px; }
      .metadata { background: #f3f4f6; border-radius: 6px; padding: 12px; }
      .metadata p { margin: 4px 0; }
      hr { border: 0; border-top: 1px solid #d1d5db; margin: 16px 0; }
    </style>
    <div class="metadata">
      <p><strong>To:</strong> ${requestHtmlEscape(recipients.to || '(none found)')}</p>
      <p><strong>Cc:</strong> ${requestHtmlEscape(cc)}</p>
      <p><strong>Subject:</strong> ${requestHtmlEscape(subject)}</p>
    </div>
    <hr>
    ${emailHtml}
  `;

  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(previewHtml).setWidth(760).setHeight(700),
    'Confirmation Email Preview'
  );
}

function requestHtmlEscape(value) {
  return requestText(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
