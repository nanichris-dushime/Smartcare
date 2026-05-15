// Appointments frontend module
import { apiFetch, showToast } from './apiWrapper.js';

export async function loadAppointments(container = '#appointmentsTable', page=1, limit=10){
  try{
    const data = await apiFetch(`/appointments?page=${page}&limit=${limit}`);
    const rows = data.data.rows || [];
    const columns = [
      {label:'ID', key:'appointment_id'},
      {label:'Date', key:'appointment_date'},
      {label:'Patient', key:'patient_name'},
      {label:'Doctor', key:'doctor_name'},
      {label:'Status', key:'status'}
    ];
    // simple render
    let html = '<table class="card"><thead><tr>' + columns.map(c=>`<th>${c.label}</th>`).join('') + '</tr></thead><tbody>';
    rows.forEach(r=>{ html += '<tr>' + columns.map(c=>`<td>${r[c.key] ?? ''}</td>`).join('') + '</tr>'; });
    html += '</tbody></table>';
    document.querySelector(container).innerHTML = html;
  }catch(err){ console.error(err); showToast(err.message,'error'); }
}

export async function createAppointment(payload){
  const res = await apiFetch('/appointments', { method: 'POST', body: JSON.stringify(payload) });
  return res;
}
