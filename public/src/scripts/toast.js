const toastShow = (title, msg, type) => {
    let toastDiv = document.getElementById('toast')

    if (type == 'danger') {
        toastDiv.innerHTML =
            `
        <div class="toast-container position-fixed bottom-0 end-0 p-3">
          <div id="liveToast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header text-bg-danger">
              <i class="fas fa-info"></i>
              <strong class="me-auto" id="toastMsg">
                &nbsp;${title}
              </strong>
              <small>Marka Aí</small>
              <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body" id="toastMsg">
              ${msg}
              <br> <small id='count'></small>
            </div>
          </div>
        </div>
        `
    } else {
        toastDiv.innerHTML =
            `
                <div class="toast-container position-fixed bottom-0 end-0 p-3">
                <div id="liveToast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="toast-header text-bg-success">
                        <i class="fas fa-info"></i>
                        <strong class="me-auto" id="toastMsg">
                            &nbsp;${title}
                        </strong>
                        <small>Marka Aí</small>
                        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                    </div>
                    <div class="toast-body" id="toastMsg">
                    ${msg}

                    <br> <small id='count'></small>
                    </div>
                </div>
            </div>
            `
    }


    const liveToast = document.getElementById('liveToast')
    const toast = new bootstrap.Toast(liveToast)
    toast.show()

    setTimeout(() => {
        toast.hide()
    }, 4000);


}