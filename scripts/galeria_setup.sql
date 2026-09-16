-- =====================================================================
-- BANDA BRUNA - TABLA DE ÁLBUMES DE GALERÍA
-- Ejecuta este script en el SQL Editor de tu consola de Supabase
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.galeria_albumes (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  ano INTEGER NOT NULL DEFAULT 2026,
  fotos JSONB NOT NULL DEFAULT '[]'::jsonb,
  orden INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.galeria_albumes ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad
DROP POLICY IF EXISTS "Lectura pública de álbumes activos" ON public.galeria_albumes;
DROP POLICY IF EXISTS "Administrador galeria completo" ON public.galeria_albumes;

CREATE POLICY "Lectura pública de álbumes activos" ON public.galeria_albumes
  FOR SELECT USING (activo = true);

CREATE POLICY "Administrador galeria completo" ON public.galeria_albumes
  FOR ALL USING (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl')
  WITH CHECK (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');

-- Inserción / Sembrado Inicial de Álbumes
INSERT INTO public.galeria_albumes (id, titulo, ano, fotos, orden, activo)
VALUES ('temuco-2026-show-en-vivo-olimpo-club', 'TEMUCO 2026 - SHOW EN VIVO - OLIMPO CLUB', 2026, '["https://res.cloudinary.com/dhgifjpkh/image/upload/v1789438488/compressed_IMG_4423_vuykwm.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1789438491/compressed_IMG_4496_johnfo.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1789438484/compressed_IMG_4466_itybfb.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1789438484/compressed_IMG_4469_zhvpcn.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1789438484/compressed_IMG_4446_chrlhi.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1789438483/compressed_IMG_4525_uqtzfg.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1789438483/compressed_IMG_4541_jhcc7j.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1789438483/compressed_IMG_4482_dnonmh.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1789438483/compressed_IMG_4363_afpzbm.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1789438482/compressed_IMG_4490_xutyjf.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1789438482/compressed_IMG_4530_jccie3.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1789438482/compressed_IMG_4450_wosuki.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1789438482/compressed_IMG_4458_f4qujo.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1789438486/compressed_IMG_4487_iq0bdh.webp"]'::jsonb, 0, true)
ON CONFLICT (id) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  ano = EXCLUDED.ano,
  fotos = EXCLUDED.fotos,
  orden = EXCLUDED.orden;

INSERT INTO public.galeria_albumes (id, titulo, ano, fotos, orden, activo)
VALUES ('freire-2026-dia-de-la-mujer', 'FREIRE 2026 - DÍA DE LA MUJER', 2026, '["https://res.cloudinary.com/dhgifjpkh/image/upload/v1784860253/compressed_25-DSC02077_a1j4vg.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784860251/compressed_2-DSC02011_wt9bhd.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784860250/compressed_15-DSC02043_mykjys.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784860252/compressed_7-DSC02026_y6eapw.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784860252/compressed_14-DSC02040_dag6qf.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784860252/compressed_8-DSC02028_ybn4io.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784860251/compressed_5-DSC02020_ozd4tr.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784860251/compressed_19-DSC02058_oufp5c.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784860251/compressed_6-DSC02021_n84qmi.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784860253/compressed_46-DSC02173_lv2ybj.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784860253/compressed_44-DSC02168_v6qlpy.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784860252/compressed_22-DSC02066_wrnql7.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784860256/compressed_4-DSC02019_u6sx1t.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784860254/compressed_18-DSC02057_mhl68n.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784860253/compressed_26-DSC02085_vvj3o6.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784860254/compressed_30-DSC02107_k54gi1.webp"]'::jsonb, 1, true)
ON CONFLICT (id) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  ano = EXCLUDED.ano,
  fotos = EXCLUDED.fotos,
  orden = EXCLUDED.orden;

INSERT INTO public.galeria_albumes (id, titulo, ano, fotos, orden, activo)
VALUES ('pocoyan-2026', 'POCOYAN 2026', 2026, '["https://res.cloudinary.com/dhgifjpkh/image/upload/v1784914210/compressed_WhatsApp_Image_2026-07-22_at_4.33.43_PM_14_bsxvrm.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784914210/compressed_WhatsApp_Image_2026-07-22_at_4.33.43_PM_12_amhyoh.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784914211/compressed_WhatsApp_Image_2026-07-22_at_4.33.43_PM_tcm7np.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784914208/compressed_WhatsApp_Image_2026-07-22_at_4.33.43_PM_11_jivxbe.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784914192/compressed_WhatsApp_Image_2026-07-22_at_4.33.43_PM_1_kkaw2s.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784914192/compressed_WhatsApp_Image_2026-07-22_at_4.33.42_PM_wejfiw.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784914191/compressed_WhatsApp_Image_2026-07-22_at_4.33.40_PM_2_rmjxl9.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784914193/compressed_WhatsApp_Image_2026-07-22_at_4.33.43_PM_4_nc1jnk.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784914192/compressed_WhatsApp_Image_2026-07-22_at_4.33.43_PM_2_uahhlo.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784914191/compressed_WhatsApp_Image_2026-07-22_at_4.33.42_PM_1_dgvnod.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784914191/compressed_WhatsApp_Image_2026-07-22_at_4.33.40_PM_3_oxgn2g.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784914193/compressed_WhatsApp_Image_2026-07-22_at_4.33.43_PM_5_o5d8ad.webp"]'::jsonb, 2, true)
ON CONFLICT (id) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  ano = EXCLUDED.ano,
  fotos = EXCLUDED.fotos,
  orden = EXCLUDED.orden;

INSERT INTO public.galeria_albumes (id, titulo, ano, fotos, orden, activo)
VALUES ('puerto-saavedra-2026', 'Puerto Saavedra 2026', 2026, '["https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414125/compressed_DSC01108_gh6sl8.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414123/compressed_DSC01050_r8fjdr.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414124/compressed_DSC00953_zemfwn.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414123/compressed_DSC01039_k96lbp.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414122/compressed_DSC01037_drvqlo.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414122/compressed_DSC01030_yuidzw.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414124/compressed_DSC01078_caezrq.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414121/compressed_DSC01017_nbg8tc.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414121/compressed_DSC00912_yegttw.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414120/compressed_DSC01015_snc4y3.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414120/compressed_DSC00983_tcabl4.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414120/compressed_DSC00959_qbmc83.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414118/compressed_DSC00938_epjivn.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414118/compressed_DSC00924_qjmiv5.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414119/compressed_DSC00958_eysbdz.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414118/compressed_DSC00921_tgwxsj.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414117/compressed_DSC00914_loo0xh.webp"]'::jsonb, 3, true)
ON CONFLICT (id) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  ano = EXCLUDED.ano,
  fotos = EXCLUDED.fotos,
  orden = EXCLUDED.orden;

INSERT INTO public.galeria_albumes (id, titulo, ano, fotos, orden, activo)
VALUES ('queule-2025', 'QUEULE 2025', 2025, '["https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414193/compressed_20250322-_DSC8451_tfvkgj.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414183/compressed_20250322-_DSC7731_smf5lp.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414183/compressed_20250322-_DSC7739_tb9nj8.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414184/compressed_20250322-_DSC7733_n2jspy.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414185/compressed_20250322-_DSC7769_i9pnfx.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414185/compressed_20250322-_DSC7966_ghpzc1.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414186/compressed_20250322-_DSC8028_wiqaof.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414187/compressed_20250322-_DSC8119_nvwckz.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414187/compressed_20250322-_DSC8127_jnqybt.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414188/compressed_20250322-_DSC8213_xl4fbg.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414189/compressed_20250322-_DSC8247_lb1txw.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414189/compressed_20250322-_DSC8302_iiqi8k.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414190/compressed_20250322-_DSC8316_gw0iie.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414191/compressed_20250322-_DSC8356_zoar8n.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414191/compressed_20250322-_DSC8359_pl7ubh.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414192/compressed_20250322-_DSC8362_vb3okd.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414193/compressed_20250322-_DSC8372_g0wkcl.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414194/compressed_20250322-_DSC8379_vsqowt.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414194/compressed_20250322-_DSC8207_jzso2d.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414195/compressed_20250322-_DSC8054_ryv5zg.webp"]'::jsonb, 4, true)
ON CONFLICT (id) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  ano = EXCLUDED.ano,
  fotos = EXCLUDED.fotos,
  orden = EXCLUDED.orden;

INSERT INTO public.galeria_albumes (id, titulo, ano, fotos, orden, activo)
VALUES ('expo-gorbea-2025', 'Expo Gorbea 2025', 2025, '["https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414182/compressed_20250322-_DSC8018_bqynkm.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414173/compressed_DSC00670_duu8r5.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414170/compressed_20250201230328_DSC00046_pr6oiu.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414170/compressed_20250201225753_DSC00006_hpdyo2.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414171/compressed_20250201230649_DSC00072_kyujor.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414172/compressed_20250201230759_DSC00081_1_jv8mqo.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414172/compressed_20250201232706_DSC01024_1_ci04km.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414173/compressed_20250201233944_DSC00544_1_cimbba.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414174/compressed_DSC00936_dkot0h.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414174/compressed_DSC00980_rz46x7.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414175/compressed_DSC00999_1_kiadap.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414176/compressed_DSC01011_ovbmg4.webp"]'::jsonb, 5, true)
ON CONFLICT (id) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  ano = EXCLUDED.ano,
  fotos = EXCLUDED.fotos,
  orden = EXCLUDED.orden;

INSERT INTO public.galeria_albumes (id, titulo, ano, fotos, orden, activo)
VALUES ('feria-costumbrista-tolten-2025', 'Feria Costumbrista Toltén 2025', 2025, '["https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414150/compressed_DSC02307_ca2wcv.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414149/compressed_DSC02279_dxk9xl.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414149/compressed_DSC02239_scfany.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414150/compressed_DSC02287_pqb5lj.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414151/compressed_DSC02309_nj8muq.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414152/compressed_DSC02343_1_k3npmc.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414152/compressed_DSC02356_1_l5mqsc.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414153/compressed_DSC02483_1_wx22zr.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414169/compressed_20250201230030_DSC00027_xk8lqc.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1781892642/compressed_DSC02295-scaled_habavd.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1781892642/compressed_DSC01118-scaled_qdzzx0.webp"]'::jsonb, 6, true)
ON CONFLICT (id) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  ano = EXCLUDED.ano,
  fotos = EXCLUDED.fotos,
  orden = EXCLUDED.orden;

INSERT INTO public.galeria_albumes (id, titulo, ano, fotos, orden, activo)
VALUES ('expo-freire-2025', 'Expo Freire 2025', 2025, '["https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414136/compressed_DSC00739_ebt6ni.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414136/compressed_DSC00864_cfbibm.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414138/compressed_DSC00917_kdb5d6.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414137/compressed_DSC00928_wrv3pg.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414137/compressed_DSC00845_ximkxy.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414138/compressed_DSC00771_pcbg7z.webp"]'::jsonb, 7, true)
ON CONFLICT (id) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  ano = EXCLUDED.ano,
  fotos = EXCLUDED.fotos,
  orden = EXCLUDED.orden;

INSERT INTO public.galeria_albumes (id, titulo, ano, fotos, orden, activo)
VALUES ('lautaro-2024', 'Lautaro 2024', 2024, '["https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414106/compressed_DSC09068_slsmnu.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414106/compressed_DSC09105_ngy5pw.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414106/compressed_DSC09016_xwet1n.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414106/compressed_DSC09063_kj4tkq.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414107/compressed_DSC09146_g28o4o.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414107/compressed_DSC09116_arjwcx.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414107/compressed_DSC09153_uzblup.webp","https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414107/compressed_DSC09167_ixrfvl.webp"]'::jsonb, 8, true)
ON CONFLICT (id) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  ano = EXCLUDED.ano,
  fotos = EXCLUDED.fotos,
  orden = EXCLUDED.orden;

