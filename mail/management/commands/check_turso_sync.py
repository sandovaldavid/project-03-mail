import time
import json
from django.core.management.base import BaseCommand
from django.conf import settings
from turso_utils import sync_with_turso, verify_sync, get_sync_status, initialize_sync_status

class Command(BaseCommand):
    help = 'Check Turso database synchronization status'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force-sync',
            action='store_true',
            help='Force a synchronization before checking status',
        )
        parser.add_argument(
            '--detailed',
            action='store_true',
            help='Show detailed verification of sync mechanism',
        )
        parser.add_argument(
            '--reset-status',
            action='store_true',
            help='Reset and reinitialize the sync status',
        )

    def handle(self, *args, **options):
        if options['reset_status']:
            self.stdout.write(self.style.WARNING('Resetting sync status...'))
            success = initialize_sync_status()
            if success:
                self.stdout.write(self.style.SUCCESS('Sync status reset successfully'))
            else:
                self.stdout.write(self.style.ERROR('Failed to reset sync status'))

        if options['force_sync']:
            self.stdout.write(self.style.WARNING('Forcing synchronization...'))
            start_time = time.time()
            success = sync_with_turso()
            duration = time.time() - start_time
            
            if success:
                self.stdout.write(self.style.SUCCESS(
                    f'Sync completed successfully in {duration:.2f} seconds'
                ))
            else:
                self.stdout.write(self.style.ERROR(
                    f'Sync failed after {duration:.2f} seconds'
                ))
        
        # Get last sync status
        last_sync = get_sync_status()
        
        # Format the timestamp nicely if it exists
        if last_sync.get('timestamp'):
            timestamp_str = last_sync['timestamp'].strftime('%Y-%m-%d %H:%M:%S')
            last_sync_display = {**last_sync, 'timestamp': timestamp_str}
        else:
            last_sync_display = last_sync
            
        self.stdout.write(self.style.NOTICE('Last sync status:'))
        self.stdout.write(json.dumps(last_sync_display, indent=2))
        
        if options['detailed']:
            self.stdout.write(self.style.NOTICE('\nPerforming detailed sync verification...'))
            
            # Verify current sync status
            sync_info = verify_sync()
            
            # Format timestamp for display
            if sync_info.get('timestamp'):
                sync_info['timestamp'] = sync_info['timestamp'].strftime('%Y-%m-%d %H:%M:%S')
                
            self.stdout.write(json.dumps(sync_info, indent=2))
            
            if sync_info['connection_valid'] and sync_info['sync_success']:
                self.stdout.write(self.style.SUCCESS(
                    '\nTurso synchronization is working correctly.'
                ))
            else:
                self.stdout.write(self.style.ERROR(
                    '\nTurso synchronization issues detected:'
                ))
                
                # Provide more detailed information about what's not working
                if not sync_info['connection_valid']:
                    self.stdout.write(self.style.ERROR('  • Cannot connect to Turso DB'))
                    
                if not sync_info.get('test_query_success', False):
                    self.stdout.write(self.style.ERROR('  • Test query failed'))
                    
                if not sync_info.get('sync_success', False):
                    self.stdout.write(self.style.ERROR('  • Synchronization failed'))
                    
                if 'error' in sync_info:
                    self.stdout.write(self.style.ERROR(f'  • Error: {sync_info["error"]}'))
        
        # Display connection information
        self.stdout.write(self.style.NOTICE('\nTurso connection information:'))
        self.stdout.write(f"Database path: {settings.TURSO_DB_PATH}")
        self.stdout.write(f"Sync URL: {settings.TURSO_SYNC_URL}")
        self.stdout.write(f"Database name: {settings.TURSO_DB_NAME}")
