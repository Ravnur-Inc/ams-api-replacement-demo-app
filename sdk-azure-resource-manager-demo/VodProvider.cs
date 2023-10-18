using Azure;
using Azure.Identity;
using Azure.ResourceManager;
using Azure.ResourceManager.Media;
using Azure.ResourceManager.Media.Models;
using Azure.Storage.Blobs;
using System.Configuration;
using VodCreatorApp.Configuration;

namespace VodCreatorApp
{
    public class VodProvider
    {
        //private const string InputMP4File = "media\\ignite.mp4";
        private const string TransformName = "Default";
        private const string StreamingEndpointName = "default";
        private readonly AzureOptions? _azureOptions;
        private readonly RmsOptions _rmsOptions;

        public VodProvider(RmsOptions rmsOptions, AzureOptions? azureOptions)
        {
            _azureOptions = azureOptions;
            _rmsOptions = rmsOptions;
        }

        public async Task CreateVod(string mediaServicesType, string inputFile)
        {
            // Create a new instance of the Media Services account
            MediaServicesAccountResource mediaService;
            if (mediaServicesType == "ams")
            {
                mediaService = CreateAmsClient();
                // In RMS transform write opeartion are not supported yet
                await CreateTransformAsync(mediaService, TransformName);
            }
            else if (mediaServicesType == "rms")
            {
                mediaService = CreateRmsClient();
            }
            else
            {
                throw new ArgumentException($"Invalid media service type: {mediaServicesType}");
            }

            await Run(mediaService, inputFile);
        }

        public async Task Run(MediaServicesAccountResource mediaService, string inputFile)
        {
            // Creating a unique suffix for this test run
            string unique = Guid.NewGuid().ToString()[..13];
            string inputAssetName = $"input-{unique}";
            string outputAssetName = $"output-{unique}";
            string jobName = $"job-{unique}";
            string locatorName = $"locator-{unique}";

            // Get transform
            var transform = await mediaService.GetMediaTransforms().GetAsync(TransformName);

            // Create input asset
            var inputAsset = await CreateAsset(mediaService, inputAssetName);
            Console.WriteLine($"Input asset created: {inputAsset.Data.Name}");

            // Upload video to asset
            Console.WriteLine();
            Console.WriteLine("Uploading video to input asset...");
            await UploadFileToAsset(mediaService, inputAssetName, inputFile);
            Console.WriteLine("Video upload completed!");

            // Create output asset
            var outputAsset = await CreateAsset(mediaService, outputAssetName);
            Console.WriteLine();
            Console.WriteLine($"Output asset created: {outputAsset.Data.Name}");

            // Create job
            var job = await SubmitJobAsync(transform, jobName, inputAsset, outputAsset);
            Console.WriteLine();
            Console.WriteLine($"Job created: {job.Data.Name}");

            // Track job progress
            job = await WaitForJobToFinishAsync(job);

            if (job.Data.State == MediaJobState.Error)
            {
                Console.WriteLine($"ERROR: Encoding job has failed {job.Data.Outputs.First().Error.Message}");
                return;
            }

            Console.WriteLine($"Job finished: {job.Data.Name}");

            // Create streaming locator
            await CreateStreamingLocatorAsync(mediaService, outputAsset.Data.Name, locatorName);
            Console.WriteLine();
            Console.WriteLine($"Streaming locator created: {locatorName}");
            var streamingEndpoint = (await mediaService.GetStreamingEndpoints().GetAsync(StreamingEndpointName)).Value;

            if (streamingEndpoint.Data.ResourceState != StreamingEndpointResourceState.Running)
            {
                await streamingEndpoint.StartAsync(WaitUntil.Completed);
            }

            // List streaming locator for asset
            var streamingLocator = (await mediaService.GetStreamingLocators().GetAsync(locatorName)).Value;

            // List url for streaming locator
            var paths = await streamingLocator.GetStreamingPathsAsync();

            var streamingUrls = new List<string>();

            Console.WriteLine();
            Console.WriteLine("The following URLs are available for adaptive streaming:");
            // All paths returned can be streamed when append it to steaming endpoint or CDN domain name
            foreach (StreamingPath path in paths.Value.StreamingPaths)
            {
                foreach (string streamingFormatPath in path.Paths)
                {
                    var streamingUrl = $"https://{streamingEndpoint.Data.HostName}{streamingFormatPath}";
                    Console.WriteLine($"{path.StreamingProtocol}: {streamingUrl}");
                    streamingUrls.Add(streamingUrl);
                }
            }

            Console.WriteLine();
            Console.WriteLine("The following URLs are available for downloads:");
            // All paths returned can be streamed when append it to steaming endpoint or CDN domain name
            foreach (string path in paths.Value.DownloadPaths)
            {
                var streamingUrl = $"https://{streamingEndpoint.Data.HostName}{path}";
                Console.WriteLine(streamingUrl);
                streamingUrls.Add(streamingUrl);
            }
        }

        private MediaServicesAccountResource CreateAmsClient()
        {
            ArmClient armClient = new ArmClient(new DefaultAzureCredential());

            var mediaServicesAccountIdentifier = MediaServicesAccountResource.CreateResourceIdentifier(
                _azureOptions!.SubscriptionId,
                _azureOptions.ResourceGroupName,
                _azureOptions.MediaServicesAccountName);

            return armClient.GetMediaServicesAccountResource(mediaServicesAccountIdentifier);
        }

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

        private static async Task<StreamingLocatorResource> CreateStreamingLocatorAsync(
            MediaServicesAccountResource mediaService,
            string assetName,
            string locatorName)
        {
            var locator = await mediaService.GetStreamingLocators().CreateOrUpdateAsync(
                WaitUntil.Completed,
                locatorName,
                new StreamingLocatorData
                {
                    AssetName = assetName,
                    StreamingPolicyName = "Predefined_DownloadAndClearStreaming",
                });

            return locator.Value;
        }

        private static async Task<MediaJobResource> WaitForJobToFinishAsync(MediaJobResource job)
        {
            var sleepInterval = TimeSpan.FromSeconds(10);
            MediaJobState? state;
            int progress = 0;

            do
            {
                job = await job.GetAsync();
                state = job.Data.State.GetValueOrDefault();
                progress = job.Data.Outputs.FirstOrDefault()?.Progress ?? 0;

                Console.WriteLine($"Job state: {state}, progress: {progress}");
                if (state != MediaJobState.Finished && state != MediaJobState.Error && state != MediaJobState.Canceled)
                {
                    await Task.Delay(sleepInterval);
                }
            }
            while (state != MediaJobState.Finished && state != MediaJobState.Error && state != MediaJobState.Canceled);

            return job;
        }

        private static async Task<MediaJobResource> SubmitJobAsync(
            MediaTransformResource transform,
            string jobName,
            MediaAssetResource inputAsset,
            MediaAssetResource outputAsset)
        {
            var job = await transform.GetMediaJobs().CreateOrUpdateAsync(
                WaitUntil.Completed,
                jobName,
                new MediaJobData
                {
                    Input = new MediaJobInputAsset(assetName: inputAsset.Data.Name),
                    Outputs =
                    {
                        new MediaJobOutputAsset(outputAsset.Data.Name),
                    },
                });

            return job.Value;
        }

        private static async Task<MediaAssetResource> UploadFileToAsset(
            MediaServicesAccountResource mediaService,
            string assetName,
            string fileName)
        {
            Response<MediaAssetResource> asset = await mediaService.GetMediaAssets().GetAsync(assetName);

            var sasUriCollection = asset.Value.GetStorageContainerUrisAsync(
                new MediaAssetStorageContainerSasContent
                {
                    Permissions = MediaAssetContainerPermission.ReadWrite,
                    ExpireOn = DateTime.UtcNow.AddHours(1),
                });

            var sasUri = await sasUriCollection.FirstOrDefaultAsync();

            var container = new BlobContainerClient(sasUri);
            BlobClient blob = container.GetBlobClient(Path.GetFileName(fileName));

            await blob.UploadAsync(fileName);

            return asset;
        }

        private static async Task<MediaAssetResource> CreateAsset(
            MediaServicesAccountResource mediaService,
            string assetName)
        {
            var asset = await mediaService.GetMediaAssets().CreateOrUpdateAsync(
                WaitUntil.Completed,
                assetName,
                new MediaAssetData());

            return asset.Value;
        }

        private static async Task<MediaTransformResource> CreateTransformAsync(
            MediaServicesAccountResource mediaServicesAccount,
            string transformName)
        {
            var codecs = new MediaCodecBase[]
            {
                new AacAudio
                {
                    Channels = 2,
                    SamplingRate = 48000,
                    Bitrate = 128000,
                    Profile = AacAudioProfile.AacLc,
                },
                new H264Video
                {
                    KeyFrameInterval = TimeSpan.FromSeconds(2),
                    Layers =
                    {
                        new H264Layer(bitrate: 3600000)
                        {
                            Width = "1280",
                            Height = "720",
                            Label = "HD-3600kbps",
                        },
                        new H264Layer(bitrate: 1600000)
                        {
                            Width = "960",
                            Height = "540",
                            Label = "SD-1600kbps",
                        },
                        new H264Layer(bitrate: 600000)
                        {
                            Width = "640",
                            Height = "360",
                            Label = "SD-600kbps",
                        },
                    },
                },
                new JpgImage(start: "25%")
                {
                    Start = "25%",
                    Step = "25%",
                    Range = "80%",
                    Layers =
                    {
                        new JpgLayer
                        {
                            Width = "50%",
                            Height = "50%",
                        },
                    },
                },
            };

            var formats = new MediaFormatBase[]
            {
                new Mp4Format(filenamePattern: "Video-{Basename}-{Label}-{Bitrate}{Extension}"),
                new JpgFormat(filenamePattern: "Thumbnail-{Basename}-{Index}{Extension}"),
            };

            var mediaTransformOutput = new MediaTransformOutput(new StandardEncoderPreset(codecs, formats))
            {
                OnError = MediaTransformOnErrorType.StopProcessingJob,
                RelativePriority = MediaJobPriority.Normal,
            };

            var transform = await mediaServicesAccount.GetMediaTransforms().CreateOrUpdateAsync(
                WaitUntil.Completed,
                transformName,
                new MediaTransformData
                {
                    Outputs =
                    {
                        mediaTransformOutput,
                    },
                    Description = "A simple custom encoding transform with 3 MP4 bitrates",
                });

            return transform.Value;
        }
    }
}
