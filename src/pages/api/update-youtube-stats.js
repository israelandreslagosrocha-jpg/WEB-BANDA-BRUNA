import { supabase } from '../../services/supabaseClient.js';

export const prerender = false; // Forzar ejecución dinámica en Vercel

export async function GET({ request }) {
  try {
    // 1. Obtener los datos del lanzamiento de Ahogado en un Bar
    const { data: lanzamiento, error: fetchError } = await supabase
      .from('lanzamientos')
      .select('*')
      .eq('slug', 'ahogado-en-un-bar')
      .single();

    if (fetchError || !lanzamiento) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Lanzamiento no encontrado o error en Supabase' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const videoUrl = lanzamiento.plataformas_links?.youtube;
    if (!videoUrl) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'No hay URL de YouTube registrada para este lanzamiento' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Consultar el video público en YouTube
    const ytRes = await fetch(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
      }
    });

    if (!ytRes.ok) {
      throw new Error(`Error HTTP al consultar YouTube: ${ytRes.status}`);
    }

    const html = await ytRes.text();

    // 3. Extraer visualizaciones (views)
    const viewMatch = html.match(/\"viewCount\":\"(\d+)\"/i);
    const views = viewMatch ? parseInt(viewMatch[1], 10) : null;

    // 4. Extraer me gusta (likes)
    const likeMatch = html.match(/LikeAction\"><meta itemprop=\"userInteractionCount\" content=\"(\d+)\"/i);
    let likes = likeMatch ? parseInt(likeMatch[1], 10) : null;

    if (!likes) {
      const altLikeMatch = html.match(/\"likeCount\":\"(\d+)\"/i);
      likes = altLikeMatch ? parseInt(altLikeMatch[1], 10) : null;
    }

    if (views === null || likes === null) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No se pudieron extraer los datos del HTML de YouTube',
        extracted: { views, likes }
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 5. Actualizar el objeto plataformas_links en Supabase
    const updatedLinks = {
      ...lanzamiento.plataformas_links,
      youtube_views: views,
      youtube_likes: likes
    };

    const { error: updateError } = await supabase
      .from('lanzamientos')
      .update({
        plataformas_links: updatedLinks,
        updated_at: new Date().toISOString()
      })
      .eq('id', lanzamiento.id);

    if (updateError) {
      throw new Error(`Error al actualizar Supabase: ${updateError.message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Estadísticas de YouTube actualizadas con éxito',
      data: {
        views,
        likes,
        updated_at: new Date().toISOString()
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Error en cron job de YouTube:', err);
    return new Response(JSON.stringify({ 
      success: false, 
      error: err.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
