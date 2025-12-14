from rest_framework import serializers
from post.models import Comment
from django.contrib.auth.models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']


class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'post', 'user', 'parent_comment', 'text', 'created_at', 'replies']
        read_only_fields = ['id', 'created_at', 'user']

    def get_replies(self, obj):
        # Get all child comments
        replies = obj.replies.all()
        return CommentSerializer(replies, many=True).data


class CommentCreateSerializer(serializers.Serializer):
    text = serializers.CharField(max_length=5000)
    parent_comment = serializers.IntegerField(required=False, allow_null=True)

    def validate(self, data):
        return data
