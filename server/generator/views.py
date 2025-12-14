from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
import tempfile
import os
import json
from . import gemini_service


class AnalyzeVideoView(APIView):
    """POST endpoint that accepts a multipart-uploaded video file (field name 'video') and
    returns the generated comments (parsed JSON when possible).
    """
    permission_classes = (AllowAny,)
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        video_file = request.FILES.get("video")
        if not video_file:
            return Response({"detail": "'video' file required"}, status=status.HTTP_400_BAD_REQUEST)

        # Save to a temporary file on disk
        suffix = os.path.splitext(getattr(video_file, 'name', 'upload'))[1] or '.mp4'
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        try:
            for chunk in video_file.chunks():
                tmp.write(chunk)
            tmp.flush()
            tmp.close()

            try:
                result = gemini_service.analyze_video(tmp.name)
            except Exception as e:
                return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # If the service returned structured data, return it directly; otherwise return raw text
            if isinstance(result, (dict, list)):
                return Response(result)
            try:
                parsed = json.loads(result)
                return Response(parsed)
            except Exception:
                return Response({"result": result})
        finally:
            try:
                os.unlink(tmp.name)
            except Exception:
                pass


class AnalyzeImageView(APIView):
    """POST endpoint that accepts a multipart-uploaded image file (field name 'image') and
    returns the generated comments (parsed JSON when possible).
    """
    permission_classes = (AllowAny,)
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        image_file = request.FILES.get("image")
        if not image_file:
            return Response({"detail": "'image' file required"}, status=status.HTTP_400_BAD_REQUEST)

        # Save to a temporary file on disk
        suffix = os.path.splitext(getattr(image_file, 'name', 'upload'))[1] or '.jpg'
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        try:
            for chunk in image_file.chunks():
                tmp.write(chunk)
            tmp.flush()
            tmp.close()

            try:
                result = gemini_service.analyze_image(tmp.name)
            except Exception as e:
                return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # If the service returned structured data, return it directly; otherwise return raw text
            if isinstance(result, (dict, list)):
                return Response(result)
            try:
                parsed = json.loads(result)
                return Response(parsed)
            except Exception:
                return Response({"result": result})
        finally:
            try:
                os.unlink(tmp.name)
            except Exception:
                pass
