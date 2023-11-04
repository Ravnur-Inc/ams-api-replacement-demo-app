using Azure.Storage.Blobs;
using Microsoft.Azure.Management.Media;
using Microsoft.Azure.Management.Media.Models;
using Microsoft.IdentityModel.Clients.ActiveDirectory;
using Microsoft.Rest;
using Microsoft.Rest.Azure.Authentication;
using Microsoft.Rest.Serialization;
using System.Net;
using VodCreatorApp.Configuration;

namespace VodCreatorApp
{
    public class VodProvider
    {
        private const string DefaultTestTransformName = "DefaultRmsTestTransform";
        private const string StreamingEndpointName = "default";
        private readonly AzureMediaServicesOptions _azureOptions;
        private readonly RmsOptions _rmsOptions;

        public VodProvider(RmsOptions rmsOptions, AzureMediaServicesOptions? azureOptions)
        {
            _azureOptions = azureOptions;
            _rmsOptions = rmsOptions;
        }

        public async Task CreateVod(string mediaServicesType, string inputFile, TransformOptions transformOptions)
        {
            // Create a new instance of the Media Services account
            AzureMediaServicesClient mediaService;
            string resourceGroupName;
            string accountName;
            if (mediaServicesType == "ams")
            {
                mediaService = await CreateAmsClient();
                resourceGroupName = _azureOptions!.ResourceGroupName;
                accountName = _azureOptions!.MediaServicesAccountName;
            }
            else if (mediaServicesType == "rms")
            {
                mediaService = CreateRmsClient();
                resourceGroupName = _rmsOptions.ResourceGroupName;
                accountName = _rmsOptions.MediaServicesAccountName;
            }
            else
            {
                throw new ArgumentException($"Invalid media service type: {mediaServicesType}");
            }

            await Run(mediaService, resourceGroupName, accountName, inputFile, transformOptions);
        }

        public async Task Run(AzureMediaServicesClient mediaService, string resourceGroupName, string accountName, string inputFile, TransformOptions transformOptions)
        {
            // Creating a unique suffix for this test run
            string unique = Guid.NewGuid().ToString()[..13];
            string inputAssetName = $"input-{unique}";
            string outputAssetName = $"output-{unique}";
            string jobName = $"job-{unique}";

            var transform = await CreateTransformAsync(mediaService, resourceGroupName, accountName, transformOptions);

            // Create input asset
            JobInput jobInput;
            if (IsUrl(inputFile))
            {
                jobInput = new JobInputHttp(files: new[] { inputFile });
            }
            else
            {
                // Create input asset
                var inputAsset = await CreateAsset(mediaService, resourceGroupName, accountName, inputAssetName);
                Console.WriteLine($"Input asset created: {inputAsset.Name} (container {inputAsset.Container})");

                // Upload video to asset
                Console.WriteLine();
                Console.WriteLine("Uploading video to input asset...");
                await UploadFileToAsset(mediaService, resourceGroupName, accountName, inputAssetName, inputFile);

                Console.WriteLine("Video upload completed!");

                jobInput = new JobInputAsset(assetName: inputAssetName);
            }

            // Create output asset
            List<string> outputAssets = new List<string>();
            if (transformOptions.ShareOutputAsset)
            {
                var outputAsset = await CreateAsset(mediaService, resourceGroupName, accountName, outputAssetName);
                Console.WriteLine();
                Console.WriteLine($"Output asset created: {outputAsset.Name} (container {outputAsset.Container})");

                foreach (var transformOutput in transform.Outputs)
                {
                    outputAssets.Add(outputAsset.Name);
                }
            }
            else
            {
                int outputAssetNumber = 1;
                foreach (var transformOutput in transform.Outputs)
                {
                    // Create output assets
                    var outputAsset = await CreateAsset(mediaService, resourceGroupName, accountName, $"output-{unique}-{outputAssetNumber++}");
                    Console.WriteLine();
                    Console.WriteLine($"Output asset created: {outputAsset.Name} (container {outputAsset.Container})");
                    outputAssets.Add(outputAsset.Name);
                }
            }

            // Create job
            var job = await SubmitJobAsync(
                mediaService,
                resourceGroupName,
                accountName,
                transform.Name,
                jobName,
                jobInput,
                outputAssets);
            Console.WriteLine();
            Console.WriteLine($"Job created: {job.Name}");

            // Track job progress
            job = await WaitForJobToFinishAsync(mediaService, resourceGroupName, accountName, transform.Name, jobName);

            if (job.State == JobState.Error)
            {
                Console.WriteLine($"ERROR: Encoding job has failed {job.Outputs.First().Error.Message}");
                return;
            }

            Console.WriteLine($"Job finished: {job.Name}");

            var streamingEndpoint = await mediaService.StreamingEndpoints.GetAsync(resourceGroupName, accountName, StreamingEndpointName);

            if (streamingEndpoint.ResourceState != StreamingEndpointResourceState.Running)
            {
                await mediaService.StreamingEndpoints.StartAsync(resourceGroupName, accountName, StreamingEndpointName);
            }

            List<ListPathsResponse> pathsResponses = new List<ListPathsResponse>();
            foreach (var outputAsset in outputAssets.Distinct())
            {
                string locatorName = outputAsset.Replace("output-", "locator-");

                // Create streaming locator
                var locator = await CreateStreamingLocatorAsync(mediaService, resourceGroupName, accountName, outputAsset, locatorName);
                Console.WriteLine();
                Console.WriteLine($"Streaming locator created: {locator.Name}");

                var paths = await mediaService.StreamingLocators.ListPathsAsync(resourceGroupName, accountName, locatorName);
                pathsResponses.Add(paths);
            }

            // List url for streaming locator
            Console.WriteLine();
            Console.WriteLine("The following URLs are available for adaptive streaming:");
            foreach (var paths in pathsResponses)
            {
                // All paths returned can be streamed when append it to steaming endpoint or CDN domain name
                foreach (var path in paths.StreamingPaths)
                {
                    foreach (string streamingFormatPath in path.Paths)
                    {
                        var streamingUrl = $"https://{streamingEndpoint.HostName}{streamingFormatPath}";
                        Console.WriteLine($"{path.StreamingProtocol}: {streamingUrl}");
                    }
                }

                Console.WriteLine();
            }

            Console.WriteLine();
            Console.WriteLine("The following URLs are available for downloads:");
            foreach (var paths in pathsResponses)
            {
                // All paths returned can be streamed when append it to steaming endpoint or CDN domain name
                foreach (string path in paths.DownloadPaths)
                {
                    var streamingUrl = $"https://{streamingEndpoint.HostName}{path}";
                    Console.WriteLine(streamingUrl);
                }

                Console.WriteLine();
            }
        }

        private async Task<AzureMediaServicesClient> CreateAmsClient()
        {
            ClientCredential clientCredential = new ClientCredential(_azureOptions.ClientId, _azureOptions.ClientSecret);
            ServiceClientCredentials serviceClientCredentials =
                await ApplicationTokenProvider.LoginSilentAsync(
                    _azureOptions.AadTenantId,
                    clientCredential,
                    ActiveDirectoryServiceSettings.Azure);
            var client = new HttpClient();
            client.BaseAddress = new Uri(_azureOptions.ApiEndpoint);

            return new AzureMediaServicesClient(serviceClientCredentials, client, true)
            {
                SubscriptionId = _azureOptions!.SubscriptionId
            };
        }

        private AzureMediaServicesClient CreateRmsClient()
        {
            var serviceClientCredentials = new RmsApiKeyCredentials(
                new Uri(_rmsOptions.ApiEndpoint),
                _rmsOptions.SubscriptionId,
                _rmsOptions.ApiKey);

            return new AzureMediaServicesClient(serviceClientCredentials, new HttpClient(), true)
            {
                SubscriptionId = _rmsOptions!.SubscriptionId
            };
        }

        private static Task<StreamingLocator> CreateStreamingLocatorAsync(
            AzureMediaServicesClient mediaService,
            string resourceGroupName,
            string accountName,
            string assetName,
            string locatorName)
        {
            return mediaService.StreamingLocators.CreateAsync(
                resourceGroupName,
                accountName,
                locatorName,
                new StreamingLocator
                {
                    AssetName = assetName,
                    StreamingPolicyName = "Predefined_DownloadAndClearStreaming",
                });
        }

        private static async Task<Job> WaitForJobToFinishAsync(AzureMediaServicesClient mediaService, string resourceGroup, string accountName, string transformName, string jobName)
        {
            var sleepInterval = TimeSpan.FromSeconds(10);
            JobState? state;
            int progress = 0;

            Job job;
            do
            {
                job = await mediaService.Jobs.GetAsync(resourceGroup, accountName, transformName, jobName);
                state = job?.State;
                progress = job?.Outputs.FirstOrDefault()?.Progress ?? 0;

                Console.WriteLine($"Job state: {state}, progress: {progress}");
                if (state != JobState.Finished && state != JobState.Error && state != JobState.Canceled)
                {
                    await Task.Delay(sleepInterval);
                }
            }
            while (state != JobState.Finished && state != JobState.Error && state != JobState.Canceled);

            return job;
        }

        private static async Task<Job> SubmitJobAsync(
            AzureMediaServicesClient mediaService,
            string resourceGroupName,
            string accountName,
            string transformName,
            string jobName,
            JobInput input,
            IEnumerable<string> outputAssets)
        {
            var jobParameters = new Job
            {
                Input = input,
                Outputs = new List<JobOutput>(),
            };

            foreach (var outputAsset in outputAssets)
            {
                jobParameters.Outputs.Add(new JobOutputAsset(outputAsset));
            }

            var job = await mediaService.Jobs.CreateAsync(
                resourceGroupName,
                accountName,
                transformName,
                jobName,
                jobParameters);

            return job;
        }

        private static async Task UploadFileToAsset(
            AzureMediaServicesClient mediaService,
            string resourceGroupName,
            string accountName,
            string assetName,
            string fileName)
        {
            var sasUriCollection = await mediaService.Assets.ListContainerSasAsync(
                resourceGroupName,
                accountName,
                assetName,
                AssetContainerPermission.ReadWrite,
                DateTime.UtcNow.AddHours(1));

            var container = new BlobContainerClient(new Uri(sasUriCollection.AssetContainerSasUrls.First()));
            BlobClient blob = container.GetBlobClient(Path.GetFileName(fileName));

            await blob.UploadAsync(fileName);
        }

        private static async Task<Asset> CreateAsset(
            AzureMediaServicesClient mediaService,
            string resourceGroupName,
            string accountName,
            string assetName)
        {
            var asset = await mediaService.Assets.CreateOrUpdateAsync(
                resourceGroupName,
                accountName,
                assetName,
                new Asset());

            return asset;
        }

        private static async Task<Transform> CreateTransformAsync(
            AzureMediaServicesClient mediaService,
            string resourceGroupName,
            string accountName,
            TransformOptions transformOptions)
        {
            if (transformOptions.Name == null && transformOptions.OutputsJsonFile == null)
            {
                Console.WriteLine("Using default transform");

                var outputs = new List<TransformOutput>
                {
                    new TransformOutput(new BuiltInStandardEncoderPreset(EncoderNamedPreset.AdaptiveStreaming)),
                    new TransformOutput
                    {
                        Preset = new StandardEncoderPreset
                        {
                            Codecs = new List<Codec>
                            {
                                new AacAudio
                                {
                                    Channels = 2,
                                    SamplingRate = 48000,
                                    Bitrate = 128000,
                                    Profile = AacAudioProfile.AacLc,
                                },
                                new H264Video()
                                {
                                    KeyFrameInterval = TimeSpan.FromSeconds(2),
                                    Layers = new List<H264Layer>
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
                                    Layers = new List<JpgLayer>
                                    {
                                        new JpgLayer
                                        {
                                            Width = "50%",
                                            Height = "50%",
                                        },
                                    },
                                },
                            },
                            Formats = new List<Format>
                            {
                                new Mp4Format(filenamePattern: "Video-{Basename}-{Label}-{Bitrate}{Extension}"),
                                new JpgFormat(filenamePattern: "Thumbnail-{Basename}-{Index}{Extension}"),
                            },
                            Filters = new Filters
                            {
                                Crop = new Rectangle
                                {
                                    Left = "10%",
                                    Top = "10%",
                                    Height = "50%",
                                    Width = "50%",
                                },
                            },
                        },
                    }
                };

                return await mediaService.Transforms.CreateOrUpdateAsync(
                    resourceGroupName,
                    accountName,
                    DefaultTestTransformName,
                    outputs,
                    "Custom encoding transforms with multiple outputs.");
            }
            else if (transformOptions.OutputsJsonFile != null)
            {
                _ = transformOptions.Name ?? throw new ArgumentException("Transform name is required when using OutputsJsonFile");
                Transform? existingTransform = await GetTransform(mediaService, resourceGroupName, accountName, transformOptions.Name);
                if (existingTransform != null)
                {
                    Console.WriteLine($"Transform {transformOptions.Name} already exists. Do you want to change it (y/n)?");
                    if (Console.ReadKey().Key != ConsoleKey.Y)
                    {
                        return existingTransform;
                    }
                }

                if (!File.Exists(transformOptions.OutputsJsonFile))
                {
                    throw new ArgumentException($"Transform file not found: {transformOptions.OutputsJsonFile}");
                }

                List<TransformOutput>? outputs = SafeJsonConvert.DeserializeObject<List<TransformOutput>>(File.ReadAllText(transformOptions.OutputsJsonFile), mediaService.DeserializationSettings);
                if (outputs == null)
                {
                    throw new ArgumentException($"Invalid transform file: {transformOptions.OutputsJsonFile}");
                }

                return await mediaService.Transforms.CreateOrUpdateAsync(
                    resourceGroupName,
                    accountName,
                    transformOptions.Name,
                    outputs,
                    $"Custom encoding transofrm created from file {transformOptions.OutputsJsonFile}");
            }
            else
            {
                _ = transformOptions.Name ?? throw new ArgumentException("Transform name is required when using OutputsJsonFile");
                var transform = await GetTransform(mediaService, resourceGroupName, accountName, transformOptions.Name);
                if (transform == null)
                {
                    throw new ArgumentException($"Transform not found: {transformOptions.Name}");
                }

                return transform;
            }
        }

        private static async Task<Transform?> GetTransform(AzureMediaServicesClient mediaService, string resourceGroupName, string accountName, string transformName)
        {
            try
            {
                var x = await mediaService.Transforms.GetWithHttpMessagesAsync(resourceGroupName, accountName, transformName);
                return await mediaService.Transforms.GetAsync(resourceGroupName, accountName, transformName);
            }
            catch (ErrorResponseException ex) when (ex.Response.StatusCode == HttpStatusCode.NotFound)
            {
                return null;
            }
        }

        private static bool IsUrl(string path) => Uri.TryCreate(path, UriKind.Absolute, out Uri? uri) && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
    }
}
