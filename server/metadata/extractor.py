import os
import tempfile
from PIL import Image
from PIL.ExifTags import TAGS
from hachoir.parser import createParser
from hachoir.metadata import extractMetadata
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class MetadataExtractor:
    """Utility class to extract metadata from image and video files"""

    @staticmethod
    def extract_image_metadata(file_path):
        """
        Extract metadata from image files
        
        Args:
            file_path: Path to image file
            
        Returns:
            dict with metadata information
        """
        metadata = {
            "type": "image",
            "status": "success",
            "data": {}
        }

        try:
            img = Image.open(file_path)
            
            # Basic image info
            metadata["data"]["format"] = img.format
            metadata["data"]["size"] = img.size
            metadata["data"]["width"] = img.width
            metadata["data"]["height"] = img.height
            metadata["data"]["mode"] = img.mode
            
            # Try to extract EXIF data
            try:
                if hasattr(img, '_getexif') and callable(img._getexif):
                    exif_data = img._getexif()
                    if exif_data:
                        exif_metadata = {}
                        for tag_id, value in exif_data.items():
                            tag_name = TAGS.get(tag_id, tag_id)
                            try:
                                exif_metadata[tag_name] = str(value)
                            except:
                                exif_metadata[tag_name] = "Unable to read"
                        metadata["data"]["exif"] = exif_metadata
                
                # Also try PIL's exif method
                if "exif" in img.info:
                    from PIL import ExifTags
                    exif = img.getexif()
                    if exif and not metadata["data"].get("exif"):
                        exif_metadata = {}
                        for tag_id, value in exif.items():
                            tag_name = ExifTags.TAGS.get(tag_id, tag_id)
                            try:
                                exif_metadata[tag_name] = str(value)
                            except:
                                exif_metadata[tag_name] = "Unable to read"
                        metadata["data"]["exif"] = exif_metadata
                        
            except Exception as e:
                logger.warning(f"Could not extract EXIF data: {e}")
                metadata["data"]["exif"] = None
            
            # Check for other metadata
            if hasattr(img, 'info') and img.info:
                other_info = {}
                for key, value in img.info.items():
                    if key != 'exif':
                        try:
                            other_info[key] = str(value)[:200]  # Limit size
                        except:
                            pass
                if other_info:
                    metadata["data"]["other_info"] = other_info
            
            return metadata
            
        except Exception as e:
            logger.error(f"Error extracting image metadata: {e}")
            metadata["status"] = "error"
            metadata["error"] = str(e)
            return metadata

    @staticmethod
    def extract_video_metadata(file_path):
        """
        Extract metadata from video files
        
        Args:
            file_path: Path to video file
            
        Returns:
            dict with metadata information
        """
        metadata = {
            "type": "video",
            "status": "success",
            "data": {}
        }

        try:
            parser = createParser(file_path)
            if not parser:
                metadata["status"] = "error"
                metadata["error"] = "Unable to parse file. Unsupported format or corrupted file."
                return metadata
            
            with parser:
                extracted = extractMetadata(parser)
                if not extracted:
                    metadata["status"] = "warning"
                    metadata["error"] = "No metadata found in file"
                    return metadata
                
                # Convert metadata to dictionary
                metadata_dict = {}
                for line in extracted.exportPlaintext():
                    line = line.strip()
                    if ':' in line:
                        key, value = line.split(':', 1)
                        key = key.strip()
                        value = value.strip()
                        metadata_dict[key] = value
                
                metadata["data"] = metadata_dict
            
            return metadata
            
        except Exception as e:
            logger.error(f"Error extracting video metadata: {e}")
            metadata["status"] = "error"
            metadata["error"] = str(e)
            return metadata

    @staticmethod
    def extract_metadata(file_path, file_name=""):
        """
        Extract metadata from any file (auto-detect type)
        
        Args:
            file_path: Path to file
            file_name: Original file name (for type detection)
            
        Returns:
            dict with metadata information
        """
        file_ext = os.path.splitext(file_name or file_path)[1].lower()
        
        # Image extensions
        image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.heic', '.heif'}
        
        # Video extensions
        video_extensions = {'.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv', '.wmv', '.m4v', '.3gp'}
        
        if file_ext in image_extensions:
            return MetadataExtractor.extract_image_metadata(file_path)
        elif file_ext in video_extensions:
            return MetadataExtractor.extract_video_metadata(file_path)
        else:
            # Try image first, then video
            try:
                result = MetadataExtractor.extract_image_metadata(file_path)
                if result["status"] == "success" and result["data"]:
                    return result
            except:
                pass
            
            try:
                result = MetadataExtractor.extract_video_metadata(file_path)
                if result["status"] == "success" and result["data"]:
                    return result
            except:
                pass
            
            return {
                "type": "unknown",
                "status": "error",
                "error": f"Unsupported file format: {file_ext}"
            }

    @staticmethod
    def extract_year_from_metadata(file_path, file_name=""):
        """
        Extract the year from file metadata
        
        Args:
            file_path: Path to file
            file_name: Original file name (for type detection)
            
        Returns:
            int (year) or None if not found
        """
        try:
            metadata = MetadataExtractor.extract_metadata(file_path, file_name)
            
            if metadata["status"] != "success" or not metadata.get("data"):
                return None
            
            data = metadata["data"]
            year = None
            
            # For images - look for EXIF DateTimeOriginal or DateTime
            if metadata["type"] == "image":
                exif_data = data.get("exif", {})
                
                # Try common EXIF date fields
                date_fields = ["DateTimeOriginal", "DateTime", "DateTimeDigitized", "Date Time"]
                for field in date_fields:
                    if field in exif_data:
                        date_str = exif_data[field]
                        try:
                            # Common format: "2023:12:14 10:30:45"
                            if ':' in date_str:
                                year = int(date_str.split(':')[0])
                                if year > 1900 and year <= datetime.now().year:
                                    return year
                        except:
                            pass
                
                # Try other info fields
                other_info = data.get("other_info", {})
                for field in date_fields:
                    if field in other_info:
                        date_str = other_info[field]
                        try:
                            if ':' in date_str:
                                year = int(date_str.split(':')[0])
                                if year > 1900 and year <= datetime.now().year:
                                    return year
                        except:
                            pass
            
            # For videos - look for Creation Time or Duration
            elif metadata["type"] == "video":
                # Try common video metadata fields
                date_fields = ["Creation Time", "creation time", "Date", "date"]
                for field in date_fields:
                    if field in data:
                        date_str = str(data[field])
                        try:
                            # Try to extract year (often in format like "2023-12-14 10:30:45")
                            for part in date_str.split():
                                try:
                                    year = int(part.split('-')[0] if '-' in part else part)
                                    if year > 1900 and year <= datetime.now().year:
                                        return year
                                except:
                                    pass
                        except:
                            pass
            
            return None
            
        except Exception as e:
            logger.warning(f"Error extracting year from metadata: {e}")
            return None
