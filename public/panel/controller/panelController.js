const OFFSET_HOURS = -4;
const PRICE_MULTIPLIER = 150;

const signOutBtn = document.getElementById('signOutBtn');
const btnPeriod = document.getElementById('btnPeriod');



signOutBtn.addEventListener('click', (e) => {
    e.preventDefault();

    firebase.auth().signOut().then(() => {
        window.location.href = '../../index.html'
    }).catch((error) => {
        // An error happened.
    });
});

btnPeriod.addEventListener('click', async (e) => {

    const { value: monthYear } = await Swal.fire({
        title: "Selecione o mês e o ano",
        input: "month",
        inputLabel: "Mês/Ano",
        inputAttributes: {
            min: "yyyy-mm",
            max: "yyyy-mm"
        },
        inputValue: new Date().toISOString().substr(0, 7) // Valor padrão: mês/ano atual
    });

    if (monthYear) {
        const [year, month] = monthYear.split("-");
        const formattedDate = `${month}/${year}`;
        Swal.fire("Mês e Ano selecionados", formattedDate);
        getDataServiceBySelect(formattedDate);
    };
});




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


const processDocumentData = (data, dataid) => ({
    id: dataid,
    name: formatName(data.name),
    identification: maskIdentification(data.identification),
    contact: data.contact,
    local: data.local,
    time: data.status !== 'expirado' ? formatDateTime(data.time) : data.time,
    endTime: data.status !== 'expirado' ? formatDateTime(data.endTime) : 'Se precisar cheque nas opções',
    paymentMethod: data.paymentMethod,
    initialCost: data.initialCost,
    rentBall: data.rentBall !== '1' ? 'Sim' : 'Não',
    status: data.status
});

const calculatePrice = (duration, cost) => duration * cost;


const formatDateToEditController = (dataOriginal) => {
    const data = new Date(dataOriginal);
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    const dataFormatada = `${dia}/${mes}/${ano}`;
    return dataFormatada;
}

const maskEditModalController = () => {
    VMasker(document.getElementById("editDate")).maskPattern("99/99/9999");
    VMasker(document.getElementById("horarioInicial")).maskPattern("99:99");
    VMasker(document.getElementById("horarioFinal")).maskPattern("99:99");

}

const formatTimeToEditController = (originalTime) => {
    const data = new Date(originalTime);
    const hora = String(data.getHours()).padStart(2, '0');
    const minutos = String(data.getMinutes()).padStart(2, '0');
    const horaFormatada = `${hora}:${minutos}`;
    return horaFormatada;
}

const handlerUpdateData = (id) => {
    let btnUpdate = document.getElementById('btnUpdate');

    btnUpdate.addEventListener("click", (e) => {
        e.preventDefault();
        updateCostumerEventDataService(id);
    })
}
const handlerDeleteData = (id) => {
    let btnDelete = document.getElementById('btnDelete');

    btnDelete.addEventListener("click", (e) => {
        e.preventDefault();
        deleteCostumerEventDataService(id);
        modal.hide();
    })
};

const updateDropdown = (selectedTimes) => {
    const dropdown = document.getElementById('time');
    selectedTimes.slice(0, -1).forEach(selectedTime => {
        const optionToRemove = dropdown.querySelector(`option[value="${selectedTime.split('T')[1].substring(0, 5)}"]`);
        if (optionToRemove) optionToRemove.remove();
    });

};

const showDivs = () => {
    // Exibe as três divs
    $('#div1, #div2').removeClass('hide');
}


