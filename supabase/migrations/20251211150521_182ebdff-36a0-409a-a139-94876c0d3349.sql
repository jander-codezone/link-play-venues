-- Insertar 20 artistas variados con diferentes rangos de precio
INSERT INTO public.artistas (nombre, email, estilo, cache, tipos_evento, descripcion) VALUES
-- DJs económicos (150€ - 500€)
('DJ Marco', 'djmarco@email.com', 'House', 150, ARRAY['Club', 'Bar'], 'DJ residente con sesiones house y deep house'),
('DJ Luna', 'djluna@email.com', 'Tech House', 200, ARRAY['Club', 'Fiesta Privada'], 'DJ emergente especializada en tech house'),
('Carlos Beats', 'carlosbeats@email.com', 'Comercial', 180, ARRAY['Club', 'Bar', 'Evento Corporativo'], 'DJ versátil para todo tipo de eventos'),
('DJ Neon', 'djneon@email.com', 'EDM', 250, ARRAY['Club', 'Festival'], 'Especialista en música electrónica mainstream'),
('Sandra Mix', 'sandramix@email.com', 'R&B', 300, ARRAY['Club', 'Lounge'], 'Sesiones R&B y hip hop suave'),

-- DJs medios (500€ - 2.000€)
('DJ Thunder', 'djthunder@email.com', 'Techno', 800, ARRAY['Club', 'Festival'], 'DJ de techno con residencias en clubs de Madrid'),
('Pablo Groove', 'pablogroove@email.com', 'Deep House', 650, ARRAY['Club', 'Beach Club'], 'Sonidos deep y melódicos para noches especiales'),
('Maria Waves', 'mariawaves@email.com', 'Minimal', 750, ARRAY['Club'], 'Productora y DJ de minimal techno'),
('DJ Fuego', 'djfuego@email.com', 'Reggaeton', 1200, ARRAY['Club', 'Fiesta Privada'], 'El rey del perreo en Madrid'),
('Alex Session', 'alexsession@email.com', 'House', 900, ARRAY['Club', 'Hotel'], 'Sesiones house elegantes y sofisticadas'),
('Nina Beats', 'ninabeats@email.com', 'Tech House', 1500, ARRAY['Club', 'Festival'], 'Una de las promesas del tech house español'),
('DJ Cosmos', 'djcosmos@email.com', 'Trance', 1800, ARRAY['Club', 'Festival'], 'Viajes sonoros de trance progresivo'),

-- Artistas medianos (2.000€ - 10.000€)
('Oscar Martinez', 'oscarmartinez@email.com', 'Latin', 3500, ARRAY['Club', 'Concierto'], 'Cantante de música latina con hits virales'),
('The Groove Band', 'thegrooveband@email.com', 'Funk', 4500, ARRAY['Club', 'Evento Corporativo', 'Concierto'], 'Banda de funk y soul para animar cualquier fiesta'),
('Danny Flow', 'dannyflow@email.com', 'Hip Hop', 6000, ARRAY['Club', 'Festival', 'Concierto'], 'Rapero emergente con millones de streams'),
('Electra', 'electra@email.com', 'EDM', 8000, ARRAY['Club', 'Festival'], 'DJ y productora internacional de EDM'),

-- Artistas grandes (10.000€ - 50.000€)
('Juan Magán', 'management@juanmagan.com', 'Reggaeton', 25000, ARRAY['Club', 'Festival', 'Concierto'], 'Leyenda del electro latino español'),
('Rels B', 'booking@relsb.com', 'Hip Hop', 35000, ARRAY['Club', 'Festival', 'Concierto'], 'Uno de los artistas urbanos más grandes de España'),
('Lola Indigo', 'management@lolaindigo.com', 'Pop', 40000, ARRAY['Club', 'Festival', 'Concierto'], 'Estrella del pop español con hits bailables'),
('C. Tangana', 'booking@ctangana.com', 'Urban', 50000, ARRAY['Festival', 'Concierto'], 'El Madrileño - icono de la música urbana española');