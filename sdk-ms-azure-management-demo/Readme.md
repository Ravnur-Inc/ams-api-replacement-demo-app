### Configure and run the RMS API Demo Application for the Microsoft.Azure.Management.Media SDK

1. Open a command prompt in your working directory
2. Clone the repo: ```git clone https://github.com/Ravnur-Inc/ams-api-replacement-demo-app.git```
3. Go to app folder ```cd ams-api-replacement-demo-app/sdk-ms-azure-management-demo```
4. To configure the RMS connection, set the following environment variables (if you use the Ravnur RMS POC instance, contact us to get those credentials): 
```
set Ravnur__SubscriptionId=<RMS account subscription ID>
set Ravnur__ResourceGroupName=<RMS account resource group name>
set Ravnur__MediaServicesAccountName=<RMS account name>
set Ravnur__ApiEndpoint=<RMS instance API endpoint>
set Ravnur__ApiKey=<RMS instance API key>
```
For Linux/Mac use the "export" command. If it is more convenient for you, you can set corresponding the settings in the appsettings.json file instead.

5. Build and run the application:
```
dotnet build
dotnet run
```
If you start the application without any command line arguments, it will encode the default video that is included in the package using the configured RMS instance.<br>
However, you probably will want to upload and encode your own videos, so you can specify the video file to encode as a command line argument:
```
dotnet run rms <local path or URL of a video/audio file>
```
If for some reason you need test videos, this link has several: https://gist.github.com/jsturgis/3b19447b304616f18657

6. The output of the program will look like this:
![image](https://github.com/Ravnur-Inc/ams-api-replacement-demo-app/assets/73594896/1e8fbed2-e476-4120-b383-006334e569f3)
> [!NOTE]
> A job can stay in Queued state for a minute. The Ravnur-hosted RMS instance is shared, so potentially it can take even longer if all VMs in the pool are occupied. The encoding pool size is configurable, so if you need to support 20 concurrent encoding jobs, for example, you can set the pool size to meet your needs.

7.  Grab a streaming URL and test the playback in a player:
https://hlsjs.video-dev.org/demo/ - for HLS
https://reference.dashif.org/dash.js/latest/samples/dash-if-reference-player/index.html - for DASH<br>

> [!NOTE]
> The RMS streaming URLs will not work with the Azure Media Player. It, too, is being retired, and we can't say we're sad to see it go. You will need to replace the AMP with a new player, and ideally you should test the streaming locator with your player of choice.<br>

8. You can test to ensure that it works with your existing AMS account. To do that login to Azure and set environment variables:
```
az login

set Azure__SubscriptionId=<AMS subscription ID>
set Azure__ResourceGroupName=<AMS resource group>
set Azure__MediaServicesAccountName=<AMS account name>
set=Azure__AadTenantId=<AMS AAD Tenant ID>
set=Azure__ClientId=<AMS AAD Client ID>
set=Azure__ClientSecret=<AMS AAD Client Secret>
```
then run command:
```
dotnet run ams <local path or URL of a video/audio file>
```
> [!NOTE]
> The app creates a transform named "default". So if you already have a transform with this name in your AMS account, it will be overwritten.

9. Inspect the code to ensure that it shares the same SDK instructions (except for the connection/credentials part). This code is in [VodProvider.cs](VodProvider.cs) file.

### AMS to RMS code changes explanation

To repoint the AMS SDK to the RMS instance, you need to create a custom implementation of the ServiceClientCredentials class (see [RmsApiKeyCredentials.cs](RmsApiKeyTokenCredentials.cs)).

This is the code you need to connect the SDK to AMS::

```csharp
private async Task<AzureMediaServicesClient> CreateAmsClient()
{
    ClientCredential clientCredential = new ClientCredential(_azureOptions.ClientId, _azureOptions.ClientSecret);
    ServiceClientCredentials serviceClientCredentials =
        await ApplicationTokenProvider.LoginSilentAsync(
            _azureOptions.AadTenantId,
            clientCredential,
            ActiveDirectoryServiceSettings.Azure);
    var client = new HttpClient();
    client.BaseAddress = new Uri(_azureOptions.ApiEndpoint);

    return new AzureMediaServicesClient(serviceClientCredentials, client, true)
    {
        SubscriptionId = _azureOptions!.SubscriptionId
    };
}
```

This is the code you need to point the SDK to the RMS instance:

```csharp
private AzureMediaServicesClient CreateRmsClient()
{
    var serviceClientCredentials = new RmsApiKeyCredentials(
        new Uri(_rmsOptions.ApiEndpoint),
        _rmsOptions.SubscriptionId,
        _rmsOptions.ApiKey);

    return new AzureMediaServicesClient(serviceClientCredentials, new HttpClient(), true)
    {
        SubscriptionId = _rmsOptions!.SubscriptionId
    };
}
```
