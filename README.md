## Introduction

This repository is designed for individuals seeking to transition from Azure Media Services (AMS) without significant modifications to their existing application code. It illustrates how Ravnur Media Services (RMS) can be a seamless replacement for AMS, requiring minimal code adjustments. Within, you'll find guidelines on migrating your current AMS implementation to RMS, the necessary post-migration code alterations, a list of presently supported AMS features, and a roadmap for upcoming features.

## Solution Overview

Broadly speaking, RMS supports the most recent version of the Azure Media Services V3 API. This means users can largely retain their existing Azure SDK without making extensive code alterations. For a comprehensive REST API description and documentation, you can refer to the existing [Microsoft Azure Media Services (v3) documentation](https://learn.microsoft.com/en-us/azure/media-services/latest/). However, please note that the current iteration of RMS is a Minimum Viable Product (MVP) and lacks some AMS features. Presently, its use is ideal for a basic VOD scenario: upload -> encode -> stream, without the capability for advanced streaming or custom encoding configurations. A list of the unsupported MVP features will be detailed later in this document.

## RMS Deployment Instructions

**To Be Determined (TBD)**: The RMS marketplace package is not currently available. Deployment instructions for RMS will be provided once the Azure Marketplace package clears verification. In the interim, you may reach out to us, and we'll grant you access to a shared demo RMS instance.

## Migration of Existing AMS Assets to RMS

**TBD**: Migration guidelines will be presented alongside the RMS deployment instructions. For any migration-related queries, please refer to the Roadmap and Q&A sections.

## Demo App for Ravnur Media Services API

This sample application showcases the process of replacing Azure Media Services with the Ravnur Media Services API to establish Video On Demand (VOD). The application follows a straightforward VOD workflow:
1. Create input asset
2. Upload video to the input asset
3. Generate output asset
4. Initiate encoding job
5. Await completion of the encoding job
6. Create streaming locator
7. Retrieve streaming and download URLs

### Prerequisites

Ensure you have:
1. A deployed RMS instance, or access to a Ravnur-hosted POC environment.
2. The corresponding API endpoint.
3. The API secret key.
4. A registered Media Services Account with the following: subscription ID, resource group name, and account name.

If you lack an existing AMS account, don't fret. You can input any unique combination (specific to a single RMS instance) of subscription ID, resource group, and account name—even if they aren't present in Azure.

Items (2) and (3) will be provided post-RMS instance deployment, while (4) is determined by you during the deployment phase. We also offer access to a shared demo RMS instance. Contact us, and we'll furnish you with all necessary credentials and register your Media Services account.

### Accessing the App

If you're utilizing the Azure.ResourceManager.Media SDK, please visit [sdk-azure-resource-manager-demo](sdk-azure-resource-manager-demo). 
For those using the Microsoft.Azure.Management.Media SDK, proceed to [sdk-ms-azure-management-demo](sdk-ms-azure-management-demo).

## RMS Feature Roadmap

| Feature | State | Comments |
|---------|-------|----------|
| Assets API | Implemented | |
| Jobs API | Implemented | Supported job inputs: JobInputAsset, JobInputHttp. Does not support  processing multiple media files in one job |
| Streaming Locators API | Implemented | |
| Custom Transforms | In development | Currently there is only one predefined transform, and adaptive bitrate streaming set of 5 (max) video qualities with audio and thumbnails. |
| Event Grid Support | In development | |
| Automatic migration of AMS assets/locators to RMS | In development | |
| Custom Streaming Policy | Planned | Currently there is only one predefined streaming policy: “Predefined_DownloadAndClearStreaming”. It allows not encrypted HLS/DASH streaming and downloads. Create and update API will be added in later RMS versions. |
| AES stream encoding | Planned | |
| DRM stream encoding | Planned | |
| Smooth streaming | Planned | |
| Custom Streaming Endpoints | Not supported | There is only one predefined streaming endpoint available. Its domain matches with domain of RMS API endpoint. Implementation of this feature is not planned. |

## QnA

**Q:** How closely does your API's architecture mirror that of AMS in terms of request/response patterns, URL structures, and data models?<br>
**A:** It is 100% mirror of the AMS API. 

**Q:** Do I need to re-encode all my videos?<br>
**A:** No, you do not need to re-encode all video, RMS can work with AMS assets without an issue.

**Q:** Do I need to change streaming/locator URL?<br>
**A:** Yes, but you need to change only host. For example, you have URL like this https://ams1.streaming.media.azure.net/5197ca71-3edc-42b0-adff-12570b48b4e4/video_3500000.ism/manifest(format=m3u8-cmaf) you would need to change ams1.streaming.media.azure.net to RMS host.

**Q:** Do I need to change streaming/locator URL if I’m using CDN?<br>
**A:** No, all you need to change is your CDN origin from AMS to RMS.

**Q:** Do I need to make code changes in my side to use RMS API?<br>
**A:** Just a little bit. If you are using Microsoft SDK, you just need to tell SDK to connect to RMS instead of AMS. Code sample we will provide later. If you have your own implementation, all you need is to change host of the AMS to RMS and change credential types for more details about code changes read Readme.md documentation of demo applications. 

**Q:** What streaming protocols do you support?<br>
**A:** RMS supports HLS, DASH and Smoot Streaming.

**Q:** What encoding formats and codecs do you support?<br>
**A:** Big variety of the codecs and formats for the input assets. Because we are using FFMPEG for encoding, all codecs and formats that FFMPEG supports we are supporting too.
Output is mp4 container with video encoded using x264 code and aac codec for audio.

**Q:** Can I use custom encoding presets similar to what I had in AMS?<br>
**A:** For MVP we do not support this, we have predefined transform, that produces multiple qualities based on the input video quality. 
After MVP, yes, full AMS transform support.

**Q:** How would you migrate streaming for my current AMS assets?<br>
**A:** We have a migration options, where you are providing existing AMS and storage information, and we will import all assets.

**Q:** Do you provide any migration tools or guides for transitioning from AMS to your platform?<br>
**A:** Yes, this would be an automatic migration process, you need to provide existing AMS information and we will import all of the assets.

**Q:** Where is the media content stored, and can it integrate seamlessly with my current storage solutions?<br>
**A:** Media content stored in the Azure Storage Account. Your current storage account can be used in RMS, no data copy required.

**Q:** How does your platform handle API authentication? Is it similar to the way AMS handles it?<br>
**A:** We provide JWT bearer token authentication, similar to the AMS, but it will not require Azure Active Directory service principal or Managed Identity.

**Q:** How does your platform scale with increased demand?<br>
**A:** Our platform designed with scale in mind and can support high demand. 

**Q:** How is pricing structured for encoding, streaming, storage, and any additional features?<br>
**A:** The cost is variable and mostly depends on the usage, the more you encode and watch, the more it costs.
There are some expenses on the infrastructure, but overall system is designed the way that you do not spend money when its idle.

**Q:** Do you support Encryption and DRM?<br>
**A:** Coming soon…  We do support AES-128 encryption natively, we use third party vendor for DRM support. 



