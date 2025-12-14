# Quick test script for Grok image generation
# Run with: python -m imagegen.test_grok

import os
import sys

# Add parent directory to path so we can import imagegen
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')

import django
django.setup()

from imagegen import grok_service

def test_driver():
    """Test if driver can be initialized"""
    print("\n" + "="*60)
    print("TESTING GROK DRIVER INITIALIZATION")
    print("="*60 + "\n")
    
    # Set to False to see browser window
    headless = os.environ.get('GROK_HEADLESS', 'false').lower() == 'true'
    print(f"Headless mode: {headless}")
    print(f"(Set $env:GROK_HEADLESS='true' for headless)\n")
    
    success = grok_service.initialize_driver(headless=headless)
    
    if success:
        print("\n✅ Driver initialized successfully!")
        print("Driver is ready on Grok Imagine page")
        
        # Keep browser open for inspection
        if not headless:
            input("\nPress ENTER to close browser...")
        
        return True
    else:
        print("\n❌ Driver initialization failed!")
        return False


def test_generation():
    """Test full image generation"""
    print("\n" + "="*60)
    print("TESTING IMAGE GENERATION")
    print("="*60 + "\n")
    
    prompt = input("Enter image prompt (or press ENTER for default): ").strip()
    if not prompt:
        prompt = "A cute robot eating ice cream"
    
    num_images = 2  # Just 2 for testing
    output_dir = "test_output"
    
    print(f"\nGenerating {num_images} images...")
    print(f"Prompt: {prompt}")
    print(f"Output: {output_dir}\n")
    
    try:
        images = grok_service.generate_grok_images(
            prompt=prompt,
            num_images=num_images,
            output_dir=output_dir
        )
        
        if images:
            print(f"\n✅ SUCCESS! Generated {len(images)} images:")
            for img in images:
                print(f"  - {img['filename']}")
            return True
        else:
            print(f"\n❌ No images generated")
            print(f"Check debug screenshots in: {output_dir}/")
            return False
            
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        print(f"Check debug screenshots in: {output_dir}/")
        return False


def main():
    print("\n" + "="*60)
    print("GROK IMAGE GENERATION TEST SUITE")
    print("="*60)
    
    print("\nOptions:")
    print("1. Test driver initialization only")
    print("2. Test full image generation")
    print("3. Exit")
    
    choice = input("\nEnter choice (1-3): ").strip()
    
    if choice == "1":
        test_driver()
    elif choice == "2":
        # First check if driver is ready
        driver = grok_service.get_driver()
        if not driver.ready:
            print("\n⚠️ Driver not initialized. Initializing now...")
            if not test_driver():
                print("\n❌ Cannot proceed without driver")
                return
        
        test_generation()
    else:
        print("Exiting...")


if __name__ == "__main__":
    main()
