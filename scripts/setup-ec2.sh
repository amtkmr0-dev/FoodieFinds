#!/bin/bash

# FoodieFinds EC2 Server Setup Script
# Run this on your EC2 instance to set up the server

set -e

echo "🔧 Setting up FoodieFinds server..."

# Update system
echo "📦 Updating system packages..."
sudo apt-get update -y
sudo apt-get upgrade -y

# Install Node.js 20.x
echo "📦 Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install nginx
echo "📦 Installing nginx..."
sudo apt-get install -y nginx

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /var/www/foodiefinds
sudo mkdir -p /var/log/foodiefinds
sudo chown -R ubuntu:ubuntu /var/www/foodiefinds
sudo chown -R ubuntu:ubuntu /var/log/foodiefinds

# Configure firewall
echo "🔒 Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5000/tcp
sudo ufw --force enable

# Configure nginx
echo "🔧 Configuring nginx..."
sudo rm -f /etc/nginx/sites-enabled/default
sudo systemctl enable nginx
sudo systemctl start nginx

echo "✅ Server setup complete!"
echo ""
echo "Next steps:"
echo "1. Run ./scripts/deploy.sh to deploy your application"
echo "2. Your app will be available at http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
