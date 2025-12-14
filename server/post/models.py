from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator


class Tahun(models.Model):
    tahun = models.IntegerField(unique=True, validators=[MinValueValidator(0)])

    def __str__(self):
        return str(self.tahun)


class Tag(models.Model):
    tag_name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.tag_name


class Post(models.Model):
    MEDIA_CHOICES = [
        ('video', 'video'),
        ('photo', 'photo'),
        ('none', 'none'),
    ]

    url = models.TextField()
    media_type = models.CharField(max_length=20, choices=MEDIA_CHOICES)
    thumb_url = models.TextField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    tahun = models.ForeignKey(Tahun, on_delete=models.SET_NULL, null=True, blank=True, related_name='posts')
    uploader = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='uploaded_posts', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    tags = models.ManyToManyField(Tag, through='PostTag', related_name='posts')

    def __str__(self):
        return f"Post {self.id}"


class PostTag(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['post', 'tag'], name='unique_post_tag')
        ]

    def __str__(self):
        return f"{self.post_id} <-> {self.tag.tag_name}"


class Time(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='times')
    year = models.IntegerField(validators=[MinValueValidator(0)])

    def __str__(self):
        return f"{self.post_id} @ {self.year}"


class PostLike(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='likes')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'post'], name='unique_user_post_like')
        ]

    def __str__(self):
        return f"{self.user_id} likes {self.post_id}"


class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, null=True, related_name='comments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='comments')
    parent_comment = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    text = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        short = (self.text[:30] + '...') if self.text and len(self.text) > 30 else (self.text or '')
        return f"Comment {self.id} by {getattr(self.user, 'username', 'Anonymous')} - {short}"


class SuggestedTopic(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='suggested_topics')
    topic = models.CharField(max_length=100)
    desc = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.topic} for Post {self.post_id}"

    class Meta:
        ordering = ['id']
