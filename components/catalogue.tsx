'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X, Flower2 } from 'lucide-react';
import { type Entry, supportTypeLabel } from '@/lib/data';
import { SupportCard } from '@/components/support-card';

const filters = [{value:'all',label:'Tout voir'},{value:'livret',label:'Livrets'},{value:'fiche',label:'Fiches pratiques'},{value:'kit',label:'Kits & activités'},{value:'guide',label:'Guides'}];

export function Catalogue({ resources }: {resources:Entry[]}) {
  const [kind, setKind] = useState('all');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  useEffect(() => { const requested = new URLSearchParams(window.location.search).get('type'); if (requested && filters.some(f => f.value === requested)) setKind(requested); }, []);
  const categories = useMemo(() => [...new Set(resources.map(e => e.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fr')), [resources]);
  const selected = useMemo(()=> resources.filter(resource => {
    const type = resource.support_type || 'fiche';
    const search = `${resource.title} ${resource.excerpt} ${resource.category} ${resource.audience || ''} ${supportTypeLabel(type)}`.toLocaleLowerCase('fr');
    return (kind==='all' || type === kind) && (category==='all' || resource.category === category) && search.includes(query.trim().toLocaleLowerCase('fr'));
  }),[resources,kind,category,query]);
  const reset = () => {setKind('all');setCategory('all');setQuery('');};
  return <div className="shop-catalogue">
    <div className="shop-catalogue-controls"><div className="shop-filter-tabs" role="group" aria-label="Filtrer par type de support">{filters.map(filter=><button type="button" className={filter.value===kind?'is-active':''} aria-pressed={filter.value===kind} onClick={()=>setKind(filter.value)} key={filter.value}>{filter.label}</button>)}</div>
      <div className="shop-search-row"><label className="shop-search"><Search size={18}/><input aria-label="Rechercher un support" placeholder="Rechercher un livret, un thème…" value={query} onChange={e=>setQuery(e.target.value)} />{query && <button type="button" aria-label="Effacer la recherche" onClick={()=>setQuery('')}><X size={16}/></button>}</label><label className="shop-category-filter"><SlidersHorizontal size={18}/><span className="sr-only">Thématique</span><select value={category} onChange={e=>setCategory(e.target.value)}><option value="all">Toutes les thématiques</option>{categories.map(item=><option key={item} value={item}>{item}</option>)}</select></label></div>
    </div>
    <div className="shop-catalogue-summary"><span>{selected.length} {selected.length > 1 ? 'créations' : 'création'} à découvrir</span>{(kind!=='all'||query||category!=='all') && <button type="button" onClick={reset}>Effacer les filtres <X size={14}/></button>}</div>
    {selected.length ? <div className="shop-product-grid">{selected.map(resource=><SupportCard entry={resource} key={resource.id}/>)}</div> : <div className="shop-catalogue-empty"><Flower2 size={38} strokeWidth={1.3}/><h2>{resources.length ? 'Pas de création pour ces critères' : 'La collection se prépare avec douceur…'}</h2><p>{resources.length ? 'Essayez une autre catégorie ou une recherche plus courte.' : 'Les premiers livrets et supports seront présentés ici dès leur publication.'}</p>{resources.length>0 && <button className="btn btn-outline" type="button" onClick={reset}>Voir toutes les créations</button>}</div>}
  </div>;
}
