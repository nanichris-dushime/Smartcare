const AppointmentsRepo = require('../repositories/appointmentsRepo');
const ApiError = require('../utils/apiError');

const AppointmentsService = {
  async create(data){
    const {patient_id, doctor_id, appointment_date} = data;
    // basic conflict check
    const conflict = await AppointmentsRepo.existsConflict(doctor_id, appointment_date);
    if (conflict) throw new ApiError(409, 'Doctor already has an appointment at that time');
    return AppointmentsRepo.create(data);
  },
  async list(query){
    return AppointmentsRepo.findAll(query);
  },
  async get(id){
    const appt = await AppointmentsRepo.findById(id);
    if (!appt) throw new ApiError(404, 'Appointment not found');
    return appt;
  },
  async update(id, data){
    return AppointmentsRepo.update(id, data);
  },
  async remove(id){
    return AppointmentsRepo.delete(id);
  }
};

module.exports = AppointmentsService;
