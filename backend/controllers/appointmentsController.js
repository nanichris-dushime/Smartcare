const AppointmentsService = require('../services/appointmentsService');
const { success, fail } = require('../utils/response');

const createAppointment = async (req, res) => {
  try{
    const payload = req.body;
    const result = await AppointmentsService.create(payload);
    return success(res, result, 'Appointment created', 201);
  }catch(err){
    return fail(res, err.message || 'Error creating appointment', null, err.status || 500);
  }
};

const listAppointments = async (req, res) => {
  try{
    const { page = 1, limit = 10, doctor_id, patient_id, search } = req.query;
    const result = await AppointmentsService.list({ page, limit, doctor_id, patient_id, search });
    return success(res, result, 'Appointments fetched');
  }catch(err){
    return fail(res, err.message || 'Error fetching appointments', null, err.status || 500);
  }
};

const getAppointment = async (req, res) => {
  try{
    const appt = await AppointmentsService.get(req.params.id);
    return success(res, appt, 'Appointment fetched');
  }catch(err){
    return fail(res, err.message || 'Error fetching appointment', null, err.status || 500);
  }
};

const updateAppointment = async (req, res) => {
  try{
    const updated = await AppointmentsService.update(req.params.id, req.body);
    return success(res, updated, 'Appointment updated');
  }catch(err){
    return fail(res, err.message || 'Error updating appointment', null, err.status || 500);
  }
};

const deleteAppointment = async (req, res) => {
  try{
    await AppointmentsService.remove(req.params.id);
    return success(res, null, 'Appointment deleted');
  }catch(err){
    return fail(res, err.message || 'Error deleting appointment', null, err.status || 500);
  }
};

module.exports = { createAppointment, listAppointments, getAppointment, updateAppointment, deleteAppointment };
