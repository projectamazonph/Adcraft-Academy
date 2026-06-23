#!/bin/bash

# Puter Integration Setup Script
# This script sets up the Puter AI integration for AdCraft

echo "Setting up Puter integration..."

# Check if PUTER_AUTH_TOKEN is set
if [[ -z "$PUTER_AUTH_TOKEN" ]]; then
    echo "WARNING: PUTER_AUTH_TOKEN environment variable not set."
    echo "Please set it with: export PUTER_AUTH_TOKEN=your_token_here"
    echo "You can get a token from puter.com"
    echo ""
    echo "The application will work but will be limited without authentication."
    echo "For full functionality, please configure the PUTER_AUTH_TOKEN."
    echo ""
fi

# Create a sample .env file if it doesn't exist
if [[ ! -f ../.env ]]; then
    cat > ../.env << EOL
# Puter Configuration
PUTER_AUTH_TOKEN=your_token_here

# NextAuth Configuration (example values - replace with your actual values)
NEXTAUTH_SECRET=generate-a-random-32-char-string-here
NEXTAUTH_URL=https://adcraft-academy.vercel.app

# Database Configuration
DATABASE_URL=postgresql://user:password@host:5432/adcraft?schema=public

# AI Configuration
AI_API_KEY=

# App Configuration
NODE_ENV=production
PORT=3000
EOL
    echo "Created .env file. Please update PUTER_AUTH_TOKEN with your Puter token."
else
    echo ".env file already exists. Please ensure PUTER_AUTH_TOKEN is set."
fi

echo ""
echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Get your Puter auth token from puter.com"
echo "2. Set PUTER_AUTH_TOKEN environment variable or update .env file"
echo "3. Start your Next.js application: npx next dev"
echo "4. Use the AI features in your application with the puter API"

