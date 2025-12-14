from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from post.models import Post, Tag, PostTag, Tahun, Comment, SuggestedTopic
from .serializers import PostCreateSerializer, PostDetailSerializer
from django.contrib.auth.models import User
from metadata.extractor import MetadataExtractor
import uuid
import os
from django.conf import settings
import threading
from django.conf import settings
from datetime import datetime

def extract_year_from_metadata_dict(metadata: dict):
    """
    Extract ONLY year (int) from metadata['data']['- Creation date']
    """
    try:
        creation_date = metadata.get('data', {}).get('- Creation date')
        if not creation_date:
            return None

        # Format: '2025-12-14 12:19:11'
        dt = datetime.strptime(creation_date, "%Y-%m-%d %H:%M:%S")
        return dt.year
    except Exception:
        return None



class CreatePostView(APIView):
    """
    POST endpoint for creating posts with file upload
    
    Accepts multipart/form-data with:
    - file: Image or video file (optional)
    - description: Post description (optional)
    - media_type: 'photo', 'video', or 'none' (auto-detected from file if provided)
    - tags: List of tag names (optional, comma-separated or JSON array)
    - years: List of years (optional, JSON array)
    - thumb_url: URL for thumbnail (optional)
    
    Response:
    {
        "success": true,
        "post": {
            "id": 1,
            "url": "media/posts/photo/uuid.jpg",
            "media_type": "photo",
            "description": "Post description",
            "tags": [{"id": 1, "tag_name": "tag1"}],
            "times": [{"id": 1, "year": 2020}],
            "likes_count": 0,
            "comments_count": 0
        }
    }
    """
    permission_classes = (AllowAny,)
    parser_classes = (MultiPartParser, FormParser)


    def post(self, request):
        """Create a new post with file upload"""
        try:
            print(f"Request data: {request.data}")
            print(f"Request files: {request.FILES}")
            
            # Extract file from request - check both 'file' and 'video' keys
            file = request.FILES.get('file') or request.FILES.get('video')
            print(f"File object: {file}")
            
            # Prepare data without file
            data = {
                'description': request.data.get('description', ''),
                'description': request.data.get('description', ''),
                'media_type': request.data.get('media_type', 'none'),
                'thumb_url': request.data.get('thumb_url', ''),
                'tags': request.data.getlist('tags') or [],
            }
            
            # Handle tahun - convert to int if provided
            tahun = None
            tahun_str = request.data.get('tahun')
            if tahun_str:
                try:
                    tahun = int(tahun_str)
                except (ValueError, TypeError):
                    tahun = None
            
            print(f"Data: {data}")
            
                        # Add uploader if authenticated
            uploader_id = request.data.get('uploader')
            if uploader_id:
                try:
                    data['uploader'] = int(uploader_id)
                except (ValueError, TypeError):
                    data['uploader'] = None
            
            # Handle file upload separately
            url = ''
            media_type = data.get('media_type', 'none')
            
            if file:
                print(f"Processing file: {file.name}")
                # Generate unique filename
                ext = file.name.split('.')[-1].lower()
                random_filename = f"{uuid.uuid4()}.{ext}"
                
                # Auto-detect media type from extension
                if not media_type or media_type == 'none':
                    if ext in ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'heic']:
                        media_type = 'photo'
                    elif ext in ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv', 'm4v', '3gp']:
                        media_type = 'video'
                
                print(f"Detected media_type: {media_type}")
                
                # Save file to public/upload
                public_upload_path = os.path.join(settings.PUBLIC_ROOT, 'upload')
                print(f"Public upload path: {public_upload_path}")
                os.makedirs(public_upload_path, exist_ok=True)
                
                file_path = os.path.join(public_upload_path, random_filename)
                print(f"Full file path: {file_path}")
                
                with open(file_path, 'wb') as f:
                    for chunk in file.chunks():
                        f.write(chunk)
                
                url = f"{settings.PUBLIC_URL}upload/{random_filename}"
                data['media_type'] = media_type
                print(f"File saved: {file_path}")
                print(f"Generated URL: {url}")
                
                # Extract year from file metadata if tahun not provided
                if not tahun:
                    print(f"\nExtracting metadata from file...")
                    metadata = MetadataExtractor.extract_metadata(file_path, file.name)
                    print(f"=== METADATA ===")
                    print(f"Type: {metadata.get('type')}")
                    print(f"Status: {metadata.get('status')}")
                    print(f"Data: {metadata.get('data')}")
                    print(f"================\n")
                    
                if not tahun:
                    print(f"\nExtracting metadata from file...")
                    metadata = MetadataExtractor.extract_metadata(file_path, file.name)

                    print(f"=== METADATA ===")
                    print(f"Data: {metadata}")
                    print(f"================\n")

                    extracted_year = extract_year_from_metadata_dict(metadata)

                    if extracted_year:
                        tahun = extracted_year
                        print(f"✓ Extracted YEAR only: {tahun}")
                    else:
                        print(f"✗ No year found in metadata")

            else:
                print("No file provided")
            
            # Create post directly
            uploader_id = data.pop('uploader', None)
            tags_list = data.pop('tags', [])
            data.pop('tahun', None)  # Remove tahun from data since we handle it separately
            
            # Get Tahun object
            tahun_obj = None
            if tahun:
                try:
                    tahun_obj = Tahun.objects.get(tahun=tahun)
                except Tahun.DoesNotExist:
                    tahun_obj = Tahun.objects.create(tahun=tahun)

            
            # Get uploader
            uploader = None
            if uploader_id:
                try:
                    uploader = User.objects.get(id=uploader_id)
                except User.DoesNotExist:
                    pass
            
            print(f"Creating post with url={url}, media_type={data['media_type']}")
            
            # Create post
            post = Post.objects.create(
                url=url,
                media_type=data['media_type'],
                description=data['description'],
                thumb_url=data['thumb_url'],
                tahun=tahun_obj,
                uploader=uploader
            )
            
            print(f"Post created: {post.id}")
            
            # Add tags
            for tag_name in tags_list:
                tag, _ = Tag.objects.get_or_create(tag_name=tag_name)
                PostTag.objects.create(post=post, tag=tag)
            
            # Return post details
            post_serializer = PostDetailSerializer(post)
            
            return Response({
                "success": True,
                "message": "Post created successfully",
                "post": post_serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {
                    "success": False,
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PostListView(APIView):
    """
    GET endpoint for listing all posts
    
    Query parameters:
    - tahun: Filter by year (integer). If 0, returns posts with no tahun (null/empty)
    """
    permission_classes = (AllowAny,)

    def get(self, request):
        """Get all posts with optional tahun filter"""
        try:
            # Get tahun filter from query parameters
            tahun_filter = request.query_params.get('tahun', None)
            
            if tahun_filter is not None:
                try:
                    tahun_value = int(tahun_filter)
                    
                    if tahun_value == 0:
                        # Get posts with no tahun (null/empty)
                        posts = Post.objects.filter(tahun__isnull=True).order_by('-id')
                    else:
                        # Get posts with specific tahun
                        posts = Post.objects.filter(tahun__tahun=tahun_value).order_by('-id')
                except (ValueError, TypeError):
                    posts = Post.objects.all().order_by('-id')
            else:
                # No filter, get all posts
                posts = Post.objects.all().order_by('-id')
            
            serializer = PostDetailSerializer(posts, many=True)
            
            return Response({
                "success": True,
                "count": posts.count(),
                "posts": serializer.data
            })
            
        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PostDetailView(APIView):
    """
    GET endpoint for individual post details
    """
    permission_classes = (AllowAny,)

    def get(self, request, post_id):
        """Get post by ID"""
        try:
            post = Post.objects.get(id=post_id)
            serializer = PostDetailSerializer(post)
            
            return Response({
                "success": True,
                "post": serializer.data
            })
            
        except Post.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "error": "Post not found"
                },
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GeneratePostContentView(APIView):
    """
    POST endpoint to generate Gemini comments and topics for a specific post
    
    Usage:
    POST /api/post/<post_id>/generate-content/
    
    Response:
    {
        "success": true,
        "message": "Content generation started",
        "comments_generated": 20,
        "topics_generated": 5
    }
    """
    permission_classes = (AllowAny,)

    def post(self, request, post_id):
        """Generate comments and topics for a post"""
        try:
            # Get post
            post = Post.objects.get(id=post_id)
            
            # Get absolute file path
            file_path = post.url
            
            # Remove leading slash and convert to absolute path
            if file_path.startswith('/'):
                file_path = file_path.lstrip('/')
            
            file_path = os.path.join(settings.BASE_DIR, file_path)
            
            # Check if file exists
            if not os.path.exists(file_path):
                return Response({
                    "success": False,
                    "error": f"File not found: {file_path}"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            print(f"Generating content for post {post_id} from file: {file_path}")
            
            # Import Gemini functions
            from generator.gemini_service import generate_comments_for_file, generate_suggested_topics
            
            comments_count = 0
            topics_count = 0
            
            # Generate comments
            try:
                print(f"Generating comments...")
                comments_data = generate_comments_for_file(file_path)
                print(f"Comments data type: {type(comments_data)}, length: {len(comments_data) if isinstance(comments_data, list) else 'N/A'}")
                print(f"Comments data: {comments_data}")
                
                if comments_data and isinstance(comments_data, list):
                    for comment_dict in comments_data:
                        username = comment_dict.get('username', f'AI_User_{post_id}')
                        comment_text = comment_dict.get('comment', '')
                        
                        # Create or get user
                        user, _ = User.objects.get_or_create(
                            username=username,
                            defaults={'first_name': username}
                        )
                        
                        # Create comment
                        Comment.objects.create(
                            post_id=post_id,
                            user=user,
                            text=comment_text
                        )
                    comments_count = len(comments_data)
                    print(f"✓ Generated {comments_count} comments for post {post_id}")
            except Exception as e:
                error_msg = f"Error generating comments: {str(e)}"
                print(f"✗ {error_msg}")
                import traceback
                traceback.print_exc()
            
            # Generate topics
            try:
                print(f"Generating topics...")
                topics_data = generate_suggested_topics(file_path)
                print(f"Topics data type: {type(topics_data)}, length: {len(topics_data) if isinstance(topics_data, list) else 'N/A'}")
                print(f"Topics data: {topics_data}")
                
                if topics_data and isinstance(topics_data, list):
                    for topic_dict in topics_data:
                        topic = topic_dict.get('topic', '')
                        desc = topic_dict.get('desc', '')
                        
                        if topic:  # Only create if topic name exists
                            SuggestedTopic.objects.create(
                                post_id=post_id,
                                topic=topic,
                                desc=desc
                            )
                    topics_count = len(topics_data)
                    print(f"✓ Generated {topics_count} topics for post {post_id}")
            except Exception as e:
                error_msg = f"Error generating topics: {str(e)}"
                print(f"✗ {error_msg}")
                import traceback
                traceback.print_exc()
            
            return Response({
                "success": True,
                "message": "Content generation completed",
                "comments_generated": comments_count,
                "topics_generated": topics_count
            }, status=status.HTTP_200_OK)
            
        except Post.DoesNotExist:
            return Response({
                "success": False,
                "error": "Post not found"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"✗ Error: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({
                "success": False,
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TahunListView(APIView):
    """
    GET endpoint for listing all tahun (years) that have posts
    
    Returns all unique years from posts in the database, sorted in descending order
    
    Response:
    {
        "success": true,
        "count": 3,
        "tahun": [
            {
                "id": 1,
                "tahun": 2025
            },
            {
                "id": 2,
                "tahun": 2024
            }
        ]
    }
    """
    permission_classes = (AllowAny,)

    def get(self, request):
        """Get all tahun (years) that have posts"""
        try:
            # Get all tahun ordered by tahun descending
            tahun_list = Tahun.objects.all().order_by('-tahun')
            
            tahun_data = [
                {
                    "id": tahun.id,
                    "tahun": tahun.tahun
                }
                for tahun in tahun_list
            ]
            
            return Response({
                "success": True,
                "count": len(tahun_data),
                "tahun": tahun_data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"✗ Error: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({
                "success": False,
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

