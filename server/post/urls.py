from django.urls import path
from .views import (
    CreatePostView, PostListView, PostListByUserView, PostDetailView, 
    GeneratePostContentView, TahunListView, PostLikeView, PostLikesCountView, PostLikesListView
)
from .comment_views import CommentListView, CommentCreateView, CommentDetailView, SuggestedTopicsView

app_name = 'post'

urlpatterns = [
    # Create post with file upload
    path('create/', CreatePostView.as_view(), name='create-post'),
    
    # List all posts
    path('list/', PostListView.as_view(), name='post-list'),
    
    # List posts by specific user
    path('list/<int:user_id>/', PostListByUserView.as_view(), name='post-list-by-user'),
    
    # List all tahun (years)
    path('tahun/', TahunListView.as_view(), name='tahun-list'),
    
    # Get single post
    path('<int:post_id>/', PostDetailView.as_view(), name='post-detail'),
    
    # Like endpoints
    path('<int:post_id>/like/', PostLikeView.as_view(), name='post-like'),
    path('<int:post_id>/likes/', PostLikesCountView.as_view(), name='post-likes-count'),
    path('<int:post_id>/likes/list/', PostLikesListView.as_view(), name='post-likes-list'),
    
    # Generate Gemini content (comments and topics) for a post
    path('<int:post_id>/generate-content/', GeneratePostContentView.as_view(), name='generate-content'),
    
    # Comments
    path('<int:post_id>/comments/', CommentListView.as_view(), name='comment-list'),
    path('<int:post_id>/comments/create/', CommentCreateView.as_view(), name='comment-create'),
    path('<int:post_id>/comments/<int:comment_id>/', CommentDetailView.as_view(), name='comment-detail'),
    
    # Suggested Topics
    path('<int:post_id>/topics/', SuggestedTopicsView.as_view(), name='suggested-topics'),
]
