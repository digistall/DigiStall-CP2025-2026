ssh root@68.183.154.125

1600922Jeno

cd /opt/digistall

docker-compose down

docker-compose up -d --build

docker logs digistall-backend-web --tail 50

docker logs digistall-backend-mobile --tail 50

docker-compose restart backend-mobile

docker-compose stop backend-mobile && docker-compose start backend-mobile

docker-compose up -d --build backend-mobile

docker-compose down backend-mobile

# Force clear database procedure cache
docker-compose stop backend-mobile && docker-compose start backend-mobile 

# Deploy fixes to production
# 1. Copy fix script to server
scp C:\Users\Jeno\DigiStall-CP2025-2026\Backend\fix_mobile_procedures.mjs root@68.183.154.125:/opt/digistall/

# 2. Run database fix on server (all-in-one command)
ssh root@68.183.154.125 "cd /opt/digistall && docker cp fix_mobile_procedures.mjs digistall-backend-mobile:/app/ && docker-compose exec -T backend-mobile node /app/fix_mobile_procedures.mjs && echo 'Database fix applied!'"

# 3. Rebuild mobile backend with updated controller code
ssh root@68.183.154.125 "cd /opt/digistall && docker-compose up -d --build backend-mobile && echo 'Backend rebuilt and restarted!'"

# 4. Check logs
ssh root@68.183.154.125 "docker logs digistall-backend-mobile --tail 50 --follow" ;& Start-Sleep -Seconds 3; Stop-Process -Name ssh

# Quick rebuild only (if code changed)
ssh root@68.183.154.125 "cd /opt/digistall && docker-compose up -d --build backend-mobile"

ssh root@68.183.154.125 "docker logs digistall-backend-mobile --tail 50 --follow" ;& Start-Sleep -Seconds 3; Stop-Process -Name ssh


