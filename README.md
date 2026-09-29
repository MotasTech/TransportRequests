# Transport Requests

## Google Sheets service-account setup

The app now accesses Google Sheets from server-side Next.js API routes. The service-account credential is never exposed to the browser.

1. Enable the Google Sheets API in the Google Cloud project that owns the service account.
2. Share both spreadsheets with the service account's `client_email` as an Editor:
   - Orders/passcodes spreadsheet: `GOOGLE_ORDERS_SPREADSHEET_ID`
   - Destinations spreadsheet: `GOOGLE_DESTINATIONS_SPREADSHEET_ID`
3. Create the local environment variables from `.env.example`.
4. Add the same server-only variables to Vercel for the relevant environments.

For local development, put the downloaded service-account JSON in `GOOGLE_SERVICE_ACCOUNT_JSON`. Do not commit `.env` or paste the private key into source code. To compact the downloaded JSON into one line for a `.env` file, run:

```powershell
$serviceAccountJson = Get-Content .\service-account.json -Raw
$serviceAccountJson = $serviceAccountJson | ConvertFrom-Json | ConvertTo-Json -Compress
$serviceAccountJson
```

Put the output in `.env` as a single quoted value:

```text
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account", ... }'
```

The destination worksheet name is optional; if `GOOGLE_DESTINATIONS_SHEET_NAME` is blank, the first worksheet in that spreadsheet is used. `SEARCHABLE_CUSTOMER_NAME_COLUMN` is a 0-based JavaScript column index and defaults to `17` (`R`; use `16` for `Q`); rows with a value containing `No` in that column are excluded from the customer lookup, while blank or null values remain eligible. The requests and passcodes tabs default to `Requests` and `Passcodes`.

## Confirmation email queue

The Next.js API writes request data to columns `A:S`. Column `T` is reserved for an `Email Sent` checkbox and is left untouched by the service-account writer, so newly appended rows remain unchecked/pending.

The Apps Script worker in [`apps-script/EmailQueue.gs`](apps-script/EmailQueue.gs) groups pending rows by shipper/company, sends one confirmation digest per shipper, and checks the rows only after `MailApp` accepts the email. It relies on the existing `getCustomerEmails`, `sendEmail`, and `ORDERS_SHEET_NAME` definitions from `Email.gs`/`Code.gs`.

In the spreadsheet's bound Apps Script project:

1. Copy `apps-script/EmailQueue.gs` into the project.
2. Create a time-driven trigger for `processPendingRequestEmails` at the interval you want.
3. Run `previewLatestRequestEmail` to view the newest email without sending it. After a new unchecked row exists, `previewPendingRequestEmail` previews the first grouped pending batch.
4. Ensure the Apps Script runs under the Google account that should send the email. No Gmail API service account is required.
