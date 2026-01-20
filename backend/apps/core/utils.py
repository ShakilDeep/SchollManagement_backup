from datetime import datetime, date
from typing import Any, Dict, List
import calendar


def date_range(start_date: date, end_date: date):
    for n in range(int((end_date - start_date).days) + 1):
        yield start_date + n


def get_month_days(year: int, month: int) -> List[date]:
    num_days = calendar.monthrange(year, month)[1]
    return [date(year, month, day) for day in range(1, num_days + 1)]


def calculate_age(birth_date: date) -> int:
    today = date.today()
    return today.year - birth_date.year - (
        (today.month, today.day) < (birth_date.month, birth_date.day)
    )


def calculate_percentage(part: float, total: float) -> float:
    if total == 0:
        return 0.0
    return round((part / total) * 100, 2)


def sanitize_input(data: Dict[str, Any]) -> Dict[str, Any]:
    sanitized = {}
    for key, value in data.items():
        if isinstance(value, str):
            sanitized[key] = value.strip()
        else:
            sanitized[key] = value
    return sanitized


def format_error_response(errors: List[str]) -> Dict[str, Any]:
    return {
        'success': False,
        'errors': errors,
        'timestamp': datetime.utcnow().isoformat()
    }


def format_success_response(data: Any, message: str = 'Success') -> Dict[str, Any]:
    return {
        'success': True,
        'message': message,
        'data': data,
        'timestamp': datetime.utcnow().isoformat()
    }
