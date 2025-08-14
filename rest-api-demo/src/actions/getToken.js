// DOCUMENTATION: https://docs.ravnur.com/hc/en-us/articles/20199019452690-RMS-API-Authentication

import { log } from "../utils";

export default async function getToken() {
  const apiEndpoint = import.meta.env.VITE_RAVNUR_API_ENDPOINT;
  const subscriptionId = import.meta.env.VITE_AZURE_SUBSCRIPTION_ID;
  const apiKey = import.meta.env.VITE_RAVNUR_API_KEY;

  const url = `${apiEndpoint}auth/token`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ subscriptionId, apiKey })
    });
  
    const token = await response.text();
    log('Authentication successful');
    return token;
  } catch (error) {
    log(`Authentication failed: ${error}`);
    return null;
  }
}