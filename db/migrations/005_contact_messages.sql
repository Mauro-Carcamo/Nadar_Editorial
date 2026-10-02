-- Mensajes del formulario de contacto. Se revisan en el panel (/admin/mensajes).
CREATE TABLE contact_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  email      text NOT NULL,
  subject    text NOT NULL DEFAULT 'GENERAL' CHECK (subject IN ('GENERAL', 'PEDIDO', 'PRENSA', 'LIBRERIAS', 'MANUSCRITOS')),
  message    text NOT NULL,
  status     text NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'READ', 'ARCHIVED')),
  ip_hash    text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX contact_messages_status_idx ON contact_messages (status, created_at DESC);

CREATE TRIGGER contact_messages_updated_at BEFORE UPDATE ON contact_messages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Eventos de analítica: índice para el embudo diario
CREATE INDEX IF NOT EXISTS analytics_events_created_idx ON analytics_events (created_at, event_type);
