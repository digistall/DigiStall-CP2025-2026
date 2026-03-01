# Start Nginx
cd nginx\nginx-1.29.4; .\nginx.exe

# Stop Nginx
cd nginx\nginx-1.29.4; .\nginx.exe -s quit

# Reload config
cd nginx\nginx-1.29.4; .\nginx.exe -s reload

# Test config
cd nginx\nginx-1.29.4; .\nginx.exe -t