# 🚀 Deploy DigiStall to Your DigitalOcean Droplet

## Quick Summary
- **Droplet**: digistall-server (68.183.154.125)
- **Cost**: $20/month (4GB RAM, 80GB Disk)
- **What you get**: Both frontend AND backend running with Docker

---

## Step 1: Reset Droplet Password

1. Go to [DigitalOcean Droplets](https://cloud.digitalocean.com/droplets)
2. Click on **digistall-server**
3. Go to **Access** tab (left sidebar)
4. Click **Reset Root Password**
5. Check your email for the new password

---

## Step 2: Connect to Your Droplet

Open PowerShell and run:
```powershell
ssh root@68.183.154.125
```
Enter the password from your email.

---

## Step 3: Deploy with One Command

Once connected, run:
```bash
# Download and run the deployment script
curl -fsSL https://raw.githubusercontent.com/digistall/DigiStall-CP2025-2026/FullBranch/deploy-to-droplet.sh | bash
```

OR manually:
```bash
# Update system


# Install Docker
curl -fsSL https://get.docker.com | bash

# Install Docker Compose
apt install docker-compose -y

# Clone your repo
git clone -b FullBranch https://github.com/digistall/DigiStall-CP2025-2026.git /opt/digistall
cd /opt/digistall

# Create .env file (edit with your settings)
cp Backend/.env.example .env
nano .env  # Edit if needed

# Start everything
docker-compose up -d --build
```

---

## Step 4: Access Your App

After deployment:
- **Frontend**: http://68.183.154.125
- **Backend API**: http://68.183.154.125:3001/api/health

---

## Useful Commands

```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop everything
docker-compose down

# Update to latest code
cd /opt/digistall
git pull
docker-compose up -d --build
```

---

## Cost Savings Summary

| What | Before | After |
|------|--------|-------|
| Droplet | $20/month | $20/month (KEEP) |
| App Platform | $24/month | $0 (DON'T USE) |
| Database | $15/month | $15/month (KEEP) |
| **Total** | **$59/month** | **$35/month** |

**You save: $24/month by using Docker on your droplet!**
