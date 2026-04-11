# FoodieFinds Deployment Guide

This guide will help you deploy the FoodieFinds application to your EC2 instance (13.234.19.105).

## Prerequisites

- EC2 instance running Ubuntu
- SSH access with `ubuntunew.pem` key file
- Node.js 20.x installed locally
- npm installed locally

## Quick Start

### Option 1: Manual Deployment (Recommended for first-time setup)

#### Step 1: Setup EC2 Server

First, connect to your EC2 instance and run the setup script:

```bash
# Connect to EC2
ssh -i ~/Downloads/ubuntunew.pem ubuntu@13.234.19.105

# Download and run setup script
wget https://raw.githubusercontent.com/your-repo/FoodieFinds/main/scripts/setup-ec2.sh
chmod +x setup-ec2.sh
./setup-ec2.sh
```

Or run the setup script from your local machine:

```bash
scp -i ~/Downloads/ubuntunew.pem scripts/setup-ec2.sh ubuntu@13.234.19.105:/tmp/
ssh -i ~/Downloads/ubuntunew.pem ubuntu@13.234.19.105 "chmod +x /tmp/setup-ec2.sh && /tmp/setup-ec2.sh"
```

#### Step 2: Deploy Application

From your local machine, run:

```bash
cd FoodieFinds
chmod +x scripts/deploy.sh
./scripts/deploy.sh 13.234.19.105 ~/Downloads/ubuntunew.pem
```

### Option 2: GitHub Actions CI/CD (Automated deployment)

#### Step 1: Add GitHub Secrets

Go to your GitHub repository Settings → Secrets and variables → Actions and add:

1. `EC2_HOST`: `13.234.19.105`
2. `EC2_PEM_KEY`: Content of your `ubuntunew.pem` file (full content including BEGIN/END lines)

To get the PEM key content:

```bash
cat ~/Downloads/ubuntunew.pem
```

Copy the entire output and paste it as the secret value.

#### Step 2: Push to GitHub

```bash
git add .
git commit -m "Add CI/CD pipeline"
git push origin main
```

The GitHub Actions workflow will automatically:
1. Build the client and server
2. Create a deployment package
3. Deploy to your EC2 instance
4. Restart the application with PM2

## Deployment Files

### 1. GitHub Actions Workflow (`.github/workflows/deploy.yml`)

Automated deployment that triggers on push to main/master branch or manual trigger.

### 2. PM2 Configuration (`ecosystem.config.js`)

Process manager configuration for running the Node.js server:
- Auto-restart on crash
- Log management
- Memory limit: 1GB
- Runs on port 5000

### 3. Nginx Configuration (`nginx.conf`)

Reverse proxy configuration:
- Serves static files from `/var/www/foodiefinds/current/client/dist`
- Proxies API requests to `localhost:5000`
- WebSocket support for real-time features
- Security headers
- Gzip compression

### 4. Deployment Script (`scripts/deploy.sh`)

Manual deployment script that:
- Builds client and server locally
- Creates deployment package
- Uploads to EC2
- Installs dependencies
- Configures nginx
- Restarts application with PM2

### 5. Server Setup Script (`scripts/setup-ec2.sh`)

One-time server setup that:
- Updates system packages
- Installs Node.js 20.x
- Installs nginx
- Installs PM2
- Creates application directories
- Configures firewall

## Directory Structure on EC2

```
/var/www/foodiefinds/
├── current/              # Current deployment
│   ├── dist/            # Server build
│   ├── client/          # Client build
│   │   └── dist/       # Static files
│   ├── shared/          # Shared code
│   ├── node_modules/    # Dependencies
│   ├── ecosystem.config.js
│   └── nginx.conf
└── backup-YYYYMMDD-HHMMSS/  # Previous deployments
```

## Logs

Application logs are stored at:
- `/var/log/foodiefinds/out.log` - Standard output
- `/var/log/foodiefinds/error.log` - Error output

View logs:
```bash
ssh -i ~/Downloads/ubuntunew.pem ubuntu@13.234.19.105
pm2 logs foodiefinds
```

## PM2 Commands

```bash
# View status
pm2 status

# View logs
pm2 logs foodiefinds

# Restart application
pm2 restart foodiefinds

# Stop application
pm2 stop foodiefinds

# View detailed info
pm2 show foodiefinds
```

## Nginx Commands

```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# Restart nginx
sudo systemctl restart nginx

# View nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Troubleshooting

### Application not starting

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs foodiefinds --lines 100

# Check if port 5000 is in use
sudo netstat -tlnp | grep 5000
```

### Nginx 502 Bad Gateway

```bash
# Check if backend is running
pm2 status

# Check nginx configuration
sudo nginx -t

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Permission denied on PEM file

```bash
chmod 600 ~/Downloads/ubuntunew.pem
```

### Firewall blocking connections

```bash
# Check firewall status
sudo ufw status

# Allow necessary ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5000/tcp
```

## Accessing Your Application

After successful deployment, your application will be available at:

- **HTTP**: `http://13.234.19.105`
- **API**: `http://13.234.19.105/api`

## SSL/HTTPS Setup (Optional)

To enable HTTPS, you can use Let's Encrypt with certbot:

```bash
# On EC2 instance
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Rollback

If a deployment causes issues, you can rollback to a previous version:

```bash
ssh -i ~/Downloads/ubuntunew.pem ubuntu@13.234.19.105
cd /var/www/foodiefinds
sudo mv current current-failed
sudo mv backup-YYYYMMDD-HHMMSS current
pm2 restart foodiefinds
```

## Support

For issues or questions, check:
- PM2 logs: `pm2 logs foodiefinds`
- Nginx logs: `/var/log/nginx/error.log`
- Application logs: `/var/log/foodiefinds/error.log`
