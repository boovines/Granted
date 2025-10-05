"""
Database connection and utilities for Supabase/Postgres.
"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Supabase client
def get_supabase() -> Client:
    """
    Get Supabase client instance.
    """
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        raise ValueError(
            "Supabase credentials not found. Please set SUPABASE_URL and SUPABASE_KEY environment variables."
        )
    
    return create_client(url, key)

# Database utilities
class DatabaseManager:
    """Database operations manager."""
    
    def __init__(self):
        self.supabase = get_supabase()
    
    def execute_query(self, query: str, params: list = None):
        """Execute raw SQL query (if needed)."""
        # Note: Supabase primarily uses the table API, but this is here for raw queries if needed
        pass
    
    def test_connection(self) -> bool:
        """Test database connection."""
        try:
            # Try a simple query
            self.supabase.table("rules").select("id").limit(1).execute()
            return True
        except Exception as e:
            print(f"Database connection failed: {e}")
            return False
