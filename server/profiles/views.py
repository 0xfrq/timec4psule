from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.authtoken.models import Token
from .serializers import (
    UserSerializer, ProfileSerializer, RegisterSerializer,
    UpdateProfilePictureSerializer, UpdateBioSerializer, UpdateUserInfoSerializer
)
from timecapsule.models import Profile


class RegisterView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        data = {"token": token.key, "user": UserSerializer(user).data}
        return Response(data, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "user": UserSerializer(user).data})


class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            token = Token.objects.get(user=request.user)
            token.delete()
        except Token.DoesNotExist:
            pass
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProfileView(APIView):
    permission_classes = (IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        serializer = ProfileSerializer(profile)
        return Response(serializer.data)

    def put(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)


class PublicProfileView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request, username):
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        profile, _ = Profile.objects.get_or_create(user=user)
        serializer = ProfileSerializer(profile)
        return Response(serializer.data)


class ProfileByIdView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request):
        """Get user profile by user ID"""
        try:
            user_id = request.query_params.get('id')
            
            if not user_id:
                return Response(
                    {"success": False, "detail": "ID parameter is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Convert to integer
            try:
                user_id = int(user_id)
            except ValueError:
                return Response(
                    {"success": False, "detail": "ID must be an integer"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get user by ID
            user = User.objects.get(id=user_id)
            profile, _ = Profile.objects.get_or_create(user=user)
            serializer = ProfileSerializer(profile)
            
            return Response({
                "success": True,
                "data": serializer.data
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response(
                {"success": False, "detail": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"success": False, "detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UpdateProfilePictureView(APIView):
    """
    PUT endpoint to update user profile picture
    
    Request (multipart/form-data):
    {
        "profile_picture": <image_file>
    }
    
    Response:
    {
        "success": true,
        "message": "Profile picture updated successfully",
        "profile_picture": "url/to/image"
    }
    """
    permission_classes = (IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser)
    
    def put(self, request):
        try:
            profile, _ = Profile.objects.get_or_create(user=request.user)
            serializer = UpdateProfilePictureSerializer(profile, data=request.data, partial=True)
            
            if not serializer.is_valid():
                return Response({
                    "success": False,
                    "errors": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            serializer.save()
            
            return Response({
                "success": True,
                "message": "Profile picture updated successfully",
                "profile_picture": profile.profile_picture.url if profile.profile_picture else None
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                "success": False,
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UpdateBioView(APIView):
    """
    PUT endpoint to update user bio
    
    Request:
    {
        "bio": "This is my new bio"
    }
    
    Response:
    {
        "success": true,
        "message": "Bio updated successfully",
        "bio": "This is my new bio"
    }
    """
    permission_classes = (IsAuthenticated,)
    
    def put(self, request):
        try:
            profile, _ = Profile.objects.get_or_create(user=request.user)
            serializer = UpdateBioSerializer(profile, data=request.data, partial=True)
            
            if not serializer.is_valid():
                return Response({
                    "success": False,
                    "errors": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            serializer.save()
            
            return Response({
                "success": True,
                "message": "Bio updated successfully",
                "bio": profile.bio
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                "success": False,
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UpdateUserInfoView(APIView):
    """
    PUT endpoint to update user information (name, email)
    
    Request:
    {
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com"
    }
    
    Response:
    {
        "success": true,
        "message": "User information updated successfully",
        "user": {
            "id": 15,
            "username": "johndoe",
            "first_name": "John",
            "last_name": "Doe",
            "email": "john@example.com"
        }
    }
    """
    permission_classes = (IsAuthenticated,)
    
    def put(self, request):
        try:
            serializer = UpdateUserInfoSerializer(request.user, data=request.data, partial=True)
            
            if not serializer.is_valid():
                return Response({
                    "success": False,
                    "errors": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            serializer.save()
            
            return Response({
                "success": True,
                "message": "User information updated successfully",
                "user": {
                    "id": request.user.id,
                    "username": request.user.username,
                    "first_name": request.user.first_name,
                    "last_name": request.user.last_name,
                    "email": request.user.email
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                "success": False,
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UpdateFullProfileView(APIView):
    """
    PUT endpoint to update entire profile at once (bio, name, email, profile picture)
    
    Request (multipart/form-data):
    {
        "bio": "My bio",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com",
        "profile_picture": <image_file>
    }
    
    Response:
    {
        "success": true,
        "message": "Profile updated successfully",
        "profile": {
            "user": {...},
            "bio": "My bio",
            "profile_picture": "url/to/image",
            "updated_at": "2025-12-14T..."
        }
    }
    """
    permission_classes = (IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser)
    
    def put(self, request):
        try:
            profile, _ = Profile.objects.get_or_create(user=request.user)
            
            # Update user info
            user_data = {}
            if 'first_name' in request.data:
                user_data['first_name'] = request.data.get('first_name')
            if 'last_name' in request.data:
                user_data['last_name'] = request.data.get('last_name')
            if 'email' in request.data:
                user_data['email'] = request.data.get('email')
            
            if user_data:
                user_serializer = UpdateUserInfoSerializer(request.user, data=user_data, partial=True)
                if not user_serializer.is_valid():
                    return Response({
                        "success": False,
                        "errors": user_serializer.errors
                    }, status=status.HTTP_400_BAD_REQUEST)
                user_serializer.save()
            
            # Update profile info
            profile_data = {}
            if 'bio' in request.data:
                profile_data['bio'] = request.data.get('bio')
            if 'profile_picture' in request.FILES:
                profile_data['profile_picture'] = request.FILES.get('profile_picture')
            
            if profile_data:
                profile_serializer = ProfileSerializer(profile, data=profile_data, partial=True)
                if not profile_serializer.is_valid():
                    return Response({
                        "success": False,
                        "errors": profile_serializer.errors
                    }, status=status.HTTP_400_BAD_REQUEST)
                profile_serializer.save()
            
            # Return updated profile
            updated_profile = ProfileSerializer(profile)
            
            return Response({
                "success": True,
                "message": "Profile updated successfully",
                "profile": updated_profile.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({
                "success": False,
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
