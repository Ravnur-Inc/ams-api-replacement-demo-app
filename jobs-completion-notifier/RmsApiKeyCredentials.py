"""
RMS API Key Credentials implementation for Python.
This credential provider allows authentication with Ravnur Media Services using API key.
"""
import requests
from azure.core.credentials import AccessToken
from datetime import datetime
import json

class RmsApiKeyCredentials:
    """
    Credentials implementation that acquires a token from Ravnur Media Service using an API key.
    This can be used as a credential object for all Ravnur Media Service clients.
    """
    
    def __init__(self, authority_uri, subscription_id, api_key):
        """
        Initialize a new instance of RmsApiKeyCredentials.
        
        :param authority_uri: The URI of the authentication endpoint
        :param subscription_id: The subscription ID for Ravnur Media Service
        :param api_key: The API key for authentication
        """
        # Ensure the authority URI ends with the token endpoint
        if not authority_uri.endswith('/auth/token'):
            authority_uri += '/auth/token'
            
        self.authority_uri = authority_uri
        self.subscription_id = subscription_id
        self.api_key = api_key
        self._token = None
        self._token_expiry = 0
    
    async def get_token(self, *scopes, **kwargs):
        """
        Gets a token for the specified scopes.
        
        :param scopes: The scopes for which the token will be valid
        :return: An AccessToken instance containing the token string and expiry timestamp
        :raises: ValueError if authentication fails
        """
        return self._get_token(*scopes, **kwargs)
    
    def get_token(self, *scopes, **kwargs):
        """
        Gets a token for the specified scopes.
        
        :param scopes: The scopes for which the token will be valid
        :return: An AccessToken instance containing the token string and expiry timestamp
        :raises: ValueError if authentication fails
        """
        return self._get_token(*scopes, **kwargs)
    
    def _get_token(self, *scopes, **kwargs):
        """
        Implementation of token acquisition logic.
        
        :param scopes: The scopes for which the token will be valid
        :return: An AccessToken instance containing the token string and expiry timestamp
        :raises: ValueError if authentication fails
        """
        # Check if we have a valid cached token
        current_time = datetime.now().timestamp()
        if self._token and current_time < self._token_expiry:
            return self._token
            
        # Prepare token request
        token_request = {
            "subscriptionId": self.subscription_id,
            "apiKey": self.api_key
        }
        
        # Make the request
        try:
            auth_response = requests.post(
                self.authority_uri,
                headers={'Content-Type': 'application/json'},
                json=token_request
            )
            
            # Check if request was successful
            if not auth_response.ok:
                raise ValueError(f"Failed to retrieve access token: {auth_response.status_code}, {auth_response.text}")
                
            # Parse the token response
            token_data = auth_response.text
            
            # Try to parse as JSON to get expiration if available in response
            try:
                token_json = json.loads(token_data)
                if 'exp' in token_json:
                    token_valid_to = datetime.fromtimestamp(token_json['exp']).timestamp()
                else:
                    # Default expiry of 1 hour if not specified
                    token_valid_to = current_time + 3600
                
                # If token is in a specific field, extract it
                if isinstance(token_json, dict) and 'token' in token_json:
                    token_data = token_json['token']
            except json.JSONDecodeError:
                # If response is not JSON, assume it's the raw token string
                # Default expiry of 1 hour
                token_valid_to = current_time + 3600
            
            # Create and cache the token
            self._token = AccessToken(token_data, int(token_valid_to))
            self._token_expiry = token_valid_to
            
            return self._token
            
        except Exception as ex:
            raise ValueError(f"Failed to authenticate with Ravnur Media Service: {str(ex)}")
