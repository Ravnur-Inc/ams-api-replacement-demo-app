🚀 **Event grid is now available!** 🚀  All AMS job-related events are supported by RMS with no code changes! Read more [here](docs/monitoring.md)

> [!NOTE]
> This is a console application to help you test the Ravnur Media Services API. It is not the repo for Ravnur Media Services. Contact Ravnur at info@ravnur.com to deploy the RMS managed application from the Azure Marketplace, or to gain access to Ravnur’s test environment

## What is the Ravnur Media Services API Demo Application?

Ravnur Media Services (RMS) and its API have been engineered for Azure Media Services (AMS) customers seeking to transition away from AMS without significant modifications to their existing application code. The demo application in this repository will help you understand how RMS can seamlessly replace AMS with minimal changes to your existing code.

We’ve created this console application to give you a quick and simple way to test and explore the Ravnur Media Services API. There are two versions of the demo application. Please select the version that corresponds to the way you use the Azure Media Services (AMS) v3 API:
1.	If you're using the **Azure.ResourceManager.Media SDK**, please use this application: [sdk-azure-resource-manager-demo](sdk-azure-resource-manager-demo).  
2.	For those using the **Microsoft.Azure.Management.Media SDK**, please use this application: [sdk-ms-azure-management-demo](sdk-ms-azure-management-demo).

After selecting one of the links above, you’ll find instructions on installing and running the demo application and SDK specific code samples that highlight the code changes required for authentication and redirecting to RMS.

## What do I need to use the RMS API Demo Application to test the API?

To run the RMS demo application, you will need:

✅ A deployed instance of RMS. You can deploy one from the Azure marketplace or use a Ravnur-hosted POC environment. Contact Ravnur to deploy the RMS managed application from the Azure Marketplace, or to gain access to Ravnur’s test environment.

✅ The corresponding RMS API endpoint. You will get this after deploying RMS from the marketplace, or from Ravnur support if you use Ravnur’s test environment.

✅ The RMS API secret key. You will get this after deploying RMS from the marketplace, or from Ravnur support if you use Ravnur’s test environment.

✅ Dotnet installed (both SDK and runtime, app is written on dotnet 6).

✅ Azure CLI installed (only if you want to run the app using an existing AMS account to compare the output with RMS. Azure CLI is not required by RMS).

## What can I test using the RMS Demo Application?

The demo application will connect to the RMS v0.7 API and allow you to upload, encode and stream a video. With each subsequent release of RMS, you will be able to test more functionality. Please see the product roadmap below for upcoming features and availability dates.

Specifically, the RMS v0.7 API will enable you to:
1.	Create input asset (if input is a local file)
2.	Upload video/audio to the input asset (if input is a local file)
3.	Create output asset
4.	Initiate encoding job
5.	Await completion of the encoding job
6.	Create streaming locator
7.	Retrieve streaming and download URLs
8.	Monitor and act on all Event Grid job-related event types supported by Azure Media Services

On the respective pages for the SDK version of the demo application, you can see a screenshot of the API responses.

> [!NOTE]
> **TEST AND COMPARE RMS WITH AMS** You can also use the test application to connect to your AMS account to compare the responses. Because the RMS and AMS API are the same, all you need to do to connect it to AMS and upload a file is change rms to ams in the command: To test RMS use: ```dotnet run rms <your file>``` and to test AMS use: ```dotnet run ams <your file>```. This is also found in Step 8 of the respective SDK demo app instructions.

----

## What is Ravnur Media Services?

Ravnur Media Services (RMS) replaces the most recent version of the Azure Media Services v3 API. This means AMS customers can continue to use their existing Azure SDK without making extensive code alterations. Because the RMS API is a mirror of the AMS v3 API, you can refer to the existing [Microsoft Azure Media Services (v3) documentation](https://learn.microsoft.com/en-us/rest/api/media/) for the comprehensive REST API description and documentation. With RMS, you do not need to reencode your content, and you can use your existing storage account because the output of RMS is identical to AMS. 

Please refer to the RMS roadmap for guidance on which endpoints have already been implemented and which endpoints are planned in coming releases. The initial release, RMS v0.6, implemented the core AMS functionality for VOD encoding and streaming. The current version, RMS v0.7 includes additional functionality, such as support for custom transforms, CDN tokenization, AES-128 encryption, content key policiesand streaming policies.

## How can I get Ravnur Media Services?

RMS is offered as a managed application available from the Azure Marketplace. This means that you can deploy it in your Azure tenant into a dedicated resource group. Ravnur manages the Azure services and the RMS application for you. During the deployment you can configure the regions and connections to existing Azure storage accounts, or specify new accounts. The RMS marketplace package is in the process of being certified for publication in the Azure Marketplace. However, in the meanwhile we can quickly create a private offer that will allow you to access and deploy RMS. Deployment instructions for RMS will be published in the Azure Marketplace once the marketplace package clears certification. In the interim, you may reach out to us, and we'll grant you access to a shared demo RMS instance.

## How do I migrate my existing AMS assets to RMS?

Ravnur includes a migration tool as part of the RMS manage application. It copies the asset metadata (not content - that stays put), content key policies, transforms and streaming locators from AMS to RMS so that your assets are streamable within minutes. A migration guide will be delivered together with the RMS deployment instructions. For any migration-related queries, please refer to the Roadmap and Q&A sections.

## RMS Feature Roadmap

| Feature | State | Comments |
|---------|-------|----------|
| Assets  | Implemented | |
| Jobs  | Implemented | Supported job inputs: JobInputAsset, JobInputHttp. Does not support  processing multiple media files in one job |
| Streaming Locators  | Implemented | |
| Custom Transforms | Implemented | Currently there is only one predefined transform, an adaptive bitrate streaming set of 5 (max) video qualities with audio and thumbnails. |
| Event Grid support | Implemented | Supported all job-related event types. More details about Event Grid support can be found on [this page](docs/monitoring.md) |
| Automatic migration of AMS assets/locators to RMS | Implemented | |
| Custom Streaming Policy | Implemented | Currently there is only one predefined streaming policy: “Predefined_DownloadAndClearStreaming”. It allows not encrypted HLS/DASH streaming and downloads. Create and update API will be added in later RMS versions. |
| AES stream encoding | Implemented | |
| DRM stream encoding | In development | |
| Smooth streaming | In developement | |
| Custom Streaming Endpoints | Not supported | There is only one predefined streaming endpoint available. Its domain matches with domain of RMS API endpoint. Implementation of this feature is not planned. |

## Ravnur Media Services FAQs

1.	**HOW CLOSELY DOES YOUR API'S ARCHITECTURE MIRROR THAT OF AMS IN TERMS OF REQUEST/RESPONSE PATTERNS, URL STRUCTURES, AND DATA MODELS?**
The RMS API structure is a 100% mirror of the AMS API structure. The endpoints delivered so far (November 2023) are Assets, Jobs, Streaming Locators, Streaming Endpoints, Transforms and Content Key Policies.

2.	**DO I NEED TO RE-ENCODE ALL MY VIDEOS?**
No, you do not need to re-encode any videos. RMS can work with existing AMS assets without any issues.
4.	**DO I NEED TO CHANGE THE STREAMING URL OR STREAMING LOCATOR?**
RMS can use the existing streaming locator. The streaming URL will need to be changed, but you need to change only the host. For example, if you have a streaming URL like this: https://ams1.streaming.media.azure.net/5197ca71-3edc-42b0-adff-12570b48b4e4/video_3500000.ism/manifest(format=m3u8-cmaf) you would need to change **ams1.streaming.media.azure.net** to the RMS host. The RMS host domain can be customized to use your domain.
5.	**DO I NEED TO CHANGE THE STREAMING URL OR STREAMING LOCATOR IF I’M USING A CDN?**
No, all you need to change is your CDN origin so that it uses the RMS streaming domain and not AMS.
6.	**DO I NEED TO MAKE CODE CHANGES IN MY APPLICATION TO USE THE RMS API?**
Yes, but just a little bit. If you are using the Microsoft Azure SDK, you just need to tell the SDK to connect to RMS instead of AMS. Code samples can be found on the pages for the respective SDK versions of the demo app (links above). If you have your own implementation, you need to change only the host from AMS to RMS.
7.	**WHAT STREAMING PROTOCOLS DO YOU SUPPORT?**
RMS supports HLS, MPEG-DASH and Smooth Streaming (fragmented MP4).
8.	**WHAT ENCODING FORMATS AND CODECS DO YOU SUPPORT?**
RMS encoding supports a wide range of codecs and containers and can accept the same codecs and containers as AMS. If you have a need to encode an unsupported codec/container, we’ll add it.
The standard output asset is h.264/AAC in an mp4 container.
9.	**CAN I USE CUSTOM ENCODING PRESETS SIMILAR TO WHAT I HAD IN AMS?**
Support for custom transforms has been added in the RMS 0.7 release (November 2023).  
10.	**HOW WOULD YOU MIGRATE THE STREAMING FUNCTIONALITY FOR MY CURRENT AMS ASSETS?**
When you initially configure the RMS deployment, you’ll be asked to provide information about your current AMS and storage accounts. Once RMS connects, it will import all of the streaming locators and asset information from AMS, and it will use the existing storage account as the source and destination for video streaming and encoding.
11.	**DO YOU PROVIDE ANY MIGRATION TOOLS FOR TRANSITIONING FROM AMS TO YOUR PLATFORM?**
Yes, migration is an automated process. After you provide the AMS and storage account information, RMS will automatically import all assets, and they will become available for streaming by RMS.
12.	**WHERE IS THE MEDIA CONTENT STORED, AND CAN IT INTEGRATE SEAMLESSLY WITH MY CURRENT STORAGE ACCOUNT?**
All media content is stored in your Azure Storage Account, following the existing AMS structure. No data copying is required.
13.	**HOW DOES YOUR PLATFORM HANDLE API AUTHENTICATION? IS IT SIMILAR TO THE WAY AMS HANDLES IT?**
We use JWT bearer token authentication, like AMS. RMS will not require Azure Active Directory service principal or Managed Identity. 
14.**IS THERE A SANDBOX OR TESTING ENVIRONMENT WHERE I CAN VERIFY THE COMPATIBILITY BEFORE GOING LIVE?**
Yes. Ravnur can set up a testing environment for you where you can run a POC. We can do this in your Azure tenant or ours.
15.	**HOW DOES YOUR PLATFORM SCALE WITH INCREASED DEMAND?**
The RMS application is engineered to scale both streaming and encoding to meet the demands of your users and viewers. The encoding management application monitors queues and jobs to ensure that jobs are efficiently allocated, and provisions encoders as needed. Streaming demand is managed by a combination of CDN and auto-scaling triggered by egress bandwidth and CPU monitoring
16.	**HOW IS PRICING STRUCTURED FOR ENCODING, STREAMING, STORAGE, AND ANY ADDITIONAL FEATURES?**
The pricing for RMS is comprised of two components. There is a fixed cost for support and updates, and there is a variable cost for Azure services. The RMS application is deployed to your Azure tenant from the Azure Marketplace as a managed application. This means that Ravnur manages the RMS application and the Azure services that provision the application.
Fixed cost. Support of the application and Azure environment, and regular upgrades for the RMS encoding and streaming solution begins at $499/month. When subscribed to from the Azure Marketplace, this can be paid for from your Azure commitment, or added to your Azure monthly invoice as a marketplace charge.
Variable cost. Because RMS runs in your Azure tenant, all encoding, streaming and storage costs accrue to your Azure expense. RMS uses VMs, Container Apps and Azure SQL (serverless), along with Azure Storage Queues and Tables. In RMS’s idle state, the encoding VMs are deallocated and not billing. The streaming servers running in Container Apps can be scaled to zero to minimize Azure expenses.
17.	**ARE THERE ANY ADDITIONAL OR HIDDEN COSTS I SHOULD BE AWARE OF?**
If you use DRM (Widevine, PlayReady, FairPlay), you will need to pay for DRM licenses. We partner with EZDRM for DRM licenses.
18.	**DO YOU SUPPORT ENCRYPTION AND DRM?**
We support AES-128 encryption natively, and we use EZDRM for multi-DRM support. 

## Ravnur Media Services Architecture

Ravnur Media Services (RMS) is the replacement for Azure Media Services (AMS), which Microsoft is retiring on June 30, 2024. The similarity in naming is intentional; The RMS API is a mirror of the AMS API and migrating from AMS to RMS requires minimal code changes to the existing Azure SDK used with the AMS API (i.e. Azure.ResourceManager.Media SDK or the Microsoft.Azure.Management.Media SDK).

The diagram below is the reference architecture for Ravnur Media Services (RMS). The Azure Services that provision RMS are deployed from the Azure Marketplace to a dedicated resource group in the customer’s Azure subscription. 

![RMS-high-level-diagram drawio-dark](https://github.com/Ravnur-Inc/ams-api-replacement-demo-app/assets/59251956/a15afa28-ca13-4041-85e1-6063eda8168d)

The architecture of RMS is similar to AMS, and it provides scalability for encoding and streaming demands. Azure Front Door sits in front of the RMS API. The RMS API endpoints terminate in an Azure container app. Streaming locators and asset metadata are stored in Azure SQL databases (primary and failover). Encoding jobs are processed by Azure VMs; the number and size can be configured during deployment. Output content assets (e.g. video files, thumbnails, manifest files, etc.) are stored in containers in Azure blob storage, and the account can be specified during deployment (e.g. connect an existing storage account or a new storage account). Streaming servers run in container apps and scale based on real-time monitoring. The connection to the Content Delivery Network is not shown on the diagram.

## List of Azure resources used by Ravnur Media Services

|Azure Service |	Purpose |
| --- | --- |
|Azure Front Door |	Manages and optimizes API traffic with global routing. Acts as a layer-7 load balancer that distributes traffic to corresponding services.  Provides SSL offloading, and WAF protects services |
Container app environment	| Provides the runtime environment for the container apps |
Container app	| Runs the containerized RMS API |
Container app	| Runs the streaming server applications. Scales according to scaling rules based on real-time monitoring |
Application Insights | Provides telemetry and service performance monitoring |
Managed Identity	| Grants permissions to resources securely without storing credentials in code. |
DNS Zones |	Maps domain names to IP addresses. |
Key Vault	| Safely stores and manages secrets, keys and certificates needed for RMS |
Log Analytics workspace	| Aggregates and analyzes log data from Application Insights, App Service event logs, Container Apps and various Azure services. |
Network Interface	| Provides an IP address to an Azure VM and connects to Azure VNet. |
Network security group	| Filters and controls inbound and outbound traffic. This is created by default when VM is created. |
App Service plan	| The App Service Plan provides the compute resources for the Azure function app. |
Azure SQL DBs	| Microsoft SQL DB stores assets, locators and metadata. Configured with failover DB. |
Azure SQL Server |	Managed service provisioning the SQL Server for the SQL DBs. |
Azure Storage Account	| This storage account stores video originals, assets, sub resources, etc. |
Azure Storage Account	| This storage account is used for infrastructure deployment. |
Virtual Machine	| VMs run the RMS encoding agents and applications. Number of VMs is configurable. Each job is allocated to a dedicated VM. VM is billing only when executing a job. |
Disk	| Each VM requires a disk. Disks are billable even when the VM is deallocated. |
Virtual Network	| Provides an isolated and secure environment to run Azure resources. This Vnet deployed by default and needed for container apps, VMs, DB. |

## ABOUT RAVNUR

Ravnur is an experienced video content management and live streaming solution provider that has been serving government customers such as the Department of Homeland Security, Department of Defense and the Department of Commerce, as well as global commercial clients like Microsoft, Xerox, and Warner Brothers for over a decade. Our flagship solution, the Ravnur Media Platform (RMP), delivers scalable and reliable live and on-demand video workflows in high quality to any device. RMP allows customers to start fast with easy-to-use live streaming and video content management processes, and its rich functionality enables customers to grow their use of video, audio and live content in other workflows as the need arises.

Our unique platform architecture allows RMP to function as a private multi-tenant SaaS solution for organizations that have multiple internal clients and require the security and privacy that a private SaaS solution offers. RMP is hosted in the customer’s FedRAMP certified Microsoft Azure Cloud, in either the commercial cloud or the government cloud, based on the customer's preference. Ravnur's solutions prioritize data privacy and security. Unlike other cloud solutions, we ensure that each customer's data and content are segregated and protected through separate databases and storage accounts, even when running as a private SaaS solution in the customer’s Azure tenant.

We believe in simplifying the procurement process for government organizations. That's why we offer Ravnur solutions in the Microsoft Azure Marketplace. Customers can purchase and use our solutions as Azure services from their existing Azure monetary commitments. Standard procurement is also offered.

We're proud to be a Veteran Owned Small Business, and we look forward to helping Azure Media Services customers migrate from AMS to RMS.
