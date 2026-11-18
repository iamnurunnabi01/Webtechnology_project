/* Landing page: counts and featured doctors come from the same demo records */
 
function showHome() {
  document.getElementById("stat-doctors").innerHTML = db.doctors.length;
  document.getElementById("stat-patients").innerHTML = db.patients.length;
  document.getElementById("stat-appointments").innerHTML = db.appointments.length;
 
  // Pick up to 3 Active doctors. First pass: doctors working today. Second pass: the others.
  var chosen = [];
  for (var pass = 0; pass < 2; pass++) {
    for (var i = 0; i < db.doctors.length; i++) {
      var d = db.doctors[i];
      var worksToday = isAvailableToday(d);
      var wanted = (pass == 0 && worksToday) || (pass == 1 && worksToday == false);
      if (d.status == "Active" && wanted && chosen.length < 3) {
        chosen.push(d);
      }
    }
  }
 
  var html = "";
  for (var j = 0; j < chosen.length; j++) {
    var doc = chosen[j];
    var todayBadge = "";
    if (isAvailableToday(doc)) {
      todayBadge = '<p><span class="badge badge-today">Available today</span></p>';
    }
    html += `<div class="col-3"><div class="card card-body">
      <div class="doctor-top"><div class="avatar">${initialsOf(doc.fullName)}</div>
        <h3>${escapeText(doc.fullName)}</h3><div class="muted small">${escapeText(doc.specialization)}</div></div>
      ${todayBadge}
      <div>${dayChips(doc.availableDays)}</div>
      <div class="doctor-bottom"><span class="fee">${formatFee(doc.consultationFee)}</span><br><br>
        <a class="btn btn-small" href="appointments.html">Book</a></div>
    </div></div>`;
  }
  if (chosen.length == 0) {
    html = '<div class="card card-body center"><h3>No doctors to show yet</h3><p class="muted">Add doctors in the directory and they will appear here.</p></div>';
  }
  document.getElementById("featured-doctors").innerHTML = html;
}