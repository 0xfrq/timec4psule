from django.apps import AppConfig
import threading
import logging

logger = logging.getLogger(__name__)


class ImagegenConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'imagegen'
    
    def ready(self):
        """Called when Django starts - initialize persistent driver"""
        import os
        
        # Only initialize in main process (not in reloader)
        if os.environ.get('RUN_MAIN') != 'true':
            return
        
        logger.info("🚀 ImageGen app ready - starting persistent Grok driver...")
        
        # Start driver initialization in background thread
        def init_driver():
            try:
                from . import grok_service
                # Set headless=False for debugging, True for production
                headless = os.environ.get('GROK_HEADLESS', 'true').lower() == 'true'
                grok_service.initialize_driver(headless=headless)
            except Exception as e:
                logger.error(f"Failed to initialize Grok driver on startup: {e}")
                import traceback
                traceback.print_exc()
        
        # Start in background thread so Django can continue starting up
        thread = threading.Thread(target=init_driver, daemon=True)
        thread.start()
        
        logger.info("✓ Driver initialization started in background")
