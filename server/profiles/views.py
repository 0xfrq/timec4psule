from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.authtoken.models import Token
from .serializers import (
    UserSerializer, ProfileSerializer, RegisterSerializer
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
        
        # Only allow updating: user (read-only), bio, profile_picture
        update_data = {}
        if 'bio' in request.data:
            update_data['bio'] = request.data.get('bio')
        if 'profile_picture' in request.FILES:
            update_data['profile_picture'] = request.FILES.get('profile_picture')
        
        if update_data:
            serializer = ProfileSerializer(profile, data=update_data, partial=True)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            serializer.save()
        
        # Return the profile
        return Response(ProfileSerializer(profile).data)


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



