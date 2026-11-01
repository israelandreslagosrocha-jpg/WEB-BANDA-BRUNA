import outfits from './outfits.json' with { type: 'json' };
export { outfits };
export function outfitFor(slug){return outfits.find(o=>o.id===slug)||null;}
