FROM node:20-slim

# USER root  # Switch to root user temporarily for installation

# Install OpenSSL 1.1
RUN apt-get update && \
    apt-get install -y libssl-dev && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*
    
RUN apt-get update && apt-get install -y procps && rm -rf /var/lib/apt/lists/*

WORKDIR /home/node/app

USER node

CMD ["tail", "-f", "/dev/null"]