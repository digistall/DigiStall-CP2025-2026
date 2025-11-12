-- Insert sample documents for the stallholders
INSERT INTO stallholder_documents (
  stallholder_id, document_type_id, file_path, original_filename,
  file_size, verification_status, verified_at, expiry_date, notes
) VALUES
-- Maria Santos documents (stallholder_id = 13)
(13, 1, '/uploads/documents/maria_santos_business_permit.pdf', 'business_permit_2024.pdf', 
 2048576, 'verified', '2024-01-20 10:30:00', '2024-12-31', 'Valid business permit'),
(13, 4, '/uploads/documents/maria_santos_cedula.pdf', 'cedula_2024.pdf',
 1024768, 'verified', '2024-01-20 10:35:00', '2024-12-31', 'Community tax certificate'),
(13, 5, '/uploads/documents/maria_santos_valid_id.pdf', 'drivers_license.pdf',
 1536890, 'verified', '2024-01-20 10:40:00', '2027-08-15', 'Driver\'s license'),

-- Roberto Cruz documents (stallholder_id = 14)
(14, 1, '/uploads/documents/roberto_cruz_business_permit.pdf', 'business_permit_2024.pdf',
 2156432, 'verified', '2024-03-05 14:15:00', '2024-12-31', 'Electronics repair permit'),
(14, 3, '/uploads/documents/roberto_cruz_fire_safety.pdf', 'fire_safety_cert.pdf',
 1847293, 'verified', '2024-03-05 14:20:00', '2025-03-01', 'Fire safety certificate'),

-- Elena Reyes documents (stallholder_id = 15, some missing/expired)
(15, 1, '/uploads/documents/elena_reyes_business_permit.pdf', 'business_permit_2023.pdf',
 1923847, 'expired', '2023-06-05 09:15:00', '2023-12-31', 'Business permit expired, renewal needed'),
(15, 5, '/uploads/documents/elena_reyes_valid_id.pdf', 'national_id.pdf',
 1672834, 'verified', '2023-06-05 09:20:00', '2030-12-31', 'National ID'),

-- Carlos Mendoza documents (stallholder_id = 16, food business - more requirements)
(16, 1, '/uploads/documents/carlos_mendoza_business_permit.pdf', 'food_business_permit.pdf',
 2387456, 'verified', '2024-02-20 11:00:00', '2024-12-31', 'Food business permit'),
(16, 2, '/uploads/documents/carlos_mendoza_sanitary_permit.pdf', 'sanitary_permit.pdf',
 1923874, 'verified', '2024-02-20 11:05:00', '2024-12-31', 'Health department permit'),
(16, 10, '/uploads/documents/carlos_mendoza_health_cert.pdf', 'health_certificate.pdf',
 1456732, 'verified', '2024-02-20 11:10:00', '2024-08-20', 'Medical certificate'),

-- Ana Villanueva documents (stallholder_id = 17)
(17, 1, '/uploads/documents/ana_villanueva_business_permit.pdf', 'meat_business_permit.pdf',
 2198374, 'verified', '2024-01-05 15:30:00', '2024-12-31', 'Meat vendor permit'),
(17, 2, '/uploads/documents/ana_villanueva_sanitary_permit.pdf', 'meat_sanitary_permit.pdf',
 1847293, 'verified', '2024-01-05 15:35:00', '2024-12-31', 'Meat handling permit');

-- Update payment history (set last payment dates)
UPDATE stallholder SET 
  last_payment_date = CASE 
    WHEN payment_status = 'current' THEN DATE_SUB(CURRENT_DATE, INTERVAL FLOOR(RAND() * 20) DAY)
    WHEN payment_status = 'grace_period' THEN DATE_SUB(CURRENT_DATE, INTERVAL 35 DAY)
    WHEN payment_status = 'overdue' THEN DATE_SUB(CURRENT_DATE, INTERVAL 45 DAY)
    ELSE NULL
  END
WHERE last_payment_date IS NULL AND stallholder_id > 12;

-- Insert some violation records for non-compliant stallholders
UPDATE stallholder SET 
  last_violation_date = DATE_SUB(CURRENT_DATE, INTERVAL 10 DAY)
WHERE compliance_status = 'Non-Compliant' AND stallholder_id > 12;