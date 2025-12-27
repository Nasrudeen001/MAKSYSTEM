-- Enhanced seed data with comprehensive sample data for all tables
-- Sample data for testing the Majlis Ansarullah Kenya Ijtema Management System

-- Insert sample regions
INSERT INTO regions (name, code) VALUES
('Nairobi Region', 'NRB'),
('Coast Region', 'CST'),
('Central Region', 'CTR'),
('Rift Valley Region', 'RVL'),
('Western Region', 'WST'),
('Nyanza Region', 'NYZ'),
('Eastern Region', 'EST'),
('North Eastern Region', 'NET');

-- Insert sample majlis (using region IDs from above)
INSERT INTO majlis (name, region_id, code) VALUES
('Nairobi Central', (SELECT id FROM regions WHERE code = 'NRB'), 'NRC'),
('Nairobi South', (SELECT id FROM regions WHERE code = 'NRB'), 'NRS'),
('Nairobi East', (SELECT id FROM regions WHERE code = 'NRB'), 'NRE'),
('Nairobi West', (SELECT id FROM regions WHERE code = 'NRB'), 'NRW'),
('Mombasa', (SELECT id FROM regions WHERE code = 'CST'), 'MBA'),
('Malindi', (SELECT id FROM regions WHERE code = 'CST'), 'MLD'),
('Kisumu', (SELECT id FROM regions WHERE code = 'NYZ'), 'KSM'),
('Nakuru', (SELECT id FROM regions WHERE code = 'RVL'), 'NKR'),
('Eldoret', (SELECT id FROM regions WHERE code = 'RVL'), 'ELD'),
('Thika', (SELECT id FROM regions WHERE code = 'CTR'), 'THK'),
('Nyeri', (SELECT id FROM regions WHERE code = 'CTR'), 'NYR'),
('Machakos', (SELECT id FROM regions WHERE code = 'EST'), 'MCK'),
('Meru', (SELECT id FROM regions WHERE code = 'EST'), 'MRU'),
('Kakamega', (SELECT id FROM regions WHERE code = 'WST'), 'KKG'),
('Kitale', (SELECT id FROM regions WHERE code = 'WST'), 'KTL'),
('Garissa', (SELECT id FROM regions WHERE code = 'NET'), 'GRS');

-- Enhanced participant data with all required fields including age column
INSERT INTO participants (full_name, name, islamic_names, islamic_name, date_of_birth, years, age, category, mobile_number, email, phone, region, majlis, region_id, majlis_id, emergency_contact_name, emergency_contact_phone, dietary_requirements, medical_conditions, status) VALUES
('Ahmed Hassan', 'Ahmed Hassan', 'Ahmad Hassan', 'Ahmad Hassan', '1979-03-15', 45, 45, 'Saf Dom', '+254701234567', 'ahmed.hassan@email.com', '+254701234567', 'Nairobi Region', 'Nairobi Central', 
 (SELECT id FROM regions WHERE code = 'NRB'), (SELECT id FROM majlis WHERE code = 'NRC'), 
 'Fatima Hassan', '+254701234568', 'No special requirements', 'None', 'active'),

('Omar Ibrahim', 'Omar Ibrahim', 'Umar Ibrahim', 'Umar Ibrahim', '1966-07-22', 58, 58, 'Saf Awwal', '+254702345678', 'omar.ibrahim@email.com', '+254702345678', 'Nyanza Region', 'Kisumu', 
 (SELECT id FROM regions WHERE code = 'NYZ'), (SELECT id FROM majlis WHERE code = 'KSM'), 
 'Aisha Ibrahim', '+254702345679', 'Vegetarian meals preferred', 'Diabetes - requires regular meals', 'active'),

('Yusuf Ahmad', 'Yusuf Ahmad', 'Yusuf Ahmad', 'Yusuf Ahmad', '1982-11-08', 42, 42, 'Saf Dom', '+254703456789', 'yusuf.ahmad@email.com', '+254703456789', 'Rift Valley Region', 'Nakuru', 
 (SELECT id FROM regions WHERE code = 'RVL'), (SELECT id FROM majlis WHERE code = 'NKR'), 
 'Khadija Ahmad', '+254703456790', 'Halal meals only', 'None', 'active'),

('Abdullahi Sheikh', 'Abdullahi Sheikh', 'Abdullah Sheikh', 'Abdullah Sheikh', '1964-01-30', 60, 60, 'Saf Awwal', '+254704567890', 'abdullahi.sheikh@email.com', '+254704567890', 'Central Region', 'Thika', 
 (SELECT id FROM regions WHERE code = 'CTR'), (SELECT id FROM majlis WHERE code = 'THK'), 
 'Maryam Sheikh', '+254704567891', 'No pork or alcohol', 'High blood pressure', 'enrolled'),

('Hassan Mohamed', 'Hassan Mohamed', 'Hassan Muhammad', 'Hassan Muhammad', '1986-05-12', 38, 38, 'General', '+254705678901', 'hassan.mohamed@email.com', '+254705678901', 'Coast Region', 'Mombasa', 
 (SELECT id FROM regions WHERE code = 'CST'), (SELECT id FROM majlis WHERE code = 'MBA'), 
 'Zainab Mohamed', '+254705678902', 'No special requirements', 'None', 'registered'),

('Ali Osman', 'Ali Osman', 'Ali Uthman', 'Ali Uthman', '1959-09-18', 65, 65, 'Saf Awwal', '+254706789012', 'ali.osman@email.com', '+254706789012', 'Eastern Region', 'Machakos', 
 (SELECT id FROM regions WHERE code = 'EST'), (SELECT id FROM majlis WHERE code = 'MCK'), 
 'Halima Osman', '+254706789013', 'Soft foods preferred', 'Dental issues', 'active'),

('Ibrahim Musa', 'Ibrahim Musa', 'Ibrahim Musa', 'Ibrahim Musa', '1976-12-03', 48, 48, 'Saf Dom', '+254707890123', 'ibrahim.musa@email.com', '+254707890123', 'Rift Valley Region', 'Eldoret', 
 (SELECT id FROM regions WHERE code = 'RVL'), (SELECT id FROM majlis WHERE code = 'ELD'), 
 'Amina Musa', '+254707890124', 'No special requirements', 'None', 'enrolled'),

('Khalid Ahmad', 'Khalid Ahmad', 'Khalid Ahmad', 'Khalid Ahmad', '1969-04-25', 55, 55, 'Saf Awwal', '+254708901234', 'khalid.ahmad@email.com', '+254708901234', 'Nairobi Region', 'Nairobi South', 
 (SELECT id FROM regions WHERE code = 'NRB'), (SELECT id FROM majlis WHERE code = 'NRS'), 
 'Safia Ahmad', '+254708901235', 'Low sodium diet', 'Hypertension', 'active');

-- Added sample sessions data
INSERT INTO sessions (title, instructor, date, start_time, end_time, venue, description, max_participants) VALUES
('Quranic Recitation and Tajweed', 'Qari Muhammad Ahmad', '2024-12-15', '09:00', '10:30', 'Main Hall A', 'Learn proper Quranic recitation with Tajweed rules', 50),
('Hadith Studies: Sahih Bukhari', 'Maulana Abdul Rahman', '2024-12-15', '11:00', '12:00', 'Lecture Hall B', 'Study of selected Hadith from Sahih Bukhari', 40),
('Islamic Jurisprudence Basics', 'Dr. Mirza Tahir Ahmad', '2024-12-15', '14:00', '15:15', 'Conference Room C', 'Introduction to Islamic Fiqh and jurisprudence', 30),
('Islamic History and Civilization', 'Prof. Ahmad Deedat', '2024-12-16', '09:00', '10:30', 'Main Hall A', 'Overview of Islamic history and contributions', 50),
('Spiritual Development Workshop', 'Imam Hassan Ali', '2024-12-16', '11:00', '12:30', 'Workshop Room D', 'Practical guidance for spiritual growth', 25);

-- Added sample session enrollments
INSERT INTO session_enrollments (participant_id, session_id, attendance_status) VALUES
((SELECT id FROM participants WHERE full_name = 'Ahmed Hassan'), (SELECT id FROM sessions WHERE title = 'Quranic Recitation and Tajweed'), 'present'),
((SELECT id FROM participants WHERE full_name = 'Ahmed Hassan'), (SELECT id FROM sessions WHERE title = 'Hadith Studies: Sahih Bukhari'), 'present'),
((SELECT id FROM participants WHERE full_name = 'Omar Ibrahim'), (SELECT id FROM sessions WHERE title = 'Quranic Recitation and Tajweed'), 'present'),
((SELECT id FROM participants WHERE full_name = 'Omar Ibrahim'), (SELECT id FROM sessions WHERE title = 'Hadith Studies: Sahih Bukhari'), 'present'),
((SELECT id FROM participants WHERE full_name = 'Yusuf Ahmad'), (SELECT id FROM sessions WHERE title = 'Islamic Jurisprudence Basics'), 'pending'),
((SELECT id FROM participants WHERE full_name = 'Khalid Ahmad'), (SELECT id FROM sessions WHERE title = 'Quranic Recitation and Tajweed'), 'present'),
((SELECT id FROM participants WHERE full_name = 'Ali Osman'), (SELECT id FROM sessions WHERE title = 'Hadith Studies: Sahih Bukhari'), 'present');

-- Added sample assessment results
INSERT INTO assessments (participant_id, title, subject, date, score, total_marks, grade, feedback, examiner, status) VALUES
((SELECT id FROM participants WHERE full_name = 'Ahmed Hassan'), 'Quranic Knowledge Quiz', 'Quran', '2024-12-17', 85.5, 100, 'A', 'Excellent understanding of Quranic concepts. Keep up the good work!', 'Qari Muhammad Ahmad', 'completed'),
((SELECT id FROM participants WHERE full_name = 'Ahmed Hassan'), 'Hadith Comprehension Test', 'Hadith', '2024-12-17', 78.0, 100, 'B+', 'Good grasp of Hadith knowledge. Work on contextual understanding.', 'Maulana Abdul Rahman', 'completed'),
((SELECT id FROM participants WHERE full_name = 'Omar Ibrahim'), 'Quranic Knowledge Quiz', 'Quran', '2024-12-17', 92.0, 100, 'A+', 'Outstanding performance! Excellent knowledge and understanding.', 'Qari Muhammad Ahmad', 'completed'),
((SELECT id FROM participants WHERE full_name = 'Omar Ibrahim'), 'Hadith Comprehension Test', 'Hadith', '2024-12-17', 88.5, 100, 'A', 'Very good understanding of Hadith principles and applications.', 'Maulana Abdul Rahman', 'completed'),
((SELECT id FROM participants WHERE full_name = 'Khalid Ahmad'), 'Quranic Knowledge Quiz', 'Quran', '2024-12-17', 76.0, 100, 'B', 'Good effort. Focus on memorization and understanding.', 'Qari Muhammad Ahmad', 'completed'),
((SELECT id FROM participants WHERE full_name = 'Ali Osman'), 'Hadith Comprehension Test', 'Hadith', '2024-12-17', 82.0, 100, 'A-', 'Good knowledge base. Continue studying for better results.', 'Maulana Abdul Rahman', 'completed');

-- Added sample certificates
INSERT INTO certificates (participant_id, certificate_number, title, description, verification_code, status) VALUES
((SELECT id FROM participants WHERE full_name = 'Ahmed Hassan'), 'CERT2024001', 'Certificate of Participation', 'Successfully completed Ijtema 2024 academic program', 'VER2024001', 'issued'),
((SELECT id FROM participants WHERE full_name = 'Omar Ibrahim'), 'CERT2024002', 'Certificate of Excellence', 'Outstanding performance in Ijtema 2024 assessments', 'VER2024002', 'issued'),
((SELECT id FROM participants WHERE full_name = 'Khalid Ahmad'), 'CERT2024003', 'Certificate of Participation', 'Successfully completed Ijtema 2024 academic program', 'VER2024003', 'issued'),
((SELECT id FROM participants WHERE full_name = 'Ali Osman'), 'CERT2024004', 'Certificate of Participation', 'Successfully completed Ijtema 2024 academic program', 'VER2024004', 'issued');

-- Insert sample academic data with enhanced performance tracking
INSERT INTO academic_data (participant_id, knows_prayer_full, knows_prayer_meaning, can_read_quran, owns_bicycle, report_month, avg_prayers_per_day, days_tilawat_done, friday_prayers_attended, huzur_sermons_listened, nafli_fasts, overall_grade, average_score, total_assessments, completed_assessments, attendance_rate, certificates_earned) VALUES
((SELECT id FROM participants WHERE full_name = 'Ahmed Hassan'), true, true, true, false, 'December 2024', 5, 25, 4, 4, 5, 'A-', 81.75, 2, 2, 100.00, 1),
((SELECT id FROM participants WHERE full_name = 'Omar Ibrahim'), true, true, true, true, 'December 2024', 5, 30, 4, 4, 8, 'A+', 90.25, 2, 2, 100.00, 1),
((SELECT id FROM participants WHERE full_name = 'Yusuf Ahmad'), true, false, true, true, 'December 2024', 4, 20, 3, 3, 2, 'N/A', 0.00, 0, 0, 0.00, 0),
((SELECT id FROM participants WHERE full_name = 'Abdullahi Sheikh'), true, true, true, false, 'December 2024', 5, 28, 4, 4, 10, 'N/A', 0.00, 0, 0, 100.00, 0),
((SELECT id FROM participants WHERE full_name = 'Hassan Mohamed'), false, false, true, true, 'December 2024', 3, 15, 2, 2, 0, 'N/A', 0.00, 0, 0, 0.00, 0),
((SELECT id FROM participants WHERE full_name = 'Ali Osman'), true, true, true, true, 'December 2024', 5, 31, 4, 4, 12, 'A-', 82.00, 1, 1, 100.00, 1),
((SELECT id FROM participants WHERE full_name = 'Ibrahim Musa'), true, true, false, false, 'December 2024', 4, 18, 3, 3, 3, 'N/A', 0.00, 0, 0, 0.00, 0),
((SELECT id FROM participants WHERE full_name = 'Khalid Ahmad'), true, true, true, true, 'December 2024', 5, 26, 4, 4, 6, 'B', 76.00, 1, 1, 100.00, 1);

-- Insert sample contributions
INSERT INTO contributions (participant_id, contribution_type, amount, month, year) VALUES
((SELECT id FROM participants WHERE full_name = 'Ahmed Hassan'), 'Chanda Aam', 2000.00, 'December', 2024),
((SELECT id FROM participants WHERE full_name = 'Ahmed Hassan'), 'Tehrik-e-Jadid', 5000.00, 'December', 2024),
((SELECT id FROM participants WHERE full_name = 'Omar Ibrahim'), 'Chanda Aam', 3000.00, 'December', 2024),
((SELECT id FROM participants WHERE full_name = 'Omar Ibrahim'), 'Waqf-e-Jadid', 8000.00, 'December', 2024),
((SELECT id FROM participants WHERE full_name = 'Yusuf Ahmad'), 'Chanda Aam', 1500.00, 'December', 2024),
((SELECT id FROM participants WHERE full_name = 'Abdullahi Sheikh'), 'Chanda Aam', 2500.00, 'December', 2024),
((SELECT id FROM participants WHERE full_name = 'Abdullahi Sheikh'), 'Chanda Jalsa Salana', 3000.00, 'December', 2024),
((SELECT id FROM participants WHERE full_name = 'Hassan Mohamed'), 'Chanda Aam', 1000.00, 'December', 2024),
((SELECT id FROM participants WHERE full_name = 'Ali Osman'), 'Chanda Aam', 4000.00, 'December', 2024),
((SELECT id FROM participants WHERE full_name = 'Ali Osman'), 'Tehrik-e-Jadid', 10000.00, 'December', 2024),
((SELECT id FROM participants WHERE full_name = 'Ibrahim Musa'), 'Chanda Aam', 1800.00, 'December', 2024),
((SELECT id FROM participants WHERE full_name = 'Khalid Ahmad'), 'Chanda Aam', 2200.00, 'December', 2024),
((SELECT id FROM participants WHERE full_name = 'Khalid Ahmad'), 'Waqf-e-Jadid', 6000.00, 'December', 2024);
