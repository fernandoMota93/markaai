const checkAuth = () => {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            const uid = user.uid;

            if (uid == 'tu0ZubKIhrS76VYu8TT0F57nKCJ2') {
                toastShow('Bem-vindo', 'Autenticado com sucesso', 'success');
            }
        } else {
            window.location.href = '../../login/';
        }
    });
}

const getDataService = () => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const firstDayOfMonthISO = formatDateWithOffset(firstDayOfMonth, true);
    const lastDayOfMonthISO = formatDateWithOffset(lastDayOfMonth, false);

    const durationsByPaymentMethod = { 1: 0, 2: 0, 3: 0 };
    const paymentOk = { 1: 0 };

    docRef
        .where('timeForDashboard', '>=', firstDayOfMonthISO)
        .where('timeForDashboard', '<=', lastDayOfMonthISO)
        .get()
        .then((querySnapshot) => {
            const documents = [];
            querySnapshot.forEach((doc) => {
                const dataid = doc.id;
                const data = doc.data();
                const duration = data.duration;
                const paymentMethod = data.paymentMethod;
                paymentOk[1] += doc.data().status === 'green' ? 1 : 0;
                durationsByPaymentMethod[paymentMethod] += doc.data().status === 'green' ? duration : 0
                documents.push(processDocumentData(data, dataid));
            });

            const durationsByPaymentMethodWithPrice = {};
            Object.keys(durationsByPaymentMethod).forEach((method) => {
                durationsByPaymentMethodWithPrice[method] = calculatePrice(durationsByPaymentMethod[method]);
            });

            const totalDocuments = {
                documents: querySnapshot.size,
                durationsByPaymentMethodWithPrice: durationsByPaymentMethodWithPrice
            }
            //render the value of top cards
            dataToViewDashBoard(totalDocuments, paymentOk);

            //render the table
            datatoViewTable(formatDataForDataTable(documents));

        }).catch((error) => {
            console.error('Erro ao obter documentos:', error);
        });
};

const getDataServiceBySelect = async (formattedDate) => {
    const [month, year] = formattedDate.split("/");

    console.log(month)

    const today = new Date(`${year}-${parseInt(month)}-01`);

    const isLastQuarter = ['10', '11', '12'].includes(month);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth() + (isLastQuarter ? 1 : 0), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + (isLastQuarter ? 2 : 1), 0);

    const firstDayOfMonthISO = formatDateWithOffset(firstDayOfMonth, true);
    const lastDayOfMonthISO = formatDateWithOffset(lastDayOfMonth, false);

    const durationsByPaymentMethod = { 1: 0, 2: 0, 3: 0 };
    const paymentOk = { 1: 0 };

    docRef
        .where('timeForDashboard', '>=', firstDayOfMonthISO)
        .where('timeForDashboard', '<=', lastDayOfMonthISO)
        .get()
        .then(async (querySnapshot) => {
            if (querySnapshot.size > 0) {
                const documents = [];
                querySnapshot.forEach((doc) => {
                    const dataid = doc.id;
                    const data = doc.data();
                    const duration = data.duration;
                    const paymentMethod = data.paymentMethod;
                    paymentOk[1] += doc.data().status === 'green' ? 1 : 0;
                    durationsByPaymentMethod[paymentMethod] += doc.data().status === 'green' ? duration : 0
                    documents.push(processDocumentData(data, dataid));
                });

                const durationsByPaymentMethodWithPrice = {};
                Object.keys(durationsByPaymentMethod).forEach((method) => {
                    durationsByPaymentMethodWithPrice[method] = calculatePrice(durationsByPaymentMethod[method]);
                });

                const totalDocuments = {
                    documents: querySnapshot.size,
                    durationsByPaymentMethodWithPrice: durationsByPaymentMethodWithPrice
                }
                //render the value of top cards
                dataToViewDashBoardBySelect(totalDocuments, paymentOk);

                //render the table
                datatoViewTable(formatDataForDataTable(documents));

                await setMonthAndYear(month, year);

            } else {
                const documents = {};
                const totalDocuments = {
                    documents: 0,
                    durationsByPaymentMethodWithPrice: 0
                }
                datatoViewTable(documents);
                dataToViewDashBoardBySelect(totalDocuments, paymentOk);
                await setMonthAndYear(month, year);
            }


        }).catch((error) => {
            console.error('Erro ao obter documentos:', error);
        });
};

const getOneDocForUpdateService = (id) => {
    docRef
        .doc(id)
        .get()
        .then((doc) => {
            if (doc.exists) {
                document.getElementById('editName').innerHTML = doc.id
                document.getElementById('editDate').value = formatDateToEditController(doc.data().time);
                document.getElementById('horarioInicial').value = formatTimeToEditController(doc.data().time);
                document.getElementById('horarioFinal').value = formatTimeToEditController(doc.data().endTime);
            }
        }).catch((err) => {
            console.error("Erro ao retornar documento:", err)
        })
}


const updateCostumerEventDataService = (id) => {
    let documentId = id;

    let newDate = document.getElementById('editDate').value;
    let newStartTime = document.getElementById('horarioInicial').value;
    let newFinalDate = document.getElementById('horarioFinal').value;

    // Convertendo a data para o formato AAAA-MM-DD
    let dateParts = newDate.split('/');
    newDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

    let startHours = parseInt(newStartTime.split(':')[0]);
    let endHours = parseInt(newFinalDate.split(':')[0]);
    let newDuration = endHours - startHours;

    let newStartTimeAndHour = `${newDate}T${String(startHours).padStart(2, '0')}:00-04:00`;
    let newFinalTimeAndHour = `${newDate}T${String(endHours).padStart(2, '0')}:00-04:00`;

    docRef
        .doc(documentId)
        .update({
            time: newStartTimeAndHour,
            endTime: newFinalTimeAndHour,
            duration: newDuration,
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            toastShow('Aviso', `Modificação Realizada. Conflitos é por conta e risco do administrador.`);

            let sec = 6;
            const countdownElement = document.getElementById('count');

            const updateTimer = () => {
                countdownElement.textContent = `Atualizado. Recarregando a página em: ${sec} segundos`;

                if (sec > 0) {
                    sec--;
                    setTimeout(updateTimer, 1000);
                } else {
                    location.reload();
                }
            };
            updateTimer();
        }).catch((err) => {
            console.error(`Não foi possivel atualizar: ${err}`);
        })
}

const deleteCostumerEventDataService = (id) => {
    docRef
        .doc(id)
        .delete()
        .then(() => {
            toastShow('Aviso', `Excluído com sucesso.`);
            setTimeout(() => {
                location.reload();
            }, 2000);
        }).catch((err) => {
            toastShow('Aviso', `Erro: ${err}.`, 'danger');
        })
}

const checkPix = async (id) => {
    try {
        swal({
            title: 'Consultando o Banco',
            text: `Ticket do cliente: ${id}`,
            icon: 'info'
        });
        // Montando a URL com os parâmetros necessários
        const url = `https://us-central1-markaai.cloudfunctions.net/pix2/checkpix?id=${id}`;

        // Realiza a requisição
        const response = await fetch(url);

        // Verifica se a requisição foi bem-sucedida
        if (response.ok) {
            // Extrai o JSON da resposta
            const responseData = await response.json();

            // Verifica se a chave 'data' existe na resposta
            if (responseData.hasOwnProperty('data')) {
                // Exibe o valor da chave 'data' em um alerta com título
                swal({
                    title: 'Checagem do Webhook EFÍ',
                    text: `${responseData.data} \n Ticket do cliente: ${responseData.doc}`,
                    icon: 'success'
                });
            } else {
                // Exibe uma mensagem de erro caso a chave 'data' não exista na resposta
                swal({
                    title: 'Aguardando',
                    text: `${responseData.error} \n Erro no processamento.`,
                    icon: 'info'
                });
            }
        } else {
            const responseData = await response.json();
            // Exibe uma mensagem de erro caso a requisição não seja bem-sucedida
            swal({
                title: 'Erro',
                text: `${responseData.error} \n Erro no processamento.`,
                icon: 'error'
            });
        }
    } catch (error) {
        console.error('Erro:', error);
        // Exibe uma mensagem de erro caso ocorra um erro durante o processamento da requisição
        swal({
            title: 'Erroa   ',
            text: 'Erro ao processar a requisição.',
            icon: 'error'
        });
    }
}

const checkAvaibleTimeService = (selectedDate) => {
    console.log({ selectedDate })
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
                updateDropdown(selectedTimes);
            }
            showDivs();
        })
        .catch(error => console.error("Erro ao obter os horários selecionados:", error));
};

const fillTimeGaps = (startTime, endTime) => {
    const filledTimes = [];
    const startHour = parseInt(startTime.slice(11, 13));
    const endHour = parseInt(endTime.slice(11, 13));
    for (let i = startHour + 1; i < endHour; i++) {
        filledTimes.push(startTime.slice(0, 11) + ('0' + i).slice(-2) + ":00-04:00");
    }
    return filledTimes;
};

const createNewReservationService = (reservationData) => {
    const createNewReservationServiceFunction = firebase.functions().httpsCallable('createNewReservationServiceFunction');
    swal({
        title: 'Aguarde',
        text: `Salvando no banco`,
        icon: 'info',
        closeOnClickOutside: false,
        closeOnEsc: false,
        buttons: false,
    });
    createNewReservationServiceFunction(reservationData)
        .then(result => {
            console.log(result.data)
            const reservationId = result.data.id;
            swal.close()
            toastShow('Aviso', `Novo jogo gratuito salvo`);
            console.log('Reserva criada com sucesso. ID:', reservationId);
            setTimeout(() => {
                location.reload();
            }, 2000);
        })
        .catch(error => {
            console.error('Erro ao criar reserva:', error);
        });
}

