/* Doctor management: directory, search, filter, sort, add, view, edit, delete */
 
var DOCTOR_FIELDS = ["fullName", "specialization", "status", "phone", "email", "consultationFee", "availableDays"];
var editingId = "";   // "" means a new doctor is being added
var viewingId = "";
 
/* The specialization filter is built from the doctors that exist. */
function fillSpecializationFilter() {
  var select = document.getElementById("filter-specialization");
  var current = select.value;
  var names = [];
  for (var i = 0; i < db.doctors.length; i++) {
    if (arrayHas(names, db.doctors[i].specialization) == false) {
      names.push(db.doctors[i].specialization);
    }
  }
  var items = [];
  for (var j = 0; j < names.length; j++) {
    items.push({ name: names[j] });
  }
  sortList(items, "name", false);
  var html = '<option value="">All specializations</option>';
  for (var k = 0; k < items.length; k++) {
    html += "<option>" + escapeText(items[k].name) + "</option>";
  }
  select.innerHTML = html;
  select.value = current;
}
 
function showDoctors() {
  fillSpecializationFilter();
  var searchText = document.getElementById("search").value.toLowerCase();
  var specialization = document.getElementById("filter-specialization").value;
  var statusChoice = document.getElementById("filter-status").value;
  var dayChoice = document.getElementById("filter-day").value;
  var sortChoice = document.getElementById("sort-by").value;
 
  var rows = [];
  for (var i = 0; i < db.doctors.length; i++) {
    var d = db.doctors[i];
    var ok = true;
    if (specialization != "" && d.specialization != specialization) { ok = false; }
    if (statusChoice != "" && d.status != statusChoice) { ok = false; }
    if (dayChoice != "" && arrayHas(d.availableDays, dayChoice) == false) { ok = false; }
    if ((d.fullName + " " + d.specialization + " " + d.id).toLowerCase().indexOf(searchText) == -1) { ok = false; }
    if (ok) {
      rows.push(d);
    }
  }
 
  switch (sortChoice) {
    case "fee-asc":
      sortList(rows, "consultationFee", false);
      break;
    case "fee-desc":
      sortList(rows, "consultationFee", true);
      break;
    case "id":
      sortList(rows, "id", false);
      break;
    default:
      sortList(rows, "fullName", false);
  }
 
  var html = "";
  for (var j = 0; j < rows.length; j++) {
    var doc = rows[j];
    var todayBadge = "";
    if (isAvailableToday(doc)) {
      todayBadge = ' <span class="badge badge-today">Available today</span>';
    }
    html += `<div class="col-3"><div class="card card-body">
      <div class="doctor-top">
        <div class="avatar">${initialsOf(doc.fullName)}</div>
        <h3>${escapeText(doc.fullName)}</h3>
        <div class="muted small">${escapeText(doc.specialization)} (${doc.id})</div>
      </div>
      <p>${statusBadge(doc.status)}${todayBadge}</p>
      <div>${dayChips(doc.availableDays)}</div>
      <div class="doctor-bottom">
        <span class="fee">${formatFee(doc.consultationFee)}</span><br><br>
        <button class="btn btn-small" onclick="viewDoctor('${doc.id}')">View</button>
        <button class="btn btn-small" onclick="openDoctorForm('${doc.id}')">Edit</button>
        <button class="btn btn-small" onclick="deleteDoctor('${doc.id}')">Delete</button>
      </div>
    </div></div>`;
  }
  document.getElementById("doctor-list").innerHTML = html;
 
  var summary = db.doctors.length + " doctors in the directory";
  if (rows.length != db.doctors.length) {
    summary = "Showing " + rows.length + " of " + db.doctors.length + " doctors";
  }
  document.getElementById("summary").innerHTML = summary;
 
  var empty = document.getElementById("empty-state");
  if (rows.length == 0) {
    if (db.doctors.length == 0) {
      empty.innerHTML = "<h3>No doctors yet</h3><p>Add the first doctor to build the directory.</p>";
    } else {
      empty.innerHTML = "<h3>No doctors match</h3><p>Try a different name or clear a filter.</p>";
    }
    empty.style.display = "block";
  } else {
    empty.style.display = "none";
  }
}
 
/* ---------- Add / edit form ---------- */
function openDoctorForm(id) {
  editingId = id;
  startValidation(DOCTOR_FIELDS);
  document.getElementById("fullName").value = "";
  document.getElementById("specialization").value = "";
  document.getElementById("status").value = "Active";
  document.getElementById("phone").value = "";
  document.getElementById("email").value = "";
  document.getElementById("consultationFee").value = "";
  for (var i = 0; i < WEEKDAYS.length; i++) {
    document.getElementById("day-" + WEEKDAYS[i]).checked = false;
  }
  if (id == "") {
    document.getElementById("doctor-modal-title").innerHTML = "Add doctor";
    document.getElementById("save-button").value = "Save doctor";
    document.getElementById("doctorId").value = "Generated when saved";
  } else {
    var d = findById(db.doctors, id);
    document.getElementById("doctor-modal-title").innerHTML = "Edit doctor";
    document.getElementById("save-button").value = "Save changes";
    document.getElementById("doctorId").value = d.id;
    document.getElementById("fullName").value = d.fullName;
    document.getElementById("specialization").value = d.specialization;
    document.getElementById("status").value = d.status;
    document.getElementById("phone").value = d.phone;
    document.getElementById("email").value = d.email;
    document.getElementById("consultationFee").value = d.consultationFee;
    for (var j = 0; j < WEEKDAYS.length; j++) {
      document.getElementById("day-" + WEEKDAYS[j]).checked = arrayHas(d.availableDays, WEEKDAYS[j]);
    }
  }
  closeModal("details-modal");
  openModal("doctor-modal");
}
 
function saveDoctor() {
  var fullName = document.getElementById("fullName").value.trim();
  var specialization = document.getElementById("specialization").value;
  var status = document.getElementById("status").value;
  var phone = document.getElementById("phone").value.trim();
  var email = document.getElementById("email").value.trim();
  var feeText = document.getElementById("consultationFee").value;
  var days = [];
  for (var i = 0; i < WEEKDAYS.length; i++) {
    if (document.getElementById("day-" + WEEKDAYS[i]).checked) {
      days.push(WEEKDAYS[i]);
    }
  }
 
  // Frontend checks are for convenience only. The server must check again.
  startValidation(DOCTOR_FIELDS);
  if (fullName.length < 2) {
    addError("fullName", "Enter the doctor's full name (at least 2 characters).");
  } else if (fullName.length > 80) {
    addError("fullName", "Full name must be 80 characters or fewer.");
  }
  if (specialization == "") {
    addError("specialization", "Select a specialization.");
  }
  if (isValidPhone(phone) == false) {
    addError("phone", "Enter a valid phone number, 7 to 20 characters (digits, spaces, + - and brackets).");
  }
  if (isValidEmail(email) == false) {
    addError("email", "Enter a valid email, like name@example.com.");
  }
  var fee = Number(feeText);
  if (feeText == "" || isNaN(fee)) {
    addError("consultationFee", "Enter the consultation fee as a number.");
  } else if (fee < 0 || fee > 100000) {
    addError("consultationFee", "Fee must be between 0 and 100,000.");
  }
  if (days.length == 0) {
    addError("availableDays", "Select at least one available day.");
  }
  if (formValid == false) {
    return false;
  }
 
  if (editingId == "") {
    var newDoctor = {
      id: nextId(db.doctors, "DR-", 200),
      fullName: fullName, specialization: specialization, phone: phone, email: email,
      availableDays: days, consultationFee: fee, status: status
    };
    db.doctors.push(newDoctor);
    showMessage(escapeText(fullName) + " was added as " + newDoctor.id, "success");
  } else {
    var d = findById(db.doctors, editingId);
    d.fullName = fullName;
    d.specialization = specialization;
    d.phone = phone;
    d.email = email;
    d.availableDays = days;
    d.consultationFee = fee;
    d.status = status;
    showMessage(escapeText(fullName) + " was updated", "success");
  }
  saveData();
  closeModal("doctor-modal");
  showDoctors();
  return false;
}
 
/* ---------- View and delete ---------- */
function countAppointmentsOf(doctorId) {
  var count = 0;
  for (var i = 0; i < db.appointments.length; i++) {
    if (db.appointments[i].doctorId == doctorId) {
      count++;
    }
  }
  return count;
}
 
function viewDoctor(id) {
  var d = findById(db.doctors, id);
  viewingId = id;
  var html = "<tr><th>Doctor ID</th><td>" + d.id + "</td></tr>" +
    "<tr><th>Full name</th><td>" + escapeText(d.fullName) + "</td></tr>" +
    "<tr><th>Specialization</th><td>" + escapeText(d.specialization) + "</td></tr>" +
    "<tr><th>Status</th><td>" + d.status + "</td></tr>" +
    "<tr><th>Phone</th><td>" + escapeText(d.phone) + "</td></tr>" +
    "<tr><th>Email</th><td>" + escapeText(d.email) + "</td></tr>" +
    "<tr><th>Available days</th><td>" + d.availableDays.join(", ") + "</td></tr>" +
    "<tr><th>Consultation fee</th><td>" + formatFee(d.consultationFee) + "</td></tr>" +
    "<tr><th>Appointments</th><td>" + countAppointmentsOf(d.id) + "</td></tr>";
  document.getElementById("details-table").innerHTML = html;
  openModal("details-modal");
}
 
function editFromDetails() {
  openDoctorForm(viewingId);
}
 
function deleteDoctor(id) {
  var d = findById(db.doctors, id);
  var linked = countAppointmentsOf(id);
  var question = "Delete " + d.fullName + "?";
  if (linked > 0) {
    question += " Their " + linked + " appointment(s) will also be removed.";
  }
  question += " This cannot be undone.";
  if (confirm(question) == false) {
    return;
  }
 
  db.doctors = removeById(db.doctors, id);
  var remaining = [];
  for (var i = 0; i < db.appointments.length; i++) {
    if (db.appointments[i].doctorId != id) {
      remaining.push(db.appointments[i]);
    }
  }
  db.appointments = remaining;
  saveData();
  showDoctors();
  showMessage(escapeText(d.fullName) + " was deleted", "success");
}