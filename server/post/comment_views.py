from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly
from post.models import Comment, Post, SuggestedTopic
from .comment_serializers import CommentSerializer, CommentCreateSerializer


class CommentListView(APIView):
    """
    GET endpoint for listing all comments on a post
    """
    permission_classes = (AllowAny,)

    def get(self, request, post_id):
        """Get all comments for a post (root level only)"""
        try:
            # Check if post exists
            try:
                post = Post.objects.get(id=post_id)
            except Post.DoesNotExist:
                return Response(
                    {
                        "success": False,
                        "error": "Post not found"
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get root comments (no parent)
            comments = Comment.objects.filter(post=post, parent_comment__isnull=True).order_by('-created_at')
            serializer = CommentSerializer(comments, many=True)
            
            return Response({
                "success": True,
                "count": comments.count(),
                "comments": serializer.data
            })
            
        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CommentCreateView(APIView):
    """
    POST endpoint for creating comments on a post
    """
    permission_classes = (IsAuthenticatedOrReadOnly,)

    def post(self, request, post_id):
        """Create a new comment on a post"""
        try:
            # Check if post exists
            try:
                post = Post.objects.get(id=post_id)
            except Post.DoesNotExist:
                return Response(
                    {
                        "success": False,
                        "error": "Post not found"
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Validate request data
            serializer = CommentCreateSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(
                    {
                        "success": False,
                        "errors": serializer.errors
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            text = serializer.validated_data.get('text')
            parent_comment_id = serializer.validated_data.get('parent_comment')
            
            # Validate parent comment if provided
            parent_comment = None
            if parent_comment_id:
                try:
                    parent_comment = Comment.objects.get(id=parent_comment_id, post=post)
                except Comment.DoesNotExist:
                    return Response(
                        {
                            "success": False,
                            "error": "Parent comment not found"
                        },
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            # Create comment
            comment = Comment.objects.create(
                post=post,
                user=request.user if request.user.is_authenticated else None,
                parent_comment=parent_comment,
                text=text
            )
            
            # Return comment details
            result_serializer = CommentSerializer(comment)
            
            return Response({
                "success": True,
                "message": "Comment created successfully",
                "comment": result_serializer.data
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


class CommentDetailView(APIView):
    """
    GET, DELETE endpoint for individual comments
    """
    permission_classes = (AllowAny,)

    def get(self, request, post_id, comment_id):
        """Get a specific comment with all its replies"""
        try:
            # Check if post exists
            try:
                post = Post.objects.get(id=post_id)
            except Post.DoesNotExist:
                return Response(
                    {
                        "success": False,
                        "error": "Post not found"
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get comment
            try:
                comment = Comment.objects.get(id=comment_id, post=post)
            except Comment.DoesNotExist:
                return Response(
                    {
                        "success": False,
                        "error": "Comment not found"
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
            
            serializer = CommentSerializer(comment)
            
            return Response({
                "success": True,
                "comment": serializer.data
            })
            
        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def delete(self, request, post_id, comment_id):
        """Delete a comment (only by owner or admin)"""
        try:
            # Check if post exists
            try:
                post = Post.objects.get(id=post_id)
            except Post.DoesNotExist:
                return Response(
                    {
                        "success": False,
                        "error": "Post not found"
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get comment
            try:
                comment = Comment.objects.get(id=comment_id, post=post)
            except Comment.DoesNotExist:
                return Response(
                    {
                        "success": False,
                        "error": "Comment not found"
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check permissions
            if comment.user != request.user and not request.user.is_staff:
                return Response(
                    {
                        "success": False,
                        "error": "Permission denied"
                    },
                    status=status.HTTP_403_FORBIDDEN
                )
            
            comment.delete()
            
            return Response({
                "success": True,
                "message": "Comment deleted successfully"
            })
            
        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SuggestedTopicsView(APIView):
    """
    GET endpoint for listing suggested topics on a post
    """
    permission_classes = (AllowAny,)

    def get(self, request, post_id):
        """Get all suggested topics for a post"""
        try:
            # Check if post exists
            try:
                post = Post.objects.get(id=post_id)
            except Post.DoesNotExist:
                return Response(
                    {
                        "success": False,
                        "error": "Post not found"
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get topics
            topics = SuggestedTopic.objects.filter(post=post).order_by('id')
            
            topics_data = [{
                "id": topic.id,
                "topic": topic.topic,
                "desc": topic.desc
            } for topic in topics]
            
            return Response({
                "success": True,
                "count": len(topics_data),
                "topics": topics_data
            })
            
        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
