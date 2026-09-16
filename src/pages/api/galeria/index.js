import { supabase } from '../../../services/supabaseClient.js';
import staticAlbums from '../../../data/albums.json';
import fs from 'node:fs';
import path from 'node:path';

export const prerender = false;

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function updateLocalFile(albums) {
  try {
    const filePath = path.resolve(process.cwd(), 'src/data/albums.json');
    fs.writeFileSync(filePath, JSON.stringify(albums, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[galeria API] No se pudo guardar en albums.json local:', e.message);
  }
}

export async function GET() {
  try {
    const { data: dbAlbums, error } = await supabase
      .from('galeria_albumes')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true })
      .order('created_at', { ascending: false });

    if (!error && dbAlbums && dbAlbums.length > 0) {
      const albums = dbAlbums.map(a => ({
        id: a.id,
        title: a.titulo,
        year: a.ano,
        photos: Array.isArray(a.fotos) ? a.fotos : (typeof a.fotos === 'string' ? JSON.parse(a.fotos) : []),
        orden: a.orden
      }));
      return new Response(JSON.stringify({ success: true, albums, source: 'supabase' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (e) {
    console.warn('[galeria API] Supabase query falló, usando local:', e.message);
  }

  return new Response(JSON.stringify({ success: true, albums: staticAlbums, source: 'local' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { action, id, album } = body;

    // Obtener álbumes actuales para fallback
    let currentAlbums = [...staticAlbums];
    try {
      const filePath = path.resolve(process.cwd(), 'src/data/albums.json');
      if (fs.existsSync(filePath)) {
        currentAlbums = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      }
    } catch (e) {}

    if (action === 'create' || action === 'update') {
      const albumId = (id || album?.id || slugify(album?.title || 'album')).trim();
      const titulo = album?.title || album?.titulo || 'Álbum Sin Título';
      const ano = parseInt(album?.year || album?.ano || new Date().getFullYear(), 10);
      const fotos = Array.isArray(album?.photos) ? album.photos : (Array.isArray(album?.fotos) ? album.fotos : []);
      const orden = album?.orden !== undefined ? parseInt(album.orden, 10) : 0;

      const newAlbumData = {
        id: albumId,
        title: titulo,
        year: ano,
        photos: fotos
      };

      // 1. Guardar en Supabase
      let supabaseError = null;
      try {
        const { error } = await supabase
          .from('galeria_albumes')
          .upsert({
            id: albumId,
            titulo: titulo,
            ano: ano,
            fotos: fotos,
            orden: orden,
            activo: true,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
        supabaseError = error;
      } catch (e) {
        supabaseError = e;
      }

      // 2. Guardar en local albums.json
      const existingIdx = currentAlbums.findIndex(a => a.id === albumId);
      if (existingIdx >= 0) {
        currentAlbums[existingIdx] = newAlbumData;
      } else {
        currentAlbums.unshift(newAlbumData);
      }
      updateLocalFile(currentAlbums);

      return new Response(JSON.stringify({
        success: true,
        album: newAlbumData,
        supabaseSynced: !supabaseError,
        supabaseError: supabaseError ? supabaseError.message : null
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (action === 'delete') {
      if (!id) {
        return new Response(JSON.stringify({ success: false, error: 'ID requerido' }), { status: 400 });
      }

      // 1. Borrar en Supabase
      try {
        await supabase.from('galeria_albumes').delete().eq('id', id);
      } catch (e) {}

      // 2. Borrar en local
      currentAlbums = currentAlbums.filter(a => a.id !== id);
      updateLocalFile(currentAlbums);

      return new Response(JSON.stringify({ success: true, deletedId: id }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: false, error: 'Acción inválida' }), { status: 400 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
