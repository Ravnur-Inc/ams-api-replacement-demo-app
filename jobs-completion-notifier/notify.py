import csv
import json
import os
import logging
import uuid
import sys
from dotenv import load_dotenv
from azure.mgmt.media import AzureMediaServices
from azure.mgmt.media.models import (
    Job,
    JobOutput,
)
from azure.servicebus import ServiceBusClient, ServiceBusMessage, ServiceBusMessageBatch
from azure.eventgrid import EventGridPublisherClient, EventGridEvent
from azure.core.credentials import AzureKeyCredential
from azure.identity import DefaultAzureCredential
from datetime import datetime, UTC
# Import our custom RMS credentials
from RmsApiKeyCredentials import RmsApiKeyCredentials

# Load environment variables from .env file if it exists
load_dotenv()

# Custom JSON encoder to handle datetime objects
class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat() + "Z"
        # Add other custom serializations if needed
        return super().default(obj)

# Configure logging - Adjust log levels by logger name
# Set root logger to WARNING level to suppress most Azure SDK logs
logging.basicConfig(level=logging.WARNING)
# But set our script's logger to INFO level
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Disable verbose HTTP logging
logging.getLogger("azure.core.pipeline.policies.http_logging_policy").setLevel(logging.WARNING)

# Ravnur Media Services configuration
SUBSCRIPTION_ID = os.getenv("AZURE_SUBSCRIPTION_ID")
RESOURCE_GROUP_NAME = os.getenv("AZURE_RESOURCE_GROUP")
ACCOUNT_NAME = os.getenv("RAVNUR_MEDIA_SERVICES_ACCOUNT_NAME")
RMS_ENDPOINT_URI = os.getenv("RAVNUR_API_ENDPOINT")
RMS_API_KEY = os.getenv("RAVNUR_API_KEY")

USE_EVENT_GRID = os.getenv("USE_EVENT_GRID", "false").lower() == "true"
EVENT_GRID_ENDPOINT = os.getenv("EVENT_GRID_ENDPOINT")
EVENT_GRID_KEY = os.getenv("EVENT_GRID_KEY")
SERVICE_BUS_NAMESPACE = os.getenv("SERVICE_BUS_NAMESPACE")
SERVICE_BUS_QUEUE_NAME = os.getenv("SERVICE_BUS_QUEUE_NAME")

# Check required environment variables
required_env_vars = [
    ("SUBSCRIPTION_ID", SUBSCRIPTION_ID),
    ("RESOURCE_GROUP_NAME", RESOURCE_GROUP_NAME),
    ("ACCOUNT_NAME", ACCOUNT_NAME),
    ("RMS_AUTHORITY_URI", RMS_ENDPOINT_URI),
    ("RMS_API_KEY", RMS_API_KEY)
]

if any(value is None for _, value in required_env_vars):
    missing_vars = [name for name, value in required_env_vars if value is None]
    logger.error(f"Missing required environment variables: {', '.join(missing_vars)}")
    logger.error("Please set them in your environment or in a .env file")
    sys.exit(1)

# Initialize clients
media_client_credentials = RmsApiKeyCredentials(RMS_ENDPOINT_URI, SUBSCRIPTION_ID, RMS_API_KEY)
media_client = AzureMediaServices(media_client_credentials, SUBSCRIPTION_ID, base_url=RMS_ENDPOINT_URI)

default_credential = DefaultAzureCredential()

service_bus_client = None
event_grid_client = None
if USE_EVENT_GRID:
    # Initialize Event Grid client
    if not EVENT_GRID_ENDPOINT or not EVENT_GRID_KEY:
        logger.error("EVENT_GRID_ENDPOINT and EVENT_GRID_KEY are required when USE_EVENT_GRID is true")
        sys.exit(1)
    
    event_grid_client = EventGridPublisherClient(EVENT_GRID_ENDPOINT, AzureKeyCredential(EVENT_GRID_KEY))
else:
    # Initialize Service Bus client
    if not SERVICE_BUS_NAMESPACE or not SERVICE_BUS_QUEUE_NAME:
        logger.error("SERVICE_BUS_NAMESPACE and SERVICE_BUS_QUEUE_NAME are required when USE_EVENT_GRID is false")
        sys.exit(1)

    service_bus_client = ServiceBusClient(SERVICE_BUS_NAMESPACE, default_credential) 

status2previous_state = {
    "Finished": "Processing",
    "Canceled": "Cancelling",
    "Errored": "Processing",
}

def create_job_completed_event(job: Job, transform_name, status):
    event = {
            "id": str(uuid.uuid4()),
            "subject": f"transforms/{transform_name}/jobs/{job.name}",
            "eventType": f"Microsoft.Media.Job{status}",
            "eventTime": datetime.now(UTC).isoformat() + "Z",
            "dataVersion": "1.0",
            "metadataVersion": "1",
            "data": {
                "previousState": status2previous_state[status],
                "state": job.state,
                "outputs": [
                    {
                        "@odata.type": "#Microsoft.Media.JobOutputAsset",
                        "assetName": output.asset_name,
                        "error": None,
                        "label": output.label,
                        "progress": output.progress,
                        "state": output.state,
                    }
                    for output in job.outputs
                ]
            },
            "specversion": "1.0"
        }
    
    return event
    
def create_job_output_completed_event(job: Job, output: JobOutput, transform_name, status):
    event = {
            "id": str(uuid.uuid4()),
            "subject": f"transforms/{transform_name}/jobs/{job.name}",
            "eventType": f"Microsoft.Media.JobOutput{status}",
            "eventTime": datetime.now(UTC).isoformat() + "Z",
            "dataVersion": "1.0",
            "metadataVersion": "1",
            "data": {
                "previousState": status2previous_state[status],
                "state": output.state,
                "output": {
                    "@odata.type": "#Microsoft.Media.JobOutputAsset",
                    "assetName": output.asset_name,
                    "error": None,
                    "label": output.label,
                    "progress": output.progress,
                    "state": output.state,
                }
            },
            "specversion": "1.0"
        }
    
    return event
    
def send_event_grid_notification(events):
    """Send a notification to Azure Event Grid."""
    event_grid_client.send([
        EventGridEvent(
            data=event['data'],
            event_type=event['eventType'],
            subject=event['subject'],
            data_version=event['dataVersion'],
        ) for event in events])

def send_service_bus_message(events):
    """Send a message to Azure Service Bus."""
    with service_bus_client.get_queue_sender(SERVICE_BUS_QUEUE_NAME) as sender:
        batch_message = sender.create_message_batch()
        for event in events:
            message_json = json.dumps(event, cls=DateTimeEncoder)
            batch_message.add_message(ServiceBusMessage(message_json))
        
        sender.send_messages(batch_message)

def process_jobs(csv_file, use_event_grid=True):
    """Process jobs from a CSV file and send notifications."""
    events_batch = []
    rows_batch = []
    with open(csv_file, mode="r") as file:
        reader = csv.DictReader(file)
        events_batch_size = 100  # Number of events to send in a batch
        for row in reader:
            rows_batch.append(row)
            transform_name = row["Transform"]
            job_name = row["Job"]
        
            try:
                job = media_client.jobs.get(
                    RESOURCE_GROUP_NAME, ACCOUNT_NAME, transform_name, job_name
                )
            except Exception as e:
                logger.error(f"Failed to process job {job_name}: {e}")
                continue

            status = job.state
            if status in ["Finished", "Canceled", "Errored"]:
                output_events = [ create_job_output_completed_event(job, output, transform_name, status) for output in job.outputs ]
                event = create_job_completed_event(job, transform_name, status)
                events = output_events + [event]

                events_batch.extend(events)
                if len(events_batch) >= events_batch_size:
                    submit_batch(use_event_grid, events_batch, rows_batch)
                    events_batch = []
                    rows_batch = []

                logger.info(f"Processed job {transform_name}/{job_name} with status {status}")

    
    if events_batch:
        submit_batch(use_event_grid, events_batch, rows_batch)
        logger.info(f"Processed remaining {len(events_batch)} events in the batch")
            

def submit_batch(use_event_grid, events_batch, rows_batch):
    try:
        if use_event_grid:
            send_event_grid_notification(events_batch)
            logger.info(f"Sent {len(events_batch)} events to Event Grid")
        else:
            send_service_bus_message(events_batch)
            logger.info(f"Sent {len(events_batch)} events to Service Bus")
    except Exception as e:
        logger.error(f"Failed to send events: {e}")
        # Append failed events to a csv file for later processing
        log_failed_records(rows_batch)

def log_failed_records(rows_batch):
    if not rows_batch:
        return
    
    with open("failed_events.csv", mode="a") as failed_file:
        writer = csv.DictWriter(failed_file, fieldnames=rows_batch[0].keys())
        if os.stat("failed_events.csv").st_size == 0:
            writer.writeheader()
        for r in rows_batch:
            writer.writerow(r)

if __name__ == "__main__":
    # Check if CSV file is provided as command-line argument
    if len(sys.argv) > 1:
        csv_file_path = sys.argv[1]
    else:
        csv_file_path = "jobs.csv"  # Default CSV file path
    
    # Determine notification method (Event Grid or Service Bus)
    
    logger.info(f"Processing jobs from {csv_file_path}")
    logger.info(f"Sending notifications to {'Event Grid' if USE_EVENT_GRID else 'Service Bus'}")
    
    process_jobs(csv_file_path, use_event_grid=USE_EVENT_GRID)

    logger.info("Processing completed.")