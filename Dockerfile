# ==========================================
# STAGE 1: Build the React Frontend
# ==========================================
# We use a Node image to build the client assets
FROM node:18-alpine AS client-builder

# Set working directory for the build
WORKDIR /app/client

# Copy client package files first (better caching)
COPY client/package*.json ./

# Install client dependencies
RUN npm install

# Copy the rest of the client source code
COPY client/ .

# Build the React app (creates /app/client/dist)
RUN npm run build


# ==========================================
# STAGE 2: Setup the Node Server
# ==========================================
# This is the final image that will actually run
FROM node:18-alpine

# Set working directory for the app
WORKDIR /app

# Copy server package files
COPY server/package*.json ./server/

# Install server dependencies
WORKDIR /app/server
RUN npm install

# Copy server source code
COPY server/ .

# Copy the BUILT frontend assets from Stage 1
# We place them in ../client/dist relative to server/index.js, 
# because your server code looks for "../client/dist"
COPY --from=client-builder /app/client/dist ../client/dist

# Expose the port the app runs on
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
