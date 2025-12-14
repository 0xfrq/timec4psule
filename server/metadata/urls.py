from django.urls import path
from .views import ExtractMetadataView

app_name = 'metadata'

urlpatterns = [
    # Extract metadata from file
    path('extract/', ExtractMetadataView.as_view(), name='extract-metadata'),
]
