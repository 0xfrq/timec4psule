from rest_framework import serializers


class MetadataExtractSerializer(serializers.Serializer):
    """
    Serializer for metadata extraction request
    
    Request format:
    {
        "file": <binary file>
    }
    """
    file = serializers.FileField(required=True)

    def validate_file(self, value):
        """Validate file size and type"""
        # Max file size: 500MB
        max_size = 500 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError("File size must not exceed 500MB")
        
        return value
