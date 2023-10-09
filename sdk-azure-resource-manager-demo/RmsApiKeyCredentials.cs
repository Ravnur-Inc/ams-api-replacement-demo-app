using System.Text;

using Azure.Core;
using Newtonsoft.Json;

namespace VodCreatorApp
{
    public class RmsApiKeyCredentials : TokenCredential
    {
        private readonly Uri _authorityUri;
        private readonly string? _subscriptionId;
        private readonly string? _apiKey;

        public RmsApiKeyCredentials(Uri authorityUri, string subscriptionId, string apiKey)
        {
            if (authorityUri.AbsolutePath != "/auth/token")
            {
                authorityUri = new Uri(authorityUri, "/auth/token");
            }
            _authorityUri = authorityUri;
            _subscriptionId = subscriptionId;
            _apiKey = apiKey;
        }

        public override AccessToken GetToken(TokenRequestContext requestContext, CancellationToken cancellationToken)
        {
            return GetAccessToken(requestContext, cancellationToken).GetAwaiter().GetResult();
        }

        public override ValueTask<AccessToken> GetTokenAsync(TokenRequestContext requestContext, CancellationToken cancellationToken)
        {
            return GetAccessToken(requestContext, cancellationToken);
        }

        private async ValueTask<AccessToken> GetAccessToken(TokenRequestContext requestContext, CancellationToken cancellationToken)
        {
            using HttpClient httpClient = new HttpClient();

            var tokenRequest = new GetTokenRequest
            {
                SubscriptionId = _subscriptionId,
                ApiKey = _apiKey,
            };

            var authContent = new StringContent(JsonConvert.SerializeObject(tokenRequest), Encoding.UTF8, "application/json");
            HttpResponseMessage authResponse = await httpClient.PostAsync(_authorityUri, authContent, cancellationToken);

            authResponse.EnsureSuccessStatusCode();

            string token = await authResponse.Content.ReadAsStringAsync();
            return new AccessToken(token, DateTime.UtcNow.AddDays(1));
        }

        public class GetTokenRequest
        {
            public string? SubscriptionId { get; set; }

            public string? ApiKey { get; set; }
        }
    }
}
