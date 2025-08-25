// DOCUMENTATION: https://docs.ravnur.com/hc/en-us/articles/23559436093458-Transform-Create-or-Update

import { log } from "../utils";

/**
 * Creates a transform
 * @param {string} transformName - The name of the transform
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} The created transform
 */
export async function createTransform(transformName, token) {
  const apiEndpoint = import.meta.env.VITE_RAVNUR_API_ENDPOINT;
  const subscriptionId = import.meta.env.VITE_AZURE_SUBSCRIPTION_ID;
  const resourceGroupName = import.meta.env.VITE_AZURE_RESOURCE_GROUP;
  const accountName = import.meta.env.VITE_RAVNUR_MEDIA_SERVICES_ACCOUNT_NAME;
  const apiVersion = '2022-07-01';

  const url = `${apiEndpoint}subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Media/mediaServices/${accountName}/transforms/${transformName}?api-version=${apiVersion}`;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }

  const outputs = [{
    preset: {
      '@odata.type': '#Microsoft.Media.BuiltInStandardEncoderPreset',
      presetName: 'AdaptiveStreaming'
    }
  }];

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ properties: { outputs } })
    });
  
    const transform = await response.json();
    log(`Transform created: ${transform.name}`);
    return transform;
  } catch (error) {
    log(`Transform creation failed: ${error}`);
    return null;
  }
}