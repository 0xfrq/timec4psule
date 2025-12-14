from django.core.management.base import BaseCommand
from django.conf import settings
from post.models import Post, Comment, SuggestedTopic
from django.contrib.auth.models import User
import os
from pathlib import Path
import sys

# Add generator to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../../../'))

from generator.gemini_service import generate_comments_for_file, generate_suggested_topics


class Command(BaseCommand):
    help = 'Process posts and generate comments and suggested topics using Gemini'

    def add_arguments(self, parser):
        parser.add_argument(
            '--post-id',
            type=int,
            help='Process specific post by ID'
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Process all posts'
        )

    def handle(self, *args, **options):
        post_id = options.get('post_id')
        process_all = options.get('all')

        if not post_id and not process_all:
            self.stdout.write(self.style.ERROR('Please provide --post-id or --all'))
            return

        # Get posts to process
        if process_all:
            posts = Post.objects.filter(url__isnull=False).exclude(url='')
        else:
            try:
                posts = Post.objects.filter(id=post_id)
            except Post.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'Post {post_id} not found'))
                return

        if not posts.exists():
            self.stdout.write(self.style.WARNING('No posts to process'))
            return

        for post in posts:
            self.stdout.write(f'\nProcessing post {post.id}...')

            try:
                # Get file path
                if not post.url or post.url.startswith('/'):
                    # Handle relative URLs
                    file_path = os.path.join(settings.PUBLIC_ROOT, post.url.lstrip('/'))
                else:
                    file_path = post.url

                # Check if file exists
                if not os.path.exists(file_path):
                    self.stdout.write(self.style.WARNING(f'File not found: {file_path}'))
                    continue

                # Generate comments
                self.stdout.write('  Generating comments...')
                try:
                    comments_data = generate_comments_for_file(file_path)
                    
                    if comments_data:
                        created_count = 0
                        for comment_data in comments_data:
                            username = comment_data.get('username', 'Anonymous')
                            comment_text = comment_data.get('comment', '')
                            
                            if comment_text:
                                # Get or create user
                                user, _ = User.objects.get_or_create(
                                    username=username,
                                    defaults={'email': f'{username}@timecapsule.local'}
                                )
                                
                                # Create comment
                                Comment.objects.create(
                                    post=post,
                                    user=user,
                                    text=comment_text
                                )
                                created_count += 1
                        
                        self.stdout.write(
                            self.style.SUCCESS(f'  ✓ Created {created_count} comments')
                        )
                    else:
                        self.stdout.write(self.style.WARNING('  No comments generated'))
                
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'  Error generating comments: {e}'))

                # Generate suggested topics
                self.stdout.write('  Generating suggested topics...')
                try:
                    topics_data = generate_suggested_topics(file_path)
                    
                    if topics_data:
                        created_count = 0
                        for topic_data in topics_data:
                            topic = topic_data.get('topic', '')
                            desc = topic_data.get('desc', '')
                            
                            if topic:
                                SuggestedTopic.objects.create(
                                    post=post,
                                    topic=topic,
                                    desc=desc
                                )
                                created_count += 1
                        
                        self.stdout.write(
                            self.style.SUCCESS(f'  ✓ Created {created_count} suggested topics')
                        )
                    else:
                        self.stdout.write(self.style.WARNING('  No topics generated'))
                
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'  Error generating topics: {e}'))

                self.stdout.write(self.style.SUCCESS(f'✓ Post {post.id} processed successfully'))

            except Exception as e:
                self.stdout.write(self.style.ERROR(f'✗ Error processing post {post.id}: {e}'))
                import traceback
                traceback.print_exc()
