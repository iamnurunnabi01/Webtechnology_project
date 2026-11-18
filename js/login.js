/*
  Login page (PROTOTYPE). No real authentication happens here.
  Later, a PHP script will check the email and password and start a session.
  Never store passwords or "logged in" flags in localStorage as a substitute.
*/
 
var LOGIN_FIELDS = ["email", "password"];
 
function validateLogin() {
  var email = document.getElementById("email").value.trim();
  var password = document.getElementById("password").value;
 
  startValidation(LOGIN_FIELDS);
  if (email == "") {
    addError("email", "Enter your email address.");
  } else if (isValidEmail(email) == false) {
    addError("email", "Enter a valid email, like name@example.com.");
  }
  if (password == "") {
    addError("password", "Enter your password.");
  } else if (password.length < 6) {
    addError("password", "Use at least 6 characters.");
  }
  if (formValid == false) {
    return false;
  }
 
  document.getElementById("login-button").value = "Opening demo...";
  window.location.href = "dashboard.html";   // there is no server check, we just open the demo
  return false;
}
 
function togglePassword() {
  var field = document.getElementById("password");
  var button = document.getElementById("toggle-button");
  if (field.type == "password") {
    field.type = "text";
    button.innerHTML = "Hide";
  } else {
    field.type = "password";
    button.innerHTML = "Show";
  }
}