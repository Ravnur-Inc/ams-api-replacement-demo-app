# Azure web job for listening to RMS events from the Storage Queue

## Pre-requisites

- a created subscription to RMS/AMS Event Grid topic. Learn more [here](../../docs/monitoring.md).

## Usage
This sample demonstrates one way to use Event Grid with Storage Queue subscriptions. Please note that this is not the only possible approach for using Event Grid with RMS.

A Service Bus subscription is incompatible with this application.
>
> [!Note]
> WARNING! The start of the application will consume all messages from the specified queue. So use it only for your non-production environment as a Proof of concept.

## Set environment variables

It is required to set 2 variables:

* `AzureWebJobsStorage` - it should contain your storage connection string
* `JobMonitoringQueueName` - it should contain your storage queue name

## Start application

```console
dotnet run
```

If you want to monitor a specific job, you need to specify arguments:

```console
dotnet run <transform name> <job name>
```

## Monitor the queue
The runtime listens for messages in the Storage Queue and prints them:

![example](example.png)

## Stop the application

Press any key to stop the application. Be aware that all messages from your queue will disappear.

## Useful links

* [How to create Event Grid subscriptions](https://learn.microsoft.com/en-us/azure/data-explorer/ingest-data-event-grid-manual)
* [Azure WebJobs SDK turtorial](https://learn.microsoft.com/en-us/azure/app-service/webjobs-sdk-get-started)
