/*
  Shared helper functions used by every page.
  Only topics from the lectures are used: variables, functions, if/else, switch, loops,
  arrays, strings and the HTML DOM (getElementById, innerHTML, style).
*/
 
var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
var WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
var APPOINTMENT_STATUSES = ["Pending", "Confirmed", "Completed", "Cancelled"];
var formValid = true;
 
/* ---------- Message bar and modal windows ---------- */
function showMessage(text, type) {
  var box = document.getElementById("message");
  document.getElementById("message-text").innerHTML = text;
  if (type == "error") {
    box.style.backgroundColor = "#FEE2E2";
    box.style.color = "#991B1B";
    box.style.borderColor = "#DC2626";
  } else {
    box.style.backgroundColor = "#DCFCE7";
    box.style.color = "#166534";
    box.style.borderColor = "#16A34A";
  }
  box.style.display = "block";
}
 
function hideMessage() {
  document.getElementById("message").style.display = "none";
}
 
function openModal(id) {
  document.getElementById(id).style.display = "block";
}
 
function closeModal(id) {
  document.getElementById(id).style.display = "none";
}
 
/* Text typed by a user must be escaped before it is put into innerHTML.
   split() and join() replace every match (replace() only replaces the first one). */
function escapeText(text) {
  var result = String(text);
  result = result.split("&").join("&amp;");
  result = result.split("<").join("&lt;");
  result = result.split(">").join("&gt;");
  result = result.split('"').join("&quot;");
  result = result.split("'").join("&#39;");
  return result;
}
 
/* ---------- Dates and times (dates are stored as text like 2026-10-31) ---------- */
function dateFromString(isoDate) {
  var parts = isoDate.split("-");
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}
 
function toIsoDate(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
 
function todayString() {
  return toIsoDate(new Date());
}
 
function nowTimeString() {
  var now = new Date();
  return String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
}
 
function addDaysToDate(isoDate, days) {
  var d = dateFromString(isoDate);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}
 
function weekdayOf(isoDate) {
  return WEEKDAYS[dateFromString(isoDate).getDay()];
}
 
function formatDate(isoDate) {
  var parts = isoDate.split("-");
  return parts[2] + " " + MONTHS[Number(parts[1]) - 1] + " " + parts[0];
}
 
function formatTime(hhmm) {
  var parts = hhmm.split(":");
  var hour = Number(parts[0]);
  var suffix = "AM";
  if (hour >= 12) {
    suffix = "PM";
  }
  var hour12 = hour % 12;
  if (hour12 == 0) {
    hour12 = 12;
  }
  return hour12 + ":" + parts[1] + " " + suffix;
}
 
function calculateAge(dateOfBirth) {
  var birth = dateFromString(dateOfBirth);
  var now = new Date();
  var age = now.getFullYear() - birth.getFullYear();
  var monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff == 0 && now.getDate() < birth.getDate())) {
    age = age - 1;
  }
  return age;
}
 
function isInFuture(date, time) {
  return (date + " " + time) > (todayString() + " " + nowTimeString());
}
 
/* ---------- Form validation helpers ---------- */
function showFieldError(fieldId, message) {
  document.getElementById("error-" + fieldId).innerHTML = message;
  var field = document.getElementById(fieldId);
  if (field != null) {
    if (message == "") {
      field.style.borderColor = "";
    } else {
      field.style.borderColor = "#DC2626";
    }
  }
}
 
function startValidation(fieldIds) {
  formValid = true;
  for (var i = 0; i < fieldIds.length; i++) {
    showFieldError(fieldIds[i], "");
  }
}
 
function addError(fieldId, message) {
  showFieldError(fieldId, message);
  formValid = false;
}
 
function isValidEmail(email) {
  var at = email.indexOf("@");
  if (at < 1) {
    return false;
  }
  if (email.indexOf(" ") != -1 || email.indexOf("@", at + 1) != -1) {
    return false;
  }
  var dot = email.indexOf(".", at);
  if (dot == -1 || dot == at + 1 || dot == email.length - 1) {
    return false;
  }
  return true;
}
 
function isValidPhone(phone) {
  var allowed = "0123456789+-() ";
  if (phone.length < 7 || phone.length > 20) {
    return false;
  }
  for (var i = 0; i < phone.length; i++) {
    if (allowed.indexOf(phone.charAt(i)) == -1) {
      return false;
    }
  }
  return true;
}
 
/* ---------- Arrays of records ---------- */
function arrayHas(list, item) {
  for (var i = 0; i < list.length; i++) {
    if (list[i] == item) {
      return true;
    }
  }
  return false;
}
 
function findById(list, id) {
  for (var i = 0; i < list.length; i++) {
    if (list[i].id == id) {
      return list[i];
    }
  }
  return null;
}
 
/* Builds a new array without the record that has this id (uses push, like the Array slide). */
function removeById(list, id) {
  var result = [];
  for (var i = 0; i < list.length; i++) {
    if (list[i].id != id) {
      result.push(list[i]);
    }
  }
  return result;
}
 
/* Creates ids such as PT-1009: finds the highest number used so far and adds one. */
function nextId(list, prefix, startNumber) {
  var highest = startNumber;
  for (var i = 0; i < list.length; i++) {
    var number = Number(list[i].id.substring(prefix.length));
    if (number > highest) {
      highest = number;
    }
  }
  return prefix + (highest + 1);
}
 
/* Simple bubble sort: sorts a list of objects by one property (key). */
function sortList(list, key, descending) {
  for (var i = 0; i < list.length - 1; i++) {
    for (var j = 0; j < list.length - 1 - i; j++) {
      var first = list[j][key];
      var second = list[j + 1][key];
      if (typeof first == "string") {
        first = first.toLowerCase();
        second = second.toLowerCase();
      }
      var shouldSwap = descending ? first < second : first > second;
      if (shouldSwap) {
        var temp = list[j];
        list[j] = list[j + 1];
        list[j + 1] = temp;
      }
    }
  }
  return list;
}
 
/* ---------- Small pieces of HTML ---------- */
function formatFee(fee) {
  return "BDT " + fee;
}
 
function statusBadge(status) {
  var cssName = status.toLowerCase().split(" ").join("-");
  return '<span class="badge badge-' + cssName + '">' + status + '</span>';
}
 
function initialsOf(name) {
  var words = name.split(" ");
  var start = 0;
  if (words[0].toLowerCase() == "dr.") {
    start = 1;
  }
  var letters = words[start].charAt(0);
  if (words.length > start + 1) {
    letters += words[start + 1].charAt(0);
  }
  return letters.toUpperCase();
}
 
/* The seven weekday boxes of a doctor; days the doctor works are highlighted. */
function dayChips(availableDays) {
  var html = "";
  for (var i = 0; i < WEEKDAYS.length; i++) {
    var css = "chip";
    if (arrayHas(availableDays, WEEKDAYS[i])) {
      css = "chip chip-on";
    }
    html += '<span class="' + css + '">' + WEEKDAYS[i] + '</span>';
  }
  return html;
}