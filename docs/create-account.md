# Azure SDK Account Management Guide

This page educates on how to create and manage new accounts using the Azure SDK through third-party sites/portals, allowing your users to control account creation and usage.

## Prerequisites

⚠️ **Important**: By default, RMS allows account creation only via [RMS Console](https://docs.ravnur.com/hc/en-us/articles/24542769095698-RMS-Console-Start-Guide). You must **request Ravnur to enable account creation via SDK first** before using this functionality.

## Step 1: Authorization

Before creating new accounts, you must authenticate with an existing account. Every environment has at least one **default** account that can be used for this purpose.

```csharp
ArmClient armClient = new ArmClient(
   new RmsApiKeyCredentials(
       authorityUri: new Uri(_rmsOptions.ApiEndpoint),
       subscriptionId: _rmsOptions.SubscriptionId
                       ?? throw new Exception("RMS SubscriptionId is missing"),
       apiKey: _rmsOptions.ApiKey),
   _rmsOptions.SubscriptionId,
   new ArmClientOptions
   {
       Environment = new ArmEnvironment(new Uri(_rmsOptions.ApiEndpoint), "prod"),
   });

var sub = armClient.GetDefaultSubscription();
var resourceGroup = sub.GetResourceGroup(_rmsOptions.ResourceGroupName).Value;
```

## Step 2: Creating a New Media Services Account

```csharp
var createResponse = resourceGroup.GetMediaServicesAccounts()
   .CreateOrUpdateAsync(
       waitUntil: WaitUntil.Completed,
       accountName: "newAccount",
       data: new MediaServicesAccountData(AzureLocation.WestEurope)
       {
           StorageAccounts =
           {
               // Provide the resource identifier of an existing storage account.
               // RMS accesses it through managed identity—no extra attachment steps required.
               new MediaServicesStorageAccount(MediaServicesStorageAccountType.Primary)
               {
                   Id = new ResourceIdentifier("storage_name")
               },
           },
           Location = AzureLocation.WestEurope
       })
   .GetAwaiter().GetResult();
```

### Key Points:
- `AzureLocation`: Can be any valid Azure location
- `storage_name`: Must be replaced with an actual StorageAccount name
- The storage account must have **Managed Identity with Storage Blob Data Contributor** role for accessibility from the current RMS deployment. See steps 1 and 2 of [this instruction](https://docs.ravnur.com/hc/en-us/articles/18503446766226-How-to-grant-storage-access-for-RMS).

## Step 3: Retrieving the API Key (Critical Step)

⚠️ **One-Time Opportunity**: This is your only chance to retrieve the API key programmatically.

```csharp
var accountApiKey = createResponse.Value.Data.Tags["DefaultApiKey"];
```

### Note:
- **Save immediately**: Store this key in your database right after retrieval. There's no way to retrieve this key later through code
- **Alternative**: You can only create a new key [from the RMS Console](https://docs.ravnur.com/hc/en-us/articles/18429515005330-RMS-Console-API-Key-Management)
- **Important**: Each API key works only with its specific account. The only exception is the creation of new accounts.

## Step 4: Connecting to the New Account

Create a new `new ArmClient` using the retrieved API key. It will be necessary to work with the newly created account:

```csharp
ArmClient accountClient = new ArmClient(
   new RmsApiKeyCredentials(
       authorityUri: new Uri(_rmsOptions.ApiEndpoint),
       subscriptionId: _rmsOptions.SubscriptionId
                       ?? throw new Exception("RMS SubscriptionId is missing"),
       apiKey: accountApiKey),
   _rmsOptions.SubscriptionId,
   new ArmClientOptions
   {
       Environment = new ArmEnvironment(new Uri(_rmsOptions.ApiEndpoint), "prod"),
   });

var accountSub = accountClient.GetDefaultSubscription();
var accountRg  = accountSub.GetResourceGroup(_rmsOptions.ResourceGroupName).Value;

```

## Step 5: Managing the New Account

Generate a reference to the new account for further management operations:

```csharp
var account  = accountRg.GetMediaServicesAccount(createResponse.Value.Data.Name).Value;
```

## Step 6: Using RMS Functionality

Once you have the account reference, you can perform  RMS operations:

### Creating Assets
```csharp
account.GetMediaAssets().CreateOrUpdateAsync(
    waitUntil: WaitUntil.Completed,
    assetName: "welcome-video",
    data: new MediaAssetData())
    .GetAwaiter().GetResult();
```

### Deleting Account
```csharp
account.DeleteAsync(WaitUntil.Completed).GetAwaiter().GetResult();
```

## Important Notes

- This code is for **educational purposes only** and doesn't include necessary production configurations
- Always implement proper error handling in production code
- Store API keys securely

## Summary

1. **Authorization**: Use existing account credentials to create `armClient`
2. **Account Creation**: Create a new account using `armClient`
3. **Key Retrieval**: Get the new account's API key (one-time only!)
4. **New Connection**: Create `new ArmClient` with the new key
5. **Account Management**: Use `new ArmClient` for all operations on the new account

## Restrictions for Keys

- Each API key works only with its own account. One Exception: creation of new accounts.
- A key grants management access only to its corresponding account.
