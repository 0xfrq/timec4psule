import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')
django.setup()

from post.models import Post

# Delete all posts with uploader = None
deleted_count, _ = Post.objects.filter(uploader__isnull=True).delete()
print(f"Deleted {deleted_count} posts with uploader=None")

# Show remaining posts
remaining = Post.objects.all().count()
print(f"Remaining posts: {remaining}")
