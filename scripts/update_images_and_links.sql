-- SCRIPT DE ACTUALIZACIÓN DE ENLACES E IMÁGENES PARA "AHOGADO EN UN BAR"
-- Ejecutar esta consulta en el SQL Editor de Supabase (https://supabase.com)

UPDATE lanzamientos
SET 
  -- 1. Actualizar enlaces de streaming
  plataformas_links = '{
    "spotify": "https://open.spotify.com/intl-es/album/44B8oavHkAoN0QreYYnGsi?si=wv9F-IkyTxWRmuHeSxALtQ",
    "youtube": "https://www.youtube.com/watch?v=HjzOsFi-EFQ",
    "apple_music": "https://music.apple.com/cl/song/ahogado-en-un-bar/6786217850",
    "amazon_music": "https://music.amazon.es/albums/B0H75B8Q2B?marketplaceId=A1RKKUPIHCS9HS&musicTerritory=ES&ref=dm_sh_0t7xtHyHLnVyxoRglq7aPsHVm",
    "deezer": "https://link.deezer.com/s/33IS3BBBrGA0IGkMil4v7",
    "youtube_music": "https://music.youtube.com/watch?v=HjzOsFi-EFQ"
  }'::jsonb,

  -- 2. Reemplazar imagen_banner con la portada horizontal oficial de YouTube (16:9)
  imagen_banner = 'https://res.cloudinary.com/dhgifjpkh/image/upload/v1783052351/compressed_Portada_Youtube_Banda_Bruna_w8bnse.webp',

  -- 3. Agregar las 2 nuevas fotos promocionales al inicio de la galería de rodaje
  galeria_images = array[
    'https://res.cloudinary.com/dhgifjpkh/image/upload/v1783052331/compressed_BANDA_BRUNA_-_AHOGADO_EN_UN_BAR_mgwlvi.webp',
    'https://res.cloudinary.com/dhgifjpkh/image/upload/v1783052331/compressed_ahogado_en_un_bar_historias_wb3eap.webp',
    'https://res.cloudinary.com/dhgifjpkh/image/upload/v1781910903/compressed_IMG_6752_muxcrr.webp',
    'https://res.cloudinary.com/dhgifjpkh/image/upload/v1781910902/compressed_IMG_6753_mbptzg.webp',
    'https://res.cloudinary.com/dhgifjpkh/image/upload/v1781910901/compressed_IMG_6754_aqr1i8.webp',
    'https://res.cloudinary.com/dhgifjpkh/image/upload/v1781910900/compressed_IMG_6755_zrkkil.webp',
    'https://res.cloudinary.com/dhgifjpkh/image/upload/v1781910899/compressed_IMG_6756_drc3lc.webp'
  ]
WHERE slug = 'ahogado-en-un-bar';
