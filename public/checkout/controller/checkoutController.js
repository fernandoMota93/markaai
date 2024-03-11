const payBtn = document.getElementById('payBtn');

payBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const storedReservation = sessionStorage.getItem('newReservation');
    
    let storedReservationParsed = JSON.parse(storedReservation);
  
    createCobrancaService(storedReservationParsed.id)
});