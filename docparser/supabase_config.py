"""
Supabase configuration module for document processing and embedding storage.
"""
import os
from typing import Optional
from supabase import create_client, Client

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


class SupabaseConfig:
    """Configuration class for Supabase integration."""
    
    def __init__(self, url: Optional[str] = None, key: Optional[str] = None):
        """
        Initialize Supabase configuration.
        
        Args:
            url: Supabase project URL. If None, will try to get from environment variable SUPABASE_URL
            key: Supabase anon key. If None, will try to get from environment variable SUPABASE_KEY
        """
        self.url = url or os.getenv('SUPABASE_URL')
        self.key = key or os.getenv('SUPABASE_KEY')
        
        if not self.url or not self.key:
            raise ValueError(
                "Supabase credentials are required. Please:\n"
                "1. Set SUPABASE_URL and SUPABASE_KEY environment variables\n"
                "2. Create a .env file with SUPABASE_URL and SUPABASE_KEY\n"
                "3. Pass url and key parameters to SupabaseConfig\n"
                "Get your credentials from your Supabase project dashboard"
            )
        
        # Initialize Supabase client
        self.client = create_client(self.url, self.key)
    
    def get_client(self) -> Client:
        """Get Supabase client instance."""
        return self.client
    
    def test_connection(self) -> bool:
        """Test Supabase connection."""
        try:
            # Try a simple query to test connection
            result = self.client.table("documents").select("id").limit(1).execute()
            return True
        except Exception as e:
            print(f"Supabase connection test failed: {e}")
            return False
