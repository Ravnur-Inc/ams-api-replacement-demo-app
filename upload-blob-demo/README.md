## RMS Blob Uploader

A minimal, single-page uploader that PUTs files directly to Azure Blob Storage using only the REST API.

### What it uses
- **Account name**: your storage account.
- **Container name**: the target container.
- **SAS**: generated in the browser for the selected blob using a short‑lived Service SAS (HMAC-SHA256) signed with the account key.

### Configure
Open `index.html` and set these constants near the top of the script:
- `ACCOUNT_NAME`
- `CONTAINER_NAME`
- `ACCOUNT_KEY_BASE64` (base64 account key)

Optional:
- Change `permissions` (default `"cw"` = create, write)
- Change `expiryMinutes` (default `60`)

### Run locally
Serve the folder and open the page in a browser (so CORS Origin is consistent). Select a file. The app creates a per-file SAS, then performs a single PUT to the blob.

### Authorization (SAS)
- The uploader builds a **Service SAS** for the specific blob using the account key in `index.html`, then appends it to the blob URL and issues a `PUT`.
- This is the minimal way to demonstrate REST upload without any SDK.
- **Security note**: Do not ship account keys to browsers. Move SAS creation to your backend and have the page fetch a short‑lived SAS (minutes), restricted to only the permissions required.

Alternative ways to get a SAS (no code changes needed):
- Azure Portal: Storage account → Containers → your container → “Generate SAS”.
- Azure CLI: `az storage blob generate-sas` or `az storage container generate-sas`.

### Storage account and container
- Create a storage account in the Azure Portal: Home → Storage accounts → Create.
- Inside the account, create a Blob container (e.g., `asset-...`).
- Ensure Blob service **CORS** allows your page’s Origin and `PUT` method for browser uploads.