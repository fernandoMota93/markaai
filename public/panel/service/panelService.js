const OFFSET_HOURS = -4;
const PRICE_MULTIPLIER = 130;

const maskIdentification = (identification) => {
    if (typeof identification !== 'string' || identification.trim().length !== 14) {
        return identification; // Retorna sem modificar se não for uma string válida ou se não tiver o comprimento esperado
    }
    return `${identification.slice(0, 3)}.***.***-${identification.slice(12)}`;
};

const formatName = (name) => {
    if (typeof name !== 'string' || name.trim().length === 0) {
        return name; // Retorna sem modificar se não for uma string válida ou se estiver vazia
    }

    const parts = name.trim().split(' '); // Divide o nome em partes separadas por espaço
    if (parts.length === 1) {
        return name; // Retorna o nome original se for apenas uma palavra
    }

    let formattedName = '';
    if (parts.length === 2) {
        formattedName = `${parts[0].charAt(0).toUpperCase()} ${parts[1]}`;
    } else {
        const firstPart = parts[0];
        const lastPart = parts.pop();
        const middleParts = parts.slice(1).map(part => part.charAt(0).toUpperCase());
        formattedName = `${firstPart} ${middleParts.join(' ')} ${lastPart}`;
    }

    return formattedName;
};

const formatDateTime = (dateTimeString) => {
    const dateTime = new Date(dateTimeString);
    const day = dateTime.getDate().toString().padStart(2, '0');
    const month = (dateTime.getMonth() + 1).toString().padStart(2, '0');
    const year = dateTime.getFullYear().toString().slice(-2); // Pegar os últimos dois dígitos do ano
    const hours = dateTime.getHours().toString().padStart(2, '0');
    const minutes = dateTime.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year}-${hours}:${minutes}`;
};



const formatDateWithOffset = (date, isStartOfDay) => {
    const offsetSign = OFFSET_HOURS >= 0 ? '+' : '-';
    const offsetHours = Math.abs(OFFSET_HOURS);
    const offsetMinutes = 0;
    const offsetString = `${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`;

    const isoDate = date.toISOString().slice(0, 10);
    const timeOfDay = isStartOfDay ? '00:00:00' : '23:59:59';
    return `${isoDate}T${timeOfDay}${offsetString}`;
};

const calculatePrice = (duration) => duration * PRICE_MULTIPLIER;

const processDocumentData = (data, dataid) => ({
    id: dataid,
    name: formatName(data.name),
    identification: maskIdentification(data.identification),
    contact: data.contact,
    local: data.local,
    time: data.status !== 'expirado' ? formatDateTime(data.time) : data.time,
    endTime: data.status !== 'expirado' ? formatDateTime(data.endTime) : 'Se precisar cheque nas opções',
    paymentMethod: data.paymentMethod,
    status: data.status
});

const getDataService = () => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const firstDayOfMonthISO = formatDateWithOffset(firstDayOfMonth, true);
    const lastDayOfMonthISO = formatDateWithOffset(lastDayOfMonth, false);

    const durationsByPaymentMethod = { 1: 0, 2: 0, 3: 0 };

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
                durationsByPaymentMethod[paymentMethod] += duration;
                documents.push(processDocumentData(data, dataid));
            });

            console.log(documents)

            const durationsByPaymentMethodWithPrice = {};
            Object.keys(durationsByPaymentMethod).forEach((method) => {
                durationsByPaymentMethodWithPrice[method] = calculatePrice(durationsByPaymentMethod[method]);
            });

            const totalDocuments = {
                documents: querySnapshot.size,
                durationsByPaymentMethodWithPrice: durationsByPaymentMethodWithPrice
            }

            dataToViewDashBoard(totalDocuments);


            datatoViewTable(formatDataForDataTable(documents));

        }).catch((error) => {
            console.error('Erro ao obter documentos:', error);
        });
}

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

const checkPix = async (id) => {
    try {
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
