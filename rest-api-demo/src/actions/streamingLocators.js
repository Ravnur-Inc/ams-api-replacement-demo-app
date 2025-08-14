// DOCUMENTATION: https://docs.ravnur.com/hc/en-us/articles/23118414092306-Streaming-locator-Create

import { log } from "../utils";

export async function createStreamingLocator(streamingLocatorName, outputAssetName, token) {
  const apiEndpoint = import.meta.env.VITE_RAVNUR_API_ENDPOINT;
  const subscriptionId = import.meta.env.VITE_AZURE_SUBSCRIPTION_ID;
  const resourceGroupName = import.meta.env.VITE_AZURE_RESOURCE_GROUP;
  const accountName = import.meta.env.VITE_RAVNUR_MEDIA_SERVICES_ACCOUNT_NAME;
  const apiVersion = '2022-07-01';

  const url = `${apiEndpoint}subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Media/mediaServices/${accountName}/streamingLocators/${streamingLocatorName}?api-version=${apiVersion}`;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }

  const streamingPolicyName = 'Predefined_ClearStreamingOnly';

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ properties: { streamingPolicyName, assetName: outputAssetName } })
    });
  
    const streamingLocator = await response.json();
    log(`Streaming locator created: ${streamingLocator.name}`);
    return streamingLocator;
  } catch (error) {
    log(`Streaming locator creation failed: ${error}`);
    return null;
  }
}

export async function listStreamingLocatorPaths(streamingLocatorName, token) {
  const apiEndpoint = import.meta.env.VITE_RAVNUR_API_ENDPOINT;
  const subscriptionId = import.meta.env.VITE_AZURE_SUBSCRIPTION_ID;
  const resourceGroupName = import.meta.env.VITE_AZURE_RESOURCE_GROUP;
  const accountName = import.meta.env.VITE_RAVNUR_MEDIA_SERVICES_ACCOUNT_NAME;
  const apiVersion = '2022-07-01';

  const url = `${apiEndpoint}subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Media/mediaServices/${accountName}/streamingLocators/${streamingLocatorName}/listPaths?api-version=${apiVersion}`;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers
    });

    const paths = await response.json();
    log('Streaming locator paths fetched');
    return paths;
  } catch (error) {
    log(`Streaming locator paths retrieval failed: ${error}`);
    return null;
  }
} 