// DOCUMENTATION: https://docs.ravnur.com/hc/en-us/articles/22708675713938-Job-Create

import { log } from "../utils";

/**
 * Creates a job
 * @param {string} jobName - The name of the job
 * @param {string} inputAssetName - The name of the input asset
 * @param {string} outputAssetName - The name of the output asset
 * @param {string} transformName - The name of the transform
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} The created job
 */
export async function createJob(jobName, inputAssetName, outputAssetName, transformName, token) {
  const apiEndpoint = import.meta.env.VITE_RAVNUR_API_ENDPOINT;
  const subscriptionId = import.meta.env.VITE_AZURE_SUBSCRIPTION_ID;
  const resourceGroupName = import.meta.env.VITE_AZURE_RESOURCE_GROUP;
  const accountName = import.meta.env.VITE_RAVNUR_MEDIA_SERVICES_ACCOUNT_NAME;
  const apiVersion = '2022-07-01';

  const url = `${apiEndpoint}subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Media/mediaServices/${accountName}/transforms/${transformName}/jobs/${jobName}?api-version=${apiVersion}`;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        properties: {
          input: {
            '@odata.type': '#Microsoft.Media.JobInputAsset',
            assetName: inputAssetName
          },
          outputs: [
            {
              '@odata.type': '#Microsoft.Media.JobOutputAsset',
              assetName: outputAssetName
            }
          ]
        }
      })
    });
  
    const job = await response.json();
    log(`Job created: ${job.name}`);
    return job;
  } catch (error) {
    log(`Job creation failed: ${error}`);
    return null;
  }
}

/**
 * Gets a job
 * @param {string} jobName - The name of the job
 * @param {string} transformName - The name of the transform
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} The job
 */
export async function getJob(jobName, transformName, token) {
  const apiEndpoint = import.meta.env.VITE_RAVNUR_API_ENDPOINT;
  const subscriptionId = import.meta.env.VITE_AZURE_SUBSCRIPTION_ID;
  const resourceGroupName = import.meta.env.VITE_AZURE_RESOURCE_GROUP;
  const accountName = import.meta.env.VITE_RAVNUR_MEDIA_SERVICES_ACCOUNT_NAME;
  const apiVersion = '2022-07-01';

  const url = `${apiEndpoint}subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Media/mediaServices/${accountName}/transforms/${transformName}/jobs/${jobName}?api-version=${apiVersion}`;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers
    });
  
    const job = await response.json();
    log(`Job status: ${job.properties.state}`);
    return job;
  } catch (error) {
    log(`Job status retrieval failed: ${error}`);
    return null;
  }
}

/**
 * Polls the status of a job
 * @param {string} jobName - The name of the job
 * @param {string} transformName - The name of the transform
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} The job
 */
export async function jobStatusPolling(jobName, transformName, token) {
  return new Promise(async (resolve, reject) => {
    try {
      const job = await getJob(jobName, transformName, token);

      if (job.properties.state === 'Finished') {
        log('Job completed');
        resolve(job);
      } else if (job.properties.state === 'Error') {
        reject(new Error('Job failed'));
      } else {
        setTimeout(async () => {
          try {
            const result = await jobStatusPolling(jobName, transformName, token);
            resolve(result);
          } catch (err) {
            reject(err);
          }
        }, 1000);
      }
    } catch (err) {
      reject(err);
    }
  });
}