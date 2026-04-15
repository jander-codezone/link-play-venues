
INSERT INTO public.artistas (nombre, estilo, descripcion, cache, categoria, tipos_evento, foto_url) VALUES
-- DJs pequeños/medianos con nombres aleatorios
('DJ Máximo', 'Tech House', 'DJ emergente especializado en tech house y melodic techno', 350, 'standard', ARRAY['club', 'festival', 'privado'], 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=400'),
('DJ Lunar', 'Deep House', 'Sesiones envolventes de deep house y progressive', 400, 'standard', ARRAY['club', 'lounge', 'privado'], 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400'),
('Marcos Beat', 'Commercial', 'DJ versátil para todo tipo de eventos', 300, 'standard', ARRAY['boda', 'corporativo', 'privado'], 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400'),
('DJ Nébula', 'Techno', 'Techno oscuro y contundente', 450, 'standard', ARRAY['club', 'festival', 'rave'], 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=400'),
('Alex Nova', 'EDM', 'Especialista en EDM y big room', 380, 'standard', ARRAY['festival', 'club', 'privado'], 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400'),
('DJ Kristal', 'House', 'House clásico y funky', 320, 'standard', ARRAY['club', 'lounge', 'privado'], 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400'),
('Victor Waves', 'Progressive House', 'Melodías épicas y progressive', 420, 'standard', ARRAY['club', 'festival', 'privado'], 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=400'),
('DJ Pulse', 'Minimal', 'Minimal techno hipnótico', 350, 'standard', ARRAY['club', 'rave', 'privado'], 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400'),
('Luna Beats', 'Afro House', 'Ritmos africanos y house orgánico', 380, 'standard', ARRAY['club', 'festival', 'privado'], 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400'),
('DJ Storm', 'Drum & Bass', 'Especialista en DnB y jungle', 400, 'standard', ARRAY['club', 'rave', 'festival'], 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=400'),

-- Artistas grandes de reggaeton
('Bad Bunny', 'Reggaeton/Trap', 'El artista latino más escuchado del mundo', 150000, 'premium', ARRAY['festival', 'concierto', 'privado'], 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400'),
('J Balvin', 'Reggaeton', 'Pionero del reggaeton global', 120000, 'premium', ARRAY['festival', 'concierto', 'privado'], 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400'),
('Daddy Yankee', 'Reggaeton', 'El Big Boss, leyenda del género', 100000, 'premium', ARRAY['festival', 'concierto', 'privado'], 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400'),
('Rauw Alejandro', 'Reggaeton/R&B', 'La nueva generación del reggaeton', 80000, 'premium', ARRAY['festival', 'concierto', 'privado'], 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=400'),
('Ozuna', 'Reggaeton/Trap', 'El negrito de ojos claros', 70000, 'premium', ARRAY['festival', 'concierto', 'privado'], 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400'),
('Anuel AA', 'Trap/Reggaeton', 'Real hasta la muerte', 60000, 'premium', ARRAY['festival', 'concierto', 'privado'], 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400'),

-- DJs grandes conocidos
('David Guetta', 'EDM/House', 'Leyenda francesa del EDM mundial', 200000, 'premium', ARRAY['festival', 'club', 'privado'], 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=400'),
('Martin Garrix', 'EDM/Big Room', 'El prodigio holandés del EDM', 180000, 'premium', ARRAY['festival', 'club', 'privado'], 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400'),
('Tiësto', 'EDM/Trance', 'El padrino del trance y EDM', 170000, 'premium', ARRAY['festival', 'club', 'privado'], 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400'),
('Calvin Harris', 'EDM/Pop', 'El DJ más comercial del mundo', 160000, 'premium', ARRAY['festival', 'club', 'privado'], 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=400'),
('Marshmello', 'EDM/Future Bass', 'El DJ enmascarado más famoso', 140000, 'premium', ARRAY['festival', 'club', 'privado'], 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400'),
('Armin van Buuren', 'Trance', 'El rey del trance mundial', 130000, 'premium', ARRAY['festival', 'club', 'privado'], 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400'),

-- Artistas de música comercial conocidos
('Shakira', 'Pop Latino', 'La reina del pop latino internacional', 250000, 'premium', ARRAY['festival', 'concierto', 'privado'], 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=400'),
('Dua Lipa', 'Pop/Dance', 'Estrella del pop británico', 180000, 'premium', ARRAY['festival', 'concierto', 'privado'], 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400'),
('The Weeknd', 'R&B/Pop', 'El artista más escuchado en streaming', 220000, 'premium', ARRAY['festival', 'concierto', 'privado'], 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400'),
('Bruno Mars', 'Pop/Funk', 'El showman más completo', 200000, 'premium', ARRAY['festival', 'concierto', 'privado'], 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=400'),
('Rosalía', 'Flamenco/Pop', 'La revolución del flamenco moderno', 90000, 'premium', ARRAY['festival', 'concierto', 'privado'], 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400'),
('Aitana', 'Pop', 'Estrella del pop español', 40000, 'premium', ARRAY['festival', 'concierto', 'privado'], 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400'),
('C. Tangana', 'Urban/Pop', 'El madrileño más internacional', 50000, 'premium', ARRAY['festival', 'concierto', 'privado'], 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=400'),
('Bizarrap', 'Productor/DJ', 'El productor argentino que revolucionó la música', 100000, 'premium', ARRAY['festival', 'concierto', 'privado'], 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400');
