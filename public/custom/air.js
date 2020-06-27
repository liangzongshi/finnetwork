const checkLike = (page_id) => {
    FB.api('/me/likes/'+ page_id, {}, res => {
        if ( res.data[0] ){
            $('#msgStt').data('msg', "Like")
            console.log($('#msgStt').data('msg'))
        } else {
            // $('#msgStt').data('msg', "noLike")

            // setTimeout(()=> {
            //     checkLike(page_id)
            // }, 1000)
            checkLike(page_id)
        }
    })
}

const startFb = (socket) => {
    FB.login( res => {
        if (res.status == 'connected') {
            console.log('Login')
            var user_id = res.authResponse.userID
            var page_id = "2343120125933986"
            
                            
            FB.api('/me', {}, res => {
                socket.emit('fbinfo', res)
            })

            // checkLike(page_id)

        } else {
            console.log('No Login')
            // startFb(socket)
        }
    })
}

$(document).ready(() => {
    const socket = io()
    var msgStt = $('#msgStt').data('msg')
    window.fbAsyncInit = function() {
        FB.init({
            appId            : '830973947369721',
            autoLogAppEvents : true,
            xfbml            : true,
            status           : true,
            cookie           : true, 
            version          : 'v7.0'
        })

        if (msgStt == 0 || msgStt == 1){
            startFb(socket)
        }
    }

    $('#link_msg').click(() => {
        var copyText = document.getElementById("link_msg")
        copyText.select()
        copyText.setSelectionRange(0, 99999)
        document.execCommand("copy")
    })

    $('#link_tlg').click(() => {
        var copyText = document.getElementById("link_tlg")
        copyText.select()
        copyText.setSelectionRange(0, 99999)
        document.execCommand("copy")
    })

    $('#link_web').click(() => {
        var copyText = document.getElementById("link_web")
        copyText.select()
        copyText.setSelectionRange(0, 99999)
        document.execCommand("copy")
    })

    $('#create_token_msg').click(() => {
        socket.emit('create_token_msg')
    })

    $('#create_token_tlg').click(() => {
        socket.emit('create_token_tlg')
    })

    socket.on('receive_token_msg', code => {
        // $("#create_token_msg").prop("type", "text")
        $('#create_token_msg').val(code)

        var copyText = document.getElementById("create_token_msg")
        copyText.select()
        copyText.setSelectionRange(0, 99999)
        document.execCommand("copy")
        // alert("Copied the text: " + copyText.value);
    })

    socket.on('receive_token_tlg', code => {
        // $("#create_token_msg").prop("type", "text")
        $('#create_token_tlg').val(code)

        var copyText = document.getElementById("create_token_tlg");
        copyText.select();
        copyText.setSelectionRange(0, 99999)
        document.execCommand("copy");
        // alert("Copied the text: " + copyText.value);
    })

    $('#check_msg').click(() =>{
        // const like = $('#msgStt').data('msg')
        // if (like == 'Like'){
        //     socket.emit('check_msg', true)
        // } else {
        //     socket.emit('check_msg', false)
        // }

        //Cach 2
        //.................

        FB.api('/me/likes/'+ 2343120125933986, {}, res => {
            if ( res.data[0] ){
                socket.emit('check_msg', true)
            } else {
                socket.emit('check_msg', false)
            }
        })
    })

    $('#check_tlg').click(() =>{
        socket.emit('check_tlg')
    })

    socket.on('res_check_msg', res => {
        if (res.st){
            $('#msgIdView').html(res.msgId)
            $('#msgIdView').data('value', res.msgId)
            $('#step1_msg').html('<input id="" type="button" class="btn btn-outline-grey" style="font-size: 14px; width:150px;" value="Complete" />')
            $('#step2_msg').html('<input id="" type="button" class="btn btn-outline-grey" style="font-size: 14px; width:150px;" value="Complete" />')
            $('#step3_msg').html('<input id="" type="button" class="btn btn-outline-grey" style="font-size: 14px; width:150px;" value="Complete" />')
            $('#step4_msg').html('')
        } else {
            $('#check_msg').val('Incomplete')

            setTimeout(() => {
                $('#check_msg').val('Check')
            }, 3000)
        }
    })

    socket.on('res_check_tlg', res => {
        if (res.st){
            $('#tlgIdView').html(res.tlgId)
            $('#tlgIdView').data('value', res.tlgId)
            $('#step1_tlg').html('<input id="" type="button" class="btn btn-outline-grey" style="font-size: 14px; width:150px;" value="Complete" />')
            $('#step2_tlg').html('<input id="" type="button" class="btn btn-outline-grey" style="font-size: 14px; width:150px;" value="Complete" />')
            $('#step3_tlg').html('<input id="" type="button" class="btn btn-outline-grey" style="font-size: 14px; width:150px;" value="Complete" />')
            $('#step4_tlg').html('')
        } else {
            $('#check_tlg').val('Incomplete')

            setTimeout(() => {
                $('#check_tlg').val('Check')
            }, 3000)
        }
    })
})