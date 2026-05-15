const API_BASE = 'http://localhost:5000/api';

export function getToken(){ return localStorage.getItem('sc_token'); }

export async function apiFetch(path, options = {}){
  const headers = options.headers || {};
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;
  headers['Content-Type'] = 'application/json';
  const res = await fetch(API_BASE + path, {...options, headers});
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'API error');
  return data;
}

export function showToast(msg, type='info'){ alert(msg); }
