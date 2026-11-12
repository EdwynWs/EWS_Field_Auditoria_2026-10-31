CREATE TABLE password_reset_tokens (
  token_hash text PRIMARY KEY,
  company_id uuid NOT NULL,
  user_id uuid NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (user_id,company_id) REFERENCES users(id,company_id)
);
CREATE INDEX password_reset_user_idx ON password_reset_tokens(company_id,user_id);
