from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
import os
import uuid
from django.conf import settings
from .serializers import GenerateImageSerializer
from . import grok_service
from post.models import Post, Tahun
from django.contrib.auth.models import User



class GenerateImageView(APIView):
    """
    POST endpoint that accepts a prompt and generates images using Grok
    
    Request body:
    {
        "prompt": "A futuristic city at sunset",
        "num_images": 4,
        "return_base64": true,
        "year": 2025,
        "uploader": 15,
        "description": "Generated image"
    }
    
    Response:
    {
        "success": true,
        "prompt": "A futuristic city at sunset",
        "images": [
            {
                "filename": "image_1.png",
                "base64": "iVBORw0KGgoAAAANS...",
                "url": "/public/generated/image/...",
                "post_id": 24
            }
        ],
        "count": 4
    }
    """
    permission_classes = (AllowAny,)
    
    def post(self, request):
        serializer = GenerateImageSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {"success": False, "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        prompt = serializer.validated_data['prompt']
        num_images = serializer.validated_data.get('num_images', 4)
        return_base64 = serializer.validated_data.get('return_base64', False)
        year = serializer.validated_data.get('year')
        uploader_id = serializer.validated_data.get('uploader')
        description = serializer.validated_data.get('description', '')
        
        # Create unique output directory for this request
        request_id = str(uuid.uuid4())[:8]
        output_dir = os.path.join(
            getattr(settings, 'PUBLIC_ROOT', 'public'),
            'generated',
            'image',
            request_id
        )
        
        try:
            print(f"\n🚀 API Request: Generating {num_images} images")
            print(f"   Prompt: {prompt}")
            print(f"   Output: {output_dir}\n")
            
            # Get or create generator instance with cookies from JSON file
            cookies_file = os.path.join(
                os.path.dirname(__file__),
                'grok_cookies.json'
            )
            generator = grok_service.get_generator(cookies_file=cookies_file)
            
            # Generate images using the generator
            result = generator.generate_images(
                prompt=prompt,
                output_dir=output_dir,
                num_images=num_images,
                wait_time=30
            )
            
            if not result:
                return Response(
                    {
                        "success": False,
                        "error": "No images were generated. Check server logs for details.",
                        "debug": {
                            "output_dir": os.path.abspath(output_dir),
                            "prompt": prompt,
                            "hint": "Check browser or server logs for errors"
                        }
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Collect generated image files
            import base64
            response_images = []
            
            if os.path.exists(output_dir):
                image_files = [f for f in os.listdir(output_dir) 
                              if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))]
                
                image_files.sort()
                
                # Get or create tahun object if year provided
                tahun_obj = None
                if year:
                    tahun_obj, _ = Tahun.objects.get_or_create(tahun=year)
                
                # Get uploader user if uploader_id provided
                uploader = None
                if uploader_id:
                    try:
                        uploader = User.objects.get(id=uploader_id)
                    except User.DoesNotExist:
                        pass
                
                for img_file in image_files:
                    filepath = os.path.join(output_dir, img_file)
                    
                    # Build public URL (relative to PUBLIC_ROOT)
                    public_url = f"/public/generated/image/{request_id}/{img_file}"
                    
                    img_response = {
                        "filename": img_file,
                        "filepath": os.path.abspath(filepath),
                        "url": public_url
                    }
                    
                    # Include base64 if requested (default: true)
                    if return_base64:
                        with open(filepath, 'rb') as f:
                            img_data = f.read()
                            img_response['base64'] = base64.b64encode(img_data).decode('utf-8')
                    
                    # Create post in database if year or uploader provided
                    if tahun_obj or uploader:
                        post = Post.objects.create(
                            url=public_url,
                            media_type='photo',
                            description=description or prompt,
                            thumb_url='',
                            tahun=tahun_obj,
                            uploader=uploader
                        )
                        img_response['post_id'] = post.id
                        print(f"📝 Post created: ID {post.id} for {img_file}")
                    
                    response_images.append(img_response)
            
            print(f"\n✅ API Success: {len(response_images)} images generated\n")
            
            return Response({
                "success": True,
                "prompt": prompt,
                "images": response_images,
                "count": len(response_images),
                "output_dir": os.path.abspath(output_dir),
                "public_url": f"/public/generated/image/{request_id}/"
            })
            
        except Exception as e:
            import traceback
            error_detail = str(e)
            error_traceback = traceback.format_exc()
            
            print(f"\n❌ API Error: {error_detail}")
            print(error_traceback)
            
            return Response(
                {
                    "success": False,
                    "error": error_detail,
                    "prompt": prompt,
                    "debug": {
                        "output_dir": output_dir,
                        "hint": "Check server logs and debug screenshots",
                        "traceback": error_traceback.split('\n')[-5:]  # Last 5 lines
                    }
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SelectGeneratedImageView(APIView):
    """
    POST endpoint for selecting one image from generated set and deleting others
    
    Keeps only the selected image in the database and removes others.
    Image files are NOT deleted from filesystem.
    
    Request body:
    {
        "folder_id": "abc12345",
        "pick": "image_1.png"
    }
    
    Response:
    {
        "success": true,
        "kept_image": {
            "filename": "image_1.png",
            "url": "/public/generated/image/abc12345/image_1.png",
            "post_id": 24
        },
        "deleted_count": 3,
        "deleted_post_ids": [25, 26, 27],
        "message": "3 images removed, 1 image kept"
    }
    """
    permission_classes = (AllowAny,)
    
    def post(self, request):
        try:
            folder_id = request.data.get('folder_id')
            pick = request.data.get('pick')
            
            if not folder_id or not pick:
                return Response({
                    "success": False,
                    "error": "folder_id and pick parameters are required"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            print(f"\n🎯 Selecting image: {pick} from folder {folder_id}")
            
            # Build the URL pattern for the selected image
            selected_url = f"/public/generated/image/{folder_id}/{pick}"
            
            # Find all posts from this folder
            folder_url_prefix = f"/public/generated/image/{folder_id}/"
            all_posts = Post.objects.filter(url__startswith=folder_url_prefix)
            
            print(f"📊 Found {all_posts.count()} total images in folder")
            
            # Find the post we want to keep
            kept_post = all_posts.filter(url=selected_url).first()
            
            if not kept_post:
                return Response({
                    "success": False,
                    "error": f"Image not found: {pick} in folder {folder_id}"
                }, status=status.HTTP_404_NOT_FOUND)
            
            print(f"✓ Found kept post: ID {kept_post.id}")
            
            # Get all posts to delete (everything except the kept one)
            posts_to_delete = all_posts.exclude(id=kept_post.id)
            deleted_post_ids = list(posts_to_delete.values_list('id', flat=True))
            deleted_count = posts_to_delete.count()
            
            print(f"🗑️  Deleting {deleted_count} posts: {deleted_post_ids}")
            
            # Delete the other posts (but keep files in filesystem)
            posts_to_delete.delete()
            
            print(f"✓ Deleted {deleted_count} posts from database")
            
            return Response({
                "success": True,
                "kept_image": {
                    "filename": pick,
                    "url": selected_url,
                    "post_id": kept_post.id
                },
                "deleted_count": deleted_count,
                "deleted_post_ids": deleted_post_ids,
                "message": f"{deleted_count} images removed, 1 image kept"
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"✗ Error: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({
                "success": False,
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
