FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive \
    PIP_NO_CACHE_DIR=1

ARG INSTALL_DOCLING=false

RUN apt-get update \
    && apt-get install -y --no-install-recommends poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/codebase/agents

COPY requirements.txt ./

RUN python -m pip install --upgrade pip
# Keep docling optional so the default dev image stays much smaller.
RUN grep -vi '^docling' requirements.txt > requirements-core.txt \
    && python -m pip install -r requirements-core.txt

RUN if [ "$INSTALL_DOCLING" = "true" ]; then python -m pip install "docling>=2.0"; fi

COPY . /app/codebase/agents

RUN mkdir -p /app/codebase/agents/data/ingested

CMD ["tail", "-f", "/dev/null"]
