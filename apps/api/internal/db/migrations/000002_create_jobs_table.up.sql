CREATE TYPE application_status AS ENUM (
  'draft',
  'submitted',
  'under_review',
  'interview_scheduled',
  'offer_extended',
  'accepted',
  'rejected',
  'withdrawn',
  'archived'
);

CREATE TABLE jobs (
	id SERIAL PRIMARY KEY,
	user_id INT REFERENCES users(id) ON DELETE CASCADE,
	title VARCHAR(255) NOT NULL,
	company VARCHAR(255) NOT NULL,
	location VARCHAR(255) NOT NULL,
	salary DECIMAL(15, 2) NOT NULL,
	description VARCHAR(2048) NULL,
	requirements VARCHAR(2048) NOT NULL,
	application_status CHAR(50) NOT NULL DEFAULT 'draft',
	status_changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
	notes VARCHAR(2048) NULL,
	source_url VARCHAR(2048) NOT NULL,
	contact_info VARCHAR(255) NULL,
	created_at TIMESTAMP NOT NULL DEFAULT NOW(), 
	updated_at TIMESTAMP NULL
);


