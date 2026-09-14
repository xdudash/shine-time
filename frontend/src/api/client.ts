import { createClient } from '@supabase/supabase-js';
declare global {
    interface Window {
        ST_SUPABASE: {
            url: string;
            publishableKey: string;
            functionName: string;
        };
        ST_BASE: string;
    }
}
const config = window.ST_SUPABASE;
export const supabase = createClient(config.url, config.publishableKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
export class ApiError extends Error {
    constructor(message: string, public status: number) { super(message); }
}
let generation = 0;
const flights = new Map<string, Promise<unknown>>(), ids = new Map<string, string>(), controllers = new Set<AbortController>();
const tickets = new Map<string, {
    uploadId: string;
    bucket: string;
    path: string;
    token: string;
}>();
export function clearApiSession() { generation++; controllers.forEach(c => c.abort()); controllers.clear(); flights.clear(); ids.clear(); tickets.clear(); }
export function api<T>(route: string, options: {
    method?: string;
    body?: unknown;
    query?: Record<string, string | number>;
} = {}): Promise<T> { const method = options.method || 'GET', key = JSON.stringify([route, method, options.body, options.query]), epoch = generation; if (flights.has(key))
    return flights.get(key) as Promise<T>; if (method !== 'GET' && !ids.has(key))
    ids.set(key, crypto.randomUUID()); const controller = new AbortController(); controllers.add(controller); const promise = (async () => { const { data: { session }, error } = await supabase.auth.getSession(); if (error)
    throw error; if (epoch !== generation)
    throw new DOMException('Session changed', 'AbortError'); if (!session)
    throw new ApiError('Authentication required', 401); const r = await fetch(`${config.url}/functions/v1/${config.functionName}`, { method: 'POST', headers: { 'content-type': 'application/json', apikey: config.publishableKey, Authorization: `Bearer ${session.access_token}` }, signal: controller.signal, body: JSON.stringify({ route, method, query: options.query || {}, body: method === 'GET' ? null : { requestId: ids.get(key), ...(options.body as object || {}) }, clientBuild: '2026-09-07-scale1' }) }); const data = await r.json(); if (epoch !== generation)
    throw new DOMException('Session changed', 'AbortError'); if (!r.ok) {
    if (r.status < 500)
        ids.delete(key);
    throw new ApiError(data.error || `HTTP ${r.status}`, r.status);
} ids.delete(key); return data as T; })().finally(() => { controllers.delete(controller); if (flights.get(key) === promise)
    flights.delete(key); }); flights.set(key, promise); return promise; }
export async function uploadProof(id: number, category: string, file: File) { const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await file.arrayBuffer())), b => b.toString(16).padStart(2, '0')).join(''); const key = JSON.stringify([id, category, digest]); let ticket = tickets.get(key); if (!ticket) {
    ticket = await api(`cleaner/jobs/${id}/photos/prepare`, { method: 'POST', body: { mime: file.type, fileName: file.name, fileSize: file.size, category } });
    tickets.set(key, ticket!);
} const { error } = await supabase.storage.from(ticket!.bucket).uploadToSignedUrl(ticket!.path, ticket!.token, file, { contentType: file.type }); try {
    await api(`cleaner/jobs/${id}/photos/finalize`, { method: 'POST', body: { uploadId: ticket!.uploadId } });
    tickets.delete(key);
}
catch (e) {
    if (e instanceof Error && /expired|not found/i.test(e.message))
        tickets.delete(key);
    throw error || e;
} }
