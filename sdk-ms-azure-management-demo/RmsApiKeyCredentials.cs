using Microsoft.Rest;
using Newtonsoft.Json;
using System.Text;

namespace VodCreatorApp
{
    public class RmsApiKeyCredentials : ServiceClientCredentials
    {
        private readonly Uri _apiEndpoint;
        private readonly Uri _authorityUri;
        private readonly string? _subscriptionId;
        private readonly string? _apiKey;
        private readonly TimeSpan _tokenRefreshPeriod;
        private DateTime tokenValidTo = DateTime.MinValue;

        private string _token = string.Empty;

        public RmsApiKeyCredentials(Uri apiEndpoint, string subscriptionId, string apiKey, TimeSpan? tokenRefreshPeriod = null)
        {
            _apiEndpoint = apiEndpoint;
            var authorityUri = new Uri(_apiEndpoint, "/auth/token");
            _authorityUri = authorityUri;
            _subscriptionId = subscriptionId;
            _apiKey = apiKey;
            _tokenRefreshPeriod = tokenRefreshPeriod ?? TimeSpan.FromDays(1);
        }

        public override async Task ProcessHttpRequestAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            if (DateTime.UtcNow > tokenValidTo)
            {
                var tokenRequest = new GetTokenRequest
                {
                    SubscriptionId = _subscriptionId,
                    ApiKey = _apiKey,
                };

                var authContent = new StringContent(JsonConvert.SerializeObject(tokenRequest), Encoding.UTF8, "application/json");
                var authResponse = await new HttpClient().PostAsync(_authorityUri, authContent, cancellationToken);

                authResponse.EnsureSuccessStatusCode();

                _token = await authResponse.Content.ReadAsStringAsync();
                tokenValidTo = DateTime.UtcNow + _tokenRefreshPeriod;
            }

            request.Headers.Add("Authorization", $"Bearer {_token}");
            request.RequestUri = new Uri(_apiEndpoint, request.RequestUri.PathAndQuery);
            await base.ProcessHttpRequestAsync(request, cancellationToken);
        }
    }

    public class GetTokenRequest
    {
        public string? SubscriptionId { get; set; }

        public string? ApiKey { get; set; }
    }
}
