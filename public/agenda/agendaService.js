const readAllReservationsService = () => {
    swal({
        title: 'Alerta',
        text: `Carregando agenda`,
        icon: 'info',
        closeOnClickOutside: false,
        closeOnEsc: false,
        buttons: false,
    });

    const readAllReservationsServiceFunction = firebase.functions().httpsCallable('readAllReservationsServiceFunction');
    readAllReservationsServiceFunction()
        .then(result => {
            swal.close();
            swal({
                icon: "success",
                buttons: false,
                timer: 1000
              });
            // Processa o resultado retornado pela função
            return loadCalendar(result.data);
        })
        .catch(error => {
            swal({
                title: 'Erro',
                text: `Não foi possível carregar a agenda: ${error}`,
                icon: 'error',
                closeOnClickOutside: false,
                closeOnEsc: false,
                buttons: false,
            });
            // Lida com erros, se houver
            console.error('Erro ao chamar a função:', error);
        });
};



