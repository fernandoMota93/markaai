
document.getElementById('btn2').addEventListener('click', function (e) {
    const hello = firebaseApp.functions().httpsCallable('hello');
    hello().then(result => {
        console.log(result.data);
    }).catch(error => {

    });

    // Cria uma referência para a função que você quer chamar
    const testarFunction = firebase.functions().httpsCallable('getDocumentos');
    // Chama a função
    testarFunction()
        .then(result => {
            // Processa o resultado retornado pela função
            console.log('Resultado da função:', result.data);
        })
        .catch(error => {
            // Lida com erros, se houver
            console.error('Erro ao chamar a função:', error);
        });

})


