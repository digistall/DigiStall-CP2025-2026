-- Insert Sample Stallholder and Document Customization Data
-- This file adds test data for the enhanced stallholder management system

-- First, create additional applicants for more sample data
INSERT INTO applicant (applicant_full_name, applicant_contact_number, applicant_address, applicant_email) VALUES
('Carlos Mendoza', '09201234567', 'Barangay Concepcion Grande, Naga City', 'carlos.mendoza@email.com'),
('Ana Villanueva', '09211234567', 'Barangay Pacol, Naga City', 'ana.villanueva@email.com'),
('Fernando Garcia', '09221234567', 'Barangay Balatas, Naga City', 'fernando.garcia@email.com'),
('Luz Fernandez', '09231234567', 'Barangay Tinago, Naga City', 'luz.fernandez@email.com'),
('Miguel Torres', '09241234567', 'Barangay Lerma, Naga City', 'miguel.torres@email.com'),
('Josefina Aquino', '09251234567', 'Barangay Igualdad, Naga City', 'josefina.aquino@email.com'),
('Pedro Santos Jr.', '09261234567', 'Barangay Dayangdang, Naga City', 'pedro.santos@email.com');

-- Insert comprehensive stallholder data using existing and new applicants
INSERT INTO stallholder (
  applicant_id, stallholder_name, contact_number, email, address,
  business_name, business_type, branch_id, stall_id,
  contract_start_date, contract_end_date, contract_status,
  lease_amount, monthly_rent, payment_status, compliance_status,
  notes, created_by_manager
) VALUES
-- Using existing applicants
(12, 'Maria Santos', '09171234567', 'maria.santos@email.com', 'Barangay Carolina, Naga City', 
 'Santos General Merchandise', 'General Merchandise', 1, 54, 
 '2024-01-15', '2024-12-31', 'Active', 28800.00, 2400.00, 'current', 'Compliant',
 'Reliable tenant, always pays on time', 1),

(33, 'Roberto Cruz', '09181234567', 'roberto.cruz@email.com', 'Barangay Triangulo, Naga City',
 'Cruz Electronics Repair', 'Electronics', 1, 57,
 '2024-03-01', '2025-02-28', 'Active', 31200.00, 2600.00, 'current', 'Compliant',
 'Electronics repair specialist', 1),

(34, 'Elena Reyes', '09191234567', 'elena.reyes@email.com', 'Barangay San Francisco, Naga City',
 'Elena\'s Fashion Corner', 'Clothing', 1, 58,
 '2023-06-01', '2024-05-31', 'Active', 25200.00, 2100.00, 'overdue', 'Non-Compliant',
 'Payment overdue by 15 days. Last violation: improper display', 1);

-- Insert some stallholder documents (sample data)
INSERT INTO stallholder_documents (
  stallholder_id, document_type_id, file_path, original_filename,
  file_size, verification_status, verified_at, expiry_date, notes
) VALUES
-- Maria Santos documents
(1, 1, '/uploads/documents/maria_santos_business_permit.pdf', 'business_permit_2024.pdf', 
 2048576, 'verified', '2024-01-20 10:30:00', '2024-12-31', 'Valid business permit'),
(1, 4, '/uploads/documents/maria_santos_cedula.pdf', 'cedula_2024.pdf',
 1024768, 'verified', '2024-01-20 10:35:00', '2024-12-31', 'Community tax certificate'),
(1, 5, '/uploads/documents/maria_santos_valid_id.pdf', 'drivers_license.pdf',
 1536890, 'verified', '2024-01-20 10:40:00', '2027-08-15', 'Driver\'s license'),

-- Roberto Cruz documents  
(2, 1, '/uploads/documents/roberto_cruz_business_permit.pdf', 'business_permit_2024.pdf',
 2156432, 'verified', '2024-03-05 14:15:00', '2024-12-31', 'Electronics repair permit'),
(2, 3, '/uploads/documents/roberto_cruz_fire_safety.pdf', 'fire_safety_cert.pdf',
 1847293, 'verified', '2024-03-05 14:20:00', '2025-03-01', 'Fire safety certificate'),

-- Elena Reyes documents (some missing/expired)
(3, 1, '/uploads/documents/elena_reyes_business_permit.pdf', 'business_permit_2023.pdf',
 1923847, 'expired', '2023-06-05 09:15:00', '2023-12-31', 'Business permit expired, renewal needed'),
(3, 5, '/uploads/documents/elena_reyes_valid_id.pdf', 'national_id.pdf',
 1672834, 'verified', '2023-06-05 09:20:00', '2030-12-31', 'National ID'),

-- Carlos Mendoza documents (food business - more requirements)
(4, 1, '/uploads/documents/carlos_mendoza_business_permit.pdf', 'food_business_permit.pdf',
 2387456, 'verified', '2024-02-20 11:00:00', '2024-12-31', 'Food business permit'),
(4, 2, '/uploads/documents/carlos_mendoza_sanitary_permit.pdf', 'sanitary_permit.pdf',
 1923874, 'verified', '2024-02-20 11:05:00', '2024-12-31', 'Health department permit'),
(4, 10, '/uploads/documents/carlos_mendoza_health_cert.pdf', 'health_certificate.pdf',
 1456732, 'verified', '2024-02-20 11:10:00', '2024-08-20', 'Medical certificate'),

-- Ana Villanueva documents
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