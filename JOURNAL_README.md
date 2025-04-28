# Funcionalidad de Diario de Trading

Esta funcionalidad permite a los usuarios añadir, editar y eliminar notas asociadas a días específicos de trading, guardando esta información en la base de datos Supabase.

## Características

- **Ver días de trading**: Muestra todos los días con operaciones de trading desde los datos obtenidos de MetaTrader 5.
- **Añadir notas**: Permite agregar notas a días específicos de trading con título (opcional) y contenido.
- **Editar notas**: Modifica el contenido de notas existentes.
- **Eliminar notas**: Elimina notas que ya no son necesarias.
- **Filtrar por cuenta**: Selecciona una cuenta específica para ver solo sus días de trading y notas asociadas.

## Guía de implementación

### 1. Crear la tabla en Supabase

Ejecuta el script SQL `sql/create_journal_notes_table.sql` en el panel de administración de Supabase para crear la tabla `journal_notes` con la siguiente estructura:

```sql
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
```

### 2. Configurar la API

La aplicación ya incluye un endpoint API en `/api/journal-notes` con los siguientes métodos:

- **GET**: Obtiene las notas de un usuario, con filtros opcionales por fecha y número de cuenta.
- **POST**: Crea una nueva nota.
- **PUT**: Actualiza una nota existente.
- **DELETE**: Elimina una nota.

### 3. Acceder a la funcionalidad

Accede a la funcionalidad a través de la URL `/dashboard/journal` en la aplicación.

## Guía de uso

1. **Ver días de trading**:
   - Navega a la página de Diario de Trading.
   - Selecciona la cuenta deseada desde el selector de cuentas.

2. **Añadir una nota**:
   - Haz clic en el botón "Agregar nota" junto a un día de trading.
   - Completa el formulario con título (opcional) y contenido.
   - Haz clic en "Guardar Nota".

3. **Editar una nota**:
   - Haz clic en el botón "Editar nota" junto a un día que ya tiene una nota.
   - Actualiza el título y/o contenido.
   - Haz clic en "Guardar Nota".

4. **Eliminar una nota**:
   - Haz clic en el botón "Eliminar" dentro de la nota.
   - Confirma la eliminación.

## Requisitos técnicos

- TypeScript
- Next.js con App Router
- Supabase para almacenamiento
- Integración con MetaTrader 5 para obtener los días de trading

## Solución de problemas

Si las notas no se cargan o guardan correctamente:

1. Verifica que la tabla `journal_notes` exista en Supabase.
2. Comprueba que el usuario esté autenticado correctamente.
3. Asegúrate de que haya datos de trading disponibles para la cuenta seleccionada.
4. Revisa la consola del navegador para mensajes de error específicos. 