// First of all, you need to get access to RMS with ApiKey for any existing account.
ArmClient armClient = new ArmClient(
    new RmsApiKeyCredentials(
        authorityUri: new Uri(_rmsOptions.ApiEndpoint),
        subscriptionId: _rmsOptions.SubscriptionId ?? throw new Exception("Rms SubscriptionId is missing"),
        apiKey: _rmsOptions.ApiKey),
    _rmsOptions.SubscriptionId,
    new ArmClientOptions
    {
        Environment = new ArmEnvironment(new Uri(_rmsOptions.ApiEndpoint), "test"),
    });

var sub = armClient.GetDefaultSubscription();
var resourceGroup = sub.GetResourceGroup(_rmsOptions.ResourceGroupName).Value;

// Now you can make create media service account request. AzureLocation can be any.
var res = resourceGroup.GetMediaServicesAccounts().CreateOrUpdateAsync(
    waitUntil: WaitUntil.Completed,
    accountName: "newAccount",
    data: new MediaServicesAccountData(AzureLocation.WestEurope)
    {
        StorageAccounts =
        {
            // Here you need to place name existing storage account that is accessible from current RMS deployment
            new MediaServicesStorageAccount(MediaServicesStorageAccountType.Primary) { Id = new ResourceIdentifier("storage_name") },
        },
        Location = AzureLocation.WestEurope
    }).GetAwaiter().GetResult();

// This is how you can obtain ApiKey for new account. Strongly recomended to save it in your DB right after retreiving, there is no way to get it later, only to create new one from RMS Console. Note that ApiKey that was used for creating accounty won't allow to work with it.
var key = res.Value.Data.Tags["DefaultApiKey"];

// Now you can create new client for new account with its ApiKey.
ArmClient armClient2 = new ArmClient(
    new RmsApiKeyCredentials(
        authorityUri: new Uri(_rmsOptions.ApiEndpoint),
        subscriptionId: _rmsOptions.SubscriptionId ?? throw new Exception("Rms SubscriptionId is missing"),
        apiKey: key),
    _rmsOptions.SubscriptionId,
    new ArmClientOptions
    {
        Environment = new ArmEnvironment(new Uri(_rmsOptions.ApiEndpoint), "test"),
    });

var sub2 = armClient2.GetDefaultSubscription();
var resourceGroup2 = sub2.GetResourceGroup(_rmsOptions.ResourceGroupName).Value;
// Load newly created account
var newAcc = resourceGroup2.GetMediaServicesAccount(res.Value.Data.Name).Value;

// Now you can use it for any rms functionalty, like creating assets.
newAcc.GetMediaAssets().CreateOrUpdateAsync(
    waitUntil: WaitUntil.Completed,
    assetName: "testasset",
    data: new MediaAssetData()).GetAwaiter().GetResult();

// You also can delete account
newAcc.DeleteAsync(WaitUntil.Completed).GetAwaiter().GetResult();
