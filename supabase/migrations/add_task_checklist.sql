-- Adiciona coluna checklist às tarefas
-- Execute no SQL Editor do Supabase Dashboard

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS checklist jsonb NOT NULL DEFAULT '[]'::jsonb;
