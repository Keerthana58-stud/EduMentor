import json
import asyncio
import logging
from groq import AsyncGroq, APIError, APIStatusError
from database import settings

logger = logging.getLogger("ai_service")
if not logger.handlers:
    ch = logging.StreamHandler()
    formatter = logging.Formatter('%(levelname)s - %(name)s - %(message)s')
    ch.setFormatter(formatter)
    logger.addHandler(ch)
logger.setLevel(logging.INFO)

# Helper to get Groq client
def get_groq_client():
    if not settings.groq_api_key:
        logger.error("Groq API Key is not set or is empty at runtime!")
    return AsyncGroq(api_key=settings.groq_api_key)

DEFAULT_MODEL = "llama-3.3-70b-versatile"

async def call_groq_api(messages: list, model: str = DEFAULT_MODEL, **kwargs) -> str:
    """Centralized, validated Groq API caller that properly handles errors."""
    
    # 9. Validate the Groq payload format for every call
    if not isinstance(model, str) or not model.strip():
        logger.error(f"Payload validation failed: Invalid model '{model}'")
        raise ValueError("Invalid Groq payload: model must be a non-empty string.")
        
    if not isinstance(messages, list) or not messages:
        logger.error("Payload validation failed: messages missing or empty list.")
        raise ValueError("Invalid Groq payload: messages must be a non-empty list.")
        
    clean_messages = []
    for idx, msg in enumerate(messages):
        if not isinstance(msg, dict):
            logger.error(f"Payload validation failed: message {idx} is not a dict.")
            raise ValueError(f"Invalid Groq payload: message at index {idx} must be a dict.")
            
        # Ensure only valid keys are present if needed, though role/content are the main ones
        if "role" not in msg or "content" not in msg:
            logger.error(f"Payload validation failed: message {idx} missing role/content.")
            raise ValueError(f"Invalid Groq payload: message at index {idx} missing 'role' or 'content'.")
            
        role = msg["role"]
        content = msg["content"]
        
        if role not in ["system", "user", "assistant"]:
            logger.error(f"Payload validation failed: Invalid role '{role}' at index {idx}.")
            raise ValueError(f"Invalid Groq payload: role must be system, user, or assistant.")
            
        if content is None or not isinstance(content, str) or not content.strip():
            logger.error(f"Payload validation failed: message {idx} content is empty or none.")
            raise ValueError("Invalid Groq payload: non-empty content required.")
            
        clean_messages.append({"role": role, "content": content})

    # Strict debugging required by user
    client = get_groq_client()
    used_key_prefix = client.api_key[:10] if client.api_key else "None"
    env_key_prefix = settings.groq_api_key[:10] if settings.groq_api_key else "None"
    
    print("=== GROQ API PRE-FLIGHT CHECK ===")
    print(f"Model: {model}")
    print(f"Messages Structure: {[{'role': m['role'], 'content_length': len(m['content'])} for m in clean_messages]}")
    print(f"Client API Key matches Env Key: {used_key_prefix == env_key_prefix} (Prefix: {used_key_prefix}...)")
    print("=================================")

    try:
        completion = await client.chat.completions.create(
            model=model,
            messages=clean_messages,
            **kwargs
        )
        logger.info(f"Groq API call successful. Model: {model}")
        return completion.choices[0].message.content
        
    except APIStatusError as e:
        status_code = getattr(e, 'status_code', 'Unknown')
        error_body = getattr(e, 'response', None)
        body_text = error_body.text if error_body else str(e)
        print("=== GROQ API STATUS ERROR ===")
        print(f"Status Code: {status_code}")
        print(f"Body: {body_text}")
        print("=============================")
        logger.error(f"Groq API HTTP Error {status_code}. Response Body: {body_text}")
        raise RuntimeError(f"AI Service is temporarily unavailable due to an API error (HTTP {status_code}).") from e
    except APIError as e:
        logger.error(f"Groq API Error: {str(e)}")
        raise RuntimeError("AI connection failed. Please try again.") from e
    except Exception as e:
        logger.error(f"Unexpected Groq API Error: {str(e)}")
        raise RuntimeError("An unexpected error occurred in AI Service.") from e

async def generate_quiz(subject: str, topic: str, difficulty: str, count: int) -> dict:
    prompt = f"""Generate a high-quality multiple-choice quiz about {subject} specifically focusing on the topic: {topic}.
Difficulty level: {difficulty}.
Generate exactly {count} questions.

Return ONLY a valid JSON object with the following structure:
{{
  "title": "Quiz on {topic}",
  "subject": "{subject}",
  "topic": "{topic}",
  "questions": [
    {{
      "question_text": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "The exact text of the correct option"
    }}
  ]
}}
Ensure the JSON is perfectly formatted and contains no other text or explanation."""

    messages = [{"role": "user", "content": prompt}]
    try:
        result = await call_groq_api(
            messages=messages,
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        return json.loads(result)
    except Exception as e:
        logger.error(f"Quiz Generation logic failed: {e}")
        raise RuntimeError(f"Quiz Generation failed: {str(e)}")

async def generate_topic_summary(subject: str, topic: str) -> str:
    prompt = f"""Provide a concise, educational summary for the topic: {topic} in the context of {subject}.
The summary should be about 4-5 sentences and suitable for a student's quick revision.
Focus on key concepts and definitions. 
Return only the summary text without any preamble."""

    messages = [{"role": "user", "content": prompt}]
    try:
        result = await call_groq_api(
            messages=messages,
            temperature=0.6
        )
        return result.strip()
    except Exception as e:
        logger.error(f"Summary Generation logic failed: {e}")
        return f"Unable to generate summary for {topic} at this time."

async def generate_performance_report(student_data: dict, quiz_history: list) -> str:
    try:
        prompt = f"""Act as an academic mentor. Summarize the student's performance:
Student: {student_data.get('username')}
Overall Average: {student_data.get('overall_average')}%
Weak Subjects: {', '.join(student_data.get('weak_subjects', []))}
Recent Quizzes: {json.dumps(quiz_history, default=str)}

Provide a concise, encouraging 2-3 sentence summary of their academic standing and areas to improve."""
        
        messages = [{"role": "user", "content": prompt}]
        result = await call_groq_api(
            messages=messages,
            temperature=0.7
        )
        return result.strip()
    except Exception as e:
        logger.warning(f"Performance report generation failed: {e}. Falling back.")
        return "Keep up the hard work! Review your quiz results to identify areas for improvement."

async def mentor_chat(student_id: str, message: str, context: str) -> str:
    prompt = f"""You are 'EduMentor', a helpful and knowledgeable academic assistant.
Current Student Context: {context}

A student asks: "{message}"

Provide a concise, helpful, and educational response. If the question is not academic, politely guide them back to their studies.
Respond directly to the question without any meta-talk."""
    
    messages = [{"role": "user", "content": prompt}]
    # We don't swallow exceptions here, let callers handle mentor_chat explicitly or use the friendly RuntimeErrors
    result = await call_groq_api(
        messages=messages,
        temperature=0.7,
        max_tokens=500
    )
    return result.strip()
