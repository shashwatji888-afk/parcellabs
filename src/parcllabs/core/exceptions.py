"""Domain-specific exceptions for Parcl Labs."""

class ParclLabsError(Exception):
    """Base exception for all Parcl Labs errors."""
    pass

class InvalidDateOfBirthError(ParclLabsError):
    """Raised when a date of birth is invalid, in the future, or cannot be parsed."""
    pass

class DataValidationError(ParclLabsError):
    """Raised when domain validation rules are violated."""
    pass

class MissingPropertyReferenceError(ParclLabsError):
    """Raised when a sold property does not link to a valid client."""
    pass

class ClusteringConfigurationError(ParclLabsError):
    """Raised when clustering parameters or feature matrices are misconfigured."""
    pass
