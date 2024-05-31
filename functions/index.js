const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const express = require('express');
const EFIRequest = require('./apis/efi');
const ejs = require('ejs');
const fs = require('fs');

const TIME_VALUE = 150.00;

//=====INTEGRAÇÃO PIX=====//
admin.initializeApp();

exports.readAllReservationsServiceFunction = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const snapshot = await admin.firestore().collection('Society1').get();
      const reservas = [];
      snapshot.forEach(doc => {
        reservas.push({
          title: `${doc.data().local} ${doc.data().name}`,
          start: doc.data().time,
          end: doc.data().endTime,
          color: doc.data().status,
          creationTimestamp: doc.data().creationTimestamp
        });
      });
      console.log(reservas);
      res.status(200).json({ data: reservas }); // Return JSON with 'data' field
    } catch (error) {
      console.error('Erro ao buscar documentos:', error);
      res.status(500).send('Erro ao buscar documentoss');
    }
  });


});

exports.createNewReservationServiceFunction = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const reservationData = req.body.data;

      if (!reservationData) {
        return res.status(400).json({ error: 'Dados de reserva não fornecidos' });
      }

      const newReservationRef = await admin.firestore().collection('Society1').add({
        ...reservationData,
        initialCost: reservationData.rentBall === '1' ? TIME_VALUE + 10 : TIME_VALUE,
        status: 'orange',
        creationTimestamp: admin.firestore.FieldValue.serverTimestamp() // definindo status como pendente por padrão
      });
      const newReservationId = newReservationRef.id; // Obter o ID do documento recém-criado
      const newReservationDoc = await newReservationRef.get(); // Obter os dados do documento recém-criado

      if (!newReservationDoc.exists) {
        throw new Error('Documento recém-criado não encontrado');
      }

      const newReservationData = newReservationDoc.data();
      newReservationData.id = newReservationId;// Obter os dados do documento
      console.log(newReservationData);
      return res.status(200).json({ success: true, data: newReservationData });
    } catch (error) {
      console.error('Erro ao criar nova reserva:', error);
      return res.status(500).json({ error: 'Erro ao criar nova reserva' });
    }
  });
});

exports.updateExpiredDocuments = functions.pubsub.schedule('every 20 minutes').onRun(async (context) => {
  try {
    const db = admin.firestore();
    const society1Ref = db.collection('Society1');

    const querySnapshot = await society1Ref.where('status', '==', 'orange').get();
    if (querySnapshot.empty) {
      console.log('No matching documents.');
      return null;
    }
    querySnapshot.forEach(async (doc) => {
      await doc.ref.update({
        status: 'expirado',
        observacoes: 'Cancelado pelo batch do sistema',
        time: 'Cancelado por falta de pagamento',
        initialCost: 0,
        endTime: ''
      });
    });

    console.log('Trigger executado com sucesso.');
    return null;
  } catch (error) {
    console.error('Erro ao executar trigger:', error);
    return null;
  }
});
//======INTEGRAÇÃO EFI PIX======//
const app = express();
app.use(cors);
app.use(express.urlencoded({
  extended: true
}));
app.use(express.json());




app.get('/checkpix', async (req, res) => {
  try {
    const docRef = admin.firestore().collection('Society1').doc(req.query.id);
    const doc = await docRef.get();

    if (doc.exists && doc.data().endToEndId) {
      return res.status(200).json({ data: 'End-to-end encontrado. Pagamento processado.', doc: doc.id })
    } else {
      return res.status(500).json({ error: 'Não foi encontrado a chave End to End do pagamento.', doc: doc.id });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao consultar pagamento' });
  }
});


app.get('/pix', async (req, res) => {
  const reqEFIAlready = EFIRequest({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET
  });
  try {
    const docRef = admin.firestore().collection('Society1').doc(req.query.id);
    const doc = await docRef.get();

    let name = '';
    let idt = '';
    let value = 0;

    if (doc.exists) {
      name = doc.data().name;
      idt = doc.data().identification.replace(/[.-]/g, '');
      value = `${doc.data().duration * doc.data().initialCost}.00`;
    } else {
      res.redirect('https://markaai.web.app/404.html');
    };

    //redireciona se o ticket de pagamento ja existe e dentro da validade
    if (doc.data().txid && doc.data().status == 'green') {
      //res.send(304).send('Documento ja existe');
      res.redirect('https://markaai.web.app/index.html');
    };

    //redireciona a forbidden caso o ticket esteja expirado
    if (doc.data().status == 'expirado' || doc.data().status == 'cancelado') {
      res.redirect('https://markaai.web.app/403.html');
    };

    reqEFI = await reqEFIAlready;

    const objCobranca = {
      calendario: {
        expiracao: 3600
      },
      devedor: {
        cpf: idt,
        nome: name
      },
      valor: {
        original: value
      }
    };

    // Adiciona os dados extras ao objeto objCobranca
    objCobranca.chave = process.env.PIX_KEY;
    objCobranca.solicitacaoPagador = "Informe o número ou identificador do pedido.";

    //visualiza o que tem no objeto
    console.log(objCobranca);

    // Função para gerar uma string aleatória de comprimento entre 26 e 35 caracteres
    function generateRandomString() {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      const length = Math.floor(Math.random() * 10) + 26; // Comprimento entre 26 e 35 caracteres
      let result = '';
      for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return result;
    }

    // Criar um txid usando a função geradora
    // o firebase nao retornou o txid automatico
    let txid = generateRandomString();

    //associa a cobranca ao documento
    const cobResponse = await reqEFI.put(`/v2/cob/${txid}`, JSON.stringify(objCobranca));

    const updateData = {
      txid: cobResponse.config.url.slice(8)
    };

    await docRef.set(updateData, { merge: true });

    //renderizar a pagina de checkout
    const qrcodeResponse = await reqEFI.get(`/v2/loc/${cobResponse.data.loc.id}/qrcode`);
    const template = fs.readFileSync('./views/checkout.ejs', 'utf-8');
    const renderedPage = ejs.render(template, {
      qrcodeImage: qrcodeResponse.data.imagemQrcode,
      qrcodeText: qrcodeResponse.data.qrcode,
      qrcodeValor: objCobranca.valor.original,
      qrcodeNome: objCobranca.devedor.nome,
      docDuracao: doc.data().duration,
      docLocal: doc.data().local,
      docData: new Date(doc.data().time).toLocaleDateString('pt-BR')
    });

    res.status(200).send(renderedPage);
  } catch (error) {
    console.error("Erro no processamento:", error);
    res.status(500).send("Erro interno do servidor");
  }
});

exports.pix2 = functions.https.onRequest(app);

exports.webhook = functions.https.onRequest(async (req, res) => {
  // Verifica se a solicitação é do tipo POST
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  console.log('Gerencianet Webhook data:', req.body);
  // Processar a notificação da Gerencianet
  try {
    // Verifica se req.body.pix.txid está definido
    if (req.body.pix[0].txid) {
      const txid = req.body.pix[0].txid;
      const toMail = {
        id: '',
        name: '',
        time: '',
        local: '',
        duration: '',
        value: ''
      }

      const querySnapshot = await admin.firestore().collection('Society1').where('txid', '==', txid).get();
      querySnapshot.forEach(async (doc) => {

        // Atualiza o documento
        await doc.ref.update(
          {
            status: 'green',
            endToEndId: req.body.pix[0].endToEndId
          });

        // Formata a data para o formato DD/MM/AAA HH:MM
        const dataString = doc.data().time;
        const data = new Date(dataString);

        const dia = data.getDate().toString().padStart(2, '0');
        const mes = (data.getMonth() + 1).toString().padStart(2, '0');
        const ano = data.getFullYear();
        const horas = dataString.slice(11, -9);

        const dataFormatada = `${dia}/${mes}/${ano} - ${horas}`;

        console.log(dataFormatada);

        //adicionar os campos para o email
        toMail.id = doc.id;
        toMail.name = doc.data().name;
        toMail.time = dataFormatada;
        toMail.local = doc.data().local;
        toMail.duration = doc.data().duration;
        toMail.value = doc.data().duration * doc.data().initialCost;

        console.log('Documento atualizado com sucesso:', doc.id);
        //template do email para o cliente
        const emailTemplate = `
                <!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml"
                  xmlns:o="urn:schemas-microsoft-com:office:office">
                <head>
                  <!--[if gte mso 9]>
                <xml>
                  <o:OfficeDocumentSettings>
                    <o:AllowPNG/>
                    <o:PixelsPerInch>96</o:PixelsPerInch>
                  </o:OfficeDocumentSettings>
                </xml>
                <![endif]-->
                  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <meta name="x-apple-disable-message-reformatting">
                  <!--[if !mso]><!-->
                  <meta http-equiv="X-UA-Compatible" content="IE=edge"><!--<![endif]-->
                  <title></title>
                
                  <style type="text/css">
                    @media only screen and (min-width: 520px) {
                      .u-row {
                        width: 500px !important;
                      }
                
                      .u-row .u-col {
                        vertical-align: top;
                      }
                
                      .u-row .u-col-25p4 {
                        width: 127px !important;
                      }
                
                      .u-row .u-col-74p6 {
                        width: 373px !important;
                      }
                
                      .u-row .u-col-100 {
                        width: 500px !important;
                      }
                
                    }
                
                    @media (max-width: 520px) {
                      .u-row-container {
                        max-width: 100% !important;
                        padding-left: 0px !important;
                        padding-right: 0px !important;
                      }
                
                      .u-row .u-col {
                        min-width: 320px !important;
                        max-width: 100% !important;
                        display: block !important;
                      }
                
                      .u-row {
                        width: 100% !important;
                      }
                
                      .u-col {
                        width: 100% !important;
                      }
                
                      .u-col>div {
                        margin: 0 auto;
                      }
                    }
                
                    body {
                      margin: 0;
                      padding: 0;
                    }
                
                    table,
                    tr,
                    td {
                      vertical-align: top;
                      border-collapse: collapse;
                    }
                
                    p {
                      margin: 0;
                    }
                
                    .ie-container table,
                    .mso-container table {
                      table-layout: fixed;
                    }
                
                    * {
                      line-height: inherit;
                    }
                
                    a[x-apple-data-detectors='true'] {
                      color: inherit !important;
                      text-decoration: none !important;
                    }
                
                    table,
                    td {
                      color: #000000;
                    }
                
                    #u_body a {
                      color: #0000ee;
                      text-decoration: underline;
                    }
                
                    @media (max-width: 480px) {
                      #u_content_image_1 .v-src-width {
                        width: auto !important;
                      }
                
                      #u_content_image_1 .v-src-max-width {
                        max-width: 19% !important;
                      }
                
                      #u_content_heading_1 .v-text-align {
                        text-align: center !important;
                      }
                
                      #u_content_text_1 .v-text-align {
                        text-align: center !important;
                      }
                    }
                  </style>
                </head>
                
                <body class="clean-body u_body"
                  style="margin: 0;padding: 0;-webkit-text-size-adjust: 100%;background-color: #ffffff;color: #000000">
                  <!--[if IE]><div class="ie-container"><![endif]-->
                  <!--[if mso]><div class="mso-container"><![endif]-->
                  <table id="u_body"
                    style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;min-width: 320px;Margin: 0 auto;background-color: #ffffff;width:100%"
                    cellpadding="0" cellspacing="0">
                    <tbody>
                      <tr style="vertical-align: top">
                        <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                          <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background-color: #ffffff;"><![endif]-->
                          <div class="u-row-container" style="padding: 0px;background-color: #3d5b40">
                            <div class="u-row"
                              style="margin: 0 auto;min-width: 320px;max-width: 500px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
                              <div
                                style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                                <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: #3d5b40;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:500px;"><tr style="background-color: transparent;"><![endif]-->
                
                                <!--[if (mso)|(IE)]><td align="center" width="127" style="background-color: #3d5b40;width: 127px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
                                <div class="u-col u-col-25p4"
                                  style="max-width: 320px;min-width: 127px;display: table-cell;vertical-align: top;">
                                  <div
                                    style="background-color: #3d5b40;height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                                    <!--[if (!mso)&(!IE)]><!-->
                                    <div
                                      style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                                      <!--<![endif]-->
                
                                      <table id="u_content_image_1" style="font-family:arial,helvetica,sans-serif;" role="presentation"
                                        cellpadding="0" cellspacing="0" width="100%" border="0">
                                        <tbody>
                                          <tr>
                                            <td
                                              style="overflow-wrap:break-word;word-break:break-word;padding:19px;font-family:arial,helvetica,sans-serif;"
                                              align="left">
                
                                              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                <tr>
                                                  <td class="v-text-align" style="padding-right: 0px;padding-left: 0px;" align="center">
                                                    <a href="https://gremioantoniojoao.com.br" target="_blank">
                                                      <img align="center" border="0"
                                                        src="https://assets.unlayer.com/projects/0/1710859492519-banner.png" alt=""
                                                        title=""
                                                        style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 100%;max-width: 89px;"
                                                        width="89" class="v-src-width v-src-max-width" />
                                                    </a>
                                                  </td>
                                                </tr>
                                              </table>
                
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                
                                      <!--[if (!mso)&(!IE)]><!-->
                                    </div><!--<![endif]-->
                                  </div>
                                </div>
                                <!--[if (mso)|(IE)]></td><![endif]-->
                                <!--[if (mso)|(IE)]><td align="center" width="373" style="width: 373px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
                                <div class="u-col u-col-74p6"
                                  style="max-width: 320px;min-width: 373px;display: table-cell;vertical-align: top;">
                                  <div
                                    style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                                    <!--[if (!mso)&(!IE)]><!-->
                                    <div
                                      style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                                      <!--<![endif]-->
                
                                      <table id="u_content_heading_1" style="font-family:arial,helvetica,sans-serif;"
                                        role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                        <tbody>
                                          <tr>
                                            <td
                                              style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;"
                                              align="left">
                
                                              <!--[if mso]><table width="100%"><tr><td><![endif]-->
                                              <h4 class="v-text-align"
                                                style="margin: 0px; color: #ffffff; line-height: 140%; text-align: left; word-wrap: break-word; font-family: arial,helvetica,sans-serif; font-size: 16px; font-weight: 700;">
                                                <span><span><span><span><span><span>GRÊMIO BENEFICIENTE ESPORTIVO E RECREATIVO ANTÔNIO
                                                            JOÃO</span></span></span></span></span></span></h4>
                                              <!--[if mso]></td></tr></table><![endif]-->
                
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                      <table id="u_content_text_1" style="font-family:arial,helvetica,sans-serif;" role="presentation"
                                        cellpadding="0" cellspacing="0" width="100%" border="0">
                                        <tbody>
                                          <tr>
                                            <td
                                              style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;"
                                              align="left">
                
                                              <div class="v-text-align"
                                                style="font-size: 14px; color: #ffffff; line-height: 140%; text-align: left; word-wrap: break-word;">
                                                <p style="line-height: 140%;">Marka aí - Reservas</p>
                                              </div>
                
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                
                                      <!--[if (!mso)&(!IE)]><!-->
                                    </div><!--<![endif]-->
                                  </div>
                                </div>
                                <!--[if (mso)|(IE)]></td><![endif]-->
                                <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                              </div>
                            </div>
                          </div>
                          <div class="u-row-container" style="padding: 0px;background-color: transparent">
                            <div class="u-row"
                              style="margin: 0 auto;min-width: 320px;max-width: 500px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
                              <div
                                style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                                <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:500px;"><tr style="background-color: transparent;"><![endif]-->
                
                                <!--[if (mso)|(IE)]><td align="center" width="500" style="width: 500px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
                                <div class="u-col u-col-100"
                                  style="max-width: 320px;min-width: 500px;display: table-cell;vertical-align: top;">
                                  <div
                                    style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                                    <!--[if (!mso)&(!IE)]><!-->
                                    <div
                                      style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                                      <!--<![endif]-->
                
                                      <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0"
                                        cellspacing="0" width="100%" border="0">
                                        <tbody>
                                          <tr>
                                            <td
                                              style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;"
                                              align="left">
                
                                              <div class="v-text-align"
                                                style="font-size: 14px; line-height: 140%; text-align: center; word-wrap: break-word;">
                                                <p style="line-height: 140%;">Dados da Reserva</p>
                                              </div>
                
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                
                                      <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0"
                                        cellspacing="0" width="100%" border="0">
                                        <tbody>
                                          <tr>
                                            <td
                                              style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;"
                                              align="left">
                
                                              <table height="0px" align="center" border="0" cellpadding="0" cellspacing="0" width="100%"
                                                style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;border-top: 1px solid #BBBBBB;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                                                <tbody>
                                                  <tr style="vertical-align: top">
                                                    <td
                                                      style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;font-size: 0px;line-height: 0px;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                                                      <span>&#160;</span>
                                                    </td>
                                                  </tr>
                                                </tbody>
                                              </table>
                
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                
                                      <!--[if (!mso)&(!IE)]><!-->
                                    </div><!--<![endif]-->
                                  </div>
                                </div>
                                <!--[if (mso)|(IE)]></td><![endif]-->
                                <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                              </div>
                            </div>
                          </div>
                          <div class="u-row-container" style="padding: 0px;background-color: transparent">
                            <div class="u-row"
                              style="margin: 0 auto;min-width: 320px;max-width: 500px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
                              <div
                                style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                                <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:500px;"><tr style="background-color: transparent;"><![endif]-->
                
                                <!--[if (mso)|(IE)]><td align="center" width="500" style="width: 500px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
                                <div class="u-col u-col-100"
                                  style="max-width: 320px;min-width: 500px;display: table-cell;vertical-align: top;">
                                  <div
                                    style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                                    <!--[if (!mso)&(!IE)]><!-->
                                    <div
                                      style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                                      <!--<![endif]-->
                
                                      <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0"
                                        cellspacing="0" width="100%" border="0">
                                        <tbody>
                                          <tr>
                                            <td
                                              style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;"
                                              align="left">
                
                                              <div class="v-text-align"
                                                style="font-size: 14px; line-height: 140%; text-align: left; word-wrap: break-word;">
                                                <p style="line-height: 140%;">Id ticket: ${toMail.id}</p>
                                              </div>
                
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                
                                      <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0"
                                        cellspacing="0" width="100%" border="0">
                                        <tbody>
                                          <tr>
                                            <td
                                              style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;"
                                              align="left">
                
                                              <div class="v-text-align"
                                                style="font-size: 14px; line-height: 140%; text-align: left; word-wrap: break-word;">
                                                <p style="line-height: 140%;">Nome do responsável: ${toMail.name}</p>
                                              </div>
                
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                
                                      <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0"
                                        cellspacing="0" width="100%" border="0">
                                        <tbody>
                                          <tr>
                                            <td
                                              style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;"
                                              align="left">
                
                                              <div class="v-text-align"
                                                style="font-size: 14px; line-height: 140%; text-align: left; word-wrap: break-word;">
                                                <p style="line-height: 140%;">Horário: ${toMail.time}</p>
                                              </div>
                
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                
                                      <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0"
                                        cellspacing="0" width="100%" border="0">
                                        <tbody>
                                          <tr>
                                            <td
                                              style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;"
                                              align="left">
                
                                              <div class="v-text-align"
                                                style="font-size: 14px; line-height: 140%; text-align: left; word-wrap: break-word;">
                                                <p style="line-height: 140%;">Local: ${toMail.local}</p>
                                              </div>
                
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                
                                      <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0"
                                        cellspacing="0" width="100%" border="0">
                                        <tbody>
                                          <tr>
                                            <td
                                              style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;"
                                              align="left">
                
                                              <div class="v-text-align"
                                                style="font-size: 14px; line-height: 140%; text-align: left; word-wrap: break-word;">
                                                <p style="line-height: 140%;">Valor da reserva: R$ ${toMail.value}.00</p>
                                              </div>
                
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                
                                      <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0"
                                        cellspacing="0" width="100%" border="0">
                                        <tbody>
                                          <tr>
                                            <td
                                              style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;"
                                              align="left">
                
                                              <div class="v-text-align"
                                                style="font-size: 14px; line-height: 140%; text-align: left; word-wrap: break-word;">
                                                <p style="line-height: 140%;">Tempo de jogo: ${toMail.duration} hora(s)</p>
                                              </div>
                
                                            </td>
                                          </tr>
                
                                          <tr>
                                            <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;"
                                            align="left">
                                            <div class="v-text-align"
                                                style="font-size: 14px; line-height: 140%; text-align: left; word-wrap: break-word;">
                                                <p style="line-height: 140%;">Cancelamento ou dúvidas: mande e-mail para <a href="mailto:clubesargentoscuiaba@gmail.com?subject=Cancelar reserva: ${toMail.id}&body= Gostaria de cancelar a reserva em meu nome: ${toMail.name}, Ticket: ${toMail.id}">clubesargentoscuiaba@gmail.com</a>*</p>
                                                <br>
                                                <small>* O reembolso por cancelamento é de 80% do valor total da reserva com tolerância de até 2 horas antes do início da partida.</small>
                                              </div>
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                
                                      <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0"
                                        cellspacing="0" width="100%" border="0">
                                        <tbody>
                                          <tr>
                                            <td
                                              style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;"
                                              align="left">
                
                                              <table height="0px" align="center" border="0" cellpadding="0" cellspacing="0" width="100%"
                                                style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;border-top: 1px solid #BBBBBB;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                                                <tbody>
                                                  <tr style="vertical-align: top">
                                                    <td
                                                      style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;font-size: 0px;line-height: 0px;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                                                      <span>&#160;</span>
                                                    </td>
                                                  </tr>
                                                </tbody>
                                              </table>
                
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                
                                      <!--[if (!mso)&(!IE)]><!-->
                                    </div><!--<![endif]-->
                                  </div>
                                </div>
                                <!--[if (mso)|(IE)]></td><![endif]-->
                                <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                              </div>
                            </div>
                          </div>
                          <div class="u-row-container" style="padding: 0px;background-color: #3d5b40">
                            <div class="u-row"
                              style="margin: 0 auto;min-width: 320px;max-width: 500px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
                              <div
                                style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                                <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: #3d5b40;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:500px;"><tr style="background-color: transparent;"><![endif]-->
                
                                <!--[if (mso)|(IE)]><td align="center" width="500" style="background-color: #3d5b40;width: 500px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
                                <div class="u-col u-col-100"
                                  style="max-width: 320px;min-width: 500px;display: table-cell;vertical-align: top;">
                                  <div
                                    style="background-color: #3d5b40;height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                                    <!--[if (!mso)&(!IE)]><!-->
                                    <div
                                      style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                                      <!--<![endif]-->
                
                                      <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0"
                                        cellspacing="0" width="100%" border="0">
                                        <tbody>
                                          <tr>
                                            <td
                                              style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;"
                                              align="left">
                
                                              <div class="v-text-align"
                                                style="font-size: 10px; color: #ffffff; line-height: 140%; text-align: left; word-wrap: break-word;">
                                                <p style="line-height: 140%;">Avenida Miguel Sutil, 941 - Barra do Pari (Vila Militar), 
                                                  Cuiabá-MT - CEP: 78040-900<br />CNPJ: 03.208.733/0001-04</p>
                                                <p style="line-height: 140%;">(65) 99304-7007</p>
                                              </div>
                
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                
                                      <!--[if (!mso)&(!IE)]><!-->
                                    </div><!--<![endif]-->
                                  </div>
                                </div>
                                <!--[if (mso)|(IE)]></td><![endif]-->
                                <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                              </div>
                            </div>
                          </div>
                          <!--[if (mso)|(IE)]></td></tr></table><![endif]-->
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <!--[if mso]></div><![endif]-->
                  <!--[if IE]></div><![endif]-->
                </body>
                </html>
                                        
                                  `
        //disparar email para o cliente
        const mailDeliver = await admin.firestore().collection('mail').add(
          {
            to: "mottta.h@gmail.com",
            message: {
              subject: "Marka Aí - Reserva",
              text: "This is the plaintext section of the email body.",
              html: `<code> ${emailTemplate} </code>`,
            },
          }
        );
      });
    }
  } catch (error) {
    console.error('Erro no firebase: ', error);
  }
  // Responda com um status 200 para confirmar o recebimento da solicitação
  res.status(200).send('OK');
});
