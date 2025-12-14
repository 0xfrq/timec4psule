import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
import json
import time
import os
import random
import requests

class GrokImageGenerator:
    def __init__(self, cookies_file="grok_cookies.json"):
        self.cookies_file = cookies_file
        self.driver = None
        
    def setup_driver(self, user_data_dir=None):
        if self.driver:
            print("Driver already running, reuse existing Chrome")
            return self.driver
        print("Initializing undetected Chrome driver...")
        
        options = uc.ChromeOptions()

        prefs = {
            "download.default_directory": os.path.abspath("."),
            "download.prompt_for_download": False,
            "download.directory_upgrade": True,
            "safebrowsing.enabled": True
        }
        options.add_experimental_option("prefs", prefs)

        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_argument('--no-sandbox')
        options.add_argument('--start-maximized')
        options.add_argument('--disable-gpu')

        width = random.randint(1366, 1920)
        height = random.randint(768, 1080)
        options.add_argument(f'--window-size={width},{height}')

        try:
            self.driver = uc.Chrome(options=options)
        except Exception as e:
            print(f"Error: {e}")
            options = uc.ChromeOptions()
            self.driver = uc.Chrome(options=options)

        try:
            self.driver.execute_script(
                "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
            )
        except:
            pass

        time.sleep(random.uniform(2, 4))
        print("Driver initialized")

        return self.driver

        
    def human_delay(self, min_sec=1, max_sec=3):
        time.sleep(random.uniform(min_sec, max_sec))
        
    def slow_type(self, element, text):
        for char in text:
            element.send_keys(char)
            time.sleep(random.uniform(0.05, 0.2))
    
    def save_cookies(self):
        try:
            cookies = self.driver.get_cookies()
            with open(self.cookies_file, 'w') as f:
                json.dump(cookies, f, indent=2)
            print(f"Cookies saved to {self.cookies_file}")
            print(f"Saved {len(cookies)} cookies")
        except Exception as e:
            print(f"Error saving cookies: {e}")
        
    def load_cookies(self):
        # Resolve absolute path
        cookies_path = self.cookies_file
        if not os.path.isabs(cookies_path):
            # If relative path, resolve it relative to this file's directory
            cookies_path = os.path.join(
                os.path.dirname(__file__),
                self.cookies_file
            )
        
        if not os.path.exists(cookies_path):
            print(f"No cookie file found at: {cookies_path}")
            return False
        
        try:
            with open(cookies_path, 'r') as f:
                cookies = json.load(f)
            
            if not cookies:
                print("Cookie file is empty")
                return False
            
            print(f"Loading {len(cookies)} cookies from {cookies_path}...")
            
            self.driver.get("https://grok.com")
            self.human_delay(2, 3)
            
            added_count = 0
            for cookie in cookies:
                try:
                    if 'expiry' in cookie:
                        cookie['expiry'] = int(cookie['expiry'])
                    if 'sameSite' in cookie:
                        if cookie['sameSite'] not in ['Strict', 'Lax', 'None']:
                            cookie['sameSite'] = 'Lax'
                    
                    self.driver.add_cookie(cookie)
                    added_count += 1
                except Exception as e:
                    pass
            
            print(f"✓ Added {added_count}/{len(cookies)} cookies")
            
            self.driver.refresh()
            self.human_delay(2, 3)
            return True
            
        except Exception as e:
            print(f"Error loading cookies: {e}")
            return False
    
    def manual_login_with_steps(self):
        print("\n" + "="*60)
        print("MANUAL LOGIN")
        print("="*60)
        print("\nSTEPS:")
        print("1. Browser will open to grok.com")
        print("2. Click 'Sign in' and log in with X/Twitter")
        print("3. After login, navigate to: https://grok.com/imagine")
        print("4. Wait until you see the image generation interface")
        print("5. Come back here and press ENTER")
        print("="*60 + "\n")
        
        self.driver.get("https://grok.com")
        self.human_delay(3, 5)
        
        input("Press ENTER after you're logged in and on the Imagine page...")
        
        print("Saving login session...")
        self.save_cookies()
        
        current_url = self.driver.current_url
        if 'imagine' not in current_url:
            print("Navigating to Imagine page...")
            self.driver.get("https://grok.com/imagine")
            self.human_delay(2, 3)
        
        print("Login successful!")
        return True
    
    def select_image_mode(self):
        try:
            print("Selecting image mode...")
            
            mode_selectors = [
                'button[aria-label*="image"]',
                'button[aria-label*="Image"]',
                'div[role="tab"][aria-label*="image"]',
                'button:has(svg)',
            ]
            
            for selector in mode_selectors:
                try:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    for elem in elements:
                        text = elem.get_attribute('aria-label') or elem.text
                        if 'image' in text.lower():
                            elem.click()
                            print("Image mode selected")
                            self.human_delay(1, 2)
                            return True
                except:
                    continue
            
            print("Could not find image mode selector, continuing anyway...")
            return True
        except Exception as e:
            print(f"Error selecting image mode: {e}")
            return True
    
    def generate_images(self, prompt, output_dir="generated_images", num_images=5, wait_time=60):
        try:
            os.makedirs(output_dir, exist_ok=True)
            
            print("\nNavigating to Grok Imagine...")
            self.driver.get("https://grok.com/imagine")
            self.human_delay(5, 8)
            
            self.select_image_mode()
            
            print("Looking for prompt input...")
            input_selectors = [
                'div[contenteditable="true"][data-placeholder*="imagine"]',
                'div.tiptap[contenteditable="true"]',
                'div[contenteditable="true"]',
            ]
            
            input_field = None
            for selector in input_selectors:
                try:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    if elements:
                        input_field = elements[0]
                        print("Found input field")
                        break
                except:
                    continue
            
            if not input_field:
                print("Could not find input field")
                self.driver.save_screenshot("no_input_found.png")
                return False
            
            print(f"Entering prompt: {prompt}")
            input_field.click()
            self.human_delay(0.5, 1)
            
            input_field.send_keys(Keys.CONTROL + "a")
            input_field.send_keys(Keys.BACKSPACE)
            self.human_delay(0.3, 0.5)
            
            self.slow_type(input_field, prompt)
            self.human_delay(1, 2)
            
            print("Submitting prompt...")
            submit_selectors = [
                'button[type="submit"][aria-label="Submit"]',
                'button[aria-label="Submit"]',
                'button[type="submit"]'
            ]
            
            submitted = False
            for selector in submit_selectors:
                try:
                    buttons = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    for btn in buttons:
                        if not btn.get_attribute('disabled'):
                            btn.click()
                            print("Submitted!")
                            submitted = True
                            break
                    if submitted:
                        break
                except:
                    continue
            
            if not submitted:
                input_field.send_keys(Keys.RETURN)
                print("Submitted via Enter key")
            
            print(f"\nWaiting {wait_time} seconds for images to generate...")
            for i in range(0, wait_time, 10):
                time.sleep(10)
                print(f"{i+10}/{wait_time} seconds")
            
            print("\nScrolling to view all images...")
            self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            self.human_delay(2, 3)
            
            print(f"Looking for generated images (getting top {num_images})...")
            
            image_containers = self.driver.find_elements(
                By.CSS_SELECTOR, 
                'div[role="listitem"] img[alt*="Generated"]'
            )
            
            if not image_containers:
                image_containers = self.driver.find_elements(By.CSS_SELECTOR, 'img[alt*="Generated"]')
            
            if not image_containers:
                print("No images found!")
                self.driver.save_screenshot("no_images_found.png")
                return False
            
            print(f"Found {len(image_containers)} generated images")
            
            images_to_download = image_containers[:num_images]
            downloaded_files = []
            
            main_window = self.driver.current_window_handle
            
            for idx, img_element in enumerate(images_to_download, 1):
                try:
                    print(f"\nProcessing image {idx}/{len(images_to_download)}...")
                    
                    self.driver.switch_to.window(main_window)
                    self.human_delay(1, 2)
                    
                    try:
                        self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", img_element)
                        self.human_delay(1, 2)
                    except:
                        print(f"Re-finding image {idx}...")
                        image_containers = self.driver.find_elements(
                            By.CSS_SELECTOR, 
                            'div[role="listitem"] img[alt*="Generated"]'
                        )
                        if idx <= len(image_containers):
                            img_element = image_containers[idx-1]
                            self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", img_element)
                            self.human_delay(1, 2)
                        else:
                            print(f"Could not find image {idx}")
                            continue
                    
                    print(f"Clicking image {idx}...")
                    img_element.click()
                    self.human_delay(2, 3)
                    
                    print(f"Looking for download button...")
                    download_button = None
                    
                    download_selectors = [
                        'button[aria-label="Download"]',
                        'button:has(svg.lucide-download)',
                        'svg.lucide-download',
                    ]
                    
                    for selector in download_selectors:
                        try:
                            elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                            for elem in elements:
                                try:
                                    if elem.is_displayed():
                                        download_button = elem
                                        if 'svg' in selector:
                                            download_button = elem.find_element(By.XPATH, '..')
                                        break
                                except:
                                    continue
                            if download_button:
                                break
                        except:
                            continue
                    
                    if not download_button:
                        print(f"No download button found, trying to get image URL...")
                        
                        main_images = self.driver.find_elements(By.CSS_SELECTOR, 'img[src*="http"]')
                        for main_img in main_images:
                            try:
                                if main_img.size['width'] > 300:
                                    img_url = main_img.get_attribute('src')
                                    if img_url and ('grok' in img_url or 'twimg' in img_url):
                                        print(f"Found image URL, downloading...")
                                        response = requests.get(img_url, headers={
                                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                                        })
                                        ext = 'jpg' if 'jpg' in img_url or 'jpeg' in img_url else 'png'
                                        new_filename = f"{output_dir}/image_{idx}.{ext}"
                                        with open(new_filename, 'wb') as f:
                                            f.write(response.content)
                                        print(f"Downloaded: {new_filename}")
                                        downloaded_files.append(new_filename)
                                        break
                            except:
                                continue
                        
                        try:
                            self.driver.find_element(By.TAG_NAME, 'body').send_keys(Keys.ESCAPE)
                            self.human_delay(1, 2)
                        except:
                            pass
                        continue
                    
                    windows_before = len(self.driver.window_handles)
                    
                    print(f"Clicking download button...")
                    download_button.click()
                    self.human_delay(2, 3)
                    
                    windows_after = len(self.driver.window_handles)
                    
                    if windows_after > windows_before:
                        print(f"New tab opened, switching to download tab...")
                        new_window = [w for w in self.driver.window_handles if w != main_window][0]
                        self.driver.switch_to.window(new_window)
                        self.human_delay(2, 3)
                        
                        current_url = self.driver.current_url
                        print(f"Download URL: {current_url[:80]}...")
                        
                        try:
                            response = requests.get(current_url, headers={
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                            })
                            
                            ext = 'jpg'
                            if '.png' in current_url:
                                ext = 'png'
                            elif '.webp' in current_url:
                                ext = 'webp'
                            elif 'content-type' in response.headers:
                                content_type = response.headers['content-type']
                                if 'png' in content_type:
                                    ext = 'png'
                                elif 'webp' in content_type:
                                    ext = 'webp'
                            
                            new_filename = f"{output_dir}/image_{idx}.{ext}"
                            with open(new_filename, 'wb') as f:
                                f.write(response.content)
                            
                            print(f"Downloaded: {new_filename}")
                            downloaded_files.append(new_filename)
                        except Exception as e:
                            print(f"Failed to download from URL: {e}")
                        
                        print(f"Closing download tab...")
                        self.driver.close()
                        
                        self.driver.switch_to.window(main_window)
                        print(f"Back to main window")
                        self.human_delay(1, 2)
                    else:
                        print(f"Checking for downloaded file...")
                        time.sleep(3)
                        
                        files = [f for f in os.listdir('.') if f.endswith(('.png', '.jpg', '.jpeg', '.webp'))]
                        if files:
                            latest_file = max(files, key=lambda x: os.path.getctime(x))
                            if os.path.getctime(latest_file) > time.time() - 10:
                                ext = latest_file.split('.')[-1]
                                new_filename = f"{output_dir}/image_{idx}.{ext}"
                                os.rename(latest_file, new_filename)
                                print(f"Downloaded: {new_filename}")
                                downloaded_files.append(new_filename)
                    
                    try:
                        self.driver.switch_to.window(main_window)
                        self.driver.find_element(By.TAG_NAME, 'body').send_keys(Keys.ESCAPE)
                        self.human_delay(1, 2)
                    except:
                        pass
                    
                except Exception as e:
                    print(f"Error with image {idx}: {e}")
                    import traceback
                    traceback.print_exc()
                    
                    try:
                        self.driver.switch_to.window(main_window)
                    except:
                        pass
                    continue
            
            print(f"\nSuccessfully processed {len(downloaded_files)} images!")
            print(f"Saved in: {output_dir}/")
            for f in downloaded_files:
                print(f"- {f}")
            
            return len(downloaded_files) > 0
            
        except Exception as e:
            print(f"Error generating images: {e}")
            self.driver.save_screenshot("error_screenshot.png")
            import traceback
            traceback.print_exc()
            return False
    
    def close(self):
        """
        Close browser MANUALLY when you REALLY want to exit
        """
        if self.driver:
            print("Closing Chrome driver...")
            self.driver.quit()
            self.driver = None


# Global generator instance
_generator_instance = None

def get_generator(cookies_file="grok_cookies.json"):
    """Get or create global generator instance with cookies from JSON file"""
    global _generator_instance
    if _generator_instance is None:
        _generator_instance = GrokImageGenerator(cookies_file=cookies_file)
        _generator_instance.setup_driver()
        
        # Try to load cookies from file, if not available do manual login
        if not _generator_instance.load_cookies():
            print("\n⚠️ No cookies found - manual login required")
            print(f"Please ensure {cookies_file} exists or complete manual login\n")
    
    return _generator_instance


def initialize_driver(headless=False):
    """Initialize driver for Django startup"""
    try:
        generator = get_generator()
        print("✅ Grok driver ready for image generation!")
        return True
    except Exception as e:
        print(f"❌ Failed to initialize Grok driver: {e}")
        return False


def generate_grok_images(prompt, num_images=4, output_dir="generated_images"):
    """
    Generate images using Grok and return structured data
    
    Args:
        prompt: Text prompt for image generation
        num_images: Number of images to generate (default: 4)
        output_dir: Directory to save images (default: "generated_images")
    
    Returns:
        List of image dictionaries with structure:
        [
            {
                "filename": "image_1.png",
                "filepath": "/full/path/to/image_1.png",
                "url": "https://...",  # if available
                "base64": "base64_encoded_data"
            },
            ...
        ]
        Returns None if generation failed
    """
    try:
        generator = get_generator()
        
        # Generate images (returns boolean)
        success = generator.generate_images(
            prompt=prompt,
            output_dir=output_dir,
            num_images=num_images,
            wait_time=60
        )
        
        if not success:
            print("❌ Image generation failed")
            return None
        
        # Collect generated image files
        import base64
        images = []
        
        if os.path.exists(output_dir):
            # Get all image files from output directory
            image_files = [f for f in os.listdir(output_dir) 
                          if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))]
            
            image_files.sort()  # Sort for consistent ordering
            
            for img_file in image_files:
                filepath = os.path.join(output_dir, img_file)
                
                # Read and encode as base64
                with open(filepath, 'rb') as f:
                    img_data = f.read()
                    b64_data = base64.b64encode(img_data).decode('utf-8')
                
                images.append({
                    "filename": img_file,
                    "filepath": os.path.abspath(filepath),
                    "base64": b64_data,
                    "url": ""  # URL not available from file download
                })
        
        print(f"✅ Successfully prepared {len(images)} images for API response")
        return images
        
    except Exception as e:
        print(f"❌ Error in generate_grok_images: {e}")
        import traceback
        traceback.print_exc()
        return None


