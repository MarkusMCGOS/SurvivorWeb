import json
import os
import re
import google.generativeai as genai
from google.generativeai import types

# Initialize Gemini client
GEMINI_API_KEY = "AIzaSyB9fjhhuKNno3zPftuZcwDbvzlc6eb345c"
genai.configure(api_key=GEMINI_API_KEY)

def clean_text_for_json(text):
    """Clean text to make it JSON-safe."""
    # Replace problematic characters
    text = text.replace('\n', '\\n')
    text = text.replace('\r', '\\r')
    text = text.replace('\t', '\\t')
    # Handle unescaped quotes within strings more carefully
    # This is a more sophisticated approach to handle nested quotes
    print(text)
    return text

def extract_json(text):
    """Extract JSON object from text response with improved parsing."""
    # First, try to find JSON with a more robust approach
    # Look for the pattern: { ... "passed": ... "score": ... "explanation": ... "feedback": ... }
    
    # Clean the text first
    cleaned_text = clean_text_for_json(text)
    
    print(f"Attempting to extract JSON from text of length: {len(cleaned_text)}")
    
    # Try multiple extraction strategies
    strategies = [
        # Strategy 0: Direct JSON parsing (most common case)
        lambda t: extract_direct_json(t),
        # Strategy 1: Find complete JSON objects
        lambda t: extract_complete_json(t),
        # Strategy 2: Use regex to find JSON-like structures
        lambda t: extract_json_regex(t),
        # Strategy 3: Manual parsing for malformed JSON
        lambda t: extract_json_manual(t)
    ]
    
    strategy_names = ["direct_json", "complete_json", "regex", "manual"]
    
    for i, strategy in enumerate(strategies):
        try:
            print(f"Trying strategy {i+1}: {strategy_names[i]}")
            result = strategy(cleaned_text)
            if result:
                print(f"Strategy {i+1} succeeded!")
                return result
            else:
                print(f"Strategy {i+1} returned None")
        except Exception as e:
            print(f"Strategy {i+1} failed with error: {e}")
            continue
    
    print("All strategies failed")
    return None

def extract_direct_json(text):
    """Try to parse the entire text as JSON directly."""
    try:
        # Try to parse the entire text as JSON
        obj = json.loads(text.strip())
        if validate_json_structure(obj):
            print("Direct JSON parsing succeeded!")
            return obj
    except json.JSONDecodeError as e:
        print(f"Direct JSON parsing failed: {e}")
        
        # Try with some basic cleaning
        try:
            # Remove any leading/trailing whitespace and try again
            cleaned_text = text.strip()
            # Try to find the JSON object boundaries
            start = cleaned_text.find('{')
            end = cleaned_text.rfind('}')
            if start != -1 and end != -1 and end > start:
                json_text = cleaned_text[start:end+1]
                obj = json.loads(json_text)
                if validate_json_structure(obj):
                    print("Direct JSON parsing succeeded after cleaning!")
                    return obj
        except json.JSONDecodeError as e2:
            print(f"Direct JSON parsing failed after cleaning: {e2}")
        except Exception as e2:
            print(f"Direct JSON parsing failed with unexpected error after cleaning: {e2}")
    except Exception as e:
        print(f"Direct JSON parsing failed with unexpected error: {e}")
    return None

def extract_complete_json(text):
    """Extract complete JSON objects from text."""
    start_idx = text.find('{')
    while start_idx != -1:
        depth = 0
        in_string = False
        escape_next = False
        
        for idx in range(start_idx, len(text)):
            char = text[idx]
            
            if escape_next:
                escape_next = False
                continue
                
            if char == '\\':
                escape_next = True
                continue
                
            if char == '"' and not escape_next:
                in_string = not in_string
                continue
                
            if not in_string:
                if char == '{':
                    depth += 1
                elif char == '}':
                    depth -= 1
                    if depth == 0:
                        candidate = text[start_idx:idx+1]
                        try:
                            # Try to parse as JSON
                            obj = json.loads(candidate)
                            if validate_json_structure(obj):
                                return obj
                        except json.JSONDecodeError:
                            # Try with additional cleaning
                            try:
                                cleaned_candidate = clean_json_candidate(candidate)
                                obj = json.loads(cleaned_candidate)
                                if validate_json_structure(obj):
                                    return obj
                            except json.JSONDecodeError:
                                # Try manual extraction as fallback
                                try:
                                    manual_result = extract_json_manual(candidate)
                                    if manual_result:
                                        return manual_result
                                except Exception:
                                    pass
                        break
        start_idx = text.find('{', start_idx+1)
    return None

def extract_json_regex(text):
    """Extract JSON using regex patterns."""
    # Look for JSON-like structures with required fields
    patterns = [
        r'\{[^{}]*"passed"\s*:\s*(true|false)[^{}]*"score"\s*:\s*\d+[^{}]*"explanation"\s*:\s*"[^"]*"[^{}]*"feedback"\s*:\s*"[^"]*"[^{}]*\}',
        r'\{[^{}]*"passed"\s*:\s*(true|false)[^{}]*"explanation"\s*:\s*"[^"]*"[^{}]*"score"\s*:\s*\d+[^{}]*"feedback"\s*:\s*"[^"]*"[^{}]*\}'
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, text, re.IGNORECASE | re.DOTALL)
        for match in matches:
            try:
                # Try to reconstruct JSON from match
                if isinstance(match, tuple):
                    # Handle group matches
                    continue
                obj = json.loads(match)
                if validate_json_structure(obj):
                    return obj
            except (json.JSONDecodeError, TypeError):
                continue
    return None

def extract_json_manual(text):
    """Manually extract JSON fields from text."""
    # Look for key-value pairs and try to reconstruct JSON
    result = {}
    
    print("Manual extraction: Starting field extraction...")
    
    # Extract passed
    passed_match = re.search(r'"passed"\s*:\s*(true|false)', text, re.IGNORECASE)
    if passed_match:
        result['passed'] = passed_match.group(1).lower() == 'true'
        print(f"Manual extraction: Found passed = {result['passed']}")
    else:
        print("Manual extraction: No passed field found")
    
    # Extract score
    score_match = re.search(r'"score"\s*:\s*(\d+)', text)
    if score_match:
        result['score'] = int(score_match.group(1))
        print(f"Manual extraction: Found score = {result['score']}")
    else:
        print("Manual extraction: No score field found")
    
    # Extract explanation with simpler, more robust pattern
    # Look for everything between "explanation": " and the next quote followed by comma or closing brace
    explanation_pattern = r'"explanation"\s*:\s*"([^"]*(?:\\.[^"]*)*)"'
    explanation_match = re.search(explanation_pattern, text, re.DOTALL)
    if explanation_match:
        explanation_text = explanation_match.group(1)
        # Handle escaped quotes and newlines
        explanation_text = explanation_text.replace('\\"', '"').replace('\\n', '\n').replace('\\t', '\t')
        result['explanation'] = explanation_text
        print(f"Manual extraction: Found explanation (length: {len(explanation_text)})")
    else:
        print("Manual extraction: No explanation field found")
        # Try alternative pattern for explanation
        alt_explanation_pattern = r'"explanation"\s*:\s*"(.*?)"(?=\s*,|\s*})'
        alt_explanation_match = re.search(alt_explanation_pattern, text, re.DOTALL)
        if alt_explanation_match:
            explanation_text = alt_explanation_match.group(1)
            explanation_text = explanation_text.replace('\\"', '"').replace('\\n', '\n').replace('\\t', '\t')
            result['explanation'] = explanation_text
            print(f"Manual extraction: Found explanation with alt pattern (length: {len(explanation_text)})")
    
    # Extract feedback with simpler, more robust pattern
    feedback_pattern = r'"feedback"\s*:\s*"([^"]*(?:\\.[^"]*)*)"'
    feedback_match = re.search(feedback_pattern, text, re.DOTALL)
    if feedback_match:
        feedback_text = feedback_match.group(1)
        # Handle escaped quotes and newlines
        feedback_text = feedback_text.replace('\\"', '"').replace('\\n', '\n').replace('\\t', '\t')
        result['feedback'] = feedback_text
        print(f"Manual extraction: Found feedback (length: {len(feedback_text)})")
    else:
        print("Manual extraction: No feedback field found")
        # Try alternative pattern for feedback
        alt_feedback_pattern = r'"feedback"\s*:\s*"(.*?)"(?=\s*,|\s*})'
        alt_feedback_match = re.search(alt_feedback_pattern, text, re.DOTALL)
        if alt_feedback_match:
            feedback_text = alt_feedback_match.group(1)
            feedback_text = feedback_text.replace('\\"', '"').replace('\\n', '\n').replace('\\t', '\t')
            result['feedback'] = feedback_text
            print(f"Manual extraction: Found feedback with alt pattern (length: {len(feedback_text)})")
    
    print(f"Manual extraction: Found {len(result)} fields")
    if len(result) == 4:
        print("Manual extraction: All fields found, returning result")
        return result
    else:
        print(f"Manual extraction: Missing fields, only found: {list(result.keys())}")
        return None

def clean_json_candidate(candidate):
    """Clean a JSON candidate string."""
    # Remove any non-ASCII characters that might cause issues
    candidate = ''.join(ch if ord(ch) < 128 else ' ' for ch in candidate)
    
    # Handle common JSON issues
    # First, let's try to fix unescaped quotes within strings
    lines = candidate.split('\n')
    cleaned_lines = []
    in_string = False
    escape_next = False
    
    for line in lines:
        cleaned_line = ""
        i = 0
        while i < len(line):
            char = line[i]
            
            if escape_next:
                cleaned_line += char
                escape_next = False
                i += 1
                continue
                
            if char == '\\':
                cleaned_line += char
                escape_next = True
                i += 1
                continue
                
            if char == '"':
                if not in_string:
                    # Starting a string
                    in_string = True
                    cleaned_line += char
                else:
                    # Check if this quote is followed by a comma, colon, or closing brace
                    # which would indicate the end of the string
                    next_chars = line[i+1:].strip()
                    if (next_chars.startswith(',') or 
                        next_chars.startswith('}') or 
                        next_chars.startswith('"') or
                        ':' in next_chars[:5]):
                        # This is likely the end of the string
                        in_string = False
                        cleaned_line += char
                    else:
                        # This is likely an unescaped quote within the string
                        cleaned_line += '\\' + char
                i += 1
                continue
                
            cleaned_line += char
            i += 1
            
        cleaned_lines.append(cleaned_line)
    
    result = '\n'.join(cleaned_lines)
    
    # Additional cleaning: replace any remaining problematic characters
    result = result.replace('\t', '\\t')
    result = result.replace('\r', '\\r')
    
    return result

def validate_json_structure(obj):
    """Validate that the JSON object has the required structure."""
    if not isinstance(obj, dict):
        return False
    
    required_keys = {"passed", "score", "explanation", "feedback"}
    if not required_keys.issubset(obj.keys()):
        return False
    
    # Validate types
    if not isinstance(obj.get("passed"), bool):
        return False
    
    try:
        score = int(obj.get("score", 0))
        if not (0 <= score <= 100):
            return False
    except (ValueError, TypeError):
        return False
    
    if not isinstance(obj.get("explanation"), str):
        return False
    
    if not isinstance(obj.get("feedback"), str):
        return False
    
    return True

def evaluate_response(question: str, answer: str) -> dict:
    """
    Evaluate a student's response using Gemini API.
    
    Args:
        question: The scenario question
        answer: The student's response
        
    Returns:
        dict: Evaluation result with success, explanation, score, and feedback
    """
    try:
        print("Starting evaluation with Gemini...")
        print(f"Question length: {len(question)}")
        print(f"Answer length: {len(answer)}")
        
        # Check answer length before proceeding
        # if len(answer.strip()) < 100:
        #     return {
        #         "passed": False,
        #         "explanation": "The response was too short to be meaningful. The team members looked at each other in confusion, wondering if this was a joke or a mistake.",
        #         "score": 0,
        #         "feedback": "Please provide a serious, detailed response that addresses the scenario and all required aspects."
        #     }

        # Create the system instruction and user message
        system_instruction = """You are a 3rd person narrator telling a story about what happens when a student responds to a situation. You must ALWAYS respond with a valid JSON object containing your narrative. Never respond with plain text or any other format. Do not include any text before or after the JSON object. IMPORTANT: Use only simple quotes and avoid any special characters that could break JSON parsing."""
        
        user_message = f"""You are narrating, in 3rd person, what happens when a student tries to help with this situation:

Question: {question}
Student's Response: {answer}

Rules for Evaluation:
You are Professor Great Brain. You are fair. The student response must show critical thinking, emotional intelligence, and actual effort, at a Grade 7 level.


    If the student repeats phrases without elaboration, fail them.
    
    If the student puts in effort and it makes sense at a Grade 7 level, pass them.

    If the response is missing detail, logic, or creativity, fail them.

    If the response is a copy/paste or filler, fail them.

    You must write the explanation as a 3rd-person story about how the student's poor response caused the group to fall apart or fail.

    Be funny, dramatic, and clear in the story.

    Output only valid JSON, in this exact format:

{{
  "passed": false,
  "explanation": "A dramatic and humorous story showing how the student failed. Use only simple quotes and avoid special characters.",
  "score": 98,
  "feedback": "Specific, clear, and constructive feedback. Use only simple quotes and avoid special characters."
}}

Do not pass the student unless the story shows they demonstrated leadership, detail, and emotional awareness — in a well-written response."""

        try:
            # Call Gemini API
            model = genai.GenerativeModel(
                model_name="gemini-2.5-flash-lite-preview-06-17",
                generation_config=genai.types.GenerationConfig(
                    temperature=0.7,
                ),
                system_instruction=system_instruction
            )

            response = model.generate_content(user_message)
            
            print("Generated response from Gemini")
            
            # Extract the text response
            gemini_text = response.text
            print("\n=== Raw Gemini Output ===")
            print(gemini_text)
            print("========================\n")

            result = extract_json(gemini_text)
            if result is not None:
                # Sanitize the result
                result = sanitize_json(result)
                print(f"Successfully parsed and sanitized JSON: {result}")
                return result

            print("Failed to parse JSON. Returning default response.")
            return {
                "passed": False,
                "explanation": "Failed to parse Gemini response",
                "score": 0,
                "feedback": "Please try again with a different response."
            }
            
        except Exception as gen_error:
            print(f"Error during Gemini generation: {str(gen_error)}")
            raise
            
    except Exception as e:
        print(f"Unexpected error in evaluate_response: {str(e)}")
        print(f"Error type: {type(e)}")
        raise

def sanitize_json(obj):
    """Ensure obj contains exactly required keys with correct types."""
    if not isinstance(obj, dict):
        return None
    # Remove disallowed keys
    ALLOWED_KEYS = {"passed", "explanation", "score", "feedback"}
    obj = {k: v for k, v in obj.items() if k in ALLOWED_KEYS}
    # Ensure all keys exist
    for key in ALLOWED_KEYS:
        obj.setdefault(key, "" if key != "passed" else False)
    # Type conversions
    obj["passed"] = bool(obj.get("passed"))
    # Convert score
    try:
        obj["score"] = int(float(obj.get("score", 0)))
    except Exception:
        obj["score"] = 0
    # Ensure explanation/feedback strings
    obj["explanation"] = str(obj.get("explanation", ""))
    obj["feedback"] = str(obj.get("feedback", ""))
    # Clip score
    obj["score"] = max(0, min(100, obj["score"]))
    return obj


