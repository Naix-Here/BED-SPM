document.addEventListener("DOMContentLoaded", () => {

    const loginBtn = document.getElementById("loginBtn");
    const registerBtn = document.getElementById("registerBtn");

    loginBtn.addEventListener("click", function (e) {
        e.preventDefault();
        window.location.href = "Login/login.html";
    });

    registerBtn.addEventListener("click", function (e) {
        e.preventDefault();
        window.location.href = "Register/register.html";
    });

});

