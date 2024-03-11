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

const handlerUpdateData = (id) =>{
    let btnUpdate = document.getElementById('btnUpdate');

    btnUpdate.addEventListener("click", (e) => {
        e.preventDefault()
        updateCostumerEventDataService(id)
    })
}
