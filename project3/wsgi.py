"""
WSGI config for project3 project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.0/howto/deployment/wsgi/
"""

import os
import logging
import time

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project3.settings')

application = get_wsgi_application()

# Configure logging
logger = logging.getLogger('wsgi')
logger.setLevel(logging.INFO)

try:
    from turso_utils import start_sync_thread, initialize_sync_status
    
    logger.info("Initializing Turso sync status...")
    initialize_result = initialize_sync_status()
    if initialize_result:
        logger.info("Turso sync status initialized successfully")
    else:
        logger.warning("Failed to initialize Turso sync status, continuing anyway")
    
    time.sleep(1)
    logger.info("Starting Turso DB sync thread...")
    sync_thread = start_sync_thread(interval=300)  # Sync every 5 minutes
    logger.info("Turso DB sync thread started successfully")
except Exception as e:
    logger.error(f"Failed to setup Turso synchronization: {e}")
