## How to configure Ravnur Media Services to work with your existing storage account 

Ravnur Media Services allows you to continue using your existing storage accounts. Your current AMS account may have one or more storage accounts connect to it, and you can continue to use them. You will need to setup user-assigned managed identity access to your storage account to enable a secure connection between RMS and your storage account.

The following sections provides step-by-step guide on how to connect your existing storage account(s) to Ravnur Media Services.

### Locate the User-Assigned Managed Identity

1. Go to the managed resource group created by the Ravnur Media Services deployment
2. Under the list of resources, go to the “Managed Identity” section

> The name of the Managed Identity wll be unique for your specific deployment, however, it always follows a pattern "id-\<unique-suffix\>"

![Managed Identity resource in the RMS deployment resource group](img/managed-identity.png)

### Grant storage permissions to the Managed Identity

1. Go the storage account you want to connect with Ravnur Media Services
2. Navigate to Access Control (IAM) section
3. Assign the following roles to the Managed Identity from the Ravnur Media Services resource group:
- Reader
- Storage Blob Data Contributor
- Storage Blob Delegator
- Storage Table Data Contributor

The step-by-step guide on how to assign Azure roles using the Azure portal can be found in [Azure RBAC documentation](https://learn.microsoft.com/en-us/azure/role-based-access-control/role-assignments-portal)

![Storage account access rights for the Managed Identity resource](img/managed-identity-storage-access.png)

### Add storage configuration to the Ravnur Media Services

1. Navigate to the Ravnur Media Services management console

> The url to access RMS management console will be unique for your specific deployment, however, it always follows a pattern "https://rms.\<unique-suffix\>.ravnur.net/console"

2. Click the "Manage" button for the corresponding account

![Managing RMS account](img/console-manage-account.PNG)

3. Add a new storage account record

- The "Name" field should contain name of the storage account you connecting
- The "Managed Identity" field should contain client ID of the Managed Identity from Ravnur Media Services managed resource group

![Adding new storage to the RMS configuration](img/rms-console-add-new-storage.png)

4. Set the new storage account as Primary

![Setting new storage as Primary in the RMS configuration](img/rms-console-set-primaty-storage.png)

> **Important!** It may take up to 10 minutes to propagate the change of the primary storage account throughout the system
