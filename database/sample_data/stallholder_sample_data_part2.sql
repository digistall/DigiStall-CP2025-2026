-- Part 2: Insert remaining stallholders using newly created applicant IDs
-- This assumes the applicants were created in Part 1

-- Get the new applicant IDs for the remaining stallholders
INSERT INTO stallholder (
  applicant_id, stallholder_name, contact_number, email, address,
  business_name, business_type, branch_id, stall_id,
  contract_start_date, contract_end_date, contract_status,
  lease_amount, monthly_rent, payment_status, compliance_status,
  notes, created_by_manager
) VALUES
-- Using newly created applicants (Carlos = 35, Ana = 36, Fernando = 37, etc.)
(35, 'Carlos Mendoza', '09201234567', 'carlos.mendoza@email.com', 'Barangay Concepcion Grande, Naga City',
 'Mendoza Food Corner', 'Food Service', 1, 55,
 '2024-02-15', '2025-01-31', 'Active', 33600.00, 2800.00, 'current', 'Compliant',
 'Popular food stall, excellent customer ratings', 1),

(36, 'Ana Villanueva', '09211234567', 'ana.villanueva@email.com', 'Barangay Pacol, Naga City',
 'Villanueva Meat Shop', 'Meat Products', 3, 91,
 '2024-01-01', '2024-12-31', 'Active', 30000.00, 2500.00, 'current', 'Compliant',
 'Fresh meat supplier, good hygiene practices', 1),

(37, 'Fernando Garcia', '09221234567', 'fernando.garcia@email.com', 'Barangay Balatas, Naga City',
 'Garcia Fresh Produce', 'Vegetables & Fruits', 3, 93,
 '2023-09-01', '2024-08-31', 'Active', 21600.00, 1800.00, 'grace_period', 'Compliant',
 'Seasonal produce vendor, payment due in 5 days', 1),

(38, 'Luz Fernandez', '09231234567', 'luz.fernandez@email.com', 'Barangay Tinago, Naga City',
 'Fernandez Dry Goods', 'Dry Goods', 3, NULL,
 '2024-04-01', '2025-03-31', 'Active', 24000.00, 2000.00, 'current', 'Compliant',
 'Rice and canned goods supplier', 1),

(39, 'Miguel Torres', '09241234567', 'miguel.torres@email.com', 'Barangay Lerma, Naga City',
 'Torres Variety Store', 'General Merchandise', 3, NULL,
 '2023-11-15', '2024-11-14', 'Active', 28800.00, 2400.00, 'current', 'Compliant',
 'Wide variety of household items', 1),

(40, 'Josefina Aquino', '09251234567', 'josefina.aquino@email.com', 'Barangay Igualdad, Naga City',
 'Aquino Meat Products', 'Meat Products', 23, NULL,
 '2024-06-01', '2025-05-31', 'Active', 30120.00, 2510.00, 'current', 'Compliant',
 'New tenant, meat processing business', 1),

(41, 'Pedro Santos Jr.', '09261234567', 'pedro.santos@email.com', 'Barangay Dayangdang, Naga City',
 'Santos Hardware Supplies', 'Hardware', 23, NULL,
 '2024-07-15', '2025-07-14', 'Active', 36000.00, 3000.00, 'current', 'Compliant',
 'Hardware and construction materials', 1);

-- Insert some stallholder documents (sample data)
INSERT INTO stallholder_documents (
  stallholder_id, document_type_id, file_path, original_filename,
  file_size, verification_status, verified_at, expiry_date, notes
) VALUES
-- Maria Santos documents (stallholder_id = 1)
(1, 1, '/uploads/documents/maria_santos_business_permit.pdf', 'business_permit_2024.pdf', 
 2048576, 'verified', '2024-01-20 10:30:00', '2024-12-31', 'Valid business permit'),
(1, 4, '/uploads/documents/maria_santos_cedula.pdf', 'cedula_2024.pdf',
 1024768, 'verified', '2024-01-20 10:35:00', '2024-12-31', 'Community tax certificate'),
(1, 5, '/uploads/documents/maria_santos_valid_id.pdf', 'drivers_license.pdf',
 1536890, 'verified', '2024-01-20 10:40:00', '2027-08-15', 'Driver\'s license'),

-- Roberto Cruz documents (stallholder_id = 2)
(2, 1, '/uploads/documents/roberto_cruz_business_permit.pdf', 'business_permit_2024.pdf',
 2156432, 'verified', '2024-03-05 14:15:00', '2024-12-31', 'Electronics repair permit'),
(2, 3, '/uploads/documents/roberto_cruz_fire_safety.pdf', 'fire_safety_cert.pdf',
 1847293, 'verified', '2024-03-05 14:20:00', '2025-03-01', 'Fire safety certificate'),

-- Elena Reyes documents (stallholder_id = 3, some missing/expired)
(3, 1, '/uploads/documents/elena_reyes_business_permit.pdf', 'business_permit_2023.pdf',
 1923847, 'expired', '2023-06-05 09:15:00', '2023-12-31', 'Business permit expired, renewal needed'),
(3, 5, '/uploads/documents/elena_reyes_valid_id.pdf', 'national_id.pdf',
 1672834, 'verified', '2023-06-05 09:20:00', '2030-12-31', 'National ID'),

-- Carlos Mendoza documents (stallholder_id = 4, food business - more requirements)
(4, 1, '/uploads/documents/carlos_mendoza_business_permit.pdf', 'food_business_permit.pdf',
 2387456, 'verified', '2024-02-20 11:00:00', '2024-12-31', 'Food business permit'),
(4, 2, '/uploads/documents/carlos_mendoza_sanitary_permit.pdf', 'sanitary_permit.pdf',
 1923874, 'verified', '2024-02-20 11:05:00', '2024-12-31', 'Health department permit'),
(4, 10, '/uploads/documents/carlos_mendoza_health_cert.pdf', 'health_certificate.pdf',
 1456732, 'verified', '2024-02-20 11:10:00', '2024-08-20', 'Medical certificate'),

-- Ana Villanueva documents (stallholder_id = 5)
(5, 1, '/uploads/documents/ana_villanueva_business_permit.pdf', 'meat_business_permit.pdf',
 2198374, 'verified', '2024-01-05 15:30:00', '2024-12-31', 'Meat vendor permit'),
(5, 2, '/uploads/documents/ana_villanueva_sanitary_permit.pdf', 'meat_sanitary_permit.pdf',
 1847293, 'verified', '2024-01-05 15:35:00', '2024-12-31', 'Meat handling permit');

-- Update payment history (set last payment dates)
UPDATE stallholder SET 
  last_payment_date = CASE 
    WHEN payment_status = 'current' THEN DATE_SUB(CURRENT_DATE, INTERVAL FLOOR(RAND() * 20) DAY)
    WHEN payment_status = 'grace_period' THEN DATE_SUB(CURRENT_DATE, INTERVAL 35 DAY)
    WHEN payment_status = 'overdue' THEN DATE_SUB(CURRENT_DATE, INTERVAL 45 DAY)
    ELSE NULL
  END
WHERE last_payment_date IS NULL;

-- Insert some violation records for non-compliant stallholders
UPDATE stallholder SET 
  last_violation_date = DATE_SUB(CURRENT_DATE, INTERVAL 10 DAY)
WHERE compliance_status = 'Non-Compliant';