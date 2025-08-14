import { log } from "../utils";

export async function getStreamingEndpoint(token) {
  const apiEndpoint = import.meta.env.VITE_RAVNUR_API_ENDPOINT;
  const subscriptionId = import.meta.env.VITE_AZURE_SUBSCRIPTION_ID;
  const resourceGroupName = import.meta.env.VITE_AZURE_RESOURCE_GROUP;
  const accountName = import.meta.env.VITE_RAVNUR_MEDIA_SERVICES_ACCOUNT_NAME;
  const apiVersion = '2022-08-01';

  const url = `${apiEndpoint}subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Media/mediaServices/${accountName}/streamingEndpoints/default?api-version=${apiVersion}`;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers
    });

    const streamingEndpoint = await response.json();
    log(`Streaming endpoint: ${streamingEndpoint.name}`);
    return streamingEndpoint;
  } catch (error) {
    log(`Streaming endpoint retrieval failed: ${error}`);
    return null;
  }
}