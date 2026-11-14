"""Application entrypoint for uvicorn server."""
import uvicorn
from app.main import create_application
from app.core.config import settings

app = create_application()

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.environment == "development",
    )
