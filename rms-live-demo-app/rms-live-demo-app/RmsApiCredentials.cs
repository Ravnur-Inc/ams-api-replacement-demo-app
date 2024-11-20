using System.Text;

using Azure.Core;
using Newtonsoft.Json;

namespace rms_live_demo_app
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

            string _token = await authResponse.Content.ReadAsStringAsync();

            string tokenDataPart = _token[(_token.IndexOf('.') + 1)..];
            tokenDataPart = tokenDataPart[..tokenDataPart.IndexOf('.')];
            string tokenDataStr = Encoding.UTF8.GetString(Convert.FromBase64String(tokenDataPart.PadRight(4 * ((tokenDataPart.Length + 3) / 4), '=')));

            dynamic tokenData = JsonConvert.DeserializeObject<dynamic>(tokenDataStr);

            DateTime tokenValidTo = DateTime.UnixEpoch.AddSeconds((int)tokenData.exp);

            return new AccessToken(_token, tokenValidTo);
        }

        public class GetTokenRequest
        {
            public string? SubscriptionId { get; set; }

            public string? ApiKey { get; set; }
        }
    }
}
