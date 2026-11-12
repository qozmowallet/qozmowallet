import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faCircleInfo, faLightbulb, faTriangleExclamation, faArrowLeft, faHashtag } from '@fortawesome/free-solid-svg-icons';
import { DOC_PAGES, docHref, type DocBlock, type DocPage } from '@/lib/docs-content';
import { QozmoMark } from '@/components/brand';
import { DocsIcon } from './docs-icons';

function Inline({text}:{text:string}) {
  return <>{text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g).map((part,index)=>{
    if(part.startsWith('**')&&part.endsWith('**')) return <strong key={index}>{part.slice(2,-2)}</strong>;
    if(part.startsWith('`')&&part.endsWith('`')) return <code key={index}>{part.slice(1,-1)}</code>;
    const link=part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if(link && /^(\/|https:\/\/|#)/.test(link[2])) return <Link href={link[2]} key={index}>{link[1]}</Link>;
    return part;
  })}</>;
}
function Block({block}:{block:DocBlock}) {
  switch(block.type) {
    case 'paragraph': return <p><Inline text={block.text}/></p>;
    case 'list': return <ul className="qdocs-list">{block.items.map((item,index)=><li key={index}><Inline text={item}/></li>)}</ul>;
    case 'steps': return <ol className="qdocs-steps">{block.items.map((item,index)=><li key={index}><span className="qdocs-step-number">{index+1}</span><div><h3>{item.title}</h3><p><Inline text={item.text}/></p></div></li>)}</ol>;
    case 'callout': return <aside className={`qdocs-callout qdocs-callout-${block.tone}`}><FontAwesomeIcon icon={block.tone==='tip'?faLightbulb:block.tone==='warning'?faTriangleExclamation:faCircleInfo} aria-hidden="true"/><div><strong>{block.title}</strong><p><Inline text={block.text}/></p></div></aside>;
    case 'cards': return <div className="qdocs-cards">{block.items.map(item=><Link className="qdocs-card" key={item.href} href={item.href}><span className={`qdocs-card-icon qdocs-card-icon-${item.icon}`}><DocsIcon name={item.icon}/></span><h3>{item.title}<FontAwesomeIcon icon={faArrowRight} aria-hidden="true"/></h3><p>{item.text}</p></Link>)}</div>;
    case 'table': return <div className="qdocs-table-wrap" role="region" aria-label={block.columns.join(', ')} tabIndex={0}><table><thead><tr>{block.columns.map((column,index)=><th scope="col" key={index}>{column}</th>)}</tr></thead><tbody>{block.rows.map((row,index)=><tr key={index}>{row.map((cell,i)=><td key={i}><Inline text={cell}/></td>)}</tr>)}</tbody></table></div>;
    case 'code': return <div className="qdocs-code"><div><span/>{block.language}</div><pre><code>{block.text}</code></pre></div>;
  }
}

export function DocsArticle({page}:{page:DocPage}) {
  const index=DOC_PAGES.findIndex(item=>item.slug===page.slug); const previous=DOC_PAGES[index-1]; const next=DOC_PAGES[index+1];
  return <article className={`qdocs-article${page.slug===''?' qdocs-welcome':''}`}>
    <div className="qdocs-breadcrumb"><Link href="/docs/">Documentation</Link><span>/</span><span>{page.group}</span></div>
    {page.slug===''?<div className="qdocs-welcome-cover"><div><span className="qdocs-eyebrow">THE QOZMO GUIDE</span><p>Your wallet.<br/><strong>A little clearer.</strong></p><span className="qdocs-cover-line">A place to learn. A world to explore.</span></div><div className="qdocs-cover-art" aria-hidden="true"><i/><i/><span><QozmoMark/></span></div></div>:<span className={`qdocs-page-emblem qdocs-card-icon-${page.icon}`}><DocsIcon name={page.icon}/></span>}
    <header className="qdocs-article-header"><div className="qdocs-title-meta"><span>{page.group}</span><span>·</span><span>{page.readTime} read</span></div><h1>{page.title}</h1><p>{page.description}</p></header>
    {page.sections.map(section=><section className="qdocs-section" key={section.id} aria-labelledby={section.id}><h2 id={section.id}>{section.title}<a className="qdocs-heading-link" href={`#${section.id}`} aria-label={`Link to ${section.title}`}><FontAwesomeIcon icon={faHashtag}/></a></h2>{section.blocks.map((block,index)=><Block block={block} key={index}/>)}</section>)}
    <div className="qdocs-page-updated"><span className="qdocs-live-dot"/>Current implementation guide<span>Updated 8 November 2026</span></div>
    <nav className="qdocs-pagination" aria-label="Documentation pagination">{previous?<Link href={docHref(previous)}><FontAwesomeIcon icon={faArrowLeft} aria-hidden="true"/><span><small>Previous</small><strong>{previous.navTitle??previous.title}</strong></span></Link>:<span/>}{next&&<Link href={docHref(next)}><span><small>Up next</small><strong>{next.navTitle??next.title}</strong></span><FontAwesomeIcon icon={faArrowRight} aria-hidden="true"/></Link>}</nav>
  </article>;
}
