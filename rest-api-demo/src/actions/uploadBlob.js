import { ensureHeader, toIsoNoMs, hmacSha256Base64, log } from "../utils.js";
import { buildHeaders } from "../utils.js";

let abortController = null;

/**
 * Builds a Service SAS for a specific blob (signed with Account Key)
 * @param {Object} options - The options for the blob service SAS
 * @param {string} options.accountName - The name of the storage account
 * @param {string} options.containerName - The name of the asset
 * @param {string} options.blobName - The name of the blob
 * @param {string} options.permissions - The permissions for the blob
 * @param {number} options.expiryMinutes - The expiry time in minutes
 * @param {string} options.protocol - The protocol for the blob
 * @param {string} options.version - The version of the blob
 * @param {number} options.startSkewMinutes - The start skew time in minutes
 * @returns {Promise<string>} The blob service SAS
*/
export async function buildBlobServiceSas({
  accountName,
  containerName,
  blobName,
  permissions = "cw", // create + write for PUT Blob
  expiryMinutes = 60,
  protocol = "https",
  version = "2021-12-02",
  startSkewMinutes = 5,
}) {
  const now = new Date();
  const st = new Date(now.getTime() - startSkewMinutes * 60 * 1000);
  const se = new Date(now.getTime() + expiryMinutes * 60 * 1000);
  const stStr = toIsoNoMs(st);
  const seStr = toIsoNoMs(se);

  // Canonicalized resource per Azure docs
  // For blob: /blob/{account}/{container}/{blob}
  const canonicalizedResource = `/blob/${accountName}/${containerName}/${blobName}`;

  // Service SAS string-to-sign (Blob) — fields in exact order
  // sp\nst\nse\ncr\nsi\nsip\nspr\nsv\nsr\nsnapshot\nsecpolicy\nrscc\nrscd\nrsce\nrscl\nrsct
  const sr = "b"; // resource: blob
  const stringToSign = [
    permissions,
    stStr,
    seStr,
    canonicalizedResource,
    "", // signedIdentifier (si)
    "", // signedIP (sip)
    protocol,
    version,
    sr,
    "", // snapshot time
    "", // encryption scope
    "", // rscc
    "", // rscd
    "", // rsce
    "", // rscl
    "", // rsct
  ].join("\n");

  const sig = await hmacSha256Base64(import.meta.env.VITE_STORAGE_ACCOUNT_KEY, stringToSign);
  const params = new URLSearchParams({
    sv: version,
    spr: protocol,
    sr,
    sp: permissions,
    st: stStr,
    se: seStr,
    sig: sig, // will be URL-encoded by URLSearchParams
  });
  return params.toString();
}

/**
 * Uploads a blob to the storage account
 * @param {File} file - The file to upload
 * @param {string} containerName - The name of the asset
 * @returns {Promise<void>}
 */
export async function uploadBlob(file, containerName) {
  const accountName = import.meta.env.VITE_STORAGE_ACCOUNT_NAME;
  const blobName = file.name; // use file name as blob name
  const sas = await buildBlobServiceSas({
    accountName: accountName,
    containerName: containerName,
    blobName,
    permissions: "cw", // create + write
    expiryMinutes: 60,
    protocol: "https",
    version: "2021-12-02",
  });
  const encodedBlobName = encodeURIComponent(blobName);
  const BLOB_PUT_URL = `https://${accountName}.blob.core.windows.net/${containerName}/${encodedBlobName}?${sas}`;

  try {
    const urlObj = new URL(BLOB_PUT_URL);
    const headers = buildHeaders(file);
    await upload(urlObj, file, headers);
    log("Upload completed");
  } catch (err) {
    log(`Error: ${err && err.message ? err.message : err}`);
  }
}

/**
 * Uploads a blob to the storage account
 * @param {URL} urlObj - The URL object for the blob
 * @param {File} file - The file to upload
 * @param {Object} headers - The headers for the upload
 * @returns {Promise<void>}
 */
export async function upload(urlObj, file, headers) {
  log('Uploading blob...');
  ensureHeader(headers, "x-ms-blob-type", "BlockBlob");
  ensureHeader(
    headers,
    "Content-Type",
    file.type || "application/octet-stream"
  );

  // Use XMLHttpRequest for progress during upload
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", urlObj.href, true);
    headers.forEach((v, k) => {
      try {
        xhr.setRequestHeader(k, v);
      } catch {
        /* ignore */
      }
    });

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        const pct = Math.floor((evt.loaded / evt.total) * 100);
        progressBar.value = pct;
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        progressBar.value = 100;
        resolve();
      } else {
        reject(new Error(`PUT failed: ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during PUT"));
    xhr.onabort = () => reject(new Error("Upload cancelled"));

    // Support cancellation
    abortController = { abort: () => xhr.abort() };
    xhr.send(file);
  });
}