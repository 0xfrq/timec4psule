from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/", include("profiles.urls")),
    path("api/scrape/", include("scraper.urls")),
    path("api/generator/", include("generator.urls")),
    path("api/imagegen/", include("imagegen.urls")),
    path("api/post/", include("post.urls")),
    path("api/metadata/", include("metadata.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.PUBLIC_URL, document_root=settings.PUBLIC_ROOT)
