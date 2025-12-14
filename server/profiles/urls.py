from django.urls import path
from .views import (
    RegisterView, LoginView, LogoutView, ProfileView, PublicProfileView, ProfileByIdView,
    UpdateProfilePictureView, UpdateBioView, UpdateUserInfoView, UpdateFullProfileView
)

urlpatterns = [
    path("register/", RegisterView.as_view()),
    path("login/", LoginView.as_view()),
    path("logout/", LogoutView.as_view()),
    path("profile/", ProfileView.as_view()),
    path("profile/update-picture/", UpdateProfilePictureView.as_view()),
    path("profile/update-bio/", UpdateBioView.as_view()),
    path("profile/update-info/", UpdateUserInfoView.as_view()),
    path("profile/update-all/", UpdateFullProfileView.as_view()),
    path("profiles/id", ProfileByIdView.as_view()),
    path("profiles/<str:username>/", PublicProfileView.as_view()),
]
