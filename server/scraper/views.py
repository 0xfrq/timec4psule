from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from post.models import Post, Tahun
from post.serializers import PostDetailSerializer
from django.contrib.auth.models import User
import uuid
import os
from django.conf import settings
from datetime import datetime
import requests
from urllib.parse import urlparse
import re


class ScrapeView(APIView):
    """
    POST endpoint for scraping video/image from social media platforms
    
    Supports:
    - YouTube (videos, shorts)
    - Instagram (images, reels, posts)
    - TikTok
    
    Request:
    {
        "url": "https://youtube.com/watch?v=...",
        "uploader": 15,  # User ID (optional)
        "description": "Optional description"
    }
    
    Response:
    {
        "success": true,
        "post": {
            "id": 24,
            "url": "/public/scrape/random-uuid.mp4",
            "media_type": "video",
            "description": "...",
            "tahun": 2025,
            "uploader": 15,
            "created_at": "...",
            "updated_at": "..."
        }
    }
    """
    permission_classes = (AllowAny,)
    
    def get_platform(self, url):
        """Detect which platform the URL is from"""
        url_lower = url.lower()
        if 'youtube.com' in url_lower or 'youtu.be' in url_lower:
            return 'youtube'
        elif 'instagram.com' in url_lower:
            return 'instagram'
        elif 'tiktok.com' in url_lower:
            return 'tiktok'
        return None
    
    def extract_year_from_date(self, date_str):
        """Extract year from various date formats"""
        if not date_str:
            return datetime.now().year
        
        # Format: YYYYMMDD
        if len(date_str) == 8 and date_str.isdigit():
            return int(date_str[:4])
        
        # Try parsing common formats
        date_formats = [
            "%Y-%m-%d",
            "%Y/%m/%d",
            "%d-%m-%Y",
            "%d/%m/%Y",
        ]
        
        for fmt in date_formats:
            try:
                dt = datetime.strptime(date_str, fmt)
                return dt.year
            except ValueError:
                continue
        
        return datetime.now().year
    
    def get_yt_dlp_options(self, output_template):
        """Get optimized yt-dlp options for different platforms"""
        return {
            'format': 'best',  # More compatible format selection
            'outtmpl': output_template,
            'quiet': False,
            'no_warnings': False,
            'socket_timeout': 30,
            'http_headers': {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            'postprocessors': [{
                'key': 'FFmpegVideoConvertor',
                'preferedformat': 'mp4',
            }],
        }
    
    def download_instagram(self, url, output_template, ydl):
        """Special handling for Instagram"""
        print(f"📸 Downloading from Instagram...")
        
        try:
            info = ydl.extract_info(url, download=True)
            
            # Extract upload date
            upload_year = datetime.now().year
            if 'upload_date' in info:
                upload_year = self.extract_year_from_date(info['upload_date'])
            elif 'timestamp' in info:
                upload_year = datetime.fromtimestamp(info['timestamp']).year
            
            # Determine if it's a photo or video/reel
            ext = info.get('ext', 'mp4')
            media_type = 'photo' if ext in ['jpg', 'jpeg', 'png', 'gif'] else 'video'
            
            # Find downloaded file
            file_path = f"{output_template.replace('.%(ext)s', '')}.{ext}"
            
            if os.path.exists(file_path):
                return file_path, media_type, upload_year
            
            # Try to find the file in scrape directory
            scrape_path = os.path.dirname(output_template)
            random_filename = os.path.basename(output_template).split('.%(ext)s')[0]
            
            for file in os.listdir(scrape_path):
                if file.startswith(random_filename):
                    return os.path.join(scrape_path, file), media_type, upload_year
            
            return None, None, upload_year
            
        except Exception as e:
            print(f"❌ Instagram download error: {str(e)}")
            raise
    
    def download_youtube(self, url, output_template, ydl):
        """Special handling for YouTube (videos and shorts)"""
        print(f"📹 Downloading from YouTube...")
        
        try:
            # Use enhanced options for YouTube
            info = ydl.extract_info(url, download=True)
            
            # Extract upload date
            upload_year = datetime.now().year
            if 'upload_date' in info:
                upload_year = self.extract_year_from_date(info['upload_date'])
            elif 'release_date' in info:
                upload_year = self.extract_year_from_date(info['release_date'])
            elif 'timestamp' in info:
                upload_year = datetime.fromtimestamp(info['timestamp']).year
            
            print(f"📅 YouTube upload year: {upload_year}")
            
            # YouTube always returns video (including shorts)
            ext = info.get('ext', 'mp4')
            file_path = f"{output_template.replace('.%(ext)s', '')}.{ext}"
            
            if os.path.exists(file_path):
                return file_path, 'video', upload_year
            
            # Try to find the file
            scrape_path = os.path.dirname(output_template)
            random_filename = os.path.basename(output_template).split('.%(ext)s')[0]
            
            for file in os.listdir(scrape_path):
                if file.startswith(random_filename):
                    return os.path.join(scrape_path, file), 'video', upload_year
            
            return None, 'video', upload_year
            
        except Exception as e:
            print(f"❌ YouTube download error: {str(e)}")
            raise
    
    def download_tiktok(self, url, output_template, ydl):
        """Special handling for TikTok"""
        print(f"🎵 Downloading from TikTok...")
        
        try:
            info = ydl.extract_info(url, download=True)
            
            # Extract upload date
            upload_year = datetime.now().year
            if 'upload_date' in info:
                upload_year = self.extract_year_from_date(info['upload_date'])
            elif 'timestamp' in info:
                upload_year = datetime.fromtimestamp(info['timestamp']).year
            
            ext = info.get('ext', 'mp4')
            file_path = f"{output_template.replace('.%(ext)s', '')}.{ext}"
            
            if os.path.exists(file_path):
                return file_path, 'video', upload_year
            
            scrape_path = os.path.dirname(output_template)
            random_filename = os.path.basename(output_template).split('.%(ext)s')[0]
            
            for file in os.listdir(scrape_path):
                if file.startswith(random_filename):
                    return os.path.join(scrape_path, file), 'video', upload_year
            
            return None, 'video', upload_year
            
        except Exception as e:
            print(f"❌ TikTok download error: {str(e)}")
            raise
    
    def post(self, request):
        try:
            from yt_dlp import YoutubeDL
            
            url = request.data.get('url')
            uploader_id = request.data.get('uploader')
            description = request.data.get('description', '')
            
            if not url:
                return Response({
                    "success": False,
                    "error": "URL is required"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            print(f"\n📥 Scraping URL: {url}")
            
            # Detect platform
            platform = self.get_platform(url)
            if not platform:
                return Response({
                    "success": False,
                    "error": "Unsupported platform. Supported: YouTube, Instagram, TikTok"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            print(f"🔍 Detected platform: {platform.upper()}")
            
            # Create scrape directory
            scrape_path = os.path.join(settings.PUBLIC_ROOT, 'scrape')
            os.makedirs(scrape_path, exist_ok=True)
            print(f"📁 Scrape directory: {scrape_path}")
            
            # Prepare yt-dlp
            random_filename = str(uuid.uuid4())
            output_template = os.path.join(scrape_path, f"{random_filename}.%(ext)s")
            
            ydl_opts = self.get_yt_dlp_options(output_template)
            
            # Download based on platform
            downloaded_file = None
            media_type = None
            upload_year = datetime.now().year
            
            with YoutubeDL(ydl_opts) as ydl:
                if platform == 'youtube':
                    downloaded_file, media_type, upload_year = self.download_youtube(url, output_template, ydl)
                elif platform == 'instagram':
                    downloaded_file, media_type, upload_year = self.download_instagram(url, output_template, ydl)
                elif platform == 'tiktok':
                    downloaded_file, media_type, upload_year = self.download_tiktok(url, output_template, ydl)
            
            if not downloaded_file or not os.path.exists(downloaded_file):
                return Response({
                    "success": False,
                    "error": f"Failed to download from {platform}. The content might be private or removed."
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            print(f"✓ Downloaded file: {downloaded_file}")
            print(f"🎬 Media type: {media_type}")
            print(f"📅 Upload year: {upload_year}")
            
            # Get or create tahun object
            tahun_obj = None
            if upload_year:
                tahun_obj, _ = Tahun.objects.get_or_create(tahun=upload_year)
                print(f"📌 Tahun object: {tahun_obj.id} ({tahun_obj.tahun})")
            
            # Get uploader
            uploader = None
            if uploader_id:
                try:
                    uploader = User.objects.get(id=uploader_id)
                    print(f"👤 Uploader: {uploader.username} (ID: {uploader.id})")
                except User.DoesNotExist:
                    print(f"⚠️  Uploader not found with ID: {uploader_id}")
            
            # Generate public URL
            file_basename = os.path.basename(downloaded_file)
            public_url = f"{settings.PUBLIC_URL}scrape/{file_basename}"
            
            # Create post
            post = Post.objects.create(
                url=public_url,
                media_type=media_type,
                description=description or f"Scrapped from {platform}",
                thumb_url='',
                tahun=tahun_obj,
                uploader=uploader
            )
            
            print(f"✓ Post created: ID {post.id}")
            
            # Return response
            post_data = PostDetailSerializer(post).data
            
            return Response({
                "success": True,
                "platform": platform,
                "post": post_data
            }, status=status.HTTP_201_CREATED)
            
        except ImportError:
            return Response({
                "success": False,
                "error": "yt-dlp is not installed. Install it with: pip install yt-dlp"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            print(f"✗ Error: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({
                "success": False,
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
