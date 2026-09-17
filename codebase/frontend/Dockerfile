FROM node:20-alpine

# Cài đặt libc6-compat (hỗ trợ Next.js) và python3/pip cho agent bridge (/api/classroom)
RUN apk add --no-cache libc6-compat python3 py3-pip

WORKDIR /app/frontend

# Cài đặt dependencies của frontend
COPY package.json package-lock.json ./
RUN npm install

# Cài đặt python dependencies cho Next.js server bridge gọi classroom_api.py
RUN pip install --no-cache-dir --break-system-packages \
    "openai>=1.0.0" \
    "anthropic>=0.34.0" \
    "google-genai>=0.8.0" \
    "PyYAML>=6.0" \
    "requests>=2.31.0" \
    "python-pptx>=1.0"

# Copy mã nguồn frontend
COPY . .

EXPOSE 3000

ENV PORT=3000 \
    HOSTNAME="0.0.0.0" \
    NODE_ENV=development

CMD ["npm", "run", "dev"]
