from django.urls import path
from .views import ScrapeView

app_name = 'scraper'

urlpatterns = [
    path('', ScrapeView.as_view(), name='scrape'),
]
