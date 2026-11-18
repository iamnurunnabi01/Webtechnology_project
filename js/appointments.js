/* Appointment management: list, search, filter, sort, book, view, edit, cancel, status updates */
 
var APPOINTMENT_FIELDS = ["patientId", "doctorId", "date", "time", "reason", "status"];
var editingId = "";   // "" means a new appointment is being booked
var viewingId = "";
 
/* Time slots every 15 minutes from 8:00 AM to 7:45 PM */
function buildTimeOptions() {
  var html = '<option value="">Select time</option>';
  for (var hour = 8; hour < 20; hour++) {
    for (var minute = 0; minute < 60; minute += 15) {
      var value = String(hour).padStart(2, "0") + ":" + String(minute).padStart(2, "0");
      html += '<option value="' + value + '">' + formatTime(value) + "</option>";
    }
  }
  document.getElementById("time").innerHTML = html;
}
 
function fillDoctorFilter() {
  var select = document.getElementById("filter-doctor");
  var current = select.value;
  var list = [];
  for (var i = 0; i < db.doctors.length; i++) {
    list.push(db.doctors[i]);
  }
  sortList(list, "fullName", false);
  var html = '<option value="">All doctors</option>';
  for (var j = 0; j < list.length; j++) {
    html += '<option value="' + list[j].id + '">' + escapeText(list[j].fullName) + "</option>";
  }
  select.innerHTML = html;
  select.value = current;
}
 
function showAppointments() {
  fillDoctorFilter();
  var searchText = document.getElementById("search").value.toLowerCase();
  var statusChoice = document.getElementById("filter-status").value;
  var doctorChoice = document.getElementById("filter-doctor").value;
  var whenChoice = document.getElementById("filter-when").value;
  var sortChoice = document.getElementById("sort-by").value;
  var today = todayString();
 
  // Each row holds the appointment plus the text we search and sort by
  var rows = [];
  for (var i = 0; i < db.appointments.length; i++) {
    var a = db.appointments[i];
    var pName = patientName(a.patientId);
    var dName = doctorName(a.doctorId);
    var ok = true;
    if (statusChoice != "" && a.status != statusChoice) { ok = false; }
    if (doctorChoice != "" && a.doctorId != doctorChoice) { ok = false; }
    if (whenChoice == "today" && a.date != today) { ok = false; }
    if (whenChoice == "upcoming" && a.date <= today) { ok = false; }
    if (whenChoice == "past" && a.date >= today) { ok = false; }
    if ((a.id + " " + pName + " " + dName + " " + a.status).toLowerCase().indexOf(searchText) == -1) { ok = false; }
    if (ok) {
      rows.push({ appointment: a, id: a.id, patient: pName, doctor: dName, when: a.date + " " + a.time });
    }
  }
 
  switch (sortChoice) {
    case "oldest":
      sortList(rows, "when", false);
      break;
    case "patient":
      sortList(rows, "patient", false);
      break;
    case "id":
      sortList(rows, "id", false);
      break;
    default:
      sortList(rows, "when", true);
  }
 
  var html = "";
  for (var j = 0; j < rows.length; j++) {
    var item = rows[j].appointment;
    var options = "";
    for (var k = 0; k < APPOINTMENT_STATUSES.length; k++) {
      var selected = "";
      if (APPOINTMENT_STATUSES[k] == item.status) {
        selected = " selected";
      }
      options += "<option" + selected + ">" + APPOINTMENT_STATUSES[k] + "</option>";
    }
    var cancelDisabled = " disabled";
    if (item.status == "Pending" || item.status == "Confirmed") {
      cancelDisabled = "";
    }
    html += `<tr>
      <td><strong>${item.id}</strong></td>
      <td>${escapeText(rows[j].patient)}</td>
      <td>${escapeText(rows[j].doctor)}</td>
      <td>${formatDate(item.date)}, ${formatTime(item.time)}</td>
      <td>${statusBadge(item.status)}</td>
      <td><select id="status-${item.id}" onchange="changeAppointmentStatus('${item.id}')">${options}</select></td>
      <td>
        <button class="btn btn-small" onclick="viewAppointment('${item.id}')">View</button>
        <button class="btn btn-small" onclick="openAppointmentForm('${item.id}')">Edit</button>
        <button class="btn btn-small" onclick="cancelAppointment('${item.id}')"${cancelDisabled}>Cancel</button>
      </td>
    </tr>`;
  }
  document.getElementById("appointments-body").innerHTML = html;
 
  var summary = db.appointments.length + " appointments in total";
  if (rows.length != db.appointments.length) {
    summary = "Showing " + rows.length + " of " + db.appointments.length + " appointments";
  }
  document.getElementById("summary").innerHTML = summary;
 
  var empty = document.getElementById("empty-state");
  if (rows.length == 0) {
    if (db.appointments.length == 0) {
      empty.innerHTML = "<h3>No appointments yet</h3><p>Book the first appointment to see it here.</p>";
    } else {
      empty.innerHTML = "<h3>No appointments match</h3><p>Try a different search or clear a filter.</p>";
    }
    empty.style.display = "block";
    document.getElementById("appointments-table").style.display = "none";
  } else {
    empty.style.display = "none";
    document.getElementById("appointments-table").style.display = "table";
  }
}
 
/* ---------- Status changes ---------- */
function changeAppointmentStatus(id) {
  var newStatus = document.getElementById("status-" + id).value;
  setAppointmentStatus(id, newStatus);
  showAppointments();   // redraw (this also resets the dropdown if the change was refused)
}
 
function cancelAppointment(id) {
  setAppointmentStatus(id, "Cancelled");
  showAppointments();
}
 
/* ---------- Booking / edit form ---------- */
function fillPeopleLists(currentDoctorId) {
  var patients = [];
  for (var i = 0; i < db.patients.length; i++) {
    patients.push(db.patients[i]);
  }
  sortList(patients, "fullName", false);
  var patientHtml = '<option value="">Select patient</option>';
  for (var j = 0; j < patients.length; j++) {
    patientHtml += '<option value="' + patients[j].id + '">' + escapeText(patients[j].fullName) + " (" + patients[j].id + ")</option>";
  }
  document.getElementById("patientId").innerHTML = patientHtml;
 
  // New bookings only offer Active doctors. When editing, the current doctor stays in the list.
  var doctors = [];
  for (var k = 0; k < db.doctors.length; k++) {
    if (db.doctors[k].status == "Active" || db.doctors[k].id == currentDoctorId) {
      doctors.push(db.doctors[k]);
    }
  }
  sortList(doctors, "fullName", false);
  var doctorHtml = '<option value="">Select doctor</option>';
  for (var m = 0; m < doctors.length; m++) {
    doctorHtml += '<option value="' + doctors[m].id + '">' + escapeText(doctors[m].fullName) + " - " + escapeText(doctors[m].specialization) + "</option>";
  }
  document.getElementById("doctorId").innerHTML = doctorHtml;
}
 
function showDoctorHint() {
  var d = findById(db.doctors, document.getElementById("doctorId").value);
  var hint = "";
  if (d != null) {
    var days = [];
    for (var i = 0; i < WEEKDAYS.length; i++) {
      if (arrayHas(d.availableDays, WEEKDAYS[i])) {
        days.push(WEEKDAYS[i]);
      }
    }
    hint = "Available: " + days.join(", ");
    if (d.status != "Active") {
      hint += " (" + d.status + ")";
    }
  }
  document.getElementById("doctor-hint").innerHTML = hint;
}
 
function openAppointmentForm(id) {
  var activeDoctors = 0;
  for (var i = 0; i < db.doctors.length; i++) {
    if (db.doctors[i].status == "Active") {
      activeDoctors++;
    }
  }
  if (id == "" && (db.patients.length == 0 || activeDoctors == 0)) {
    showMessage("Add at least one patient and one active doctor before booking.", "error");
    return;
  }
 
  editingId = id;
  startValidation(APPOINTMENT_FIELDS);
  var a = null;
  if (id != "") {
    a = findById(db.appointments, id);
  }
  var currentDoctorId = "";
  if (a != null) {
    currentDoctorId = a.doctorId;
  }
  fillPeopleLists(currentDoctorId);
 
  if (a == null) {
    document.getElementById("appointment-modal-title").innerHTML = "New appointment";
    document.getElementById("save-button").value = "Save appointment";
    document.getElementById("appointmentId").value = "Generated when saved";
    document.getElementById("date").value = "";
    document.getElementById("time").value = "";
    document.getElementById("reason").value = "Consultation";
    document.getElementById("status").value = "Pending";
  } else {
    document.getElementById("appointment-modal-title").innerHTML = "Edit appointment";
    document.getElementById("save-button").value = "Save changes";
    document.getElementById("appointmentId").value = a.id;
    document.getElementById("patientId").value = a.patientId;
    document.getElementById("doctorId").value = a.doctorId;
    document.getElementById("date").value = a.date;
    document.getElementById("time").value = a.time;
    document.getElementById("reason").value = a.reason;
    document.getElementById("status").value = a.status;
  }
  showDoctorHint();
  closeModal("details-modal");
  openModal("appointment-modal");
}
 
/* True when this doctor already has a non-cancelled appointment at that date and time. */
function isSlotTaken(doctorId, date, time, ignoreId) {
  for (var i = 0; i < db.appointments.length; i++) {
    var a = db.appointments[i];
    if (a.id != ignoreId && a.status != "Cancelled" && a.doctorId == doctorId && a.date == date && a.time == time) {
      return true;
    }
  }
  return false;
}
 
function saveAppointment() {
  var patientId = document.getElementById("patientId").value;
  var doctorId = document.getElementById("doctorId").value;
  var date = document.getElementById("date").value;
  var time = document.getElementById("time").value;
  var reason = document.getElementById("reason").value;
  var status = document.getElementById("status").value;
 
  var original = null;
  if (editingId != "") {
    original = findById(db.appointments, editingId);
  }
  var doctor = findById(db.doctors, doctorId);
  var doctorChanged = (original == null || original.doctorId != doctorId);
  var dateChanged = (original == null || original.date != date);
  var timeChanged = (original == null || original.time != time);
  var today = todayString();
 
  // Frontend checks are for convenience only. The server must check again.
  startValidation(APPOINTMENT_FIELDS);
  if (patientId == "") {
    addError("patientId", "Select a patient.");
  }
  if (doctorId == "") {
    addError("doctorId", "Select a doctor.");
  } else if (doctor != null && doctor.status != "Active" && doctorChanged) {
    addError("doctorId", doctor.fullName + " is not taking appointments (" + doctor.status.toLowerCase() + ").");
  }
 
  if (date == "") {
    addError("date", "Select a date.");
  } else if (dateChanged && date < today) {
    addError("date", "Choose today or a future date.");
  } else if (date > addDaysToDate(today, 365)) {
    addError("date", "Appointments can be booked up to one year ahead.");
  } else if (doctor != null && (doctorChanged || dateChanged) && arrayHas(doctor.availableDays, weekdayOf(date)) == false) {
    addError("date", doctor.fullName + " does not work on " + weekdayOf(date) + ". Available: " + doctor.availableDays.join(", ") + ".");
  }
 
  if (time == "") {
    addError("time", "Select a time.");
  } else if (date == today && timeChanged && time < nowTimeString() && status != "Completed" && status != "Cancelled") {
    addError("time", "That time has already passed today.");
  } else if (status != "Cancelled" && isSlotTaken(doctorId, date, time, editingId)) {
    addError("time", "This doctor already has an appointment at that time.");
  }
 
  if (date != "" && time != "" && status == "Completed" && isInFuture(date, time)) {
    addError("status", "A future appointment cannot be marked as completed.");
  }
  if (formValid == false) {
    return false;
  }
 
  if (editingId == "") {
    var newAppointment = {
      id: nextId(db.appointments, "AP-", 5000),
      patientId: patientId, doctorId: doctorId, date: date, time: time, status: status, reason: reason
    };
    db.appointments.push(newAppointment);
    showMessage(newAppointment.id + " was booked", "success");
  } else {
    original.patientId = patientId;
    original.doctorId = doctorId;
    original.date = date;
    original.time = time;
    original.status = status;
    original.reason = reason;
    showMessage(original.id + " was updated", "success");
  }
  saveData();
  closeModal("appointment-modal");
  showAppointments();
  return false;
}
 
/* ---------- Details ---------- */
function viewAppointment(id) {
  var a = findById(db.appointments, id);
  var d = findById(db.doctors, a.doctorId);
  viewingId = id;
  var doctorText = "Unknown";
  var feeText = "Unknown";
  if (d != null) {
    doctorText = d.fullName + ", " + d.specialization;
    feeText = formatFee(d.consultationFee);
  }
  var html = "<tr><th>Appointment ID</th><td>" + a.id + "</td></tr>" +
    "<tr><th>Patient</th><td>" + escapeText(patientName(a.patientId)) + " (" + a.patientId + ")</td></tr>" +
    "<tr><th>Doctor</th><td>" + escapeText(doctorText) + "</td></tr>" +
    "<tr><th>Date</th><td>" + formatDate(a.date) + " (" + weekdayOf(a.date) + ")</td></tr>" +
    "<tr><th>Time</th><td>" + formatTime(a.time) + "</td></tr>" +
    "<tr><th>Visit type</th><td>" + a.reason + "</td></tr>" +
    "<tr><th>Status</th><td>" + a.status + "</td></tr>" +
    "<tr><th>Consultation fee</th><td>" + feeText + "</td></tr>";
  document.getElementById("details-table").innerHTML = html;
  openModal("details-modal");
}
 
function editFromDetails() {
  openAppointmentForm(viewingId);
}
 
buildTimeOptions();