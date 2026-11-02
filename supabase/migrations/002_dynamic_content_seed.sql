-- ===========================================================================
-- RespondeYa · 002 · Categorías iniciales
-- ===========================================================================
-- Solo categorías: los módulos los crea el administrador desde la aplicación.
--
-- `on conflict do nothing` hace la migración idempotente: volver a ejecutarla
-- no duplica ni falla.
-- ===========================================================================

insert into categories (slug, name, icon_name, position) values
  ('urgencias',        'Urgencias vitales',    'cpr',             1),
  ('primeros-auxilios','Primeros auxilios',    'bandage-adhesive',2),
  ('prevencion',       'Prevención',           'stethoscope',     3),
  ('salud-general',    'Salud general',        'heartbeat',       4)
on conflict (slug) do nothing;
