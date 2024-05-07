const loginUsr = (user) => {
    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
        .then((userCredential) => {
            let user = userCredential.user;
            window.location.href ='../../panel/view/'
        })
        .catch((error) => {
            let errorCode = error.code;
            let errorMessage = error.message;
            toastShow('Erro', errorCode, 'danger');
        });
}