const PIX_TAX = 0.0119;
const CREDIT_TAX = 0.399;
const DEBIT_TAX = 0.239;
const PROGRAMMER_TIP = 0.015;

const dataToViewDashBoard = (dataGathered, paymentOk) => {
    //******************DASHBOARD******************//
    //taxas de transação
    const pix = 1 - PIX_TAX;
    const credit = 1 - CREDIT_TAX;
    const debit = 1 - DEBIT_TAX;

    // Acessando os valores dos pagamentos
    const payment1 = dataGathered.durationsByPaymentMethodWithPrice[1] || 0;
    const payment2 = dataGathered.durationsByPaymentMethodWithPrice[2] || 0;
    const payment3 = dataGathered.durationsByPaymentMethodWithPrice[3] || 0;

    //contador de pagamentos processados
    const payments = paymentOk[1];

    // Calculando a soma dos valores dos pagamentos
    const bruteValue = payment1 + payment2 + payment3;

    //Calculo Liquido
    const liquidValue = ((payment1 * pix) + (payment2 * credit) + (payment3 * debit));

    //repasse
    const programmerTip = bruteValue * PROGRAMMER_TIP;

    // Formatando bruteValue com duas casas decimais
    const bruteValueWithCents = bruteValue.toFixed(2);
    const liquidValueWithCents = liquidValue.toFixed(2);
    const programmerTipWithCents = programmerTip.toFixed(2);

    // Selecione o elemento onde o template será renderizado
    const templateReservation = document.getElementById('reservations');
    const templateBrute = document.getElementById('bruteValue');
    const templateLiquid = document.getElementById('liquidValue');
    const templateProgrammerTip = document.getElementById('programmerTip');
    const templatePaymentOk = document.getElementById('paymentOk');

    // Compile os templates usando Handlebars
    const compiledTemplateReservation = Handlebars.compile(templateReservation.innerHTML);
    const compiledTemplateBrute = Handlebars.compile(templateBrute.innerHTML);
    const compiledTemplateLiquid = Handlebars.compile(templateLiquid.innerHTML);
    const compiledProgrammerTip = Handlebars.compile(templateProgrammerTip.innerHTML);
    const compiledPaymentOk = Handlebars.compile(templatePaymentOk.innerHTML);

    // Renderize os templates com os dados
    templateReservation.innerHTML = compiledTemplateReservation({ totalDocuments: dataGathered.documents });
    templateBrute.innerHTML = compiledTemplateBrute({ bruteValue: `R$ ${bruteValueWithCents}` });
    templateLiquid.innerHTML = compiledTemplateLiquid({ liquidValue: `R$ ${liquidValueWithCents}` });
    templateProgrammerTip.innerHTML = compiledProgrammerTip({ programmerTip: `R$ ${programmerTipWithCents}` });
    templatePaymentOk.innerHTML = compiledPaymentOk({ totalPaymentOk: payments });
    //******************DASHBOARD******************//

}

const dataToViewDashBoardBySelect = (dataGathered, paymentOk) => {
    //******************DASHBOARD******************//
    //taxas de transação
    const pix = 1 - PIX_TAX;
    const credit = 1 - CREDIT_TAX;
    const debit = 1 - DEBIT_TAX;

    // Acessando os valores dos pagamentos
    const payment1 = dataGathered.durationsByPaymentMethodWithPrice[1] || 0;
    const payment2 = dataGathered.durationsByPaymentMethodWithPrice[2] || 0;
    const payment3 = dataGathered.durationsByPaymentMethodWithPrice[3] || 0;

    //contador de pagamentos processados
    const payments = paymentOk[1];

    // Calculando a soma dos valores dos pagamentos
    const bruteValue = payment1 + payment2 + payment3;

    //Calculo Liquido
    const liquidValue = ((payment1 * pix) + (payment2 * credit) + (payment3 * debit));

    //repasse
    const programmerTip = bruteValue * PROGRAMMER_TIP;

    // Formatando bruteValue com duas casas decimais
    const bruteValueWithCents = bruteValue.toFixed(2);
    const liquidValueWithCents = liquidValue.toFixed(2);
    const programmerTipWithCents = programmerTip.toFixed(2);

    // renderizado dinamicamente
    document.getElementById('reservations').innerHTML = dataGathered.documents;
    document.getElementById('bruteValue').innerHTML = `R$ ${bruteValueWithCents}`;
    document.getElementById('liquidValue').innerHTML = `R$ ${liquidValueWithCents}`;
    document.getElementById('programmerTip').innerHTML = `R$ ${programmerTipWithCents}`;
    document.getElementById('paymentOk').innerHTML = payments;
    //******************DASHBOARD******************//

}

const formatDataForDataTable = (documents) => {
    return documents.map(document => [
        document.name,
        document.identification == null ? '' : document.identification,
        document.contact  == null ? '' : document.contact,
        typeof document.time != String ? `${document.time} - ${document.endTime}` : 'dsadas',
        document.local,
        document.status === 'green' ? 'Pago' :
            document.status === 'expirado' ? 'Ticket Expirado' :
                document.status === 'orange' ? 'Ag. Pagamento' : 
                    document.status === 'blue' ? 'Marcou como Socio' : 'Cancelado',
        document.paymentMethod === '1' ? 'PIX' :
            document.paymentMethod === '2' ? 'Crédito' :
                document.paymentMethod === '3' ? 'Débito' : 'Outro',
        `<button class="btn btn-success p-1" onclick="checkPix('${document.id}')"><i class="bi bi-check-square"></i></button>&nbsp` + // Autorizar
        `<button class="btn btn-warning p-1"onclick="renderEditModal('${document.id}')"><i class="bi bi-pencil-square"></i></button>&nbsp` + // Editar
        `${document.status === 'blue' ? `<button class="btn btn-danger p-1" onclick="renderConfirmModal('${document.id}')"><i class="bi bi-trash"></i></button>&nbsp` : `` }` +
        `<button class="btn btn-info p-1"><i class="bi bi-cash"></i></button>`
    ]);

}

const datatoViewTable = (documents) => {
    // Limpa a tabela antes de adicionar novos dados
    $('#myTable').DataTable().clear().draw();

    // Adiciona os dados à tabela
    $('#myTable').DataTable().rows.add(documents).draw();
};

const getMonthAndYear = () => {
    const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const currentMonthIndex = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthName = months[currentMonthIndex];

    const templateCurrentMonth = document.getElementById('currentMonth');
    const compiledTemplatecurrentMonth = Handlebars.compile(templateCurrentMonth.innerHTML);
    templateCurrentMonth.innerHTML = compiledTemplatecurrentMonth({ currentMonth: `${monthName} de ${currentYear}` });

}

const setMonthAndYear = async (month, year) => {
    try {
        console.log(month)
        const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        const currentMonthIndex = new Date(`${year}-${parseInt(month)}-01`).getMonth();
        const currentYear = new Date().getFullYear();
        const monthName = month === '10' || month === '11' || month === '12' ? months[currentMonthIndex + 1] : months[currentMonthIndex];

        document.getElementById('currentMonth').innerHTML = `${monthName} de ${currentYear}`;
    } catch (error) {
        console.error('Não executou: ', error)
    }

};

const renderConfirmModal = (id) => {
    let deleteModal = document.getElementById('deleteModal')
    deleteModal.innerHTML =
        `
        <div class="modal fade" data-bs-backdrop="static" data-bs-keyboard="false" id="deleteModalDisplay" tabindex="-1"
        aria-labelledby="editModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-xl">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="editModalLabel">Ticket da reserva: <small id="editName"></small></h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                </div>
                <div class="modal-body" id="printThis">
                    <form action="" id="editData">
                        <fieldset class="scheduler-border">
                            <legend class="scheduler-border">Um momento </legend>
                            <div class="row row-cols-1">
                                <span>Deseja excluir o regsitro?</span>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                                <button type="button" id="btnDelete" class="btn btn-danger"  data-bs-dismiss="modal"><i class="fas fa-trash"></i>
                                    Excluir</button>
                            </div>
                        </fieldset>
                    </form>
                </div>
                
                <div class="modal-footer">
                    <div class="alert alert-danger" role="alert" style= "font-size:9pt">
                        <strong>Atenção:</strong> Fazer alterações aqui pode afetar a lógica dos agendamentos. Tenha certeza do horário antes de prosseguir. Em caso de dúvida não faça nada!
                    </div>
                </div>
            </div>
        </div>
    </div>
    `

    const modal = new bootstrap.Modal(document.getElementById('deleteModalDisplay'));
    modal.show();

    modal._element.addEventListener('shown.bs.modal', (e) => {
        console.log('Modal apresentado!');
    });


    //call the controller    
    handlerDeleteData(id)

}

const renderEditModal = (id) => {
    let updateModal = document.getElementById('updateModal')
    updateModal.innerHTML =
        `
        <div class="modal fade" data-bs-backdrop="static" data-bs-keyboard="false" id="editModal" tabindex="-1"
        aria-labelledby="editModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-xl">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="editModalLabel">Ticket da reserva: <small id="editName"></small></h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                </div>
                <div class="modal-body" id="printThis">
                    <form action="" id="editData">
                        <fieldset class="scheduler-border">
                            <legend class="scheduler-border">Edição aberta </legend>
                            <div class="row row-cols-1">
                                <div class="col">
                                    <label for="editDate" class="form-label">Data</label>
                                    <input type="text" id="editDate" class="form-control" aria-labelledby="help">
                                </div>
                                <div class="col">
                                    <label for="horarioInicial" class="form-label">Horário inicial</label>
                                    <input type="text" id="horarioInicial" class="form-control" aria-labelledby="help"
                                        >
                                </div>
                                <div class="col">
                                    <label for="horarioFinal" class="form-label">Horário final</label>
                                    <input type="text" id="horarioFinal" class="form-control" aria-labelledby="help"
                                        >
                                </div>
                            </div>
                        </fieldset>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                    <button type="button" id="btnUpdate" class="btn btn-success"><i class="fas fa-check"></i>
                        Alterar</button>
                </div>
                <div class="modal-footer">
                    <div class="alert alert-danger" role="alert" style= "font-size:9pt">
                        <strong>Atenção:</strong> Fazer alterações aqui pode afetar a lógica dos agendamentos. Tenha certeza do horário antes de prosseguir. Em caso de dúvida não faça nada!
                    </div>
                </div>
            </div>
        </div>
    </div>
    `

    const modal = new bootstrap.Modal(document.getElementById('editModal'));
    modal.show();

    modal._element.addEventListener('shown.bs.modal', (e) => {
        maskEditModalController();
        console.log('Modal apresentado!');
    });
    //call the service -> get the document and show data in modal   
    getOneDocForUpdateService(id)


    //call the controller    
    handlerUpdateData(id)

}


const bundleModal = () => {

    let bundleModal = document.getElementById('bundleModal')
    bundleModal.innerHTML =
        `
     <div class="modal fade" data-bs-backdrop="static" data-bs-keyboard="false" id="newBundleModal" tabindex="-1"
                aria-labelledby="bundleModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="bundleModalLabel">Mensalistas<small id="editName"></small></h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"
                                aria-label="Fechar"></button>
                        </div>
                        <div class="modal-body" id="printThis">
                            <form action="" id="editData">
                                <fieldset class="scheduler-border">
                                    <legend class="scheduler-border">Novo pacote de jogos </legend>
                                    <div class="row row-cols-1">
                                        <div class="mt-3">
                                            <label for="nomeResponsavel" class="form-label">Nome do responsável</label>
                                            <input type="text" id="nomeResponsavel" class="form-control"
                                                aria-labelledby="help">
                                        </div>

                                        <div class="form-group mt-3 animate__animated animate__fadeIn" id="div2">
                                            <label for="time" class="form-label">Qual horário?</label>
                                            <select id="time" class="form-select" required>
                                                <option value="" selected disabled>Selecione...</option>
                                                <option value="08:00">08:00</option>
                                                <option value="09:00">09:00</option>
                                                <option value="10:00">10:00</option>
                                                <option value="11:00">11:00</option>
                                                <option value="12:00">12:00</option>
                                                <option value="13:00">13:00</option>
                                                <option value="14:00">14:00</option>
                                                <option value="15:00">15:00</option>
                                                <option value="16:00">16:00</option>
                                                <option value="17:00">17:00</option>
                                                <option value="18:00">18:00</option>
                                                <option value="19:00">19:00</option>
                                                <option value="20:00">20:00</option>
                                                <option value="21:00">21:00</option>
                                                <option value="22:00">22:00</option>
                                            </select>
                                        </div>
                                        <div class="form-group mt-3 animate__animated animate__fadeIn" id="div4">
                                            <label for="duration" class="form-label">Duração de cada jogo</label>
                                            <select id="duration" class="form-select" required>
                                                <option value="" selected disabled>Selecione...</option>
                                                <option value="1">1 hora</option>
                                                <option value="2">2 horas</option>
                                                <option value="3">3 horas</option>
                                            </select>
                                        </div>

                                        <div class="form-group mt-3 animate__animated animate__fadeIn" id="div4">
                                            <label for="duration" class="form-label">Quantos jogos no pacote (dias)?</label>
                                            <select id="days" class="form-select" required>
                                                <option value="" selected disabled>Selecione...</option>
                                                <option value="1">1 dia</option>
                                                <option value="2">2 dias</option>
                                                <option value="3">3 dias</option>
                                                <option value="5">4 dias</option>
                                            </select>
                                        </div>
                                        <div class="mt-3">
                                            <label for="valorCobrado" class="form-label">Valor total do pacote</label>
                                            <input type="text" id="valorCobrado" class="form-control"
                                                aria-labelledby="help">
                                        </div>
                                    </div>
                                </fieldset>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                            <button type="button" id="btnUpdate" class="btn btn-success"><i class="fas fa-check"></i>
                                Salvar no banco</button>
                        </div>
                        <div class="modal-footer">
                            <div class="alert alert-danger" role="alert" style="font-size:9pt">
                                <strong>Atenção:</strong> O lançamento da receita é manual e terá impacto no cálculo
                                final dos lucros. O recebimento de valores será diretamente na sede do clube!
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
    `
    const modal = new bootstrap.Modal(document.getElementById('newBundleModal'));
    modal.show();

}

const individualPlay = () => {

    let individualPlay = document.getElementById('individualPlayModal')
    individualPlay.innerHTML =
        `
     <div class="modal fade" data-bs-backdrop="static" data-bs-keyboard="false" id="newIndividualPlayModal" tabindex="-1"
                aria-labelledby="individualPlayModal" aria-hidden="true">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="individualPlayModal">Jogo único<small id="editName"></small></h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"
                                aria-label="Fechar"></button>
                        </div>
                        <div class="modal-body" id="printThis">
                            <form action="" id="create-reservation">
                                <fieldset class="scheduler-border">
                                    <legend class="scheduler-border">Marcar um jogo único sem custo (SÓCIO)</legend>
                                    <div class="row row-cols-1">
                                        <div class="mt-3">
                                            <label for="nomeResponsavel" class="form-label">Nome do responsável</label>
                                            <input type="text" id="nomeResponsavel" class="form-control"
                                                aria-labelledby="help">
                                        </div>

                                        <div class="form-group mt-3">
                                            <label for="datepicker" class="form-label">Selecione uma data:</label>
                                            <input type="text" id="datepicker" class="form-control" required>
                                        </div>

                                        <div class="hide form-group mt-3 animate__animated animate__fadeIn" id="div2">
                                            <label for="time" class="form-label">Qual horário?</label>
                                            <select id="time" class="form-select" required>
                                                <option value="" selected disabled>Selecione...</option>
                                                <option value="08:00">08:00</option>
                                                <option value="09:00">09:00</option>
                                                <option value="10:00">10:00</option>
                                                <option value="11:00">11:00</option>
                                                <option value="12:00">12:00</option>
                                                <option value="13:00">13:00</option>
                                                <option value="14:00">14:00</option>
                                                <option value="15:00">15:00</option>
                                                <option value="16:00">16:00</option>
                                                <option value="17:00">17:00</option>
                                                <option value="18:00">18:00</option>
                                                <option value="19:00">19:00</option>
                                                <option value="20:00">20:00</option>
                                                <option value="21:00">21:00</option>
                                                <option value="22:00">22:00</option>
                                            </select>
                                        </div>
                                        <div class="hide form-group mt-3 animate__animated animate__fadeIn" id="div4">
                                            <label for="duration" class="form-label">Duração do jogo</label>
                                            <select id="duration" class="form-select" required>
                                                <option value="" selected disabled>Selecione...</option>
                                                <option value="1">1 hora</option>
                                                <option value="2">2 horas</option>
                                                <option value="3">3 horas</option>
                                            </select>
                                        </div>
                                    </div>
                                </fieldset>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                                    <button type="submit" id="" class="btn btn-success"  data-bs-dismiss="modal"><i class="fas fa-check"></i>
                                        Salvar no banco</button>
                                 </div>
                            </form>
                        </div>
                       
                        <div class="modal-footer">
                            <div class="alert alert-danger" role="alert" style="font-size:9pt">
                                <strong>Atenção:</strong> Este lançamento <b> NÃO GERA RECEITA  para o Clube e fecha um horário disponível! Além de não gerar ticket de controle.</b> Porém é possivel excluir manualmente na planilha caso não seja utilizado. 
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
    `
    const modal = new bootstrap.Modal(document.getElementById('newIndividualPlayModal'));
    modal.show();
    const createReservation = document.getElementById('create-reservation');
    const timeSelected = document.getElementById('time');


    $(document).ready(function () {

        $('#datepicker').datepicker({
            language: 'pt-BR',
            daysOfWeekDisabled: [],
            todayHighlight: true,
            toggleActive: false,
            title: 'Dias disponíveis',
            startDate: new Date(),
            disableTouchKeyboard: true
        }).on('changeDate', function (e) {
            $(this).datepicker('hide');

            const selectedDateFormatted = e.date.toISOString().split('T')[0];
            checkAvaibleTimeService(selectedDateFormatted);
        });

    });

    createReservation.addEventListener('submit',(e) => {
        e.preventDefault();
    
        const convertDateFormat = (inputDate) => {
            const dateParts = inputDate.split('/');
    
            if (dateParts.length === 3) {
                const day = dateParts[0];
                const month = dateParts[1];
                const year = dateParts[2];
    
                const outputDate = `${year}-${month}-${day}`;
    
                return outputDate;
            } else {
    
                console.error('Formato de data inválido. Use DD/MM/YYYY.');
                return null;
            }
        };
        const convertDateFormatMoreOneDay = (inputDate) => {
            const dateParts = inputDate.split('/');
    
            if (dateParts.length === 3) {
                const day = dateParts[0];
                const month = dateParts[1];
                const year = dateParts[2];
    
                const moreOneDay = parseInt(day) + 1;
                const outputDate = `${year}-${month}-${moreOneDay}`;
    
                return outputDate;
            } else {
                console.error('Formato de data inválido. Use DD/MM/YYYY.');
                return null;
            }
        };
    
        let name = document.getElementById('nomeResponsavel').value;
        let time = `${convertDateFormat(document.getElementById('datepicker').value)}T${document.getElementById('time').value}:00-04:00`;
        //let local = document.getElementById('local').value;
    
        let selectedDuration = parseInt(document.getElementById('duration').value);
        let endTime = new Date(time);
    
        endTime.setHours(endTime.getHours() + selectedDuration);
    
    
        let formattedHours = ('0' + endTime.getHours()).slice(-2);
        let formattedMinutes = ('0' + endTime.getMinutes()).slice(-2);
        let formattedEndTime = `${formattedHours}:${formattedMinutes}`;
    
        if (formattedEndTime == '01:00' || formattedEndTime == '00:00') {
            endTime = `${convertDateFormatMoreOneDay(document.getElementById('datepicker').value)}T${formattedEndTime}:00-04:00`;
        } else {
            endTime = `${convertDateFormat(document.getElementById('datepicker').value)}T${formattedEndTime}:00-04:00`
        }
        const reservationData = {
            name: name,
            time: time,
            timeForDashboard: time,
            endTime: endTime,
            duration: selectedDuration,
            paymentMethod: 'free',
            local: 'Society1'
        };
        console.log(reservationData)
        createNewReservationService(reservationData);
    });

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
}
