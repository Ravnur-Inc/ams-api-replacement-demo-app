const { AzureMediaServices: MediaServices } = require("@azure/arm-mediaservices");
const { BlobServiceClient } = require("@azure/storage-blob");
const { setLogLevel } = require("@azure/logger");
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');
const fetch = require('node-fetch');
const RmsApiKeyCredentials = require('./RmsApiKeyCredentials');

// Uncomment the line below to enable verbose logging if needed
// setLogLevel("verbose");

class VodProvider {
  transformName = 'RmsTestTransform';
  streamingEndpointName = 'default';
  options = {};

  constructor(options) {
    this.options = options;
  }

  async createRMSClient() {
    const credentials = new RmsApiKeyCredentials(
      this.options.ApiEndpoint,
      this.options.SubscriptionId,
      this.options.ApiKey
    );

    const mediaService = new MediaServices(credentials, this.options.SubscriptionId, {
      endpoint: this.options.ApiEndpoint
    });

    return mediaService;
  }

  async createAssetsAndUploadFile(mediaService, inputFile, inputAssetName, outputAssetName) {
    console.log('Creating input and output assets...');
    const inputAsset = await mediaService.assets.createOrUpdate(this.options.ResourceGroupName, this.options.MediaServicesAccountName, inputAssetName, {});
    console.log('Input asset created: ', inputAsset.name);
    const outputAsset = await mediaService.assets.createOrUpdate(this.options.ResourceGroupName, this.options.MediaServicesAccountName, outputAssetName, {});
    console.log('Output asset created: ', outputAsset.name);

    console.log('Uploading file...');
    const asset = await mediaService.assets.get(this.options.ResourceGroupName, this.options.MediaServicesAccountName, inputAssetName);
    const listContainerSas = await mediaService.assets.listContainerSas(this.options.ResourceGroupName, this.options.MediaServicesAccountName, asset.name, { permissions: 'ReadWrite' });
    const container = listContainerSas.assetContainerSasUrls[0];
    const blobService = new BlobServiceClient(container);
    const containerClient = blobService.getContainerClient(asset.name);
    const blobClient = containerClient.getBlobClient(inputFile);
    const blockBlobClient = blobClient.getBlockBlobClient();

    await blockBlobClient.uploadFile(inputFile);

    return { inputAsset, outputAsset };
  }

  async createJob(mediaService, jobName, inputAsset, outputAsset) {
    console.log('Creating job...');

    const jobInput = {
      odataType: '#Microsoft.Media.JobInputAsset',
      assetName: inputAsset.name
    };

    const jobOutput = {
      odataType: '#Microsoft.Media.JobOutputAsset',
      assetName: outputAsset.name
    };

    const job = await mediaService.jobs.create(this.options.ResourceGroupName, this.options.MediaServicesAccountName, this.transformName, jobName, {
      input: jobInput,
      outputs: [jobOutput],
    });

    console.log(`Job created: ${job.name}`);

    let jobStatus = await mediaService.jobs.get(this.options.ResourceGroupName, this.options.MediaServicesAccountName, this.transformName, jobName);

    while (jobStatus.state !== 'Finished' && jobStatus.state !== 'Error') {
      if (jobStatus.state === 'Scheduled' || jobStatus.state === 'Processing') {
        console.log(`Job status: ${jobStatus.state}. Progress: ${jobStatus.outputs[0].progress}%`);
      }

      await new Promise(resolve => setTimeout(resolve, 10000));
      jobStatus = await mediaService.jobs.get(this.options.ResourceGroupName, this.options.MediaServicesAccountName, this.transformName, jobName);
    }

    if (jobStatus.state === 'Error') {
      console.error(`Job ${jobStatus.name} failed:`, jobStatus.error.message);
    }

    console.log(`Job ${jobStatus.name} finished successfully.`);
  }

  async createStreamingLocator(mediaService, outputAsset, locatorName) {
    // create streaming locator
    console.log('Creating streaming locator...');
    const locator = await mediaService.streamingLocators.create(this.options.ResourceGroupName, this.options.MediaServicesAccountName, locatorName, {
      assetName: outputAsset.name,
      streamingPolicyName: 'Predefined_ClearStreamingOnly'
    });

    console.log(`Streaming locator created: ${locator.name}`)

    // get streaming endpoint
    const streamingEndpoint = await mediaService.streamingEndpoints.get(this.options.ResourceGroupName, this.options.MediaServicesAccountName, this.streamingEndpointName);

    if (streamingEndpoint.resourceState !== 'Running') {
      console.log('Streaming endpoint is not running, starting it...');
      await mediaService.streamingEndpoints.start(this.options.ResourceGroupName, this.options.MediaServicesAccountName, this.streamingEndpointName);
      console.log('Streaming endpoint started successfully.');
    }

    // List streaming locator for asset
    const streamingLocators = await mediaService.streamingLocators.listPaths(this.options.ResourceGroupName, this.options.MediaServicesAccountName, locatorName);

    // List url for streaming locator
    const paths = streamingLocators.streamingPaths.map(path => path.paths[0]);
    const downloadPaths = streamingLocators.downloadPaths;
    const downloadUrls = [];
    const streamingUrls = [];

    for (const path of paths) {
      const url = `${streamingEndpoint.hostName}/${path}`;
      streamingUrls.push(url);
    }

    for (const path of downloadPaths) {
      const url = `${streamingEndpoint.hostName}/${path}`;
      downloadUrls.push(url);
    }

    console.log('The following URLs are available for adaptive streaming:');
    streamingUrls.forEach(url => console.log(url));

    console.log('The following URLs are available for download:');
    downloadUrls.forEach(url => console.log(url));

    return streamingEndpoint;
  }

  async createAES128StreamingLocator(mediaService, outputAsset, locatorName, contentKeyPolicyName, streamingEndpoint) {
    console.log('Creating Content Key Policy for AES-128 encryption...');

    const issuer = 'ravnur';
    const audience = 'rmstest';
    const password = 'banana strawberry apple pear' // Change this to a strong password

    const configuration = {
      odataType: "#Microsoft.Media.ContentKeyPolicyClearKeyConfiguration",
    }

    const primaryVerificationKey = {
      odataType: "#Microsoft.Media.ContentKeyPolicySymmetricTokenKey",
      keyValue: this.deriveKey(password),
    }

    const restriction = {
      odataType: '#Microsoft.Media.ContentKeyPolicyTokenRestriction',
      issuer,
      audience,
      restrictionTokenType: 'Jwt',
      primaryVerificationKey,
    };

    const contentKeyPolicy = await mediaService.contentKeyPolicies.createOrUpdate(this.options.ResourceGroupName, this.options.MediaServicesAccountName, contentKeyPolicyName, {
      options: [{
        configuration,
        restriction
      }],
    });

    console.log(`Content Key Policy created: ${contentKeyPolicy.name}`)

    // Create Streaming Locator with Content Key Policy
    await mediaService.streamingLocators.create(this.options.ResourceGroupName, this.options.MediaServicesAccountName, locatorName, {
      assetName: outputAsset.name,
      streamingPolicyName: 'Predefined_ClearKey',
      defaultContentKeyPolicyName: contentKeyPolicy.name,
    });

    console.log(`AES-128 Streaming Locator created: ${locatorName}`);

    const aes128StreamingLocators = await mediaService.streamingLocators.listPaths(this.options.ResourceGroupName, this.options.MediaServicesAccountName, locatorName);
    const aes128Paths = aes128StreamingLocators.streamingPaths.map(path => path.paths[0]);
    const aes128StreamingUrls = [];

    for (const path of aes128Paths) {
      const url = `${streamingEndpoint.hostName}/${path}`;
      aes128StreamingUrls.push(url);
    }

    console.log('The following URLs are available for adaptive streaming with AES-128 encryption:');
    aes128StreamingUrls.forEach(url => console.log(url));

    // // Define token payload
    const tokenPayload = {
      exp: Math.floor(Date.now() / 1000) + (6 * 60 * 60), // 6 hours expiration
      nbf: Math.floor(Date.now() / 1000),
      iss: issuer,
      aud: audience,
    };

    const tokenKey = this.deriveKey(password)

    // Sign the token
    const token = jwt.sign(tokenPayload, tokenKey, { algorithm: 'HS256' });
    console.log(`Token for encrypted playback (valid for 6hrs): ${token}`);
  }

  async downloadFileIfNeeded(inputFile) {
    let filePath = inputFile;

    if (this.isUrl(filePath)) {
      console.log('Input file is a URL, downloading...');
      const url = new URL(filePath);
      const fileName = `${new Date().getTime()}-${url.pathname.split('/').pop()}`
      const path = `./input/${fileName}`;
      
      try {
        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error(`Failed to download file: ${response.statusText}`);
        }
        const buffer = await response.buffer();
        fs.writeFileSync(path, buffer);
        console.log(`File downloaded and saved to ${path}`);

        // Fix the input file path
        filePath = path;
      } catch (error) {
        console.error('Error downloading file:', error);
      }
    }

    return filePath;
  }

  async createVod(inputFile) {
    console.log(`Creating VOD for ${inputFile} using RMS`);

    const unique = new Date().getTime();
    const inputAssetName = `input-${unique}`;
    const outputAssetName = `output-${unique}`;
    const jobName = `job-${unique}`;
    const locatorName = `locator-${unique}`;
    const aes128locatorName = `aes128locator-${unique}`;
    const contentKeyPolicyName = `contentKeyPolicy-${unique}`;
    const filePath = await this.downloadFileIfNeeded(inputFile);

    try {
      // Create RMS client
      const mediaService = await this.createRMSClient();

      // Create transform if it doesn't exist
      await this.createTransform(mediaService, this.transformName);

      // Create input asset and upload file
      const { inputAsset, outputAsset } = await this.createAssetsAndUploadFile(mediaService, filePath, inputAssetName, outputAssetName);

      // Create the job and wait for it to finish
      await this.createJob(mediaService, jobName, inputAsset, outputAsset);

      // Create Streaming Locator
      const streamingEndpoint = await this.createStreamingLocator(mediaService, outputAsset, locatorName);

      // Create AES128 Streaming Locator
      await this.createAES128StreamingLocator(mediaService, outputAsset, aes128locatorName, contentKeyPolicyName, streamingEndpoint);
    } catch (err) {
      console.error('Error creating VOD:', err.message);
    } finally {
      process.exit();
    }
  }

  deriveKey(password) {
    let hash = crypto.createHash('sha256');
    hash.update(new TextEncoder().encode(password));
    return hash.digest().subarray(0, 16)
  }

  async createTransform(client) {
    console.log('Checking if Transform exists...');
    let transform = null;

    try {
      transform = await client.transforms.get(this.options.ResourceGroupName, this.options.MediaServicesAccountName, this.transformName);
      console.log('Transform already exists.');
    } catch (error) {
      if (error.statusCode === 404) {
        console.log('Transform not found, creating...');
        const TRANSFORM_DATA = require('./transform-data.json');
        transform = await client.transforms.createOrUpdate(this.options.ResourceGroupName, this.options.MediaServicesAccountName, this.transformName, TRANSFORM_DATA);
        console.log('Transform created successfully.');
      } else {
        throw error; // Rethrow the error if it's not a 404
      }
    }
    return transform;
  }

  async isUrl(url) {
    return url.includes('http://') || url.includes('https://');
  }
}

module.exports = VodProvider;