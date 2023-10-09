## Demo app

This is a sample application that demonstrates how you can replace Azure Media Services with the Ravnur Media Services API and create VOD.
To use it first perform RMS instance deployment specifying your Azure subscription ID, resource group name and Media Services account name.
Then configure the application with your RMS instance API endpoint and API key.

Or you ask us to provide you with an existing demo account.

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

If you use Azure.ResourceManager.Media SDK please go to [sdk-azure-resource-manager-demo](sdk-azure-resource-manager-demo)
If you use Microsoft.Azure.Management.Media SDK please navigate to [sdk-ms-azure-management-demo](sdk-ms-azure-management-demo)

