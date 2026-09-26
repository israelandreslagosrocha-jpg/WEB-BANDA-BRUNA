import { supabase } from '../../../services/supabaseClient.js';
import staticAlbums from '../../../data/albums.json';
import { authenticateAdminRequest, createServiceSupabaseClient, jsonResponse } from '../../../services/serverAuth.js';

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
  const auth = await authenticateAdminRequest(request);
  if (!auth.authorized) {
    return jsonResponse({ success: false, error: 'No autorizado' }, 401);
  }

  try {
    const body = await request.json();
    const { action, id, album } = body;
    const adminSupabase = createServiceSupabaseClient();

    if (action === 'create' || action === 'update') {
      const albumId = (id || album?.id || slugify(album?.title || 'album')).trim();
      const titulo = String(album?.title || album?.titulo || '').trim();
      const ano = parseInt(album?.year || album?.ano || new Date().getFullYear(), 10);
      const fotos = (Array.isArray(album?.photos) ? album.photos : (Array.isArray(album?.fotos) ? album.fotos : []))
        .filter(photo => typeof photo === 'string' && photo.length <= 2048 && /^https:\/\//i.test(photo));
      const orden = album?.orden !== undefined ? parseInt(album.orden, 10) : 0;

      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(albumId) || albumId.length > 120 || !titulo || titulo.length > 160 || !Number.isInteger(ano) || ano < 1900 || ano > 2100 || fotos.length > 100) {
        return jsonResponse({ success: false, error: 'Datos de álbum inválidos.' }, 400);
      }

      const newAlbumData = {
        id: albumId,
        title: titulo,
        year: ano,
        photos: fotos
      };

      const { error } = await adminSupabase
        .from('galeria_albumes')
        .upsert({
          id: albumId,
          titulo,
          ano,
          fotos,
          orden: Number.isInteger(orden) ? orden : 0,
          activo: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) {
        return jsonResponse({ success: false, error: 'No se pudo guardar el álbum.' }, 500);
      }

      return jsonResponse({ success: true, album: newAlbumData });
    }

    if (action === 'delete') {
      if (!id) {
        return new Response(JSON.stringify({ success: false, error: 'ID requerido' }), { status: 400 });
      }

      const { error } = await adminSupabase.from('galeria_albumes').delete().eq('id', id);
      if (error) {
        return jsonResponse({ success: false, error: 'No se pudo eliminar el álbum.' }, 500);
      }

      return jsonResponse({ success: true, deletedId: id });
    }

    return jsonResponse({ success: false, error: 'Acción inválida' }, 400);
  } catch (err) {
    console.error('[galeria API] Error al modificar álbum:', err.message);
    return jsonResponse({ success: false, error: 'Error interno.' }, 500);
  }
}
