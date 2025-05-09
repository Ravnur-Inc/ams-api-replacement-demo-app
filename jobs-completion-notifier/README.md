# Jobs Completion Notifier (alpha version)

This Python project retrieves Azure Media Services (AMS) job statuses from a CSV file and sends notifications based on their completion status. Notifications can be sent to either Azure Event Grid or Azure Service Bus.

## Features
- Retrieve AMS job statuses using the Azure Media Services SDK.
- Send notifications to Azure Event Grid or Azure Service Bus.
- Secure authentication using Azure Managed Identity.
- Configurable via environment variables.

## Prerequisites
1. Python 3.8 or later.
2. Azure account with access to Media Services, Event Grid, and Service Bus.
3. Ensure you have necessary roles to send messages to a target Azure Service Bus (or Event Grid topic).
4. Set up environment variables by either:
   - Creating a `.env` file in the project root (use `.env.example` as a template)
   - Setting environment variables directly in your system

   Required variables:
   - `SUBSCRIPTION_ID`: Your Azure subscription ID.
   - `RESOURCE_GROUP_NAME`: The name of the resource group containing your media service account.
   - `ACCOUNT_NAME`: The name of your media service account.
   - `USE_EVENT_GRID`: Set to "true" to use Event Grid or "false" to use Service Bus (default: "true").

   Ravnur Media Services specific variables (required when USE_RAVNUR_MEDIA=true):
   - `RMS_AUTHORITY_URI`: The authority URI for Ravnur Media Services authentication.
   - `RMS_API_KEY`: Your API key for Ravnur Media Services.

   Service Bus specific variables (required when USE_EVENT_GRID=false):
   - `SERVICE_BUS_NAMESPACE`: The namespace of your Service Bus.
   - `SERVICE_BUS_QUEUE_NAME`: The name of the Service Bus queue.
  
Event Grid specific variables (required when USE_EVENT_GRID=true):
   - `EVENT_GRID_ENDPOINT`: The endpoint for your Event Grid topic.
   - `EVENT_GRID_KEY`: The access key for your Event Grid topic (optional if your account have neccessary permissions to target Event Grid Topic).

## Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ams-migration-demo/jobs-completion-notifier
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up your environment:
   ```bash
   cp .env.example .env  # Create a copy of the example file
   # Edit .env with your specific configuration values
   ```

## Usage
1. Prepare a CSV file with the following structure:
   ```csv
   Transform,Job
   Encode1080,job-123456-encode
   AudioAnalysis,job-234567-audio
   ```
   A sample `jobs.csv` file is included in the repository for testing purposes.

2. Run the script:
   ```bash
   # Using the default jobs.csv file:
   python notify.py

   # Or specify a custom CSV file:
   python notify.py /path/to/your/jobs.csv
   ```
