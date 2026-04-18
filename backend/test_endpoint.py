import asyncio
import httpx

async def test_endpoint():
    # Attempt to call the local backend if it's running
    # If not, we'll try to import and run the router logic directly
    url = "http://localhost:8000/admin/students"
    print(f"Testing GET {url}...")
    try:
        async with httpx.AsyncClient() as client:
            # We don't have a token here, but we can see if it returns 401 or 500
            # A 500 would indicate a code error. A 401 is expected.
            resp = await client.get(url)
            print(f"Status: {resp.status_code}")
            print(f"Body: {resp.text[:200]}")
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_endpoint())
