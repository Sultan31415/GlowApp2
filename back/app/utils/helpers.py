import json
import traceback
from typing import Any, Dict
from fastapi import HTTPException

def safe_json_parse(data: str) -> Dict[str, Any]:
    """Safely parse JSON string with error handling"""
    try:
        return json.loads(data)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON format: {str(e)}")

def log_error(error: Exception, context: str = "") -> None:
    """Log error with context for debugging"""
    print(f"Error in {context}: {str(error)}")
    print(f"Traceback: {traceback.format_exc()}")

def validate_required_fields(data: Dict[str, Any], required_fields: list) -> None:
    """Validate that required fields are present in data"""
    missing_fields = [field for field in required_fields if field not in data]
    if missing_fields:
        raise HTTPException(
            status_code=400, 
            detail=f"Missing required fields: {', '.join(missing_fields)}"
        ) 