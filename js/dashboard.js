/* Dashboard: statistics, appointment overview and recent appointments */
 
function showDashboard() {
  showWelcome();
  showStats();
  showOverview();
  showRecentAppointments();
}
 
function showWelcome() {
  var hour = new Date().getHours();
  var greeting;
  if (hour < 12) {
    greeting = "Good morning";
  } else if (hour < 17) {
    greeting = "Good afternoon";
  } else {
    greeting = "Good evening";
  }
  document.getElementById("welcome-title").innerHTML = greeting + ", Admin";
  document.getElementById("welcome-date").innerHTML = weekdayOf(todayString()) + ", " + formatDate(todayString());
}
 
function countByStatus(status) {
  var count = 0;
  for (var i = 0; i < db.appointments.length; i++) {
    if (db.appointments[i].status == status) {
      count++;
    }
  }
  return count;
}
 
/* The numbers are counted from the records, never typed in by hand. */
function showStats() {
  var today = todayString();
  var todayCount = 0;
  for (var i = 0; i < db.appointments.length; i++) {
    if (db.appointments[i].date == today) {
      todayCount++;
    }
  }
  document.getElementById("stat-patients").innerHTML = db.patients.length;
  document.getElementById("stat-doctors").innerHTML = db.doctors.length;
  document.getElementById("stat-today").innerHTML = todayCount;
  document.getElementById("stat-pending").innerHTML = countByStatus("Pending");
}
 
function showOverview() {
  var total = db.appointments.length;
  var html = "";
  for (var i = 0; i < APPOINTMENT_STATUSES.length; i++) {
    var count = countByStatus(APPOINTMENT_STATUSES[i]);
    var percent = 0;
    if (total > 0) {
      // whole-number percentage using the % (remainder) operator
      percent = (count * 100 - (count * 100) % total) / total;
    }
    html += `<div class="overview-line">
      <span class="name">${APPOINTMENT_STATUSES[i]}</span><span class="count">${count} (${percent}%)</span>
      <div class="bar"><div class="bar-fill fill-${APPOINTMENT_STATUSES[i].toLowerCase()}" style="width:${percent}%"></div></div>
    </div>`;
  }
  document.getElementById("overview").innerHTML = html;
}
 
function showRecentAppointments() {
  var searchText = document.getElementById("search").value.toLowerCase();
 
  // Step 1: collect the appointments that match the search
  var rows = [];
  for (var i = 0; i < db.appointments.length; i++) {
    var a = db.appointments[i];
    var text = (a.id + " " + patientName(a.patientId) + " " + doctorName(a.doctorId) + " " + a.status).toLowerCase();
    if (text.indexOf(searchText) != -1) {
      rows.push({ appointment: a, when: a.date + " " + a.time });
    }
  }
 
  // Step 2: newest first, then keep only the first 8
  sortList(rows, "when", true);
  var html = "";
  for (var j = 0; j < rows.length && j < 8; j++) {
    var item = rows[j].appointment;
    var options = "";
    for (var k = 0; k < APPOINTMENT_STATUSES.length; k++) {
      var selected = "";
      if (APPOINTMENT_STATUSES[k] == item.status) {
        selected = " selected";
      }
      options += "<option" + selected + ">" + APPOINTMENT_STATUSES[k] + "</option>";
    }
    html += `<tr>
      <td><strong>${item.id}</strong></td>
      <td>${escapeText(patientName(item.patientId))}</td>
      <td>${escapeText(doctorName(item.doctorId))}</td>
      <td>${formatDate(item.date)}, ${formatTime(item.time)}</td>
      <td>${statusBadge(item.status)}</td>
      <td><select id="status-${item.id}" onchange="changeStatus('${item.id}')">${options}</select></td>
    </tr>`;
  }
  document.getElementById("appointments-body").innerHTML = html;
 
  // Empty state
  if (rows.length == 0) {
    document.getElementById("appointments-table").style.display = "none";
    document.getElementById("empty-state").style.display = "block";
  } else {
    document.getElementById("appointments-table").style.display = "table";
    document.getElementById("empty-state").style.display = "none";
  }
}
 
function changeStatus(id) {
  var newStatus = document.getElementById("status-" + id).value;
  setAppointmentStatus(id, newStatus);
  showDashboard();   // redraw everything (this also resets the dropdown if the change was refused)
}
 
function resetFromDashboard() {
  resetDemoData();
  document.getElementById("search").value = "";
  showDashboard();
  showMessage("Demo data was reset.", "success");
}