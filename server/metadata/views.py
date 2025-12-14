from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
import tempfile
import os
import logging
from .serializers import MetadataExtractSerializer
from .extractor import MetadataExtractor

logger = logging.getLogger(__name__)


class ExtractMetadataView(APIView):
    """
    POST endpoint for extracting metadata from files
    
    Accepts multipart/form-data with:
    - file: Image or video file (required)
    
    Supported formats:
    - Images: JPG, PNG, GIF, BMP, WEBP, TIFF, HEIC
    - Videos: MP4, AVI, MOV, MKV, WEBM, FLV, WMV, M4V, 3GP
    
    Response:
    {
        "success": true,
        "type": "image|video|unknown",
        "status": "success|error|warning",
        "filename": "image.jpg",
        "data": {
            ... metadata fields ...
        }
    }
    """
    permission_classes = (AllowAny,)
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        """Extract metadata from uploaded file"""
        try:
            # Validate request
            serializer = MetadataExtractSerializer(data=request.data)
            
            if not serializer.is_valid():
                return Response(
                    {
                        "success": False,
                        "error": "Invalid request",
                        "details": serializer.errors
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            file = serializer.validated_data['file']
            
            # Save file to temporary location
            with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.name)[1]) as tmp_file:
                for chunk in file.chunks():
                    tmp_file.write(chunk)
                tmp_path = tmp_file.name
            
            try:
                # Extract metadata
                metadata = MetadataExtractor.extract_metadata(tmp_path, file.name)
                
                # Build response
                response_data = {
                    "success": metadata["status"] == "success",
                    "type": metadata["type"],
                    "status": metadata["status"],
                    "filename": file.name,
                    "file_size": file.size,
                }
                
                # Add metadata data if successful
                if "data" in metadata:
                    response_data["data"] = metadata["data"]
                
                # Add error message if present
                if "error" in metadata:
                    response_data["error"] = metadata["error"]
                
                # Determine HTTP status code
                http_status = status.HTTP_200_OK
                if metadata["status"] == "error":
                    http_status = status.HTTP_422_UNPROCESSABLE_ENTITY
                elif metadata["status"] == "warning":
                    http_status = status.HTTP_206_PARTIAL_CONTENT
                
                return Response(response_data, status=http_status)
                
            finally:
                # Clean up temporary file
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)
            
        except Exception as e:
            logger.error(f"Error in metadata extraction: {e}", exc_info=True)
            return Response(
                {
                    "success": False,
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
