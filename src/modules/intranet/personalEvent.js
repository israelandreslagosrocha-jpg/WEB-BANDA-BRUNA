// El destinatario se obtiene de la sesión validada; nunca del cuerpo de la petición.
export async function personalizeEvent(auth,entry) {
 const email=auth.user.email.toLowerCase();
 const [payment,receipt]=await Promise.all([
  auth.client.from('intranet_event_payments').select('amount_clp').eq('entry_id',entry.id).eq('member_email',email).maybeSingle(),
  auth.client.from('intranet_receipts').select('completed,personal_checklist').eq('entry_id',entry.id).eq('user_id',auth.user.id).maybeSingle()
 ]);
 if(payment.error||receipt.error)throw new Error('No se pudo cargar tu información personal del evento.');
 return {...entry,member_email:email,payment_amount:payment.data?.amount_clp??null,completed:receipt.data?.completed||[],personal_checklist:receipt.data?.personal_checklist||[]};
}
