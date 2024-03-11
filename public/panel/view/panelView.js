const PIX_TAX = 0.0119;
const CREDIT_TAX = 0.399;
const DEBIT_TAX = 0.239;
const PROGRAMMER_TIP = 0.015;

const dataToViewDashBoard = (dataGathered) => {
    //******************DASHBOARD******************//
    //taxas de transação
    const pix = 1 - PIX_TAX;
    const credit = 1 - CREDIT_TAX;
    const debit = 1 - DEBIT_TAX;

    // Acessando os valores dos pagamentos
    const payment1 = dataGathered.durationsByPaymentMethodWithPrice[1] || 0;
    const payment2 = dataGathered.durationsByPaymentMethodWithPrice[2] || 0;
    const payment3 = dataGathered.durationsByPaymentMethodWithPrice[3] || 0;

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

    // Compile os templates usando Handlebars
    const compiledTemplateReservation = Handlebars.compile(templateReservation.innerHTML);
    const compiledTemplateBrute = Handlebars.compile(templateBrute.innerHTML);
    const compiledTemplateLiquid = Handlebars.compile(templateLiquid.innerHTML);
    const compiledProgrammerTip = Handlebars.compile(templateProgrammerTip.innerHTML);

    // Renderize os templates com os dados
    templateReservation.innerHTML = compiledTemplateReservation({ totalDocuments: dataGathered.documents });
    templateBrute.innerHTML = compiledTemplateBrute({ bruteValue: `R$ ${bruteValueWithCents}` });
    templateLiquid.innerHTML = compiledTemplateLiquid({ liquidValue: `R$ ${liquidValueWithCents}` });
    templateProgrammerTip.innerHTML = compiledProgrammerTip({ programmerTip: `R$ ${programmerTipWithCents}` });
    //******************DASHBOARD******************//

}

const formatDataForDataTable = (documents) => {
    return documents.map(document => [
        document.name,
        document.identification,
        document.contact,
        typeof document.time != String ? `${document.time} - ${document.endTime}` :'dsadas',
        document.local,
        document.status === 'green' ? 'Pago' :
            document.status === 'expirado' ? 'Ticket Expirado' :
                document.status === 'orange' ? 'Ag. Pagamento' : 'Cancelado',
        document.paymentMethod === '1' ? 'PIX' :
            document.paymentMethod === '2' ? 'Crédito' :
                document.paymentMethod === '3' ? 'Débito' : 'Outro',
        `<button class="btn btn-success p-1" onclick="checkPix('${document.id}')"><i class="bi bi-check-square"></i></button>&nbsp` + // Autorizar
        `<button class="btn btn-warning p-1"onclick="renderEditModal('${document.id}')"><i class="bi bi-pencil-square"></i></button>&nbsp` + // Editar
        `<button class="btn btn-danger p-1"><i class="bi bi-trash"></i></button>&nbsp` +
        `<button class="btn btn-info p-1"><i class="bi bi-cash"></i></button>`
    ]);

}

const datatoViewTable = (documents) => {
    console.log( typeof documents[0][3])
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
