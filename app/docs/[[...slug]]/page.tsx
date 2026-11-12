import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DOC_PAGES, getDoc } from '@/lib/docs-content';
import { DocsArticle } from '@/components/docs/docs-article';
import { DocsShell } from '@/components/docs/docs-shell';

type Props = { params: Promise<{slug?:string[]}> };
export function generateStaticParams() { return DOC_PAGES.map(page=>({slug:page.slug?page.slug.split('/'):[]})); }
export const dynamicParams = false;
export async function generateMetadata({params}:Props):Promise<Metadata> {
  const {slug}=await params; const page=getDoc(slug?.join('/')??'');
  if(!page)return {title:'Page not found | Qozmo Docs'};
  return {title:`${page.title} | Qozmo Docs`,description:page.description,openGraph:{title:`${page.title} | Qozmo Docs`,description:page.description}};
}
export default async function DocumentationPage({params}:Props) {
  const {slug}=await params; const page=getDoc(slug?.join('/')??''); if(!page)notFound();
  return <DocsShell slug={page.slug}><DocsArticle page={page}/></DocsShell>;
}
