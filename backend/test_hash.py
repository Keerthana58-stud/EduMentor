import utils
import sys

def test_hash():
    password = "password123"
    print(f"Testing hashing for: {password}")
    try:
        h = utils.get_password_hash(password)
        print(f"Hashed: {h}")
        v = utils.verify_password(password, h)
        print(f"Verified: {v}")
    except Exception as e:
        print(f"Hashing failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    test_hash()
