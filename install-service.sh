#!/bin/bash

# DEORA Plaza Systemd Service Installation Script

set -e

echo "Installing DEORA Plaza Backend Service..."

# Create user and group
if ! id "deora" &>/dev/null; then
    sudo useradd -r -s /bin/false deora
    echo "Created deora user"
fi

# Create directories
sudo mkdir -p /opt/deora-plaza
sudo mkdir -p /opt/deora-plaza/logs
sudo mkdir -p /opt/deora-plaza/config

# Copy service file
sudo cp deora-backend.service /etc/systemd/system/

# Set permissions
sudo chown -R deora:deora /opt/deora-plaza

# Reload systemd and enable service
sudo systemctl daemon-reload
sudo systemctl enable deora-backend

echo "Service installed successfully!"
echo "Commands:"
echo "  sudo systemctl start deora-backend    - Start the service"
echo "  sudo systemctl stop deora-backend     - Stop the service"
echo "  sudo systemctl status deora-backend   - Check status"
echo "  sudo journalctl -u deora-backend -f   - View logs"
