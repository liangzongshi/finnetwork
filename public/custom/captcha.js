var handler = function (captchaObj) {
    captchaObj.appendTo('#captcha')
    captchaObj.onReady(function () {
        $("#wait").hide()
    })

    $("body").on('DOMSubtreeModified', ".geetest_result_content", function() {
        var gee_content = $(".geetest_result_content").html()
        const email = $("input[name='login_email']").val()
        const password = $("input[name='login_password']").val()
        if (gee_content !== 'Position the piece in its slot.' && gee_content !== '' && email !== '' && password !== '' && $('#check_login').html() == ''){
            $('#login').prop("disabled", false)
        }
    })

    $('#login').click(function () {
        var result = captchaObj.getValidate()
        if (!result) {
            $('#login').prop("disabled", true)
            return $.notify('Please verify captcha before logging in')
        }
        $.ajax({
            url: 'gt/validate-slide',
            type: 'POST',
            dataType: 'json',
            data: {
                geetest_challenge: result.geetest_challenge,
                geetest_validate: result.geetest_validate,
                geetest_seccode: result.geetest_seccode
            },
            success: function (data) {
                if (data.status === 'success') {
                    $.notify('Sign In Success', "success")
                } else if (data.status === 'fail') {
                    $.notify('Sign In Failed, please check the captcha', "error")
                    captchaObj.reset()
                }
            }
        })
    })
}

$.ajax({
    url: "gt/register-slide?t=" + (new Date()).getTime(),
    type: "get",
    dataType: "json",
    success: function (data) {
        initGeetest({
            lang: "en",
            gt: data.gt,
            challenge: data.challenge,
            offline: !data.success,
            new_captcha: data.new_captcha,
            lang: "en",
            product: "popup", // float，popup
            width: "100%"
        }, handler)
    }
})