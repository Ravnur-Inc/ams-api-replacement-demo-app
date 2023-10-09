## Introduction

This repository was created for people who are looking for Azure Media Services (further AMS) replacement and do not want to spend a lot of resources on changing existing code of their applications.
It demonstrates how Ravnur Media Services (further RMS) allows you replace AMS instance with minimal effort for code changes.
The repository contains instructions how to migrate existing AMS instance to RMS, what code changes you need to perform after this, the list of currently supported AMS features and roadmap of other features implementations.

## Solution overview

In general RMS implements latest version of Azure Media Services V3 API so you can continue using existing Azure SDK without changing your existing code in most of cases. That’s why if you need detailed REST API description and documentation you can still use existing [Microsoft documentation Azure Media Services (v3) documentation](https://learn.microsoft.com/en-us/azure/media-services/latest/). However you need to take into account that current version of RMS is an MVP version and does not support some AMS features. At the moment it can be used for vanilla VOD scenario: upload->encode->stream without ability of advanced streaming or custom encoding configuration. The list of features which are not present in MVP you will see later in the article.

## RMS deployment instructions

TBD: At the moment RMS marketplace package is not available yet. Instructions of RMS deployment will be here as soon as Azure Marketplace package passes verification.
Meanwhile you can contact us and we provide you with access to shared demo RMS instance.

## Migration of existing AMS assets to RMS

TBD: Instructions will be added together with RMS deploymnet instructions. You can find some answers to your question about migration in Roadmap and QnA chapters.

## Demo app for Ravnur Media Services API

This is a sample application that demonstrates how you can replace Azure Media Services with the Ravnur Media Services API and create VOD.
Application implements simple VOD workflow:
1. Create input assset
2. Upload video to the input asset
3. Create output asset
4. Create encoding job
5. Wait for encoding job to complete
6. Create streaming locator
7. Get streaming and download URLs

### Prerequisites

You shoud have:
1. RMS instance deployed.
2. Its API endpoint
3. API secret key
4. Registered Media Services Account there: subscription ID, resouce group name, and account name. 

If you don't have existing AMS account now worries you can specify any unique (in scope of single RMS instance) combination of subscription ID, resource group and account name which shouldn't even exist in Azure.

(2) and (3) are given after RMS instance deployment. (4) - are specified by you during the RMS deployment.
We also have a shared demo RMS instance. Just contact us and we will provide you with all necessary credentials and register there your Media Services account there.

### Go to the app

If you use Azure.ResourceManager.Media SDK please go to [sdk-azure-resource-manager-demo](sdk-azure-resource-manager-demo).
If you use Microsoft.Azure.Management.Media SDK please navigate to [sdk-ms-azure-management-demo](sdk-ms-azure-management-demo).

## Roadmap

| Feature | State | Comments |
|---------|-------|----------|
| Assets API | Implemented | |
| Jobs API | Implemented | Supported job inputs: JobInputAsset, JobInputHttp. Does not support  processing multiple media files in one job |
| Streaming Locators API | Implemented | |
| Custom Transforms | In development | Approximately will be available in the middle of October. There is only one predefined transform which you can use. It is a ladder of 5 video qualities, audio and thumbnails. |
| Event Grid Support | In development | |
| Automatic migration of AMS assets/locators to RMS | In development | |
| Custom Streaming Policy | Planned | There is only one predefined screaming policy which you can use: “Predefined_DownloadAndClearStreaming”. It allows not encrypted HLS/DASH streaming and downloads. And you cannot update it. Create and update API will be added in later versions. |
| AES stream encoding | Planned | |
| DRM stream encoding | Planned | |
| Smooth streaming | Planned | |
| Custom Streaming Endpoints | Not supported | There is only one predefined streaming endpoint available. Its domain matches with domain of RMS API endpoint. Implementation of this feature is not planned. |

## QnA

**Q:** How closely does your API's architecture mirror that of AMS in terms of request/response patterns, URL structures, and data models?
**A:** It is 100% mirror of the AMS API. 

**Q:** Do I need to re-encode all my videos?
**A:** No, you do not need to re-encode all video, RMS can work with AMS assets without an issue.

**Q:** Do I need to change streaming/locator URL?
**A:** Yes, but you need to change only host. For example, you have URL like this https://ams1.streaming.media.azure.net/5197ca71-3edc-42b0-adff-12570b48b4e4/video_3500000.ism/manifest(format=m3u8-cmaf) you would need to change ams1.streaming.media.azure.net to RMS host.

**Q:** Do I need to change streaming/locator URL if I’m using CDN?
**A:** No, all you need to change is your CDN origin from AMS to RMS.

**Q:** Do I need to make code changes in my side to use RMS API?
**A:** Just a little bit. If you are using Microsoft SDK, you just need to tell SDK to connect to RMS instead of AMS. Code sample we will provide later. If you have your own implementation, all you need is to change host of the AMS to RMS and change credential types for more details about code changes read Readme.md documentation of demo applications. 

**Q:** What streaming protocols do you support?
**A:** RMS supports HLS, DASH and Smoot Streaming.

**Q:** What encoding formats and codecs do you support?
**A:** Big variety of the codecs and formats for the input assets. Because we are using FFMPEG for encoding, all codecs and formats that FFMPEG supports we are supporting too.
Output is mp4 container with video encoded using x264 code and aac codec for audio.

**Q:** Can I use custom encoding presets similar to what I had in AMS?
**A:** For MVP we do not support this, we have predefined transform, that produces multiple qualities based on the input video quality. 
After MVP, yes, full AMS transform support.

**Q:** How would you migrate streaming for my current AMS assets?
**A:** We have a migration options, where you are providing existing AMS and storage information, and we will import all assets.

**Q:** Do you provide any migration tools or guides for transitioning from AMS to your platform?
**A:** Yes, this would be an automatic migration process, you need to provide existing AMS information and we will import all of the assets.

**Q:** Where is the media content stored, and can it integrate seamlessly with my current storage solutions?
**A:** Media content stored in the Azure Storage Account. Your current storage account can be used in RMS, no data copy required.

**Q:** How does your platform handle API authentication? Is it similar to the way AMS handles it?
**A:** We provide JWT bearer token authentication, similar to the AMS, but it will not require Azure Active Directory service principal or Managed Identity.

**Q:** How does your platform scale with increased demand?
**A:** Our platform designed with scale in mind and can support high demand. 

**Q:** How is pricing structured for encoding, streaming, storage, and any additional features?
**A:** The cost is variable and mostly depends on the usage, the more you encode and watch, the more it costs.
There are some expenses on the infrastructure, but overall system is designed the way that you do not spend money when its idle.

**Q:** Do you support Encryption and DRM?
**A:** Coming soon…  We do support AES-128 encryption natively, we use third party vendor for DRM support. 



