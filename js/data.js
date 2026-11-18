/*
  Demo data (all fictional) and saving.
  The records are kept in the browser with localStorage so they survive moving between pages.
  localStorage is NOT in the lecture slides and it is NOT secure: anyone can read or edit it.
  Later, PHP and MySQL will replace this file (see docs/PHP-PLAN.md).
*/
 
var STORAGE_KEY = "medicare_simple_v1";
var db = null;   // db.patients, db.doctors, db.appointments
 
function dateFromToday(offset) {
  return addDaysToDate(todayString(), offset);
}
 
function makeSeedData() {
  return {
    patients: [
      { id: "PT-1001", fullName: "Rahim Uddin", dateOfBirth: "1984-03-12", gender: "Male", phone: "01711-000001", email: "rahim@example.com", address: "Dhanmondi, Dhaka", registeredOn: dateFromToday(-120) },
      { id: "PT-1002", fullName: "Sultana Akter", dateOfBirth: "1992-07-25", gender: "Female", phone: "01811-000002", email: "sultana@example.com", address: "Uttara, Dhaka", registeredOn: dateFromToday(-98) },
      { id: "PT-1003", fullName: "Karim Hossain", dateOfBirth: "1975-11-02", gender: "Male", phone: "01911-000003", email: "karim@example.com", address: "Mirpur, Dhaka", registeredOn: dateFromToday(-75) },
      { id: "PT-1004", fullName: "Nusrat Jahan", dateOfBirth: "2001-01-18", gender: "Female", phone: "01611-000004", email: "nusrat@example.com", address: "Banani, Dhaka", registeredOn: dateFromToday(-60) },
      { id: "PT-1005", fullName: "Tanvir Ahmed", dateOfBirth: "1968-09-30", gender: "Male", phone: "01511-000005", email: "tanvir@example.com", address: "Gulshan, Dhaka", registeredOn: dateFromToday(-41) },
      { id: "PT-1006", fullName: "Farhana Islam", dateOfBirth: "1989-05-09", gender: "Female", phone: "01311-000006", email: "farhana@example.com", address: "Mohammadpur, Dhaka", registeredOn: dateFromToday(-22) },
      { id: "PT-1007", fullName: "Mizanur Rahman", dateOfBirth: "1958-12-21", gender: "Male", phone: "01411-000007", email: "mizan@example.com", address: "Motijheel, Dhaka", registeredOn: dateFromToday(-9) },
      { id: "PT-1008", fullName: "Ayesha Siddiqua", dateOfBirth: "1997-04-14", gender: "Female", phone: "01711-000008", email: "ayesha@example.com", address: "Bashundhara, Dhaka", registeredOn: dateFromToday(-3) }
    ],
    doctors: [
      { id: "DR-201", fullName: "Dr. Imran Chowdhury", specialization: "Cardiology", phone: "01700-100001", email: "imran@medicare.test", availableDays: ["Sun", "Tue", "Thu"], consultationFee: 1200, status: "Active" },
      { id: "DR-202", fullName: "Dr. Salma Khatun", specialization: "Pediatrics", phone: "01700-100002", email: "salma@medicare.test", availableDays: ["Mon", "Wed", "Sat"], consultationFee: 900, status: "Active" },
      { id: "DR-203", fullName: "Dr. Arif Mahmud", specialization: "Orthopedics", phone: "01700-100003", email: "arif@medicare.test", availableDays: ["Sun", "Mon", "Wed"], consultationFee: 1000, status: "Active" },
      { id: "DR-204", fullName: "Dr. Rubina Haque", specialization: "Dermatology", phone: "01700-100004", email: "rubina@medicare.test", availableDays: ["Tue", "Thu", "Sat"], consultationFee: 800, status: "On leave" },
      { id: "DR-205", fullName: "Dr. Nasir Uddin", specialization: "General Medicine", phone: "01700-100005", email: "nasir@medicare.test", availableDays: ["Sun", "Mon", "Tue", "Wed", "Thu"], consultationFee: 600, status: "Active" }
    ],
    appointments: [
      { id: "AP-5001", patientId: "PT-1001", doctorId: "DR-201", date: dateFromToday(0), time: "09:00", status: "Confirmed", reason: "Follow-up visit" },
      { id: "AP-5002", patientId: "PT-1002", doctorId: "DR-202", date: dateFromToday(0), time: "09:30", status: "Pending", reason: "General check-up" },
      { id: "AP-5003", patientId: "PT-1003", doctorId: "DR-203", date: dateFromToday(0), time: "10:15", status: "Completed", reason: "Consultation" },
      { id: "AP-5004", patientId: "PT-1004", doctorId: "DR-205", date: dateFromToday(0), time: "11:00", status: "Pending", reason: "Consultation" },
      { id: "AP-5005", patientId: "PT-1005", doctorId: "DR-201", date: dateFromToday(0), time: "11:45", status: "Confirmed", reason: "Follow-up visit" },
      { id: "AP-5006", patientId: "PT-1006", doctorId: "DR-204", date: dateFromToday(1), time: "10:00", status: "Pending", reason: "Consultation" },
      { id: "AP-5007", patientId: "PT-1007", doctorId: "DR-205", date: dateFromToday(1), time: "12:30", status: "Confirmed", reason: "General check-up" },
      { id: "AP-5008", patientId: "PT-1008", doctorId: "DR-202", date: dateFromToday(-1), time: "15:00", status: "Completed", reason: "Consultation" },
      { id: "AP-5009", patientId: "PT-1002", doctorId: "DR-203", date: dateFromToday(-2), time: "16:30", status: "Cancelled", reason: "Consultation" },
      { id: "AP-5010", patientId: "PT-1003", doctorId: "DR-201", date: dateFromToday(2), time: "09:15", status: "Pending", reason: "Follow-up visit" }
    ]
  };
}
 
function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}
 
function resetDemoData() {
  db = makeSeedData();
  saveData();
}
 
function loadData() {
  var saved = localStorage.getItem(STORAGE_KEY);
  if (saved == null) {
    resetDemoData();
    return;
  }
  // try/catch is not in the slides. It only protects the page when the saved text is damaged.
  try {
    db = JSON.parse(saved);
  } catch (error) {
    db = null;
  }
  if (db == null || db.patients == undefined || db.doctors == undefined || db.appointments == undefined) {
    resetDemoData();
  }
}
 
loadData();
 
/* ---------- Look-ups shared by several pages ---------- */
function patientName(id) {
  var p = findById(db.patients, id);
  if (p == null) {
    return "Unknown";
  }
  return p.fullName;
}
 
function doctorName(id) {
  var d = findById(db.doctors, id);
  if (d == null) {
    return "Unknown";
  }
  return d.fullName;
}
 
/* A doctor is "available today" when Active and working on today's weekday. */
function isAvailableToday(doctor) {
  return doctor.status == "Active" && arrayHas(doctor.availableDays, WEEKDAYS[new Date().getDay()]);
}
 
/* Changes an appointment's status. Used by the dashboard and the appointments page,
   so both follow the same rules. Returns true when the status was changed. */
function setAppointmentStatus(id, newStatus) {
  var a = findById(db.appointments, id);
  if (a == null || newStatus == a.status) {
    return false;
  }
  if (newStatus == "Completed" && isInFuture(a.date, a.time)) {
    showMessage("A future appointment cannot be marked as completed.", "error");
    return false;
  }
  if (newStatus == "Cancelled") {
    // confirm() works like alert() but lets the person choose OK or Cancel.
    if (confirm("Cancel appointment " + id + "?") == false) {
      return false;
    }
  }
  a.status = newStatus;
  saveData();
  showMessage(id + " marked as " + newStatus, "success");
  return true;
}