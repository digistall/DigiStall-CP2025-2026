ssh root@68.183.154.125

1600922Jeno

cd /opt/digistall

docker-compose down

docker-compose up -d --build

docker logs digistall-backend-web --tail 50

docker logs digistall-backend-mobile --tail 50