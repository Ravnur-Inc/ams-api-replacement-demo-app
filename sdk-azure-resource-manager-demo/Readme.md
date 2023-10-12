### Configure and run application

1. Open command prompt in your working directory
2. Clone the repo: ```git clone git@github.com:Ravnur-Inc/ams-migration-demo.git```
3. Go to app folder ```cd sdk-azure-resource-manager-demo```
4. To configure RMS connection set the following environment variables (if you use test RMS instance contact us to get those credentials): 
```
set Ravnur__SubscriptionId=<RMS account subscription ID>
set Ravnur__ResourceGroupName=<RMS account resource group name>
set Ravnur__MediaServicesAccountName=<RMS account name>
set Ravnur__ApiEndpoint=<RMS instance API endpoint>
set Ravnur__ApiKey=<RMS instance API key>
```
5. Build and run the application:
```
dotnet build
dotnet run
```
If you start application without any command line arguments it will encode its default video using configured RMS instance<br>
You can also specify a video file to encode as a command line argument:
```
dotnet run rms <path to video file>
```
As a source of test videos I suggest this link https://gist.github.com/jsturgis/3b19447b304616f18657
6. The output of the program will look like this:
![image](https://github.com/Ravnur-Inc/ams-migration-demo/assets/73594896/b60d6263-3571-43d1-8d53-ffc23212309d)
7. Grab streaming URL and play in player:
https://hlsjs.video-dev.org/demo/ - for HLS
https://reference.dashif.org/dash.js/latest/samples/dash-if-reference-player/index.html - for DASH<br>
NOTE! At the moment it doesn't work for Azure Media Player
8. To ensure that it works with your existing AMS account, run the following command:
```
set Azure__SubscriptionId=<AMS subscription ID>,
set Azure__ResourceGroupName": <AMS resource group>,
set Azure__MediaServicesAccountName": <AMS account name>,
dotnet run ams <path to video file>
```
9. Investigate the code to ensure that it shares the same SDK instructions except connection/credentials part. This code is in [VodProvider.cs](VodProvider.cs) file.

### AMS to RMS code changes explanation

To repoint AMS SDK to RMS instance, you need to create custome implementation of TokenCredentials class (see [RmsApiKeyCredentials.cs](RmsApiKeyTokenCredentials.cs)).

This is code which you needed to connect SDK to AMS:

```csharp
private MediaServicesAccountResource CreateAmsClient()
{
    ArmClient armClient = new ArmClient(new DefaultAzureCredential());

    var mediaServicesAccountIdentifier = MediaServicesAccountResource.CreateResourceIdentifier(
        _azureOptions!.SubscriptionId,
        _azureOptions.ResourceGroupName,
        _azureOptions.MediaServicesAccountName);

    return armClient.GetMediaServicesAccountResource(mediaServicesAccountIdentifier);
}
```

This is code you need to point SDK to RMS instance:

```csharp
private MediaServicesAccountResource CreateRmsClient()
{
    ArmClient armClient = new ArmClient(
        new RmsApiKeyCredentials(
            authorityUri: new Uri(_rmsOptions.ApiEndpoint),
            subscriptionId: _rmsOptions.SubscriptionId ?? throw new ConfigurationErrorsException("Rms SubscriptionId is missing"),
            apiKey: _rmsOptions.ApiKey),
        _rmsOptions.SubscriptionId,
        new ArmClientOptions
        {
            Environment = new ArmEnvironment(new Uri(_rmsOptions.ApiEndpoint), "test"),
        });

    var mediaServicesAccountIdentifier = MediaServicesAccountResource.CreateResourceIdentifier(
        _rmsOptions.SubscriptionId,
        _rmsOptions.ResourceGroupName,
        _rmsOptions.MediaServicesAccountName);

    return armClient.GetMediaServicesAccountResource(mediaServicesAccountIdentifier);
}
```

