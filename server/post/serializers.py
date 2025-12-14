from rest_framework import serializers
from post.models import Post, Tag, PostTag, Time, Tahun
from django.core.files.storage import default_storage
from django.conf import settings
import uuid
import os


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'tag_name']


class TahunSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tahun
        fields = ['id', 'tahun']


class PostCreateSerializer(serializers.Serializer):
    """
    Serializer for creating posts with file upload
    Note: File is handled separately in the view
    """
    description = serializers.CharField(
        max_length=5000,
        required=False,
        allow_blank=True
    )
    media_type = serializers.ChoiceField(
        choices=['photo', 'video', 'none'],
        default='none'
    )
    thumb_url = serializers.CharField(
        max_length=500,
        required=False,
        allow_blank=True
    )
    tags = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        default=[]
    )
    tahun = serializers.IntegerField(
        required=False,
        allow_null=True
    )

    def validate(self, data):
        return data

    def create(self, validated_data):
        # This method should not be called since file handling moved to view
        pass


class PostDetailSerializer(serializers.ModelSerializer):
    """Serializer for post details"""
    tags = TagSerializer(many=True, read_only=True)
    tahun = TahunSerializer(read_only=True)
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id',
            'url',
            'media_type',
            'thumb_url',
            'description',
            'tags',
            'tahun',
            'uploader',
            'created_at',
            'updated_at',
            'likes_count',
            'comments_count'
        ]

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_comments_count(self, obj):
        return obj.comments.count()
