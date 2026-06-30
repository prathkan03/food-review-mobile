#!/bin/bash

# Load environment variables from .env file
export $(grep -v '^#' .env | xargs)

# Accept port as first argument, default to 8080 if not provided
PORT=${1:-8080}

# Run the Spring Boot application with specified port
./mvnw spring-boot:run -Dspring-boot.run.arguments="--server.port=$PORT"
