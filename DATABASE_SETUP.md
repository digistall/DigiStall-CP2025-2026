# Database Setup Guide

Since you're running the database manually, follow these steps:

## Prerequisites
- MySQL Server installed and running on your local machine
- MySQL running on default port 3306

## Setup Steps

1. **Start MySQL Server**
   - If using XAMPP: Start Apache and MySQL from XAMPP Control Panel
   - If using standalone MySQL: Ensure MySQL service is running

2. **Create the Database**
   ```sql
   CREATE DATABASE IF NOT EXISTS naga_stall;
   ```

3. **Import the Database Schema**
   - Navigate to the project directory
   - Import the SQL file:
   ```bash
   mysql -u root -p naga_stall < Backend/database/naga_stall_complete.sql
   ```
   
   Or using MySQL Workbench:
   - Open MySQL Workbench
   - Connect to your local MySQL server
   - Open the file `Backend/database/naga_stall_complete.sql`
   - Execute the script

4. **Verify Database Setup**
   ```sql
   USE naga_stall;
   SHOW TABLES;
   ```

## Docker Configuration
The Docker containers are configured to connect to your local MySQL server using `host.docker.internal`. No additional configuration needed.

## Access Points
After starting Docker containers:
- **Web Frontend**: http://localhost
- **Mobile Frontend**: http://localhost:8080  
- **Backend API**: http://localhost:3001

## Troubleshooting
- Ensure MySQL is running on port 3306
- Check that the `naga_stall` database exists
- Verify all tables are imported correctly
- Check Docker logs: `docker-compose logs backend`