-- SCRIPT DE ACTUALIZACIÓN DE LOCACIONES PARA "AHOGADO EN UN BAR"
-- Ejecutar este script en el editor SQL de Supabase para actualizar los textos en producción.

-- 1. Actualizar en la tabla de Lanzamientos
UPDATE public.lanzamientos
SET 
  descripcion = 'La escena tropical se enciende con el lanzamiento más esperado del invierno. La Banda Bruna presenta su nuevo tema original grabado en Cervecería Maquehue y Centro de Eventos Araucaria en Padre las Casas.',
  historia = '«Ahogado en un bar» nace de la necesidad de contar historias cotidianas a través del contagioso ritmo de la cumbia tropical de Banda Bruna. El proceso creativo comenzó en el sur de Chile, donde combinamos el folclor urbano y la energía de los metales y las percusiones. El rodaje se llevó a cabo en Cervecería Maquehue y Centro de Eventos Araucaria, en la comuna de Padre las Casas, capturando la esencia perfecta y bohemia que la canción relata. Bajo la dirección de Agencia CK, logramos un estándar cinematográfico del cual estamos profundamente orgullosos y ansiosos de compartir.',
  meta_description = 'Descubre la cuenta regresiva, fotos exclusivas del rodaje en Cervecería Maquehue y Centro de Eventos Araucaria, el making of y todos los detalles del nuevo single de Banda Bruna.',
  keywords = 'banda bruna, ahogado en un bar, cumbia sureña, cerveceria maquehue, centro eventos araucaria, padre las casas, musica chilena, proximo lanzamiento'
WHERE slug = 'ahogado-en-un-bar';

-- 2. Actualizar en la tabla de Noticias
UPDATE public.noticias
SET 
  resumen = 'La escena tropical de la Región de La Araucanía se prepara para un estreno importante. La Banda Bruna anunció el rodaje de su segundo videoclip para su tema original "Ahogado en un bar", grabado en Cervecería Maquehue y Centro de Eventos Araucaria en Padre las Casas.',
  contenido = 'La escena tropical de la Región de La Araucanía se prepara para un importante estreno. La Banda Bruna anunció el rodaje de su segundo videoclip, para su nuevo tema original «Ahogado en un bar». El proyecto, que se registrará bajo el ritmo y la energía de la cumbia tropical, tuvo como locaciones de grabación la Cervecería Maquehue (Padre las Casas, IX Región de la Araucanía - https://www.instagram.com/cervezamaquehue/?hl=es) y el Centro de Eventos Araucaria (Padre las Casas - https://www.instagram.com/centro_eventos_araucaria/?hl=es), lo que promete capturar la atmósfera perfecta para la canción. La producción visual estará en manos de la reconocida Agencia CK, lo que asegura un estándar de calidad técnica y artística de primer nivel para la escena local.

¿Cuándo se estrena? Los fanáticos no tendrán que esperar mucho. El videoclip y la canción de BandaBruna estarán disponibles en todas las plataformas digitales a partir de mediados de junio/principios de Julio. Con «Ahogado en un bar», la agrupación busca consolidar su propuesta musical y hacer bailar a todo el público del país.

Sigue el minuto a minuto el proceso de grabación, que traerá sorpresas y registros exclusivos tras bambalinas. Recuerda mantenerte informado de todos los detalles del rodaje y el lanzamiento en nuestras redes sociales oficiales como bandabruna_oficial.'
WHERE slug = 'banda-bruna-bb-encendera-el-invierno-con-su-nueva-cumbia-ahogado-en-un-bar';
