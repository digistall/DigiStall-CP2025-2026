SET SESSION sql_require_primary_key = 0;
SET FOREIGN_KEY_CHECKS=0;

DROP TABLE IF EXISTS collector;
CREATE TABLE collector (
  collector_id int NOT NULL AUTO_INCREMENT,
  username varchar(50) NOT NULL,
  password_hash varchar(255) NOT NULL,
  first_name varchar(100) NOT NULL,
  last_name varchar(100) NOT NULL,
  middle_name varchar(100) DEFAULT NULL,
  email varchar(255) NOT NULL,
  contact_no varchar(20) DEFAULT NULL,
  date_created datetime DEFAULT CURRENT_TIMESTAMP,
  date_hired date DEFAULT NULL,
  status enum('active','inactive') DEFAULT 'active',
  termination_date date DEFAULT NULL,
  termination_reason varchar(255) DEFAULT NULL,
  last_login timestamp NULL DEFAULT NULL,
  PRIMARY KEY (collector_id),
  UNIQUE KEY username (username),
  UNIQUE KEY email (email)
);

DROP TABLE IF EXISTS inspector;
CREATE TABLE inspector (
  inspector_id int NOT NULL AUTO_INCREMENT,
  first_name varchar(100) NOT NULL,
  last_name varchar(100) NOT NULL,
  email varchar(255) NOT NULL,
  contact_no varchar(20) DEFAULT NULL,
  password varchar(255) NOT NULL,
  date_hired date DEFAULT NULL,
  status enum('active','inactive') DEFAULT 'active',
  termination_date date DEFAULT NULL,
  termination_reason varchar(255) DEFAULT NULL,
  last_login timestamp NULL DEFAULT NULL,
  PRIMARY KEY (inspector_id),
  UNIQUE KEY email (email)
);

DROP TABLE IF EXISTS collector_assignment;
CREATE TABLE collector_assignment (
  assignment_id int NOT NULL AUTO_INCREMENT,
  collector_id int NOT NULL,
  branch_id int NOT NULL,
  start_date date DEFAULT NULL,
  end_date date DEFAULT NULL,
  status varchar(20) DEFAULT 'Active',
  remarks text,
  PRIMARY KEY (assignment_id),
  KEY collector_id (collector_id),
  KEY branch_id (branch_id)
);

SET FOREIGN_KEY_CHECKS=1;
