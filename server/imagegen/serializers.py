from rest_framework import serializers


class GenerateImageSerializer(serializers.Serializer):
    """Serializer for image generation request"""
    prompt = serializers.CharField(
        required=True,
        max_length=1000,
        help_text="Text prompt for image generation"
    )
    num_images = serializers.IntegerField(
        required=False,
        default=4,
        min_value=1,
        max_value=10,
        help_text="Number of images to generate (1-10, default 4)"
    )
    return_base64 = serializers.BooleanField(
        required=False,
        default=True,
        help_text="Return images as base64 encoded strings (default True)"
    )
    year = serializers.IntegerField(
        required=False,
        help_text="Year for the generated images (optional)"
    )
    uploader = serializers.IntegerField(
        required=False,
        help_text="User ID for uploader (optional)"
    )
    description = serializers.CharField(
        required=False,
        default="",
        help_text="Description for the generated images (optional)"
    )
