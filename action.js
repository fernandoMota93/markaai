const dataString = "2024-03-19T16:00:00-04:00";
const data = new Date(dataString);

const dia = data.getDate().toString().padStart(2, '0');
const mes = (data.getMonth() + 1).toString().padStart(2, '0');
const ano = data.getFullYear();
const horas = dataString.slice(11,-9);

const dataFormatada = `${dia}/${mes}/${ano} - ${horas}`;

console.log(dataFormatada);