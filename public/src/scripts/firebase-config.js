//API CONFIG FIREBASE
const firebaseApp = firebase.initializeApp({
  apiKey: "AIzaSyCBkZ4yZxvA4NVG_NigUzCCbE0tOtqanAs",
  authDomain: "clubesgt-7414c.firebaseapp.com",
  projectId: "clubesgt-7414c",
  storageBucket: "clubesgt-7414c.appspot.com",
  messagingSenderId: "748645048839",
  appId: "1:748645048839:web:7e3de71cecb181dc99c0a2"
});

/*********** firebase instance ***********/
const db = firebaseApp.firestore()
const auth = firebaseApp.auth()

const docRef = db.collection('members')

/*********** config data ***********/
const timestamp = Date.now();
const data = new Date(timestamp);

const dia = String(data.getDate()).padStart(2, '0');
const mes = String(data.getMonth() + 1).padStart(2, '0'); // Os meses são indexados de 0 a 11, por isso é necessário adicionar 1
const ano = data.getFullYear();
const hora = String(data.getHours()).padStart(2, '0');
const minuto = String(data.getMinutes()).padStart(2, '0');
const segundo = String(data.getSeconds()).padStart(2, '0');

const dataFormatada = `${dia}/${mes}/${ano} ${hora}:${minuto}:${segundo}`;
/*********** config data ***********/