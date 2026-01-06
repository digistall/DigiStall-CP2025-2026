# Violation Evidence Uploads

This directory stores photo evidence for violation reports submitted by inspectors.

## Structure
```
violations/
├── {year}/
│   └── {month}/
│       ├── {timestamp}_{uuid}.jpg
│       └── ...
```

## Notes
- Maximum 5 photos per violation report
- Maximum file size: 10MB per photo
- Supported formats: JPEG, PNG
