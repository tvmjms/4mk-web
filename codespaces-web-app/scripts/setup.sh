#!/bin/bash

# This script sets up the development environment for the codespaces-web-app project.

# Update package list and install necessary packages
sudo apt update
sudo apt install -y nodejs npm

# Install project dependencies
npm install

# Additional setup tasks can be added here

echo "Setup complete!"