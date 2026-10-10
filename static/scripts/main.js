var imageName;
var newImageName;
var fileExtension;
var currentFile = null;
apiURL = "https://colorizer-backend.milestomorrow.com";
if (window.location.href == 'http://127.0.0.1:8000/' || window.location.href == 'http://localhost:8000/' ) {
    apiURL = "http://127.0.0.1:8001"   // python3 app.py with DEV=1 in image-colorizer-backend
}

// The backend scales to zero and loads a 129 MB model at start; a visitor's first
// Colorize would otherwise pay that cold start. Wake it while they pick a file.
fetch(apiURL + '/', { mode: 'no-cors' }).catch(function () {});

function uploadClick() {
    removeUpload();
    $('.file-upload-input').trigger('click')
}

function readURL(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        var file = input.files[0];
        var fileSize = file.size.toString();
        imageName = file.name.toString();
        fileExtension = imageName.split('.').slice(-1)[0]
        newImageName = imageName.replace('.' + fileExtension, '-colorized.' + fileExtension);
        fileExtension = fileExtension.replace('jpg', 'jpeg').replace('JPG', 'JPEG')
        if (fileSize > 5 * 1024 * 1024) {
            $('.error-message').html('File larger than 5 MB maximum')
            removeUpload();
        } else {
            currentFile = file;
            reader.onload = function(e) {
                $('.error-message').html('');
                $('.upload-image').attr('src', e.target.result);
                $('.colorize').removeAttr("disabled");
                $('.download-link').attr('download', newImageName);
            };
            reader.readAsDataURL(input.files[0]);
        }
    } else {
        invalidImage();
    }
}

function invalidImage() {
    $('.error-message').html('Image upload unsuccesful.')
    removeUpload();
}

function setBusy(busy) {
    var btn = $('.colorize');
    btn.prop('disabled', busy).attr('aria-busy', busy ? 'true' : null).text(busy ? 'Colorizing\u2026' : 'Colorize');
    $('.upload').prop('disabled', busy);
}

function colorizeImage() {
    if (!currentFile || $('.colorize').prop('disabled')) return;
    setBusy(true);
    $('.error-message').html('');
    $('.return-image').css("display", "block");
    var started = Date.now();
    var report = function (status) {
        if (window.gtag) gtag('event', 'colorize', { status: status, duration_ms: Date.now() - started });
    };

    const formData = new FormData()
    formData.append('imageFile', currentFile, 'image.' + fileExtension.toLowerCase())
    fetch(apiURL + '/colorize', { method: 'POST', mode: 'cors', body: formData })
        .then(res => {
            if (res.ok) {
                return res.json().then(data => {
                    $('.return-image').attr('src', data['image'])
                    $('.download-link').attr('href', data['image']);
                    $('.download').css("display", "block");
                    report('ok');
                    setBusy(false);
                });
            }
            return res.text().then(text => {
                $('.error-message').html(res.status + ": " + text);
                $('.return-image').css("display", "none");
                report('http_' + res.status);
                setBusy(false);   // the upload stays; the visitor can retry or pick another file
            });
        })
        .catch(error => {
            console.error(error);
            $('.error-message').html('The colorizer could not be reached. Try again in a moment.')
            $('.return-image').css("display", "none");
            report('network');
            setBusy(false);
        })
}

function removeUpload() {
    $('.file-upload-input').replaceWith($('.file-upload-input').clone());
    $('.return-image').css("display", "none");
    $('.return-image').attr('src', '/static/images/loading.gif');
    $('.upload-image').attr('src', '/static/images/noimage.png');
    $('.download').css("display", "none");
    $('.upload').removeAttr('disabled');
    $('.colorize').attr('disabled', 'disabled');
    imageName = "";
    newImageName = "";
    fileExtension = "";
    currentFile = null;
}

function downloadImage() {
    document.getElementsByClassName('download-link')[0].click();
}

function openPage(pageName, elmnt) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].className = tabcontent[i].className.replace(" current", "");
    }

    tablinks = document.getElementsByClassName("tablink");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" current", "");
    }

    document.getElementById(pageName).className += " current";
    elmnt.className += " current";
}
