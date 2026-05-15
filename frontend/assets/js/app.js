const API_BASE = 'http://localhost:5000/api';

const auth = {
  saveToken(token){ localStorage.setItem('sc_token', token); },
  getToken(){ return localStorage.getItem('sc_token'); },
  logout(){ localStorage.removeItem('sc_token'); window.location = '/frontend/login.html'; }
};

async function apiFetch(path, options = {}){
  const headers = options.headers || {};
  const token = auth.getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;
  headers['Content-Type'] = 'application/json';
  const res = await fetch(API_BASE + path, {...options, headers});
  if (res.status === 401){ auth.logout(); throw new Error('Unauthorized'); }
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'API error');
  return data;
}

function showToast(msg, type='info'){
  alert(msg);
}

// simple table renderer
function renderTable(containerSelector, data, columns){
  const container = document.querySelector(containerSelector);
  if (!container) return;
  let html = '<table class="card"><thead><tr>' + columns.map(c=>`<th>${c.label}</th>`).join('') + '</tr></thead><tbody>';
  data.forEach(row=>{ html += '<tr>' + columns.map(c=>`<td>${row[c.key] ?? ''}</td>`).join('') + '</tr>'; });
  html += '</tbody></table>';
  container.innerHTML = html;
}
