#!/bin/bash

# Traps a signal to kill all background jobs upon script termination.
# This ensures a clean shutdown of all started processes.
trap 'kill $(jobs -p)' EXIT

echo "Starting Docker Compose for Postgres Vector DB..."
docker-compose up -d

echo "Waiting for Docker containers to be healthy..."

# Loop until a container with 'postgres' in its name is running and healthy.
# The 'docker ps' command is reliable on any system with Docker installed.
while ! docker ps --filter "name=postgres" --format '{{.Status}}' | grep -q 'healthy'; do
  sleep 1 # Wait for 1 second before checking again
done

echo "Docker containers are ready. Installing dependencies..."

# Install backend dependencies
echo "Installing backend dependencies..."
cd server
npm install

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd ../client
npm install

echo "Dependencies installed. Starting backend and frontend..."

# Start backend in the background and capture its Process ID (PID)
cd ../server
npm run dev &
BACKEND_PID=$!

# Start frontend in the background and capture its PID
cd ../client
npm run dev &
FRONTEND_PID=$!

echo "Backend (PID: $BACKEND_PID) and frontend (PID: $FRONTEND_PID) are running."
echo "Press Ctrl+C to stop both processes gracefully."

# Wait for the background processes to finish.
wait $BACKEND_PID
wait $FRONTEND_PID

echo "All processes have been stopped."