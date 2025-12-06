


BEGIN;

ALTER TABLE public.evaluaciones
    ADD COLUMN IF NOT EXISTS seccion_id integer;


DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'secciones') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_schema = 'public' AND tc.table_name = 'evaluaciones' AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'seccion_id'
        ) THEN
            ALTER TABLE public.evaluaciones
                ADD CONSTRAINT fk_evaluaciones_seccion
                FOREIGN KEY (seccion_id) REFERENCES public.secciones(id) ON DELETE SET NULL;
        END IF;
    END IF;
END$$;

COMMIT;
