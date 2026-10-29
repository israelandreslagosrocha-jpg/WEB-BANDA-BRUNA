// Monitor radial retirado por decisión del propietario; no consulta ni modifica datos.
export const prerender = false;
export function GET() {
  return new Response(JSON.stringify({ success: false, retired: true, error: 'El seguimiento de radios fue retirado' }), {
    status: 410, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}
