from grok_service import GrokImageGenerator
import time

def run():
    generator = GrokImageGenerator(cookies_file="grok_cookies.json")

    # Setup driver ONCE
    generator.setup_driver()

    # Load cookies / manual login ONCE
    if not generator.load_cookies():
        generator.manual_login_with_steps()

    prompts = [
        "Cyberpunk hacker room, dark, neon monitors"
    ]

    for i, prompt in enumerate(prompts, 1):
        print(f"\n=== RUN {i} ===")

        result = generator.generate_images(
            prompt=prompt,
            output_dir=prompt.replace(" ", "_"),
            num_images=4,
            wait_time=30
        )

        print("Result:", result)

        # optional cooldown (recommended)
        time.sleep(5)

    # ❗TUTUP HANYA KALAU BENAR-BENAR SELESAI
    # generator.close()


if __name__ == "__main__":
    run()
