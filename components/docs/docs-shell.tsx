'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faArrowUpRightFromSquare, faBars, faXmark, faCopy, faCheck, faArrowRight, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { QozmoMark } from '@/components/brand';
import { useScrolled } from '@/components/use-scrolled';
import { DOC_GROUPS, DOC_PAGES, docHref, searchDocs } from '@/lib/docs-content';
import { DocsIcon } from './docs-icons';

export function DocsShell({slug,children}:{slug:string;children:ReactNode}) {
  const page=DOC_PAGES.find(item=>item.slug===slug)!;
  const scrolled=useScrolled();
  const [drawer,setDrawer]=useState(false); const [query,setQuery]=useState('');
  const [active,setActive]=useState(page.sections[0]?.id??''); const [copied,setCopied]=useState(false);
  const [status,setStatus]=useState('');
  const menuRef=useRef<HTMLButtonElement>(null); const sidebarRef=useRef<HTMLElement>(null);
  const searchRef=useRef<HTMLDialogElement>(null); const inputRef=useRef<HTMLInputElement>(null);
  const copyTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const results=searchDocs(query);

  const openSearch=()=>{setDrawer(false);setQuery(''); if(!searchRef.current?.open) searchRef.current?.showModal(); inputRef.current?.focus();};
  useEffect(()=>{
    const keys=(event:KeyboardEvent)=>{
      if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();setDrawer(false);if(!searchRef.current?.open) searchRef.current?.showModal();inputRef.current?.focus();}
    };
    window.addEventListener('keydown',keys);return()=>window.removeEventListener('keydown',keys);
  },[]);
  useEffect(()=>{
    setDrawer(false);setActive(page.sections[0]?.id??'');setStatus('');setCopied(false);searchRef.current?.close();
    const observer=new IntersectionObserver(entries=>{const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);if(visible[0])setActive(visible[0].target.id);},{rootMargin:'-120px 0px -60% 0px',threshold:0});
    page.sections.forEach(section=>{const heading=document.getElementById(section.id);if(heading)observer.observe(heading);});
    return()=>observer.disconnect();
  },[slug,page]);
  useEffect(()=>{
    if(!drawer)return;
    const previousOverflow=document.body.style.overflow; document.body.style.overflow='hidden';
    sidebarRef.current?.querySelector<HTMLAnchorElement>('a[aria-current="page"]')?.focus();
    const keys=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){setDrawer(false);menuRef.current?.focus();}
      if(event.key==='Tab'){
        const links=Array.from(sidebarRef.current?.querySelectorAll<HTMLAnchorElement>('a[href]')??[]);
        const targets=[menuRef.current,...links].filter((item):item is HTMLButtonElement|HTMLAnchorElement=>item!==null);
        const index=targets.indexOf(document.activeElement as HTMLAnchorElement);
        if(event.shiftKey&&index<=0){event.preventDefault();targets.at(-1)?.focus();}
        else if(!event.shiftKey&&(index===targets.length-1||index===-1)){event.preventDefault();targets[0]?.focus();}
      }
    };
    const outside=(event:PointerEvent)=>{if(event.target instanceof Node&&!sidebarRef.current?.contains(event.target)&&!menuRef.current?.contains(event.target))setDrawer(false);};
    const media=window.matchMedia('(min-width: 901px)'); const resize=()=>{if(media.matches)setDrawer(false);};
    window.addEventListener('keydown',keys);window.addEventListener('pointerdown',outside);media.addEventListener('change',resize);
    return()=>{document.body.style.overflow=previousOverflow;window.removeEventListener('keydown',keys);window.removeEventListener('pointerdown',outside);media.removeEventListener('change',resize);};
  },[drawer]);
  useEffect(()=>()=>{if(copyTimer.current)clearTimeout(copyTimer.current);},[]);
  async function copyLink(){try{await navigator.clipboard.writeText(window.location.href);setCopied(true);setStatus('Page link copied.');if(copyTimer.current)clearTimeout(copyTimer.current);copyTimer.current=setTimeout(()=>setCopied(false),2200);}catch{setStatus('Clipboard unavailable. Copy the page address from your browser.');}}
  function navigation(){return <>{DOC_GROUPS.map(group=><div className="qdocs-nav-group" key={group}><p>{group}</p>{DOC_PAGES.filter(item=>item.group===group).map(item=><Link key={item.slug} href={docHref(item)} className={item.slug===slug?'is-active':''} aria-current={item.slug===slug?'page':undefined}><DocsIcon name={item.icon}/><span>{item.navTitle??item.title}</span>{item.slug===slug&&<span className="qdocs-nav-indicator"/>}</Link>)}</div>)}</>;}

  return <div className="qdocs">
    <a className="skip-link" href="#qdocs-main">Skip to documentation</a>
    <header className={`qdocs-header${scrolled?' is-scrolled':''}`}><div className="qdocs-header-brand"><Link className="qdocs-brand" href="/" aria-label="Qozmo home"><QozmoMark/><span>qozmo<span>.</span></span></Link><Link href="/docs/" className="qdocs-docs-label">docs</Link></div><div className="qdocs-header-actions"><button className="qdocs-search-trigger" onClick={openSearch} aria-label="Search documentation"><FontAwesomeIcon icon={faMagnifyingGlass} aria-hidden="true"/><span>Find a little clarity…</span><kbd>⌘ K</kbd></button><Link className="qdocs-open-wallet" href="/dashboard/">Open wallet<FontAwesomeIcon icon={faArrowUpRightFromSquare} aria-hidden="true"/></Link><button ref={menuRef} className="qdocs-menu-button" aria-label={drawer?'Close documentation menu':'Open documentation menu'} aria-expanded={drawer} aria-controls="qdocs-sidebar" onClick={()=>setDrawer(value=>!value)}><FontAwesomeIcon icon={drawer?faXmark:faBars}/></button></div></header>
    {drawer&&<button className="qdocs-nav-backdrop" aria-label="Close documentation menu" onClick={()=>{setDrawer(false);menuRef.current?.focus();}}/>}
    <div className="qdocs-layout"><aside className={`qdocs-sidebar${drawer?' is-open':''}`} id="qdocs-sidebar" ref={sidebarRef}><div className="qdocs-space-label"><span><QozmoMark/></span><div><strong>The Qozmo guide</strong><small>A little more clarity.</small></div><span className="qdocs-version">v1</span></div><nav aria-label="Documentation navigation">{navigation()}</nav><div className="qdocs-sidebar-bottom"><Link href="/dashboard/#quantum"><span><DocsIcon name="quantum"/></span><div><strong>Meet Qozmo Quantum</strong><small>A fresh key for every move.</small></div><FontAwesomeIcon icon={faArrowRight}/></Link><Link className="qdocs-sidebar-app-link" href="/dashboard/">Back to your workspace<FontAwesomeIcon icon={faArrowUpRightFromSquare}/></Link></div></aside>
    <main id="qdocs-main" className="qdocs-main" inert={drawer}>{children}</main>
    <aside className="qdocs-toc" aria-label="On this page" inert={drawer}><p>On this page</p><nav>{page.sections.map(section=><a key={section.id} href={`#${section.id}`} className={active===section.id?'is-active':''} aria-current={active===section.id?'location':undefined} onClick={()=>setActive(section.id)}>{section.title}</a>)}</nav><div className="qdocs-toc-actions"><button onClick={()=>void copyLink()}><FontAwesomeIcon icon={copied?faCheck:faCopy}/>{copied?'Link copied':'Copy page link'}</button><Link href="/docs/troubleshooting/">Need a little help?<FontAwesomeIcon icon={faChevronRight}/></Link></div><div className="qdocs-toc-note"><span className="qdocs-live-dot"/>Built around clarity.<small>Guides reflect the current Qozmo implementation.</small></div></aside></div>
    <footer className="qdocs-footer" inert={drawer}><span>qozmo<span>.</span> <small>Your keys. Your possibilities.</small></span><nav aria-label="Documentation footer"><Link href="/">Home</Link><Link href="/docs/security/">Security & scope</Link><Link href="/dashboard/">Open wallet</Link></nav></footer>
    <div className="qdocs-sr-only" role="status" aria-live="polite">{status}</div>
    <dialog className="qdocs-search-dialog" ref={searchRef} aria-labelledby="qdocs-search-title" onClick={event=>{if(event.target===event.currentTarget)searchRef.current?.close();}}><div className="qdocs-search-content"><h2 id="qdocs-search-title" className="qdocs-sr-only">Search Qozmo documentation</h2><div className="qdocs-search-input"><FontAwesomeIcon icon={faMagnifyingGlass}/><input ref={inputRef} value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search accounts, quantum, backups…" aria-label="Search documentation text" autoComplete="off"/><button aria-label="Close search" onClick={()=>searchRef.current?.close()}><FontAwesomeIcon icon={faXmark}/></button></div><div className="qdocs-search-results" aria-live="polite"><p>{query.trim()?`${results.length} ${results.length===1?'result':'results'}`:'A few good places to start'}</p>{results.map(result=><Link key={result.page.slug} href={`${docHref(result.page)}${result.section?`#${result.section.id}`:''}`} onClick={()=>searchRef.current?.close()}><span><DocsIcon name={result.page.icon}/></span><div><small>{result.page.group}{result.section?` / ${result.section.title}`:''}</small><strong>{result.page.title}</strong><p>{result.page.description}</p></div><FontAwesomeIcon icon={faArrowRight}/></Link>)}{!results.length&&<div className="qdocs-search-empty"><DocsIcon name="help"/><h3>No matches just yet.</h3><p>Try “quantum”, “backup”, “network”, or a shorter phrase.</p></div>}</div><div className="qdocs-search-footer"><span>Qozmo documentation</span><span><kbd>Tab</kbd> navigate <kbd>Esc</kbd> close</span></div></div></dialog>
  </div>;
}
