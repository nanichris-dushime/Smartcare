function success(res, data = null, message = 'OK', status = 200){
  return res.status(status).json({ success: true, message, data, errors: null });
}

function fail(res, message = 'Error', errors = null, status = 400){
  return res.status(status).json({ success: false, message, data: null, errors });
}

module.exports = { success, fail };
