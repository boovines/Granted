"""
Configuration module for Aryn AI DocParse API.
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
    """Configuration class for Aryn AI DocParse API."""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Aryn configuration.
        
        Args:
            api_key: Aryn API key. If None, will try to get from environment variable ARYN_API_KEY
        """
        self.api_key = api_key or os.getenv('ARYN_API_KEY')
        
        if not self.api_key:
            raise ValueError(
                "Aryn API key is required. Please:\n"
                "1. Set ARYN_API_KEY environment variable\n"
                "2. Create a .env file with ARYN_API_KEY\n"
                "3. Pass api_key parameter to ArynConfig\n"
                "Get your API key from https://docs.aryn.ai/"
            )
    
    def get_api_key(self) -> str:
        """Get Aryn API key."""
        return self.api_key