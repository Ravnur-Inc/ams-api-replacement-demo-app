using Azure.Storage.Blobs;

using Microsoft.Azure.Management.Media;
using Microsoft.Azure.Management.Media.Models;
using Microsoft.IdentityModel.Clients.ActiveDirectory;
using Microsoft.Rest;
using Microsoft.Rest.Azure.Authentication;

using VodCreatorApp.Configuration;

using Jose;

namespace VodCreatorApp
{
    public class VodProvider
    {
        private const string TransformName = "RmsTestTransform2";
        private const string StreamingEndpointName = "default";
        private const string LogoMaskLabel = "logoMask";
        private readonly AzureMediaServicesOptions _azureOptions;
        private readonly RmsOptions _rmsOptions;

        public VodProvider(RmsOptions rmsOptions, AzureMediaServicesOptions? azureOptions)
        {
            _azureOptions = azureOptions;
            _rmsOptions = rmsOptions;
        }

        public async Task CreateVod(string mediaServicesType, string inputFile)
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

            try
            {
                await Run(mediaService, resourceGroupName, accountName, inputFile);
            }
            catch (Exception e)
            {
                Console.WriteLine("Exception when calling API: {0}", e.Message);
            }
        }

        public async Task Run(AzureMediaServicesClient mediaService, string resourceGroupName, string accountName, string inputFile)
        {
            // Creating a unique suffix for this test run
            string unique = Guid.NewGuid().ToString()[..13];
            string inputAssetName = $"input-{unique}";
            string overlayInputAssetName = $"input-overlay-{unique}";
            string outputAssetName = $"output-{unique}";
            string jobName = $"job-{unique}";
            string locatorName = $"locator-{unique}";
            string aes128locatorName = $"locator-{unique}-aes";
            string contentKeyPolicyName = $"aeskeypolicy-{unique}";

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

                // Create overlay input asset
                var overlayInputAsset = await CreateAsset(mediaService, resourceGroupName, accountName, overlayInputAssetName);
                Console.WriteLine($"Input asset created: {overlayInputAsset.Name} (container {overlayInputAsset.Container})");

                // Upload video to asset
                Console.WriteLine();
                Console.WriteLine("Uploading video to input asset...");
                await UploadFileToAsset(mediaService, resourceGroupName, accountName, inputAssetName, inputFile);

                Console.WriteLine("Uploading overlay file to input asset...");
                await UploadFileToAsset(mediaService, resourceGroupName, accountName, overlayInputAssetName, "DefaultInput/tests.png");

                Console.WriteLine("Video upload completed!");
                var jobInputs = new List<JobInput> { new JobInputAsset(inputAsset.Name), new JobInputAsset(overlayInputAsset.Name, label: LogoMaskLabel) };
                jobInput = new JobInputs() { Inputs = jobInputs };
            }

            // Create output assets
            var outputAsset = await CreateAsset(mediaService, resourceGroupName, accountName, outputAssetName);
            Console.WriteLine();
            Console.WriteLine($"Output asset created: {outputAsset.Name} (container {outputAsset.Container})");

            var transform = await CreateTransformAsync(mediaService, resourceGroupName, accountName, TransformName);

            // Create job
            var job = await SubmitJobAsync(
                mediaService,
                resourceGroupName,
                accountName,
                transform.Name,
                jobName,
                jobInput,
                outputAsset.Name);
            Console.WriteLine();
            Console.WriteLine($"Job created: {job.Name}");

            // Track job progress
            job = await WaitForJobToFinishAsync(mediaService, resourceGroupName, accountName, TransformName, jobName);

            if (job.State == JobState.Error)
            {
                Console.WriteLine($"ERROR: Encoding job has failed {job.Outputs.First().Error.Message}");
                return;
            }

            Console.WriteLine($"Job finished: {job.Name}");

            // Create streaming locator
            await CreateStreamingLocatorAsync(mediaService, resourceGroupName, accountName, outputAsset.Name, locatorName);
            Console.WriteLine();
            Console.WriteLine($"Streaming locator created: {locatorName}");
            var streamingEndpoint = await mediaService.StreamingEndpoints.GetAsync(resourceGroupName, accountName, StreamingEndpointName);

            if (streamingEndpoint.ResourceState != StreamingEndpointResourceState.Running)
            {
                await mediaService.StreamingEndpoints.StartAsync(resourceGroupName, accountName, StreamingEndpointName);
            }

            // List streaming locator for asset
            var streamingLocator = await mediaService.StreamingLocators.GetAsync(resourceGroupName, accountName, locatorName);

            // List url for streaming locator
            var paths = await mediaService.StreamingLocators.ListPathsAsync(resourceGroupName, accountName, locatorName);

            var streamingUrls = new List<string>();

            Console.WriteLine();
            Console.WriteLine("The following URLs are available for adaptive streaming:");
            // All paths returned can be streamed when append it to steaming endpoint or CDN domain name
            foreach (StreamingPath path in paths.StreamingPaths)
            {
                foreach (string streamingFormatPath in path.Paths)
                {
                    var streamingUrl = $"https://{streamingEndpoint.HostName}{streamingFormatPath}";
                    Console.WriteLine($"{path.StreamingProtocol}: {streamingUrl}");
                    streamingUrls.Add(streamingUrl);
                }
            }

            Console.WriteLine();
            Console.WriteLine("The following URLs are available for downloads:");
            // All paths returned can be streamed when append it to steaming endpoint or CDN domain name
            foreach (string path in paths.DownloadPaths)
            {
                var streamingUrl = $"https://{streamingEndpoint.HostName}{path}";
                Console.WriteLine(streamingUrl);
                streamingUrls.Add(streamingUrl);
            }

            // Prepearing AES-128 encrypted HLS stream
            string issuer = "ravnur";
            string audience = "rmstest";
            // Create Content Key Policy for AES-128 encryption
            var contentKeyPolicy = await CreateContentKeyPolicyAsync(mediaService, resourceGroupName, accountName, contentKeyPolicyName, issuer, audience);
            // Create Streaming Locator with Content Key Policy
            var aesLocator = await CreateAES128StreamingLocatorAsync(mediaService, resourceGroupName, accountName, outputAsset.Name, aes128locatorName, contentKeyPolicy.Name);
            // List url for encrypted streaming
            var aesPaths = await mediaService.StreamingLocators.ListPathsAsync(resourceGroupName, accountName, aes128locatorName);

            Console.WriteLine();
            Console.WriteLine("The following URL is available for adaptive streaming with AES-128 encryption:");
            foreach (StreamingPath path in aesPaths.StreamingPaths)
            {
                foreach (string streamingFormatPath in path.Paths)
                {
                    var streamingUrl = $"https://{streamingEndpoint.HostName}{streamingFormatPath}";
                    Console.WriteLine($"{path.StreamingProtocol}: {streamingUrl}");
                    streamingUrls.Add(streamingUrl);
                }
            }

            // Generate test token for AES-128 encryption
            ContentKeyPolicyTokenRestriction restriction = (ContentKeyPolicyTokenRestriction)contentKeyPolicy.Options.First().Restriction;
            ContentKeyPolicySymmetricTokenKey tokenKey = (ContentKeyPolicySymmetricTokenKey)restriction.PrimaryVerificationKey;
            var token = JWT.Encode(new Dictionary<string, object>
                {
                    { "exp", DateTimeOffset.UtcNow.AddHours(6).ToUnixTimeSeconds() },
                    { "nbf", DateTimeOffset.UtcNow.ToUnixTimeSeconds() },
                    { "iss", issuer },
                    { "aud", audience }
                },
                tokenKey.KeyValue,
                JwsAlgorithm.HS256);
            Console.WriteLine($"Token for encrypted playback (valid for 6hrs): {token}");
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

        private static Task<StreamingLocator> CreateAES128StreamingLocatorAsync(
            AzureMediaServicesClient mediaService,
            string resourceGroupName,
            string accountName,
            string assetName,
            string locatorName,
            string contentKeyPolicyName)
        {
            return mediaService.StreamingLocators.CreateAsync(
                resourceGroupName,
                accountName,
                locatorName,
                new StreamingLocator
                {
                    AssetName = assetName,
                    StreamingPolicyName = "Predefined_ClearKey",
                    DefaultContentKeyPolicyName = contentKeyPolicyName,
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
            string outputAssetName)
        {
            var jobParameters = new Job
            {
                Input = input,
                Outputs = new List<JobOutput>()
                {
                    new JobOutputAsset(outputAssetName),
                },
            };

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

        private async Task<ContentKeyPolicy> CreateContentKeyPolicyAsync(
            AzureMediaServicesClient mediaService,
            string resourceGroupName,
            string accountName,
            string policyName,
            string issuer,
            string audience)
        {
            var options = new ContentKeyPolicyOption[]
            {
                new ContentKeyPolicyOption(
                    name: "ae128-option",
                    configuration: new ContentKeyPolicyClearKeyConfiguration(),
                    restriction: new ContentKeyPolicyTokenRestriction(
                        issuer: issuer,
                        audience: audience,
                        primaryVerificationKey: new ContentKeyPolicySymmetricTokenKey(Guid.NewGuid().ToByteArray()),
                        restrictionTokenType: ContentKeyPolicyRestrictionTokenType.Jwt)
                )
            };

            return await mediaService.ContentKeyPolicies.CreateOrUpdateAsync(resourceGroupName, accountName, policyName, options, "test policy description");
        }

        private static async Task<Transform> CreateTransformAsync(
            AzureMediaServicesClient mediaService,
            string resourceGroupName,
            string accountName,
            string transformName)
        {
            var outputs = new List<TransformOutput>
            {
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
                            Overlays = new List<Overlay>
                            {
                                new VideoOverlay(LogoMaskLabel)
                                {
                                    Start = TimeSpan.FromSeconds(3),
                                    End = TimeSpan.FromSeconds(10),
                                    Position = new Rectangle (left:"75%", top:"75%", width:"25%", height: "25%"),
                                    FadeInDuration = TimeSpan.FromSeconds(2),
                                }
                            }
                        }
                    },
                }
            };

            var transform = await mediaService.Transforms.CreateOrUpdateAsync(
                resourceGroupName,
                accountName,
                transformName,
                outputs,
                "A simple custom encoding transforms.");

            return transform;
        }

        private static bool IsUrl(string path) => Uri.TryCreate(path, UriKind.Absolute, out Uri? uri) && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
    }
}
