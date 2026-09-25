import logging
import sys

from app.core.correlation import get_correlation_id


class CorrelationIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.correlation_id = get_correlation_id()
        return True


def configure_logging(level: int = logging.INFO) -> None:
    """Structured (key=value) logging with the request's correlation id on
    every line, so a request can be traced across Java and Python (section 33)."""

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        logging.Formatter(
            fmt="timestamp=%(asctime)s level=%(levelname)s logger=%(name)s "
            "correlation_id=%(correlation_id)s message=%(message)s"
        )
    )
    handler.addFilter(CorrelationIdFilter())

    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(level)
