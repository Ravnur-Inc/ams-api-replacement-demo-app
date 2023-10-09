
### AMS to RMS code changes explanation

To repoint AMS SDK to RMS instance, you need to create custome implementation of TokenCredentials class (see [RmsApiKeyTokenCredentials.cs](RmsApiKeyTokenCredentials.cs)).

This is code which connects SDK to AMS:

```csharp
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
```

This is code which points SDK to RMS instance:

```csharp
private AzureMediaServicesClient CreateRmsClient()
{
    var serviceClientCredentials = new RmsApiKeyCredentials(
        new Uri(_rmsOptions.ApiEndpoint),
        _rmsOptions.SubscriptionId,
        _rmsOptions.ApiKey);

    return new AzureMediaServicesClient(serviceClientCredentials, new HttpClient(), true)
    {
        SubscriptionId = _azureOptions!.SubscriptionId
    };
}
```

### Configure and run application

To configure the application you need to set the following environment variables:

```
set Ravnur__SubscriptionId=<Your AMS account Azure subscription ID>
set Ravnur__ResourceGroupName=<Your AMS account resource group name>
set Ravnur__MediaServicesAccountName=<Your AMS account name>
set Ravnur__ApiEndpoint=<Your RMS instance API endpoint>
set Ravnur__ApiKey=<Your RMS instance API key>
```

Then you can build and run the application:

```
dotnet build
dotnet run
```

By default the application will encode its default video using configured RMS instance.
You can also specify a video file to encode as a command line argument:

```
dotnet run rms <path to video file>
```

You can also run encoding using Azure Media Services:

```
set=Azure__AadTenantId=<AMS AAD Tenant ID>
set=Azure__ClientId=<AMS AAD Client ID>
set=Azure__ClientSecret=<AMS AAD Client Secret>

dotnet run ams <path to video file>
```