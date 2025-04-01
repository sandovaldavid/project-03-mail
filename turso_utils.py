"""
Utility functions for working with Turso DB in Django
"""
import threading
import time
import logging
import datetime
from django.conf import settings
import libsql_experimental as libsql

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger('turso_sync')

# Global variable to store last sync status
last_sync = {
    'timestamp': None,
    'success': False,
    'message': 'No sync attempted yet',
}

def sync_with_turso():
    """Sync local SQLite database with Turso Cloud"""
    global last_sync
    
    try:
        logger.info("Starting Turso DB sync...")
        start_time = time.time()
        
        conn = libsql.connect(
            settings.TURSO_DB_PATH, 
            sync_url=settings.TURSO_SYNC_URL, 
            auth_token=settings.TURSO_AUTH_TOKEN
        )
        conn.sync()
        
        end_time = time.time()
        duration = round(end_time - start_time, 2)
        
        last_sync = {
            'timestamp': datetime.datetime.now(),
            'success': True,
            'message': f'Sync completed successfully in {duration}s',
            'duration': duration
        }
        
        logger.info(f"Turso DB sync completed successfully in {duration} seconds")
        return True
    except Exception as e:
        error_msg = f"Error syncing with Turso: {e}"
        logger.error(error_msg)
        
        last_sync = {
            'timestamp': datetime.datetime.now(),
            'success': False,
            'message': error_msg,
        }
        return False

def start_sync_thread(interval=300):
    """Start a background thread that syncs with Turso every 'interval' seconds"""
    # Perform initial sync to populate the last_sync data
    logger.info("Performing initial sync at startup...")
    initial_sync_result = sync_with_turso()
    
    if initial_sync_result:
        logger.info("Initial sync completed successfully")
    else:
        logger.warning("Initial sync failed, will retry in background thread")
    
    def sync_periodically():
        while True:
            time.sleep(interval)
            success = sync_with_turso()
            # Log sync status
            if success:
                logger.info(f"Scheduled sync successful. Next sync in {interval} seconds.")
            else:
                logger.warning(f"Scheduled sync failed. Will retry in {interval} seconds.")
    
    sync_thread = threading.Thread(target=sync_periodically, daemon=True)
    sync_thread.start()
    logger.info(f"Started Turso sync thread with interval: {interval} seconds")
    return sync_thread

def execute_query(query, params=None):
    """Execute a raw SQL query on Turso DB"""
    conn = settings.get_turso_connection()
    if not conn:
        logger.error("Could not get Turso connection")
        return None
    
    try:
        cursor = conn.cursor()
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        
        result = cursor.fetchall()
        conn.sync()  # Sync changes after execution
        logger.debug(f"Query executed and synced: {query[:50]}...")
        return result
    except Exception as e:
        logger.error(f"Error executing query: {e}")
        return None
    finally:
        if conn:
            conn.close()

def get_sync_status():
    """Get the current synchronization status"""
    return last_sync

def verify_sync():
    """Verify that synchronization is working correctly"""
    try:
        # Check if we have a connection to Turso
        conn = libsql.connect(
            settings.TURSO_DB_PATH, 
            sync_url=settings.TURSO_SYNC_URL, 
            auth_token=settings.TURSO_AUTH_TOKEN
        )
        
        # Execute a test query to ensure connection works
        cursor = conn.cursor()
        cursor.execute("SELECT 1 AS test")
        result = cursor.fetchone()
        
        if result and result[0] == 1:
            # Perform a test sync
            sync_success = False
            try:
                conn.sync()
                # If we reach here, sync was successful (no exception thrown)
                sync_success = True
                logger.info("Sync verification succeeded")
            except Exception as sync_error:
                logger.error(f"Sync verification error: {sync_error}")
            
            # Get sync status from Turso client
            sync_info = {
                'timestamp': datetime.datetime.now(),
                'connection_valid': True,
                'test_query_success': True,
                'sync_attempted': True,
                'sync_success': sync_success,  # Will be True or False, never None
            }
            
            return sync_info
        else:
            return {
                'timestamp': datetime.datetime.now(),
                'connection_valid': True,
                'test_query_success': False,
                'sync_attempted': False,
                'sync_success': False,
                'error': 'Test query failed'
            }
            
    except Exception as e:
        return {
            'timestamp': datetime.datetime.now(),
            'connection_valid': False,
            'test_query_success': False,
            'sync_attempted': False,
            'sync_success': False,
            'error': str(e)
        }

def initialize_sync_status():
    """Manually initialize the sync status by performing a sync and updating the status"""
    global last_sync
    
    try:
        logger.info("Initializing sync status...")
        conn = libsql.connect(
            settings.TURSO_DB_PATH, 
            sync_url=settings.TURSO_SYNC_URL, 
            auth_token=settings.TURSO_AUTH_TOKEN
        )
        
        start_time = time.time()
        conn.sync()
        end_time = time.time()
        duration = round(end_time - start_time, 2)
        
        last_sync = {
            'timestamp': datetime.datetime.now(),
            'success': True,
            'message': f'Initial sync completed successfully in {duration}s',
            'duration': duration
        }
        
        logger.info(f"Sync status initialized successfully in {duration} seconds")
        return True
    except Exception as e:
        error_msg = f"Error initializing sync status: {e}"
        logger.error(error_msg)
        
        last_sync = {
            'timestamp': datetime.datetime.now(),
            'success': False,
            'message': error_msg,
        }
        return False
