/* Patient management: list, search, filter, sort, add, view, edit, delete */
 
var PATIENT_FIELDS = ["fullName", "dateOfBirth", "gender", "phone", "email", "address"];
var editingId = "";   // "" means a new patient is being added
var viewingId = "";
 
function showPatients() {
  var searchText = document.getElementById("search").value.toLowerCase();
  var genderChoice = document.getElementById("filter-gender").value;
  var sortChoice = document.getElementById("sort-by").value;
 
  // Step 1: search and filter
  var rows = [];
  for (var i = 0; i < db.patients.length; i++) {
    var p = db.patients[i];
    var matchesGender = (genderChoice == "" || p.gender == genderChoice);
    var matchesSearch = ((p.fullName + " " + p.id).toLowerCase().indexOf(searchText) != -1);
    if (matchesGender && matchesSearch) {
      rows.push(p);
    }
  }
 
  // Step 2: sort
  switch (sortChoice) {
    case "oldest":
      sortList(rows, "registeredOn", false);
      break;
    case "name-asc":
      sortList(rows, "fullName", false);
      break;
    case "name-desc":
      sortList(rows, "fullName", true);
      break;
    case "id":
      sortList(rows, "id", false);
      break;
    default:
      sortList(rows, "id", true);
      sortList(rows, "registeredOn", true);
  }
 
  // Step 3: build the table rows
  var html = "";
  for (var j = 0; j < rows.length; j++) {
    var row = rows[j];
    html += `<tr>
      <td><strong>${row.id}</strong></td>
      <td>${escapeText(row.fullName)}</td>
      <td>${calculateAge(row.dateOfBirth)}</td>
      <td>${row.gender}</td>
      <td>${escapeText(row.phone)}</td>
      <td>${formatDate(row.registeredOn)}</td>
      <td>
        <button class="btn btn-small" onclick="viewPatient('${row.id}')">View</button>
        <button class="btn btn-small" onclick="openPatientForm('${row.id}')">Edit</button>
        <button class="btn btn-small" onclick="deletePatient('${row.id}')">Delete</button>
      </td>
    </tr>`;
  }
  document.getElementById("patients-body").innerHTML = html;
 
  // Summary line and empty state
  var summary = db.patients.length + " patients registered";
  if (rows.length != db.patients.length) {
    summary = "Showing " + rows.length + " of " + db.patients.length + " patients";
  }
  document.getElementById("summary").innerHTML = summary;
 
  var empty = document.getElementById("empty-state");
  if (rows.length == 0) {
    if (db.patients.length == 0) {
      empty.innerHTML = "<h3>No patients yet</h3><p>Add your first patient to get started.</p>";
    } else {
      empty.innerHTML = "<h3>No patients match</h3><p>Try a different name, ID or gender filter.</p>";
    }
    empty.style.display = "block";
    document.getElementById("patients-table").style.display = "none";
  } else {
    empty.style.display = "none";
    document.getElementById("patients-table").style.display = "table";
  }
}
 
/* ---------- Add / edit form ---------- */
function openPatientForm(id) {
  editingId = id;
  startValidation(PATIENT_FIELDS);
  for (var i = 0; i < PATIENT_FIELDS.length; i++) {
    document.getElementById(PATIENT_FIELDS[i]).value = "";
  }
  if (id == "") {
    document.getElementById("patient-modal-title").innerHTML = "Add patient";
    document.getElementById("save-button").value = "Save patient";
    document.getElementById("patientId").value = "Generated when saved";
    document.getElementById("registeredOn").value = formatDate(todayString());
  } else {
    var p = findById(db.patients, id);
    document.getElementById("patient-modal-title").innerHTML = "Edit patient";
    document.getElementById("save-button").value = "Save changes";
    document.getElementById("patientId").value = p.id;
    document.getElementById("registeredOn").value = formatDate(p.registeredOn);
    for (var j = 0; j < PATIENT_FIELDS.length; j++) {
      document.getElementById(PATIENT_FIELDS[j]).value = p[PATIENT_FIELDS[j]];
    }
  }
  closeModal("details-modal");
  openModal("patient-modal");
}
 
/* Runs when the form is submitted. We save the data ourselves, so we always return false
   (false stops the browser from sending the form). With PHP later this will return true. */
function savePatient() {
  var fullName = document.getElementById("fullName").value.trim();
  var dateOfBirth = document.getElementById("dateOfBirth").value;
  var gender = document.getElementById("gender").value;
  var phone = document.getElementById("phone").value.trim();
  var email = document.getElementById("email").value.trim();
  var address = document.getElementById("address").value.trim();
 
  // Frontend checks are for convenience only. The server must check again.
  startValidation(PATIENT_FIELDS);
  if (fullName.length < 2) {
    addError("fullName", "Enter the patient's full name (at least 2 characters).");
  } else if (fullName.length > 80) {
    addError("fullName", "Full name must be 80 characters or fewer.");
  }
  if (dateOfBirth == "") {
    addError("dateOfBirth", "Select the date of birth.");
  } else if (dateOfBirth > todayString()) {
    addError("dateOfBirth", "Date of birth cannot be in the future.");
  } else if (calculateAge(dateOfBirth) > 120) {
    addError("dateOfBirth", "Check the date of birth. Age cannot be over 120.");
  }
  if (gender == "") {
    addError("gender", "Select a gender.");
  }
  if (isValidPhone(phone) == false) {
    addError("phone", "Enter a valid phone number, 7 to 20 characters (digits, spaces, + - and brackets).");
  }
  if (email != "" && isValidEmail(email) == false) {
    addError("email", "Enter a valid email, like name@example.com.");
  }
  if (address.length > 150) {
    addError("address", "Address must be 150 characters or fewer.");
  }
  if (formValid == false) {
    return false;
  }
 
  if (editingId == "") {
    var newPatient = {
      id: nextId(db.patients, "PT-", 1000),
      fullName: fullName, dateOfBirth: dateOfBirth, gender: gender,
      phone: phone, email: email, address: address,
      registeredOn: todayString()
    };
    db.patients.push(newPatient);
    showMessage(escapeText(fullName) + " was added as " + newPatient.id, "success");
  } else {
    var p = findById(db.patients, editingId);
    p.fullName = fullName;
    p.dateOfBirth = dateOfBirth;
    p.gender = gender;
    p.phone = phone;
    p.email = email;
    p.address = address;
    showMessage(escapeText(fullName) + " was updated", "success");
  }
  saveData();
  closeModal("patient-modal");
  showPatients();
  return false;
}
 
/* ---------- View and delete ---------- */
function viewPatient(id) {
  var p = findById(db.patients, id);
  viewingId = id;
  var email = p.email;
  if (email == "") {
    email = "Not provided";
  }
  var address = p.address;
  if (address == "") {
    address = "Not provided";
  }
  var html = "<tr><th>Patient ID</th><td>" + p.id + "</td></tr>" +
    "<tr><th>Full name</th><td>" + escapeText(p.fullName) + "</td></tr>" +
    "<tr><th>Date of birth</th><td>" + formatDate(p.dateOfBirth) + " (age " + calculateAge(p.dateOfBirth) + ")</td></tr>" +
    "<tr><th>Gender</th><td>" + p.gender + "</td></tr>" +
    "<tr><th>Phone</th><td>" + escapeText(p.phone) + "</td></tr>" +
    "<tr><th>Email</th><td>" + escapeText(email) + "</td></tr>" +
    "<tr><th>Address</th><td>" + escapeText(address) + "</td></tr>" +
    "<tr><th>Registered on</th><td>" + formatDate(p.registeredOn) + "</td></tr>";
  document.getElementById("details-table").innerHTML = html;
  openModal("details-modal");
}
 
function editFromDetails() {
  openPatientForm(viewingId);
}
 
function deletePatient(id) {
  var p = findById(db.patients, id);
  var linked = 0;
  for (var i = 0; i < db.appointments.length; i++) {
    if (db.appointments[i].patientId == id) {
      linked++;
    }
  }
  var question = "Delete " + p.fullName + "?";
  if (linked > 0) {
    question += " Their " + linked + " appointment(s) will also be removed.";
  }
  question += " This cannot be undone.";
  if (confirm(question) == false) {
    return;
  }
 
  db.patients = removeById(db.patients, id);
  var remaining = [];
  for (var j = 0; j < db.appointments.length; j++) {
    if (db.appointments[j].patientId != id) {
      remaining.push(db.appointments[j]);
    }
  }
  db.appointments = remaining;
  saveData();
  showPatients();
  showMessage(escapeText(p.fullName) + " was deleted", "success");
}