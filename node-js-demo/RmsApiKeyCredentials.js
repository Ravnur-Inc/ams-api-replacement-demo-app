const fetch = require('node-fetch');

class RmsApiKeyCredentials {
  constructor(authorityUri, subscriptionId, apiKey) {
    if (!authorityUri.endsWith('/auth/token')) {
      authorityUri += '/auth/token';
    }

    this.authorityUri = authorityUri;
    this.subscriptionId = subscriptionId;
    this.apiKey = apiKey;
  }

  async getToken(scopes, options) {
    const tokenRequest = {
      subscriptionId: this.subscriptionId,
      apiKey: this.apiKey,
    };

    const authResponse = await fetch(this.authorityUri, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tokenRequest)
    });

    if (!authResponse.ok) {
      const responseText = await authResponse.text();
      throw new Error(
        `Failed to retrieve access token: ${authResponse.statusText}, ${responseText}`
      );
    }

    const tokenData = await authResponse.text();
    const tokenValidTo = new Date(0);
    tokenValidTo.setUTCSeconds(tokenData.exp);

    return {
      token: tokenData,
      expiresOnTimestamp: tokenValidTo.getTime()
    };
  }
}

module.exports = RmsApiKeyCredentials;
