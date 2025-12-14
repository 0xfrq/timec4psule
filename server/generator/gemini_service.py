import os
import time
import json
from dotenv import load_dotenv
from pathlib import Path

try:
    import google.generativeai as genai
except Exception:
    genai = None

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
if genai and API_KEY:
    genai.configure(api_key=API_KEY)


def analyze_video(video_path, model_name="gemini-2.5-flash", timeout=600):
    """Upload a video to Gemini, wait for processing, request generation, and return parsed JSON or raw text.

    Returns either a Python object (if the model returned valid JSON) or a string with the raw text.
    """
    if genai is None:
        raise RuntimeError("google.generativeai is not installed or failed to import")
    if not API_KEY:
        raise RuntimeError("GEMINI_API_KEY not set in environment")

    video_file = genai.upload_file(path=video_path)

    # Poll until processing finished
    while getattr(video_file, "state", None) and getattr(video_file.state, "name", "") == "PROCESSING":
        time.sleep(2)
        video_file = genai.get_file(video_file.name)

    if getattr(video_file, "state", None) and getattr(video_file.state, "name", "") == "FAILED":
        try:
            genai.delete_file(video_file.name)
        finally:
            raise ValueError(f"Video processing failed: {video_file.state.name}")

    model = genai.GenerativeModel(model_name=model_name)

    prompt = (
        "Describe exactly what happens in this video, dan dari deskripsi yang anda dapatkan "
        "generate comment organik sosial media tiktok dari deskripsi video ini, gunakan slang "
        "slang bahasa indonesia yang sering digunakan dan terlihat organik. buat komentar dalam "
        "kurang dari 1 kalimat, gunakan bahasa edgy jaksel juga bisa atau menggunakan brainrot "
        "juga boleh lebih edgy dan lebih brainrot lebih baik, generate 20 comment, buat dalam "
        "bentuk json beserta username dan isi comment nya. untuk usernamenya, username dengan "
        "nama orang pada umumnya saja"
    )

    response = model.generate_content(
        [video_file, prompt],
        request_options={"timeout": timeout}
    )

    text = getattr(response, "text", "")

    # Attempt to parse returned text as JSON
    try:
        data = json.loads(text)
    except Exception:
        data = text

    # Cleanup uploaded file on Gemini side
    try:
        genai.delete_file(video_file.name)
    except Exception:
        pass

    return data


def analyze_image(image_path, model_name="gemini-2.5-flash", timeout=600):
    """Upload an image to Gemini, request generation, and return parsed JSON or raw text.

    Returns either a Python object (if the model returned valid JSON) or a string with the raw text.
    """
    if genai is None:
        raise RuntimeError("google.generativeai is not installed or failed to import")
    if not API_KEY:
        raise RuntimeError("GEMINI_API_KEY not set in environment")

    image_file = genai.upload_file(path=image_path)

    # Poll until processing finished (images typically process faster than videos)
    while getattr(image_file, "state", None) and getattr(image_file.state, "name", "") == "PROCESSING":
        time.sleep(1)
        image_file = genai.get_file(image_file.name)

    if getattr(image_file, "state", None) and getattr(image_file.state, "name", "") == "FAILED":
        try:
            genai.delete_file(image_file.name)
        finally:
            raise ValueError(f"Image processing failed: {image_file.state.name}")

    model = genai.GenerativeModel(model_name=model_name)

    prompt = (
        "Describe exactly what you see in this image, dan dari deskripsi yang anda dapatkan "
        "generate comment organik sosial media tiktok dari deskripsi image ini, gunakan slang "
        "slang bahasa indonesia yang sering digunakan dan terlihat organik. buat komentar dalam "
        "kurang dari 1 kalimat, gunakan bahasa edgy jaksel juga bisa atau menggunakan brainrot "
        "juga boleh lebih edgy dan lebih brainrot lebih baik, generate 20 comment, buat dalam "
        "bentuk json beserta username dan isi comment nya. untuk usernamenya, username dengan "
        "nama orang pada umumnya saja"
    )

    response = model.generate_content(
        [image_file, prompt],
        request_options={"timeout": timeout}
    )

    text = getattr(response, "text", "")

    # Attempt to parse returned text as JSON
    try:
        data = json.loads(text)
    except Exception:
        data = text

    # Cleanup uploaded file on Gemini side
    try:
        genai.delete_file(image_file.name)
    except Exception:
        pass

    return data


def generate_comments_for_file(file_path, model_name="gemini-2.5-flash", timeout=600):
    """
    Upload a file (image or video) to Gemini and generate organic TikTok comments.
    Returns a list of comments with username and comment text.
    
    Response format:
    [
        {"username": "name1", "comment": "comment text 1"},
        {"username": "name2", "comment": "comment text 2"},
        ...
    ]
    """
    if genai is None:
        raise RuntimeError("google.generativeai is not installed or failed to import")
    if not API_KEY:
        raise RuntimeError("GEMINI_API_KEY not set in environment")
    
    # Determine file type
    file_path_obj = Path(file_path)
    ext = file_path_obj.suffix.lower()
    
    is_video = ext in ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv', '.wmv', '.m4v', '.3gp']
    is_image = ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.heic']
    
    if not (is_video or is_image):
        raise ValueError(f"Unsupported file format: {ext}")
    
    # Upload file
    uploaded_file = genai.upload_file(path=file_path)
    
    # Poll until processing finished
    while getattr(uploaded_file, "state", None) and getattr(uploaded_file.state, "name", "") == "PROCESSING":
        time.sleep(2 if is_video else 1)
        uploaded_file = genai.get_file(uploaded_file.name)
    
    if getattr(uploaded_file, "state", None) and getattr(uploaded_file.state, "name", "") == "FAILED":
        try:
            genai.delete_file(uploaded_file.name)
        finally:
            raise ValueError(f"File processing failed: {uploaded_file.state.name}")
    
    model = genai.GenerativeModel(model_name=model_name)
    
    file_type = "VIDEO" if is_video else "IMAGE"
    prompt = (
        f"Analyze this {file_type} and generate 20 organic TikTok comments in Indonesian. "
        "Use slang bahasa Indonesia, edgy jaksel style, and brainrot humor. "
        "Komentar harus short, maksimal 1 kalimat, dan terlihat natural. "
        "IMPORTANT: Return ONLY a valid JSON array, nothing else. "
        "Each comment must have 'username' (Indonesian name) and 'comment' (the comment text). "
        "Example format: "
        '[{"username": "Budi", "comment": "gila ini mah"}, {"username": "Siti", "comment": "wkwkwk parah"}]'
    )
    
    response = model.generate_content(
        [uploaded_file, prompt],
        request_options={"timeout": timeout}
    )
    
    text = getattr(response, "text", "")
    
    # Strip markdown code blocks if present
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]  # Remove ```json
    elif text.startswith("```"):
        text = text[3:]  # Remove ```
    if text.endswith("```"):
        text = text[:-3]  # Remove trailing ```
    text = text.strip()
    
    # Parse JSON
    try:
        comments = json.loads(text)
        if not isinstance(comments, list):
            comments = [comments]
        print(f"✓ Successfully parsed {len(comments)} comments")
    except Exception as e:
        print(f"✗ Failed to parse comments JSON: {e}")
        print(f"Raw response: ```json\n{text}\n```")
        comments = []
    
    # Cleanup
    try:
        genai.delete_file(uploaded_file.name)
    except Exception:
        pass
    
    return comments


def generate_suggested_topics(file_path, model_name="gemini-2.5-flash", timeout=600):
    """
    Upload a file (image or video) to Gemini and generate suggested topics/contexts.
    Returns a list of topics with descriptions.
    
    Response format:
    [
        {"topic": "Travel", "desc": "This image shows a beautiful beach destination"},
        {"topic": "Nature", "desc": "Natural landscape with mountains"},
        ...
    ]
    """
    if genai is None:
        raise RuntimeError("google.generativeai is not installed or failed to import")
    if not API_KEY:
        raise RuntimeError("GEMINI_API_KEY not set in environment")
    
    # Determine file type
    file_path_obj = Path(file_path)
    ext = file_path_obj.suffix.lower()
    
    is_video = ext in ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv', '.wmv', '.m4v', '.3gp']
    is_image = ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.heic']
    
    if not (is_video or is_image):
        raise ValueError(f"Unsupported file format: {ext}")
    
    # Upload file
    uploaded_file = genai.upload_file(path=file_path)
    
    # Poll until processing finished
    while getattr(uploaded_file, "state", None) and getattr(uploaded_file.state, "name", "") == "PROCESSING":
        time.sleep(2 if is_video else 1)
        uploaded_file = genai.get_file(uploaded_file.name)
    
    if getattr(uploaded_file, "state", None) and getattr(uploaded_file.state, "name", "") == "FAILED":
        try:
            genai.delete_file(uploaded_file.name)
        finally:
            raise ValueError(f"File processing failed: {uploaded_file.state.name}")
    
    model = genai.GenerativeModel(model_name=model_name)
    
    file_type = "VIDEO" if is_video else "IMAGE"
    prompt = (
        f"Analyze this {file_type} and generate 5-10 suggested topics/contexts that describe "
        "what is in it. Each topic should have a clear category name and a detailed description of what it shows. "
        "Topics should be specific and contextual (e.g., 'Fashion', 'Food', 'Travel', 'Technology', etc.). "
        "IMPORTANT: Return ONLY a valid JSON array, nothing else. "
        "Each topic must have 'topic' (category name, short) and 'desc' (detailed description). "
        "Example format: "
        '[{"topic": "Travel", "desc": "Beautiful beach destination with clear blue water"}, '
        '{"topic": "Nature", "desc": "Tropical landscape with palm trees and sandy shore"}]'
    )
    
    response = model.generate_content(
        [uploaded_file, prompt],
        request_options={"timeout": timeout}
    )
    
    text = getattr(response, "text", "")
    
    # Strip markdown code blocks if present
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]  # Remove ```json
    elif text.startswith("```"):
        text = text[3:]  # Remove ```
    if text.endswith("```"):
        text = text[:-3]  # Remove trailing ```
    text = text.strip()
    
    # Parse JSON
    try:
        topics = json.loads(text)
        if not isinstance(topics, list):
            topics = [topics]
        print(f"✓ Successfully parsed {len(topics)} topics")
    except Exception as e:
        print(f"✗ Failed to parse topics JSON: {e}")
        print(f"Raw response: ```json\n{text}\n```")
        topics = []
    
    # Cleanup
    try:
        genai.delete_file(uploaded_file.name)
    except Exception:
        pass
    
    return topics
