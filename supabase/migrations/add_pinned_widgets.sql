-- ============================================
-- PINNED WIDGETS TABLE
-- Stores user-pinned dashboard component descriptors
-- ============================================

CREATE TABLE pinned_widgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  component_name VARCHAR(100) NOT NULL,
  query_descriptor JSONB NOT NULL DEFAULT '{}',  -- { queryId, params }
  layout JSONB NOT NULL DEFAULT '{}',            -- { x, y, w, h }
  title VARCHAR(200),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent exact duplicate pins
CREATE UNIQUE INDEX idx_pinned_widgets_unique
  ON pinned_widgets (employee_id, component_name, query_descriptor);

-- Fast lookup by employee
CREATE INDEX idx_pinned_widgets_employee ON pinned_widgets(employee_id);
CREATE INDEX idx_pinned_widgets_order ON pinned_widgets(employee_id, order_index);

-- Auto-update updated_at
CREATE TRIGGER update_pinned_widgets_updated_at
  BEFORE UPDATE ON pinned_widgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (allow-all for development)
ALTER TABLE pinned_widgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for pinned_widgets" ON pinned_widgets FOR ALL USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE pinned_widgets;
