import {useEffect,useState} from 'react';
import {api} from '../api/client';
import {useApp} from '../app/context';
import {Button,Form} from '../ui/components';
type Photo={id:number;caption:string;mime:string};
function PhotoCard({photo,route,editable,reload}:{photo:Photo;route:string;editable:boolean;reload:()=>Promise<void>}){
 const {t}=useApp();const [src,setSrc]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[expanded,setExpanded]=useState(false);
 useEffect(()=>{let active=true;api<{dataUrl:string}>(`${route}/${photo.id}`).then(r=>{if(active)setSrc(r.dataUrl)}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[route,photo.id]);
 return <figure className="property-guide-photo">{src&&<button type="button" className="guide-image-button" onClick={()=>setExpanded(!expanded)} aria-label={t('Open photo')}><img src={src} alt={photo.caption||t('Property photos')} style={{objectFit:expanded?'contain':'cover',height:expanded?'auto':180}}/></button>}<figcaption>{photo.caption||t('Property photos')}</figcaption>{error&&<p role="alert">{error}</p>}{editable&&<Button disabled={busy} kind="danger" onClick={async()=>{if(!window.confirm(t('Delete photo?')))return;setBusy(true);try{await api(`${route}/${photo.id}`,{method:'DELETE'});await reload()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}}>{t('Delete')}</Button>}</figure>;
}
export function PropertyPhotos({objectId,jobId,editable=false}:{objectId?:number;jobId?:number;editable?:boolean}){
 const {t}=useApp();const route=jobId?`cleaner/jobs/${jobId}/reference-photos`:`objects/${objectId}/reference-photos`;
 const [photos,setPhotos]=useState<Photo[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true),[file,setFile]=useState<File|null>(null),[page,setPage]=useState(0),[uploading,setUploading]=useState(false);
 const reload=async()=>{try{const r=await api<{photos:Photo[]}>(route);setPhotos(r.photos);setError('')}catch(e){setPhotos([]);setError((e as Error).message)}finally{setLoading(false)}};
 useEffect(()=>{let live=true;setPhotos([]);setLoading(true);api<{photos:Photo[]}>(route).then(r=>{if(live){setPhotos(r.photos);setError('')}}).catch(e=>{if(live)setError(e.message)}).finally(()=>{if(live)setLoading(false)});return()=>{live=false}},[route]);
 return <section><h3>{t('Property photos')}</h3><p className="muted">{t('Private property guide')}</p>{loading&&<p>{t('Loading')}</p>}{error&&<p role="alert">{error}</p>}{!loading&&!error&&!photos.length&&<p>{t('No property photos')}</p>}<div className="property-guide-grid">{photos.slice(page*12,page*12+12).map(photo=><PhotoCard key={photo.id} photo={photo} route={route} editable={editable} reload={reload}/>)}</div>{photos.length>12&&<div className="actions"><Button disabled={page===0} onClick={()=>setPage(page-1)}>←</Button><span>{page+1}/{Math.ceil(photos.length/12)}</span><Button disabled={(page+1)*12>=photos.length} onClick={()=>setPage(page+1)}>→</Button></div>}{editable&&<div><label className="button">{t('Choose property photo')}<input type="file" disabled={uploading} accept="image/jpeg,image/png,image/webp" onChange={e=>{setFile(e.target.files?.[0]||null);e.target.value=''}}/></label>{file&&<p>{file.name}</p>}<Form fields={[{name:'caption',label:'Photo caption',wide:true}]} onSubmit={async v=>{
 if(!file)throw new Error(t('Choose property photo'));
 if(file.size>5*1024*1024)throw new Error(t('Photo limit 5 MB'));
 setUploading(true);try{const base64=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(new Error(t('Cannot read photo')));reader.readAsDataURL(file)});await api(route,{method:'POST',body:{caption:v.caption,mime:file.type,base64}});setFile(null);await reload()}finally{setUploading(false)}
 }}/></div>}</section>;
}
