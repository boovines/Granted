"""
Configuration module for Aryn AI DocParse API integration.
"""
import os
from typing import Optional

# Try to load python-dotenv if available
try:
    from dotenv import load_dotenv
    # Load .env file if it exists
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_path):
        load_dotenv(env_path)
    else:
        # Try loading from current directory as fallback
        load_dotenv()
except ImportError:
    # python-dotenv not installed, continue without it
    pass


class ArynConfig:
    """Configuration class for Aryn AI API settings."""
    
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None, region: Optional[str] = None):
        """
        Initialize Aryn configuration.
        
        Args:
            api_key: Aryn API key. If None, will try to get from environment variable ARYN_API_KEY
            base_url: Base URL for Aryn API. If None, uses default Aryn API URL
            region: Aryn region (US or EU). If None, uses default or ARYN_REGION env var
        """
        self.api_key = api_key or os.getenv('ARYN_API_KEY')
        self.base_url = base_url or os.getenv('ARYN_BASE_URL') or "https://api.aryn.ai"
        self.region = region or os.getenv('ARYN_REGION')
        
        if not self.api_key:
            raise ValueError(
                "Aryn API key is required. Please:\n"
                "1. Set ARYN_API_KEY environment variable\n"
                "2. Create a .env file with ARYN_API_KEY=your_key\n"
                "3. Pass api_key parameter to ArynConfig\n"
                "Get your API key from: https://www.aryn.ai/get-started"
            )
    
    def get_headers(self) -> dict:
        """Get headers for API requests."""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    def get_parse_url(self) -> str:
        """Get URL for document parsing endpoint."""
        return f"{self.base_url}/v1/parse"
    
    def get_query_url(self) -> str:
        """Get URL for document querying endpoint."""
        return f"{self.base_url}/v1/query"
