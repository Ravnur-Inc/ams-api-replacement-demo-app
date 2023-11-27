
# Application migration to RMS

## Pre-requisits

✅ You have an RMS instance deployed using Azure Marketplace

✅ You have a Microsoft account which has access to an Azure Tenant where RMS instance is deployed

## Get RMS connection credentials

* On Azure Portal go to RMS Managed Application resource: Managed Applications center -> Marketplace Applications -> Find RMS Application and open it
* Then click on "Parameters and Outputs" ![RMS Managed App view](img/rms-managed-app.png)
* In the list of outputs copy "consoleURL" and open it in browser ![RMS Console URL](img/rms-managed-app-outputs.png)
* On the Console page copy all neccessry RMS connection and save them for further steps
TODO: Add screenshot

## Register your AMS storage(s) in RMS

* In RMS Console page press "Manage Storages" button for your RMS account
* Remove existing default storage (optional)
TODO: Add screenshot
* Add your primary AMS storage by specifying:
  * Storage name
  * Primary Key
  * Secondary Key
  * Check "Is Primary" checkbox
  TODO: Add screenshot
* Add secondary storages if any
* Ensure that the list of storages match with your AMS account
  TODO: Add screenshot

> [!NOTE] **Storage account keys rotation**. If you are going to rotate your storage keys don't forget to update them in RMS Console after that.

## Migrate AMS assets and locators to RMS

Comes soon. At this stage you can use RMS for testing purpose and skip this step.

## Migrate you application

RMS API mirrors AMS API that's why there is no dramatic code changes required. You can keep using your SDK and logic without changes. However RMS has different authentication scheme that's why you need to update your code to use new type of credentials.
You can just copy them from here:

* For **Azure.ResourceManager.Media SDK** use [this implementation](../sdk-azure-resource-manager-demo/RmsApiKeyCredentials.cs)
* For **Microsoft.Azure.Management.Media SDK** use [this implementation](../sdk-ms-azure-management-demo/RmsApiKeyCredentials.cs)

Then your media service client initialization code will look like this:

```CSharp
// For Microsoft.Azure.Management.Media SDK
var credentials = new RmsApiKeyCredentials(
    new Uri("<RMS API endpoint>"),
    "<RMS Subscription ID>",
    "<RMS API Key>");

var mediaServicesClient = new AzureMediaServicesClient(credentials, new HttpClient(), true)
{
    SubscriptionId = "<RMS Subscription ID>"
};
// All client method calls then use RMS Resource Group and Account Names
```

or

```CSharp
// For Azure.ResourceManager.Media SDK
var credentials = new RmsApiKeyCredentials(
    new Uri("<RMS API endpoint>"),
    "<RMS Subscription ID>",
    "<RMS API Key>");

ArmClient armClient = new ArmClient(
        credentials,
        "<RMS Subscription ID>",
        new ArmClientOptions
        {
            Environment = new ArmEnvironment(new Uri("<RMS API endpoint>"), "test"),
        });

var mediaServicesAccountIdentifier = MediaServicesAccountResource.CreateResourceIdentifier(
    "<RMS Subscription ID>",
    "<RMS Resource Group Name>",
    "<RMS Account Name>");

var mediaServiceClient = armClient.GetMediaServicesAccountResource(mediaServicesAccountIdentifier)
```

You can see in details how it is done for demo application, which can switch between AMS and RMS:

* For **Azure.ResourceManager.Media SDK** [sdk-azure-resource-manager-demo](sdk-azure-resource-manager-demo)
* For **Microsoft.Azure.Management.Media SDK**, please use this application: [sdk-ms-azure-management-demo](sdk-ms-azure-management-demo).

## Replace Azure Media Player with another player

Azure Media Player was developed specifically for AMS streams and do not work with any streaming link you provide it with. RMS is not exception: AMP does not work with RMS streams. You need to use a different player. At the moment the following players are consistent with RMS:

* [Ravnur Media Player](https://strmsdemo.z13.web.core.windows.net/)
* hls.js
* dash.js
* Shaka
* Video.js (TODO: need to test)
* ExoPlayer (TODO: need to test)
* AVPlayer (TODO: need to test)
* THEOplayer (TODO: need to test)
* NextPlayer (TODO: need to test)

## Change Event Grid subscriptions

RMS produces same Event Grid events schema as AMS. Use [these instructions](monitoring.md) to change your current Event Grid subscriptons to listen RMS events instead.

## Repoint your CDN to RMS original

* Go to your CDN profile:
  * In azure portal go to your AMS account → Endpoints
  * Select endpoint you use for streaming
  * Navigate to its CDN profile
* Select endpoint routed to your AMS endpoint ![Ams endpoint location](img/cdn-update-1.png)
* Change origin to your RMS streaming domain (it matches with RMS API endpoint domain) ![Change CDN origin](img/cdn-update-2.png)
* Change RMS streaming endpoint hostName
  * Go to RMS Console -> Streaming Endpoints (TODO: add screenshot)
  * In Host Name text box specify host name of your current AMS account streaming endpoint
