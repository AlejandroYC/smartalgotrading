-- Crear una nueva tabla para las notas del diario de trading
CREATE TABLE IF NOT EXISTS public.journal_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_number TEXT,
  trade_date DATE NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Agregar indices para mejorar el rendimiento en búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_journal_notes_user_id ON public.journal_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_notes_trade_date ON public.journal_notes(trade_date);
CREATE INDEX IF NOT EXISTS idx_journal_notes_account_number ON public.journal_notes(account_number);

-- Configurar Row Level Security (RLS) para proteger los datos
ALTER TABLE public.journal_notes ENABLE ROW LEVEL SECURITY;

-- Crear políticas para permitir acceso solo a las notas del usuario autenticado
CREATE POLICY journal_notes_select_policy ON public.journal_notes 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY journal_notes_insert_policy ON public.journal_notes 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY journal_notes_update_policy ON public.journal_notes 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY journal_notes_delete_policy ON public.journal_notes 
  FOR DELETE USING (auth.uid() = user_id);

-- Comentarios para la tabla y columnas
COMMENT ON TABLE public.journal_notes IS 'Tabla para almacenar las notas del diario de trading de los usuarios';
COMMENT ON COLUMN public.journal_notes.id IS 'Identificador único para cada nota';
COMMENT ON COLUMN public.journal_notes.user_id IS 'ID del usuario propietario de la nota';
COMMENT ON COLUMN public.journal_notes.account_number IS 'Número de cuenta de trading asociada a la nota';
COMMENT ON COLUMN public.journal_notes.trade_date IS 'Fecha del trading a la que se refiere la nota';
COMMENT ON COLUMN public.journal_notes.title IS 'Título opcional de la nota';
COMMENT ON COLUMN public.journal_notes.content IS 'Contenido de la nota';
COMMENT ON COLUMN public.journal_notes.created_at IS 'Fecha y hora de creación de la nota';
COMMENT ON COLUMN public.journal_notes.updated_at IS 'Fecha y hora de última actualización de la nota'; 