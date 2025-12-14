from django.urls import path
from .views import AnalyzeVideoView, AnalyzeImageView

urlpatterns = [
    path("analyze-video/", AnalyzeVideoView.as_view()),
    path("analyze-image/", AnalyzeImageView.as_view()),
]
