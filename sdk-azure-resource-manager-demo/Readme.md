
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
dotnet run ams <path to video file>
```

The output of the program will look like this:

![image](https://github.com/Ravnur-Inc/ams-migration-demo/assets/73594896/b60d6263-3571-43d1-8d53-ffc23212309d)

Then you can play streaming URLs in player:
https://hlsjs.video-dev.org/demo/ - for HLS
https://reference.dashif.org/dash.js/latest/samples/dash-if-reference-player/index.html - for DASH<br>
NOTE! At the moment it doesn't work for Azure Media Player

As a source of test videos I suggest this link https://gist.github.com/jsturgis/3b19447b304616f18657
