const getDataForCheckOutService = () => {
    // Recupera os dados da reserva do sessionStorage
    const storedReservation = sessionStorage.getItem('newReservation');

    // Verifica se existem dados armazenados na sessionStorage
    if (storedReservation) {
        //call the view to render
        dataToViewCheckout(storedReservation);
        //apaga a storage
        //sessionStorage.removeItem('newReservation');
    } else {
        // Caso não haja dados armazenados na sessionStorage
        window.location.href = '../../403.html';
    }
}




const createCobrancaService = async (id) => {
    try {
        // Montando a URL com os parâmetros necessários
        const url = `https://us-central1-markaai.cloudfunctions.net/pix2/pix?id=${id}`;

        // Cria um link com o URL gerado
        const link = document.createElement('a');
        link.href = url;

    
        link.setAttribute('rel', 'noopener noreferrer'); // Segurança para evitar ataques de phishing

        // Simula um clique no link
        if (document.createEvent) {
            const event = document.createEvent('MouseEvents');
            event.initEvent('click', true, true);
            link.dispatchEvent(event);
        } else {
            link.click();
        }

    } catch (error) {
        console.error('Erro:', error);
    }
};
