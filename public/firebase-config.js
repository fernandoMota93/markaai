const firebaseApp = firebase.initializeApp({
  apiKey: "AIzaSyAcGAmosw3K5B32paCgr1LJjwier8To1zA",
  authDomain: "markaai.firebaseapp.com",
  projectId: "markaai",
  storageBucket: "markaai.appspot.com",
  messagingSenderId: "1069464960562",
  appId: "1:1069464960562:web:503ebd27f65b5f6e50862b",
  measurementId: "G-054F1JGG52"
})

/*********** firebase instance ***********/
const db = firebaseApp.firestore();
const auth = firebaseApp.auth();
const docRef = db.collection('Society1');
/*********** firebase instance ***********/

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