#!/bin/bash
# Deploy complaint fix to DigitalOcean
# Run this script on your DigitalOcean droplet

echo "======================================"
echo "Deploying Complaint Fix"
echo "======================================"

# Navigate to project directory
cd /opt/digistall

# Pull latest code (if using git)
# git pull

# Copy the SQL migration to a temporary location
echo "📋 Preparing SQL migration..."

# Run the SQL migration on the database
echo "🔄 Running SQL migration on database..."
docker exec -i digistall-db mysql -u doadmin -p'1600922Jeno' naga_stall << 'EOF'
-- =============================================
-- 511: Fix Complaint Submission with Encryption Support
-- =============================================

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_getStallholderDetailsForComplaintDecrypted$$
CREATE PROCEDURE sp_getStallholderDetailsForComplaintDecrypted(
  IN p_stallholder_id INT
)
BEGIN
  DECLARE v_key VARCHAR(255);
  
  SELECT encryption_key INTO v_key 
  FROM encryption_keys 
  WHERE key_name = 'user_data_key' AND is_active = 1 
  LIMIT 1;
  
  SELECT 
    sh.stallholder_id,
    CASE 
      WHEN sh.is_encrypted = 1 AND sh.encrypted_name IS NOT NULL AND v_key IS NOT NULL
      THEN CAST(AES_DECRYPT(sh.encrypted_name, v_key) AS CHAR(255))
      ELSE sh.stallholder_name 
    END as sender_name,
    CASE 
      WHEN sh.is_encrypted = 1 AND sh.encrypted_contact IS NOT NULL AND v_key IS NOT NULL
      THEN CAST(AES_DECRYPT(sh.encrypted_contact, v_key) AS CHAR(50))
      ELSE sh.contact_number 
    END as sender_contact,
    CASE 
      WHEN sh.is_encrypted = 1 AND sh.encrypted_email IS NOT NULL AND v_key IS NOT NULL
      THEN CAST(AES_DECRYPT(sh.encrypted_email, v_key) AS CHAR(255))
      ELSE sh.email 
    END as sender_email,
    COALESCE(al.branch_id, sh.branch_id) as branch_id,
    al.stall_id as stall_id,
    s.stall_number,
    'stallholder' as source
  FROM stallholder sh
  LEFT JOIN application app ON sh.applicant_id = app.applicant_id AND app.status = 'Approved'
  LEFT JOIN assigned_location al ON app.application_id = al.application_id
  LEFT JOIN stall s ON al.stall_id = s.stall_id
  WHERE sh.stallholder_id = p_stallholder_id OR sh.applicant_id = p_stallholder_id
  ORDER BY app.application_id DESC
  LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_getApplicantDetailsForComplaintDecrypted$$
CREATE PROCEDURE sp_getApplicantDetailsForComplaintDecrypted(
  IN p_applicant_id INT
)
BEGIN
  DECLARE v_key VARCHAR(255);
  
  SELECT encryption_key INTO v_key 
  FROM encryption_keys 
  WHERE key_name = 'user_data_key' AND is_active = 1 
  LIMIT 1;
  
  SELECT 
    a.applicant_id,
    CASE 
      WHEN a.is_encrypted = 1 AND a.encrypted_full_name IS NOT NULL AND v_key IS NOT NULL
      THEN CAST(AES_DECRYPT(a.encrypted_full_name, v_key) AS CHAR(255))
      ELSE a.applicant_full_name 
    END as sender_name,
    CASE 
      WHEN a.is_encrypted = 1 AND a.encrypted_contact IS NOT NULL AND v_key IS NOT NULL
      THEN CAST(AES_DECRYPT(a.encrypted_contact, v_key) AS CHAR(50))
      ELSE a.applicant_contact_number 
    END as sender_contact,
    CASE 
      WHEN a.is_encrypted = 1 AND a.encrypted_email IS NOT NULL AND v_key IS NOT NULL
      THEN CAST(AES_DECRYPT(a.encrypted_email, v_key) AS CHAR(255))
      ELSE a.applicant_email 
    END as sender_email,
    al.branch_id,
    al.stall_id,
    s.stall_number,
    'applicant' as source
  FROM applicant a
  LEFT JOIN application app ON a.applicant_id = app.applicant_id AND app.status = 'Approved'
  LEFT JOIN assigned_location al ON app.application_id = al.application_id
  LEFT JOIN stall s ON al.stall_id = s.stall_id
  WHERE a.applicant_id = p_applicant_id
  ORDER BY app.application_id DESC
  LIMIT 1;
END$$

DELIMITER ;

SELECT '✅ Migration 511 Complete!' as status;
EOF

echo "✅ SQL migration completed"

# Rebuild and restart containers
echo "🔄 Rebuilding and restarting containers..."
docker-compose down
docker-compose up -d --build

echo "⏳ Waiting for services to start..."
sleep 10

# Check container status
echo "📊 Container status:"
docker-compose ps

# Show logs
echo "📋 Backend Mobile logs:"
docker logs digistall-backend-mobile --tail 30

echo "======================================"
echo "✅ Deployment Complete!"
echo "======================================"
echo ""
echo "Test the complaint submission now!"
