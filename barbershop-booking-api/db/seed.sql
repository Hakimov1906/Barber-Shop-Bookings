INSERT INTO barbers (name)
VALUES
  ('AzamatTEST'),
  ('BeksultanTEST'),
  ('DastanTEST'),
  ('ErlanTEST'),
  ('KairatTEST'),
  ('MaksatTEST'),
  ('NurlanTEST'),
  ('RuslanTEST'),
  ('SamatTEST'),
  ('DaniyarTEST')
ON CONFLICT DO NOTHING;

INSERT INTO services (name, duration_minutes, price)
VALUES
  ('Classic haircutTEST', 30, 500),
  ('Fade haircutTEST', 45, 700),
  ('Beard trimTEST', 20, 400)
ON CONFLICT DO NOTHING;
