-- Custom migration (drizzle-kit generate --custom). Two rules the schema cannot express as
-- constraints: item.original_text is never overwritten (stories/E1-2, acceptance 3) and
-- item_set.version is never renumbered (decision 0010, one version per import).
CREATE OR REPLACE FUNCTION refuse_original_text_update() RETURNS trigger AS $$
BEGIN
  IF NEW.original_text IS DISTINCT FROM OLD.original_text THEN
    RAISE EXCEPTION 'item.original_text is never overwritten (item %)', OLD.id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER item_original_text_immutable
  BEFORE UPDATE OF original_text ON item
  FOR EACH ROW EXECUTE FUNCTION refuse_original_text_update();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION refuse_item_set_version_update() RETURNS trigger AS $$
BEGIN
  IF NEW.version IS DISTINCT FROM OLD.version THEN
    RAISE EXCEPTION 'item_set.version is never renumbered (item_set %)', OLD.id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER item_set_version_immutable
  BEFORE UPDATE OF version ON item_set
  FOR EACH ROW EXECUTE FUNCTION refuse_item_set_version_update();
