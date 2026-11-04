export function lightingSummary(stageObjects, dbEffects) {
  // Procesar focos de base de datos o usar fallbacks si está vacío
  let fixtureList = [];
  let trussList = [];

  if (stageObjects.length > 0) {
    const counts = {};
    const trussSummary = {};

    stageObjects.forEach(obj => {
      const name = obj.fixture?.nombre || obj.nombre_etiqueta || 'Fixture';
      if (!counts[name]) {
        counts[name] = {
          nombre: name,
          tipo: obj.fixture?.tipo || 'Desconocido',
          modelo: `${obj.fixture?.marca || ''} ${obj.fixture?.modelo || ''}`.trim() || 'Genérico',
          potencia: obj.fixture?.potencia || 'N/A',
          dmx: obj.modo || '16 CH',
          cant: 0
        };
      }
      counts[name].cant++;

      const trussName = obj.truss?.nombre || 'Piso Escenario (Floor)';
      const type = obj.fixture?.tipo || 'Fixture';
      if (!trussSummary[trussName]) {
        trussSummary[trussName] = {};
      }
      if (!trussSummary[trussName][type]) {
        trussSummary[trussName][type] = 0;
      }
      trussSummary[trussName][type]++;
    });

    fixtureList = Object.values(counts).map(f => ({
      nombre: f.nombre,
      tipo: f.tipo,
      modelo: f.modelo,
      potencia: f.potencia,
      dmx: f.dmx,
      cant: f.cant.toString()
    }));

    trussList = Object.keys(trussSummary).map(trussName => {
      const types = trussSummary[trussName];
      const detail = Object.keys(types).map(t => `${types[t]} ${t}s`).join(' + ');
      const total = Object.values(types).reduce((a, b) => a + b, 0);
      return {
        truss: trussName,
        detail: detail,
        cant: total.toString()
      };
    });
  } else {
    fixtureList = [
      { nombre: 'Moving Head Beam 7R', tipo: 'Beam', modelo: 'Clay Paky / Sharpy', potencia: '230W', dmx: '16 CH', cant: '22' },
      { nombre: 'Moving Head Wash LED', tipo: 'Wash', modelo: 'Martin / Mac Aura', potencia: '300W', dmx: '15 CH', cant: '16' },
      { nombre: 'Paleta Led RGB', tipo: 'Led Bar', modelo: 'Chauvet / COLORband', potencia: '150W', dmx: '4 CH', cant: '12' },
      { nombre: 'COB LED 200W', tipo: 'Cob', modelo: 'Generic COB', potencia: '200W', dmx: '2 CH', cant: '8' },
      { nombre: 'Blinder 4 Canales', tipo: 'Blinder', modelo: 'Generic 4x100W', potencia: '400W', dmx: '4 CH', cant: '6' }
    ];
    trussList = [
      { truss: 'Puente Contra (Back Truss)', detail: '8 Beams (efectos aire) + 4 Barras LED (color base de fondo)', cant: '12' },
      { truss: 'Puente Cenital (Mid Truss)', detail: '8 Wash (baño de color escenario) + 4 Barras LED (contras cenitales)', cant: '12' },
      { truss: 'Puente Frontal (Front Truss)', detail: '6 Blinders (iluminación público) + 8 COB LEDs (iluminación base integrantes)', cant: '14' },
      { truss: 'Piso Escenario (Floor)', detail: '14 Beams (haces desde atrás y costados) + 8 Wash + 8 Paletas LED', cant: '30' }
    ];
  }

  let fxSummary = { Spark: 4, Smoke: 4, Hazer: 1 };
  if (dbEffects.length > 0) {
    const temp = {};
    dbEffects.forEach(fx => {
      if (!temp[fx.nombre]) temp[fx.nombre] = 0;
      temp[fx.nombre] += fx.cantidad;
    });
    Object.keys(temp).forEach(k => {
      fxSummary[k] = temp[k];
    });
  }

  return { fixtureList, trussList, fxSummary };
}
