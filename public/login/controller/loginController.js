const loginBtn = document.getElementById('loginBtn');

loginBtn.addEventListener('click', (e) => {
    const user = new User(
        email = document.getElementById('email').value,
        password = document.getElementById('password').value
    )
    e.preventDefault();
    loginUsr(user);
})