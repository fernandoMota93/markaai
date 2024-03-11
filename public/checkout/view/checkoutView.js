

const dataToViewCheckout = (storedReservation) => {
    let storedReservationParsed = JSON.parse(storedReservation);

    const partes = storedReservationParsed.time.split(/[T-]/);
    const dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]} - ${partes[3]}`;

    let paymentMethod;
    switch (storedReservationParsed.paymentMethod) {
        case '1':
            paymentMethod = 'PIX';
            break;
        case '2':
            paymentMethod = 'Débito';
            break;
        case '3':
            paymentMethod = 'Crédito';
            break;
        default:
            paymentMethod = 'Método de pagamento desconhecido';
    }


    // Selecione o elemento onde o template será renderizado
    const templateDocId = document.getElementById('docId');
    const templateDocFooterId = document.getElementById('footerId');
    const templateName = document.getElementById('name');
    const templateContact = document.getElementById('contact');
    const templateEmail = document.getElementById('email');
    const templateLocal = document.getElementById('local');
    const templateDate = document.getElementById('date');
    const templateDuration = document.getElementById('duration');
    const templatePaymentMethod = document.getElementById('paymentMethod');
    const templateTotalAmount = document.getElementById('totalAmount');

    // Compile os templates usando Handlebars
    const compiledtemplateDocId = Handlebars.compile(templateDocId.innerHTML);
    const compiledtemplateDocFooterId = Handlebars.compile(templateDocFooterId.innerHTML);
    const compiledtemplateName = Handlebars.compile(templateName.innerHTML);
    const compiledtemplateContact = Handlebars.compile(templateContact.innerHTML);
    const compiledtemplateEmail = Handlebars.compile(templateEmail.innerHTML);
    const compiledtemplateLocal = Handlebars.compile(templateLocal.innerHTML);
    const compiledtemplateDate = Handlebars.compile(templateDate.innerHTML);
    const compiledtemplateDuration = Handlebars.compile(templateDuration.innerHTML);
    const compiledtemplatePaymentMethod = Handlebars.compile(templatePaymentMethod.innerHTML);
    const compiledtemplateTotalAmount = Handlebars.compile(templateTotalAmount.innerHTML);

    // Renderize os templates com os dados
    templateDocId.innerHTML = compiledtemplateDocId({ docId: storedReservationParsed.id });
    templateDocFooterId.innerHTML = compiledtemplateDocFooterId({ footerId: storedReservationParsed.id });
    templateName.innerHTML = compiledtemplateName({ name: storedReservationParsed.name });
    templateContact.innerHTML = compiledtemplateContact({ contact: storedReservationParsed.contact });
    templateEmail.innerHTML = compiledtemplateEmail({ email: storedReservationParsed.email });
    templateLocal.innerHTML = compiledtemplateLocal({ local: storedReservationParsed.local });
    templateDate.innerHTML = compiledtemplateDate({ date: dataFormatada });
    templateDuration.innerHTML = compiledtemplateDuration({ duration: `0${storedReservationParsed.duration} Hora(s)` });
    templatePaymentMethod.innerHTML = compiledtemplatePaymentMethod({ paymentMethod: paymentMethod });
    templateTotalAmount.innerHTML = compiledtemplateTotalAmount({ totalAmount: `R$ ${storedReservationParsed.duration  *  storedReservationParsed.initialCost},00` });
}