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

The destination worksheet name is optional; if `GOOGLE_DESTINATIONS_SHEET_NAME` is blank, the first worksheet in that spreadsheet is used. `SEARCHABLE_CUSTOMER_NAME_COLUMN` is a 1-based column number and defaults to `17` (`Q`); rows with a blank value or a value containing `No` in that column are excluded from the customer lookup. The requests and passcodes tabs default to `Requests` and `Passcodes`.

The service-account migration writes orders to Sheets but does not send the email that was previously triggered by the Apps Script. Email delivery requires a separate provider or Gmail API/domain-wide delegation setup.
