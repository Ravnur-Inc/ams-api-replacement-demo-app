# Application Migration to RMS

To enable the playback of media stored in your AMS account within RMS, follow the migration procedure outlined below. This process involves extracting necessary resources from your AMS account and storing them in the RMS database.

Entities to be migrated:
- Transforms
- Content Key Policies
- Streaming Policies
- Assets
- Streaming Locators

## Get AMS credentials

1. Open Azure Portal and navigate to the AMS account that need to be migrated.

2. Navigate to API Access.
      ![Console credentials](img/data-migration-select-api.png)

3. Scroll down to the "Connect to Media Services API" section and select JSON view.
      ![Console credentials](img/data-migration-json.png)

4. Retrieve the AZURE_CLIENT_ID and AZURE_CLIENT_SECRET values using this [instruction](https://learn.microsoft.com/en-us/azure/databricks/dev-tools/service-prin-aad-token#--provision-a-service-principal-in-azure-portal). Ensure the Token expiration is not less than one week because the migration process can take days, depending on the media count. Also, confirm that your AMS account has a Microsoft Entra Id (AAD) application assigned with the "Contributor" role.
      ![Console credentials](img/data-migration-iam.png)
   
## Start Migration

1. On the Azure Portal, go to RMS Managed Application resource: Managed Applications center -> Marketplace Applications -> Find RMS Application and open it.
   
2. Go to RMS Console and click the "Data migration" button for your RMS account.
      ![Console credentials](img/data-migration-console.png)
You will see a form where you should enter AMS API Access JSON credentials in JSON format and comma-separated list of emails for notifications about migration status (optional). Then press "Start Migration" button.
      ![Console credentials](img/data-migration-start.png)

3. You will see migration status form with source AMS account inforamtion and a list of migration steps. Depending on media count, the migration process can take from a couple of hours to several days.
      ![Console credentials](img/data-migration-inprogress.png)

4. Upon successful completion, the Migration Info table will display a "Completed" status, and the Steps table will show counts of migrated items.
      ![Console credentials](img/data-migration-finished.png)
   If an error occurred during the migration process, the status will be "Failed," with details in the Steps table. If notification emails were provided, you will receive a notification with migration results.

5. If new items were added to your AMS account after migration, and you want to add them to RMS, open the Data Migration page and press the "Sync latest changes" button. If changes were made to already migrated items, check the "Update migrated items" checkbox before starting synchronization.

## Migration Errors
If the migration process finishes with an error, please contact Ravnur for assistance in resolving the issues and completing the migration process.
