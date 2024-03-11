const readAllReservationsService = () => {
    const readAllReservationsServiceFunction = firebase.functions().httpsCallable('readAllReservationsServiceFunction');
    readAllReservationsServiceFunction()
        .then(result => {
            // Processa o resultado retornado pela função
            return loadCalendar(result.data);
        })
        .catch(error => {
            // Lida com erros, se houver
            console.error('Erro ao chamar a função:', error);
        });
};



