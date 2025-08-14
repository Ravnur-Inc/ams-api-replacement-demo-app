// DOCUMENTATION: https://docs.ravnur.com/hc/en-us/articles/22396926975506-Asset-Create-Or-Update

import { log } from "../utils";

export async function createAsset(assetName, token) {
  const storageAccountName = import.meta.env.VITE_STORAGE_ACCOUNT_NAME;
  const apiEndpoint = import.meta.env.VITE_RAVNUR_API_ENDPOINT;
  const subscriptionId = import.meta.env.VITE_AZURE_SUBSCRIPTION_ID;
  const resourceGroupName = import.meta.env.VITE_AZURE_RESOURCE_GROUP;
  const accountName = import.meta.env.VITE_RAVNUR_MEDIA_SERVICES_ACCOUNT_NAME;
  const apiVersion = '2022-08-01';

  const url = `${apiEndpoint}subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Media/mediaServices/${accountName}/assets/${assetName}?api-version=${apiVersion}`;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        properties: { storageAccountName }
      })
    });
  
    const asset = await response.json();
    log(`Asset created: ${asset.name}`);
    return asset;
  } catch (error) {
    log(`Asset creation failed: ${error}`);
    return null;
  }
}