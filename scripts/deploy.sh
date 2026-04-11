#!/bin/bash

# FoodieFinds Deployment Script
# Usage: ./scripts/deploy.sh [ec2-host] [pem-file-path]

set -e

# Configuration
EC2_HOST=${1:-"13.234.19.105"}
PEM_FILE=${2:-"$HOME/Downloads/ubuntunew.pem"}
APP_DIR="/var/www/foodiefinds"
REMOTE_USER="ubuntu"

echo "🚀 Starting deployment to $EC2_HOST..."

# Check if PEM file exists
if [ ! -f "$PEM_FILE" ]; then
    echo "❌ Error: PEM file not found at $PEM_FILE"
    echo "Please provide the correct path to your ubuntunew.pem file"
    exit 1
fi

# Set proper permissions on PEM file
chmod 600 "$PEM_FILE"

# Build the application locally
echo "📦 Building application..."
npm install
npm run build

# Create deployment package
echo "📁 Creating deployment package..."
mkdir -p deploy
cp -r dist deploy/
# Rename index.prod.js to index.js for PM2
if [ -f deploy/dist/index.prod.js ]; then
    mv deploy/dist/index.prod.js deploy/dist/index.js
fi
cp -r package.json deploy/
cp -r package-lock.json deploy/
cp -r shared deploy/
cp ecosystem.config.js deploy/ 2>/dev/null || true
cp nginx.conf deploy/ 2>/dev/null || true
cd deploy
tar -czf ../foodiefinds-deploy.tar.gz .
cd ..

# Upload to EC2
echo "📤 Uploading to EC2..."
scp -i "$PEM_FILE" foodiefinds-deploy.tar.gz ${REMOTE_USER}@${EC2_HOST}:/tmp/

# Deploy on EC2
echo "🔧 Deploying on EC2..."
ssh -i "$PEM_FILE" ${REMOTE_USER}@${EC2_HOST} << 'ENDSSH'
    # Create app directory if it doesn't exist
    sudo mkdir -p /var/www/foodiefinds
    sudo chown ubuntu:ubuntu /var/www/foodiefinds
    
    # Create log directory
    sudo mkdir -p /var/log/foodiefinds
    sudo chown ubuntu:ubuntu /var/log/foodiefinds
    
    # Backup current deployment
    if [ -d "/var/www/foodiefinds/current" ]; then
        sudo mv /var/www/foodiefinds/current /var/www/foodiefinds/backup-$(date +%Y%m%d-%H%M%S)
    fi
    
    # Extract new deployment
    mkdir -p /var/www/foodiefinds/current
    tar -xzf /tmp/foodiefinds-deploy.tar.gz -C /var/www/foodiefinds/current
    
    # Install dependencies
    cd /var/www/foodiefinds/current
    npm install --production
    
    # Setup nginx
    if [ -f "nginx.conf" ]; then
        sudo cp nginx.conf /etc/nginx/sites-available/foodiefinds
        sudo ln -sf /etc/nginx/sites-available/foodiefinds /etc/nginx/sites-enabled/
        sudo rm -f /etc/nginx/sites-enabled/default
        sudo nginx -t && sudo systemctl reload nginx
    fi
    
    # Install PM2 if not already installed
    if ! command -v pm2 &> /dev/null; then
        sudo npm install -g pm2
    fi
    
    # Start/restart application with PM2
    pm2 stop foodiefinds 2>/dev/null || true
    pm2 delete foodiefinds 2>/dev/null || true
    pm2 start dist/index.js --name foodiefinds --cwd /var/www/foodiefinds/current --env production
    
    # Save PM2 process list
    pm2 save
    
    # Setup PM2 to start on boot
    pm2 startup systemd -u ubuntu --hp /home/ubuntu || true
    
    # Cleanup
    rm /tmp/foodiefinds-deploy.tar.gz
    
    echo "✅ Deployment completed successfully!"
ENDSSH

# Cleanup local files
rm -rf deploy foodiefinds-deploy.tar.gz

echo "🎉 Deployment complete! Your app is now live at http://$EC2_HOST"
