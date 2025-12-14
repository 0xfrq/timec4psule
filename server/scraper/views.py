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


class ScrapeView(APIView):
    """
    POST endpoint for scraping video/image from social media platforms
    
    Supports:
    - YouTube
    - TikTok
    - Instagram Reels
    
    Request:
    {
        "url": "https://youtube.com/watch?v=...",
        "uploader": 15,  # User ID
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
            
            # Validate supported platforms
            supported_platforms = ['youtube.com', 'youtu.be', 'tiktok.com', 'instagram.com']
            if not any(platform in url for platform in supported_platforms):
                return Response({
                    "success": False,
                    "error": "Unsupported platform. Supported: YouTube, TikTok, Instagram Reels"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create scrape directory
            scrape_path = os.path.join(settings.PUBLIC_ROOT, 'scrape')
            os.makedirs(scrape_path, exist_ok=True)
            print(f"📁 Scrape directory: {scrape_path}")
            
            # Prepare yt-dlp options
            random_filename = str(uuid.uuid4())
            output_template = os.path.join(scrape_path, f"{random_filename}.%(ext)s")
            
            ydl_opts = {
                'format': 'best[ext=mp4]/best[ext=webm]/best',
                'outtmpl': output_template,
                'quiet': False,
                'no_warnings': False,
            }
            
            # Download video/image
            downloaded_file = None
            upload_date = None
            
            with YoutubeDL(ydl_opts) as ydl:
                print(f"⏳ Downloading from {url}...")
                info = ydl.extract_info(url, download=True)
                
                # Get upload date from metadata
                if 'upload_date' in info:
                    upload_date_str = info['upload_date']  # Format: YYYYMMDD
                    upload_year = int(upload_date_str[:4])
                    print(f"📅 Upload date: {upload_date_str} → Year: {upload_year}")
                elif 'release_date' in info:
                    release_date_str = info['release_date']  # Format: YYYYMMDD
                    upload_year = int(release_date_str[:4])
                    print(f"📅 Release date: {release_date_str} → Year: {upload_year}")
                else:
                    upload_year = datetime.now().year
                    print(f"⚠️  No upload date found, using current year: {upload_year}")
                
                # Find downloaded file
                ext = info.get('ext', 'mp4')
                file_path = f"{output_template.replace('.%(ext)s', '')}.{ext}"
                
                if os.path.exists(file_path):
                    downloaded_file = file_path
                    print(f"✓ Downloaded file: {downloaded_file}")
                else:
                    # Try to find the file
                    for file in os.listdir(scrape_path):
                        if file.startswith(random_filename):
                            downloaded_file = os.path.join(scrape_path, file)
                            break
            
            if not downloaded_file or not os.path.exists(downloaded_file):
                return Response({
                    "success": False,
                    "error": "Failed to download file"
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Determine media type
            file_ext = os.path.splitext(downloaded_file)[1].lower()
            if file_ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.heic']:
                media_type = 'photo'
            else:
                media_type = 'video'
            
            print(f"🎬 Media type: {media_type}")
            
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
                description=description,
                thumb_url='',
                tahun=tahun_obj,
                uploader=uploader
            )
            
            print(f"✓ Post created: ID {post.id}")
            
            # Return response
            post_data = PostDetailSerializer(post).data
            
            return Response({
                "success": True,
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
