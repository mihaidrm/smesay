-- Custom migration (drizzle-kit generate --custom). Live updates on Results (stories/E8-7):
-- every write to an answer, a response or a missing item sends NOTIFY on the channel
-- "results" with the instrument's id as the payload, nothing else (acceptance 4). Plain
-- Postgres, no vendor channel (acceptance 5). pg_notify(channel, payload) and the delivery on
-- commit, with identical payloads in one transaction sent once:
-- postgresql.org/docs/current/sql-notify.html.
CREATE OR REPLACE FUNCTION notify_results() RETURNS trigger AS $$
DECLARE
  row_response uuid;
  row_instrument uuid;
BEGIN
  -- OLD is null on INSERT and NEW on DELETE, so each is read only where it is set.
  IF TG_TABLE_NAME = 'response' THEN
    IF TG_OP = 'DELETE' THEN row_instrument := OLD.instrument_id; ELSE row_instrument := NEW.instrument_id; END IF;
  ELSE
    IF TG_OP = 'DELETE' THEN row_response := OLD.response_id; ELSE row_response := NEW.response_id; END IF;
    SELECT r.instrument_id INTO row_instrument FROM response r WHERE r.id = row_response;
  END IF;
  IF row_instrument IS NOT NULL THEN
    PERFORM pg_notify('results', row_instrument::text);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER answer_notify_results
  AFTER INSERT OR UPDATE OR DELETE ON answer
  FOR EACH ROW EXECUTE FUNCTION notify_results();
--> statement-breakpoint
CREATE TRIGGER response_notify_results
  AFTER INSERT OR UPDATE OR DELETE ON response
  FOR EACH ROW EXECUTE FUNCTION notify_results();
--> statement-breakpoint
CREATE TRIGGER missing_item_notify_results
  AFTER INSERT OR UPDATE OR DELETE ON missing_item
  FOR EACH ROW EXECUTE FUNCTION notify_results();
