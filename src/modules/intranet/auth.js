import { createClient } from '@supabase/supabase-js';
import { createPublicSupabaseClient, getBearerToken } from '../../services/serverAuth.js';
import { memberFor } from './members.js';
export async function intranetAuth(request) {
 const token=getBearerToken(request);if(!token)return null;
 const {data:{user},error}=await createPublicSupabaseClient().auth.getUser(token);
 if(error||!user)return null;
 const email=user.email?.toLowerCase(); const member=memberFor(email);
 if(!member&&email!=='contacto@bandabruna.cl')return null;
 const url=process.env.PUBLIC_SUPABASE_URL||import.meta.env.PUBLIC_SUPABASE_URL;
 const key=process.env.PUBLIC_SUPABASE_ANON_KEY||import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
 return {user,role:member?.[2]||'jefatura',client:createClient(url,key,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}})};
}
