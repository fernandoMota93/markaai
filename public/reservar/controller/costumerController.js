const createReservation = document.getElementById('create-reservation');
const originalSelectValues = $('#time').html();
const timeSelected = document.getElementById('time');
const duration = document.getElementById('duration');
const datepicker = document.getElementById('datepicker');
const proccedToPay = document.getElementById('paymentMethod');
const btnContinue = document.getElementById('btnContinue');


document.getElementById('name').addEventListener('input', () => {
    const inputElement = document.getElementById('name');
    const inputValue = inputElement.value;

    if (/^[a-zA-Z\s]*$/.test(inputValue)) {

    } else {

        inputElement.value = inputValue.slice(0, -1);
        toastShow('Atenção', 'Somente letras!', 'danger');
    }
});

VMasker(document.getElementById('document')).maskPattern("999.999.999-99");
VMasker(document.getElementById('contact')).maskPattern("(99) 99999-9999");

datepicker.addEventListener('click', (e) => {
    if ($('#duration').val() !== 'Selecione...') {
        $('#time').val('');
        $('#duration').val('');
        $('#paymentMethod').val('');
        $('#div2, #div3, #div4').addClass('hide');
    }
})

timeSelected.addEventListener('change', (e) => {
    e.preventDefault();
    $('#div4').removeClass('hide');

    const selectedIndex = timeSelected.selectedIndex;
    const selectedTimeOption = timeSelected.options[selectedIndex];
    const selectedTime = selectedTimeOption ? selectedTimeOption.value : null;
    const nextTimeOption = timeSelected.options[selectedIndex + 1];
    const nextTimeOption2 = timeSelected.options[selectedIndex + 2];
    const nextTime = nextTimeOption ? nextTimeOption.value : null;
    const nextTime2 = nextTimeOption2 ? nextTimeOption2.value : null;

   // console.log("Selected time:", selectedTime);
    //console.log("Next time:", nextTime);
   // console.log("Next time 2:", nextTime2);


    if (!nextTime && !nextTime2 && selectedTime == '22:00') {
        $('#duration option').each(function () {
            const optionValue = $(this).val();
            const shouldDisable =
                (optionValue !== '1' && optionValue !== '2' && optionValue !== '3');
            $(this).prop('disabled', shouldDisable);
        });
    }

    if (!nextTime && !nextTime2 && selectedTime != '22:00') {
        $('#duration option').each(function () {
            const optionValue = $(this).val();
            const shouldDisable =
                (optionValue !== '1');
            $(this).prop('disabled', shouldDisable);
        });
    }



    if (nextTime && nextTime2) {
        const selectedHours = parseInt(selectedTime.split(':')[0]);
        const nextHours = parseInt(nextTime.split(':')[0]);
        const nextHours2 = parseInt(nextTime2.split(':')[0]);
        const diffHours = nextHours - selectedHours;
        const diffHoursSecondSlot = nextHours2 - selectedHours;


        //console.log("Difference in hours:", diffHours);
        //console.log("Difference in second slot:", diffHoursSecondSlot);
        //console.log("Selected time:", selectedHours);
        //console.log("Second time:", nextHours2);

        // Desabilita opções do dropdown de duração conforme as condições
        $('#duration option').each(function () {
            const optionValue = $(this).val();
            const shouldDisable =
                (diffHours == 1 && diffHoursSecondSlot == 2 && optionValue !== '1' && optionValue !== '2' && optionValue !== '3') ||
                (diffHours == 4 && diffHoursSecondSlot == 5 && optionValue !== '1' && optionValue !== '2' && optionValue !== '3') ||
                (diffHours > 3 && optionValue !== '1') ||
                (diffHours > 3 && diffHoursSecondSlot > 5 && optionValue !== '1') ||
                (diffHours == 3 && diffHoursSecondSlot == 4 && optionValue !== '1') ||
                (diffHours == 1 && diffHoursSecondSlot >= 3 && optionValue !== '1' && optionValue !== '2')
            //(diffHoursSecondSlot >= 4 && diffHours > 3  && optionValue !== '1' && optionValue !== '2');

            $(this).prop('disabled', shouldDisable);
        });

    }
    if (nextTime && !nextTime2) {

        const selectedHours = parseInt(selectedTime.split(':')[0]);
        const nextHours = parseInt(nextTime.split(':')[0]);
        const diffHours = nextHours - selectedHours;


        //console.log("Difference in hours:", diffHours);
        //console.log("Selected time:", selectedHours);

        // Desabilita opções do dropdown de duração conforme as condições
        $('#duration option').each(function () {
            const optionValue = $(this).val();
            const shouldDisable =
                (diffHours !== 1 && optionValue !== '1') ||
                (diffHours == 1 && optionValue !== '1' && optionValue !== '2')
            $(this).prop('disabled', shouldDisable);
        });

    }
});


duration.addEventListener('change', (e) => {
    e.preventDefault();
    $('#div3').removeClass('hide');
    $('#div6').removeClass('hide');
});
proccedToPay.addEventListener('change', (e) => {
    e.preventDefault();
    $('#div5').removeClass('hide');
});


// Função para atualizar o dropdown das horas
const updateDropdown = (selectedTimes, selectedDate) => {
    const dropdown = document.getElementById('time');

    // Remover opções já ocupadas
    selectedTimes.forEach(selectedTime => {
        const optionToRemove = dropdown.querySelector(`option[value="${selectedTime.split('T')[1].substring(0, 5)}"]`);
        if (optionToRemove) optionToRemove.remove();
    });

    const dateObject = new Date(selectedDate);
    let dayOfWeek = dateObject.getDay();   

    if (dayOfWeek === 0 || dayOfWeek === 2 || dayOfWeek === 4) {
        $("#time option[value='19:00']").remove();
        $("#time option[value='20:00']").remove();
    }
};

const showDivs = () => {
    // Exibe as três divs
    $('#div1, #div2').removeClass('hide');
}


btnContinue.addEventListener('click', (e) => {
    e.preventDefault();
    
    // Verifica se todos os campos obrigatórios estão preenchidos
    const form = document.getElementById('create-reservation');
    const requiredInputs = form.querySelectorAll('[required]');
    let isValid = true;

    requiredInputs.forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
            input.classList.add('is-invalid'); // Adiciona uma classe de estilo para indicar campos inválidos
        } else {
            input.classList.remove('is-invalid');
        }
    });

    if (isValid && document.getElementById('privacyPolicyCheckbox').checked) {
        btnContinue.disabled = true;
        const event = new Event('submitReservation');
        createReservation.dispatchEvent(event);
    } else {
        swal({
            title: 'Alerta',
            text: `Você deve preencher todos os campos obrigatórios e aceitar a política de privacidade`,
            icon: 'info'
        });
    }
});




createReservation.addEventListener('submitReservation', (e) => {
    e.preventDefault();

    const convertDateFormat = (inputDate) => {
        // Divida a string usando '/' como delimitador
        const dateParts = inputDate.split('/');

        // Verifique se a string de entrada está no formato correto (DD/MM/YYYY)
        if (dateParts.length === 3) {
            const day = dateParts[0];
            const month = dateParts[1];
            const year = dateParts[2];


            // Construa a nova string no formato desejado (YYYY-MM-DD)
            const outputDate = `${year}-${month}-${day}`;

            return outputDate;
        } else {
            // Retorne nulo ou uma mensagem de erro se o formato da entrada não for válido
            console.error('Formato de data inválido. Use DD/MM/YYYY.');
            return null;
        }
    };
    const convertDateFormatMoreOneDay = (inputDate) => {
        // Divida a string usando '/' como delimitador
        const dateParts = inputDate.split('/');

        // Verifique se a string de entrada está no formato correto (DD/MM/YYYY)
        if (dateParts.length === 3) {
            const day = dateParts[0];
            const month = dateParts[1];
            const year = dateParts[2];

            const moreOneDay = parseInt(day) + 1;

            // Construa a nova string no formato desejado (YYYY-MM-DD)
            const outputDate = `${year}-${month}-${moreOneDay}`;

            return outputDate;
        } else {
            // Retorne nulo ou uma mensagem de erro se o formato da entrada não for válido
            console.error('Formato de data inválido. Use DD/MM/YYYY.');
            return null;
        }
    };




    let name = document.getElementById('name').value;
    let identification = document.getElementById('document').value;
    let contact = document.getElementById('contact').value;
    let email = document.getElementById('email').value;
    let time = `${convertDateFormat(document.getElementById('datepicker').value)}T${document.getElementById('time').value}:00-04:00`;
    let paymentMethod = document.getElementById('paymentMethod').value;
    let local = document.getElementById('local').value;
    let rentBall = document.getElementById('rentBall').value;

    let selectedDuration = parseInt(document.getElementById('duration').value);
    let endTime = new Date(time);

    endTime.setHours(endTime.getHours() + selectedDuration);


    let formattedHours = ('0' + endTime.getHours()).slice(-2);
    let formattedMinutes = ('0' + endTime.getMinutes()).slice(-2);
    let formattedEndTime = `${formattedHours}:${formattedMinutes}`;
   // console.log(`End Time: ${formattedEndTime}`)

    if (formattedEndTime == '01:00' || formattedEndTime == '00:00') {
        endTime = `${convertDateFormatMoreOneDay(document.getElementById('datepicker').value)}T${formattedEndTime}:00-04:00`;
    } else {
        endTime = `${convertDateFormat(document.getElementById('datepicker').value)}T${formattedEndTime}:00-04:00`
    }
    const reservationData = {
        name: name,
        identification: identification,
        contact: contact,
        email: email,
        time: time,
        timeForDashboard: time,
        endTime: endTime,
        duration: selectedDuration,
        paymentMethod: paymentMethod,
        rentBall: rentBall,
        local: local
    };
    createNewReservationService(reservationData);
});