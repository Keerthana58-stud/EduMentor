import asyncio
import os
from groq import AsyncGroq
from database import settings

async def test_groq():
    api_key = settings.groq_api_key
    print(f"Testing Groq with API Key prefix: {api_key[:10]}...")
    client = AsyncGroq(api_key=api_key)
    
    try:
        print("Sending test completion request...")
        completion = await client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": "Hello, are you working?"}],
        )
        print("Response received!")
        print(f"Content: {completion.choices[0].message.content}")
    except Exception as e:
        print(f"GROQ FAILURE: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_groq())
