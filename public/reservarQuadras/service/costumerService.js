
const progressBar = document.getElementById('progress-bar');
const updateProgressBar = (percentage) => {
    progressBar.style.width = percentage + '%';
    progressBar.textContent = percentage + '%';
};


const createNewReservationService = (reservationData) => {
    const createNewReservationServiceFunction = firebase.functions().httpsCallable('createNewReservationServiceFunction');
    const totalSteps = 2; // Defina o número total de etapas
    let currentStep = 0; // Inicialize a etapa atual

    const updateProgress = () => {
        const percentage = Math.round((currentStep / totalSteps) * 100);
        updateProgressBar(percentage);
    };

    currentStep++;
    updateProgress();

    createNewReservationServiceFunction(reservationData)
        .then(result => {
            console.log(result.data)
            const reservationId = result.data.id;
            
            toastShow('Aviso', `Pré-reserva realizada, proceda para o pagamento`);
            currentStep++;
            updateProgress();
            console.log('Reserva criada com sucesso. ID:', reservationId);

            let sec = 6;
            const countdownElement = document.getElementById('count');

            const updateTimer = () => {
                countdownElement.textContent = `Redirecionando para o pagamento em: ${sec} segundos`;

                if (sec > 0) {
                    sec--;
                    setTimeout(updateTimer, 1000);
                } else {
                    sessionStorage.setItem('newReservation', JSON.stringify(result.data));
                    window.location.href = '../../checkout/view/';
                }
            };
            updateTimer();
        })
        .catch(error => {
            console.error('Erro ao criar reserva:', error);
            // Lidar com erros aqui
        });
}

const checkAvaibleTimeService = (selectedDate) => {
    docRef
        .where('time', '>=', selectedDate + 'T00:00:00-04:00')
        .where('time', '<=', selectedDate + 'T23:59:59-04:00')
        .get()
        .then(querySnapshot => {
            const selectedTimes = [];
            querySnapshot.forEach(doc => {
                const startTime = doc.data().time;
                const endTime = doc.data().endTime;
                selectedTimes.push(startTime, endTime);
                // Verifica e preenche lacunas dentro do intervalo
                const gapTimes = fillTimeGaps(startTime, endTime);
                selectedTimes.push(...gapTimes);
            });

            console.log(selectedTimes.sort())

            // Verifica se há horários selecionados
            if (selectedTimes.length > 0) {
                // Se há valores, exibe as divs e atualiza o dropdown
                showDivs();
                updateDropdown(selectedTimes);
            } else {
                // Se não há valores, restaura os valores originais do select
                restoreOriginalSelect();
            }
        })
        .catch(error => console.error("Erro ao obter os horários selecionados:", error));
};

// Função para preencher as lacunas apenas dentro de cada documento
const fillTimeGaps = (startTime, endTime) => {
    const filledTimes = [];
    const startHour = parseInt(startTime.slice(11, 13));
    const endHour = parseInt(endTime.slice(11, 13));
    for (let i = startHour + 1; i < endHour; i++) {
        filledTimes.push(startTime.slice(0, 11) + ('0' + i).slice(-2) + ":00-04:00");
    }
    return filledTimes;
};
// Função para restaurar os valores originais do select
const restoreOriginalSelect = () => {
    $('#time').html(originalSelectValues);
};

