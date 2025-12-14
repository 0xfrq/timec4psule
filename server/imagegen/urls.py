from django.urls import path
from .views import GenerateImageView, SelectGeneratedImageView

urlpatterns = [
    path("generate/", GenerateImageView.as_view(), name="generate_image"),
    path("select/", SelectGeneratedImageView.as_view(), name="select_image"),
]
