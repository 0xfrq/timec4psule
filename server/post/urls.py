from django.urls import path
from .views import CreatePostView, PostListView, PostDetailView, GeneratePostContentView, TahunListView
from .comment_views import CommentListView, CommentCreateView, CommentDetailView, SuggestedTopicsView

app_name = 'post'

urlpatterns = [
    # Create post with file upload
    path('create/', CreatePostView.as_view(), name='create-post'),
    
    # List all posts
    path('list/', PostListView.as_view(), name='post-list'),
    
    # List all tahun (years)
    path('tahun/', TahunListView.as_view(), name='tahun-list'),
    
    # Get single post
    path('<int:post_id>/', PostDetailView.as_view(), name='post-detail'),
    
    # Generate Gemini content (comments and topics) for a post
    path('<int:post_id>/generate-content/', GeneratePostContentView.as_view(), name='generate-content'),
    
    # Comments
    path('<int:post_id>/comments/', CommentListView.as_view(), name='comment-list'),
    path('<int:post_id>/comments/create/', CommentCreateView.as_view(), name='comment-create'),
    path('<int:post_id>/comments/<int:comment_id>/', CommentDetailView.as_view(), name='comment-detail'),
    
    # Suggested Topics
    path('<int:post_id>/topics/', SuggestedTopicsView.as_view(), name='suggested-topics'),
]
