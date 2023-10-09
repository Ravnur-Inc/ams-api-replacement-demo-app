## Introduction

This repository was created for people who are looking for Azure Media Services (further AMS) replacement and do not want to spend a lot of resources on changing existing code of their applications.
It demonstrates how Ravnur Media Services (further RMS) allows you replace AMS instance with minimal effort for code changes.
The repository contains instructions how to migrate existing AMS instance to RMS, what code changes you need to perform after this, the list of currently supported AMS features and roadmap of other features implementations.

## Solution overview

In general RMS implements latest version of Azure Media Services V3 API so you can continue using existing Azure SDK without changing your existing code in most of cases. That’s why if you need detailed REST API description and documentation you can still use existing [Microsoft documentation Azure Media Services (v3) documentation](https://learn.microsoft.com/en-us/azure/media-services/latest/). However you need to take into account that current version of RMS is a beta version and does not support some AMS features. At the moment v1.0 can be used for vanilla VOD scenario: upload->encode->stream without ability of advanced streaming or encoding configuration. The list of features which are not present in v1.0 will see later in the article.

## RMS deployment instructions

TBD: At the moment RMS marketplace package is not available yet. Instructions of RMS deployment will be here as soon as Azure Marketplace package passes verification.
Meanwhile you can contact us and we provide you with access to shared demo RMS instance.

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
| Automatic AMS assets/locators migration | In development | |
| Custom Streaming Policy | Planned | There is only one predefined screaming policy which you can use: “Predefined_DownloadAndClearStreaming”. It allows not encrypted HLS/DASH streaming and downloads. And you cannot update it. Create and update API will be added in later versions. |
| AES stream encoding | Planned | |
| DRM stream encoding | Planned | |
| Custom Streaming Endpoints | Not supported | There is only one predefined streaming endpoint available. Its domain matches with domain of RMS API endpoint. Implementation of this feature is not planned. |

