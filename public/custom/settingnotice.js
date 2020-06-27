$(document).ready(()=>{ 
    const socket = io()
    socket.on('connect', () => {})
    //phone
    $("#phone_notice_setting").change(()=>{  
        if($("#phone_notice_setting").val() == "on"){
            $("#phone_notice_setting").prop("checked", true)
        }else{
            $("#phone_notice_setting").prop("checked", false)
        }
        $("#phone_notice_setting_md").modal("show")
    })
    $("#btn_phone_notice_setting_md").click(()=>{
        if($("#phone_notice_setting").val() == "on"){
            $("#phone_notice_setting").val("off")
        }else{
            $("#phone_notice_setting").val("on")
        }
        socket.emit("change_phone_notice_setting", $("#phone_notice_setting").val())
        $("#phone_notice_setting_md").modal("hide")
    })
    socket.on("change_phone_notice_setting_success", (data)=>{
        if(data == false){
            $("#phone_notice_setting").prop("checked", false)
            $("#status_phone_notice_setting").html("Disabled").removeClass("text-green").addClass("text-danger")
        }else{
            $("#phone_notice_setting").prop("checked", true)
            $("#status_phone_notice_setting").html("Enabled").removeClass("text-danger").addClass("text-green")
        }
    })
    //messenger
    $("#messenger_notice_setting").change(()=>{  
        if($("#messenger_notice_setting").val() == "on"){
            $("#messenger_notice_setting").prop("checked", true)
        }else{
            $("#messenger_notice_setting").prop("checked", false)
        }
        $("#messenger_notice_setting_md").modal("show")
    })
    $("#btn_messenger_notice_setting_md").click(()=>{
        if($("#messenger_notice_setting").val() == "on"){
            $("#messenger_notice_setting").val("off")
        }else{
            $("#messenger_notice_setting").val("on")
        }
        socket.emit("change_messenger_notice_setting", $("#messenger_notice_setting").val())
        $("#messenger_notice_setting_md").modal("hide")
    })
    socket.on("change_messenger_notice_setting_success", (data)=>{
        if(data == false){
            $("#messenger_notice_setting").prop("checked", false)
            $("#status_messenger_notice_setting").html("Disabled").removeClass("text-green").addClass("text-danger")
        }else{
            $("#messenger_notice_setting").prop("checked", true)
            $("#status_messenger_notice_setting").html("Enabled").removeClass("text-danger").addClass("text-green")
        }
    })
    //telegram
    $("#telegram_notice_setting").change(()=>{  
        if($("#telegram_notice_setting").val() == "on"){
            $("#telegram_notice_setting").prop("checked", true)
        }else{
            $("#telegram_notice_setting").prop("checked", false)
        }
        $("#telegram_notice_setting_md").modal("show")
    })
    $("#btn_telegram_notice_setting_md").click(()=>{
        if($("#telegram_notice_setting").val() == "on"){
            $("#telegram_notice_setting").val("off")
        }else{
            $("#telegram_notice_setting").val("on")
        }
        socket.emit("change_telegram_notice_setting", $("#telegram_notice_setting").val())
        $("#telegram_notice_setting_md").modal("hide")
    })
    socket.on("change_telegram_notice_setting_success", (data)=>{
        if(data == false){
            $("#telegram_notice_setting").prop("checked", false)
            $("#status_telegram_notice_setting").html("Disabled").removeClass("text-green").addClass("text-danger")
        }else{
            $("#telegram_notice_setting").prop("checked", true)
            $("#status_telegram_notice_setting").html("Enabled").removeClass("text-danger").addClass("text-green")
        }
    })
    //website
    $("#website_notice_setting").change(()=>{  
        if($("#website_notice_setting").val() == "on"){
            $("#website_notice_setting").prop("checked", true)
        }else{
            $("#website_notice_setting").prop("checked", false)
        }
        $("#website_notice_setting_md").modal("show")
    })
    $("#btn_website_notice_setting_md").click(()=>{
        if($("#website_notice_setting").val() == "on"){
            $("#website_notice_setting").val("off")
        }else{
            $("#website_notice_setting").val("on")
        }
        socket.emit("change_website_notice_setting", $("#website_notice_setting").val())
        $("#website_notice_setting_md").modal("hide")
    })
    socket.on("change_website_notice_setting_success", (data)=>{
        if(data == false){
            $("#website_notice_setting").prop("checked", false)
            $("#status_website_notice_setting").html("Disabled").removeClass("text-green").addClass("text-danger")
        }else{
            $("#website_notice_setting").prop("checked", true)
            $("#status_website_notice_setting").html("Enabled").removeClass("text-danger").addClass("text-green")
        }
    })
    //login 2fa
    $("#status_login_2fa_setting").change(()=>{  
        if($("#status_login_2fa_setting").val() == "on"){
            $("#status_login_2fa_setting").prop("checked", true)
        }else{
            $("#status_login_2fa_setting").prop("checked", false)
        }
        $("#login_2fa_setting_md").modal("show")
    })
    $("#btn_login_2fa_setting_md").click((e)=>{
        e.preventDefault()
        const passLogin = $("#pass_submit_login_2fa").val()
        const hashLogin = CryptoJS.MD5(passLogin)
        $("#cef_login_2fa").val(hashLogin)
        socket.emit("login_2fa_setting_event", {value:$("#status_login_2fa_setting").val(), pass_login: $("#cef_login_2fa").val()})
    })
    socket.on("pass_login_2fa_false", (data)=>{
        $.notify(data, "error")
        $("#pass_submit_login_2fa").val("")
    })
    socket.on("login_2fa_setting_event_success", (data)=>{
        if(data == false){
            $("#status_login_2fa_setting").prop("checked", false)
            $("#status_login_2fa_setting").val("off")
            $("#setting_login_2fa").html("Disabled").removeClass("text-green").addClass("text-danger")
        }else{
            $("#status_login_2fa_setting").prop("checked", true)
            $("#status_login_2fa_setting").val("on")
            $("#setting_login_2fa").html("Enabled").removeClass("text-danger").addClass("text-green")
        }
        $("#login_2fa_setting_md").modal("hide")
    })
    //withdraw 2fa
    $("#status_withdraw_2fa_setting").change(()=>{  
        if($("#status_withdraw_2fa_setting").val() == "on"){
            $("#status_withdraw_2fa_setting").prop("checked", true)
        }else{
            $("#status_withdraw_2fa_setting").prop("checked", false)
        }
        $("#withdraw_2fa_setting_md").modal("show")
    })
    $("#btn_withdraw_2fa_setting_md").click((e)=>{
        e.preventDefault()
        const passWithdraw = $("#pass_submit_withdraw_2fa").val()
        const hashWithdraw = CryptoJS.MD5(passWithdraw)
        $("#cef_withdraw_2fa").val(hashWithdraw)
        socket.emit("withdraw_2fa_setting_event", {value:$("#status_withdraw_2fa_setting").val(), pass_withdraw: $("#cef_withdraw_2fa").val()})
        
    })
    socket.on("pass_withdraw_2fa_false", (data)=>{
        $.notify(data, "error")
        $("#pass_submit_withdraw_2fa").val("")
    })
    socket.on("withdraw_2fa_setting_event_success", (data)=>{
        if(data == false){
            $("#status_withdraw_2fa_setting").prop("checked", false)
            $("#status_withdraw_2fa_setting").val("off")
            $("#setting_withdraw_2fa").html("Disabled").removeClass("text-green").addClass("text-danger")
        }else{
            $("#status_withdraw_2fa_setting").prop("checked", true)
            $("#status_withdraw_2fa_setting").val("on")
            $("#setting_withdraw_2fa").html("Enabled").removeClass("text-danger").addClass("text-green")
        }
        $("#withdraw_2fa_setting_md").modal("hide")
    })

    //2fa
    $("#status_2fa_setting").change(()=>{  
        if($("#status_2fa_setting").val() == "off"){
            $("#form_2fa").removeClass("d-none")
            $("#text_2fa").addClass("d-none")
        }else{
            $("#form_off_2fa").removeClass("d-none")
            $("#text_2fa").addClass("d-none")
        }
    })
    //on
    $(".iputs").keyup(function(){
        if(this.value.length == this.maxLength){
            $(this).next(".iputs").focus()
        }
    })
    
    $("#submit_2fa_setting").click((e)=>{
        e.preventDefault()
        const pass2fa = $("#pass_2fa").val()
        const hash = CryptoJS.MD5(pass2fa)
        $("#elf_2fa").val(hash)
        const code = $("#n_1").val() + $("#n_2").val() + $("#n_3").val() + $("#n_4").val() + $("#n_5").val() + $("#n_6").val()
        socket.emit("setting_2fa_event", { pass: $("#elf_2fa").val(), code: (code)})
    })
    socket.on("pass_2fa_false", data=>{
        $.notify(data, "error")
        $("#pass_2fa").val(null)
        $("#n_1").val(null)
        $("#n_2").val(null)
        $("#n_3").val(null)
        $("#n_4").val(null)
        $("#n_5").val(null)
        $("#n_6").val(null)
    })
    socket.on("setting_2fa_success", data=>{
        $.notify(data, "success")
        $("#form_2fa").addClass("d-none")
        $("#text_2fa").removeClass("d-none")
        $("#status_2fa_setting").prop("checked", true)
        $("#status_2fa_setting").val("on")
        $("#setting_2fa").html("Enabled").removeClass("text-danger").addClass("text-green")
        $("#pass_2fa").val(null)
        $("#n_1").val(null)
        $("#n_2").val(null)
        $("#n_3").val(null)
        $("#n_4").val(null)
        $("#n_5").val(null)
        $("#n_6").val(null)
        $("#text_2fa").append(`
        <div class="col-xl-6 col-lg-6 m-b-5 p-b-1" id="detail_setting_2fa">
            <div class="p-10 bg-black-transparent-5 rounded m-b-5">
                <div class="media media-xs overflow-visible align-items-center">
                    <a class="media-left" href="javascript:;">
                        <i class="fa fa-tools"></i>
                    </a>
                    <div class="media-body valign-middle">
                        <b class="text-white">Google Authencator For Login</b>
                    </div>
                    <div class="media-body valign-middle text-right overflow-visible">
                        <div class="row m-t-10">
                            <div id="setting_2fa" class="col-6 control-label  f-w-600 text-danger">Disabled</div>
                            <div class="col-6 d-flex">
                                <div class="custom-control custom-switch ml-auto">
                                    <input type="checkbox" class="custom-control-input" name="header-fixed" id="status_2fa_setting" value="off">
                                    <label class="custom-control-label" for="status_2fa_setting">&nbsp;</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <p class="p-20 bg-amber-transparent-3">Enabled Or Disabled Google Authenticator For Login</p>
                </div>
            </div>
            <div class="p-10 bg-black-transparent-5 rounded">
                <div class="media media-xs overflow-visible align-items-center">
                    <a class="media-left" href="javascript:;">
                        <i class="fa fa-tools"></i>
                    </a>
                    <div class="media-body valign-middle">
                        <b class="text-white">Google Authencator For Withdraw</b>
                    </div>
                    <div class="media-body valign-middle text-right overflow-visible">
                        <div class="row m-t-10">
                            <div id="setting_2fa" class="col-6 control-label  f-w-600 text-danger">Disabled</div>
                            <div class="col-6 d-flex">
                                <div class="custom-control custom-switch ml-auto">
                                    <input type="checkbox" class="custom-control-input" name="header-fixed" id="status_2fa_setting" value="off">
                                    <label class="custom-control-label" for="status_2fa_setting">&nbsp;</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <p class="p-20 bg-amber-transparent-3">Enabled Or Disabled Google Authenticator For Withdraw</p>
                </div>
            </div>
            
        </div>
        `)
    })
    socket.on("setting_2fa_faile", data=>{
        $.notify(data, "error")
        $("#n_1").val(null)
        $("#n_2").val(null)
        $("#n_3").val(null)
        $("#n_4").val(null)
        $("#n_5").val(null)
        $("#n_6").val(null)
    })
    //off
    $(".ioputs").keyup(function(){
        if(this.value.length == this.maxLength){
            $(this).next(".ioputs").focus()
        }
    })
    $("#submit_off_2fa_setting").click((e)=>{
        e.preventDefault()
        const passo2fa = $("#pass_off_2fa").val()
        const hasho = CryptoJS.MD5(passo2fa)
        $("#elf_off_2fa").val(hasho)
        const codeOff = $("#no_1").val() + $("#no_2").val() + $("#no_3").val() + $("#no_4").val() + $("#no_5").val() + $("#no_6").val()
        socket.emit("setting_off_2fa_event", { pass_off: $("#elf_off_2fa").val(), code_off: (codeOff)})
    })
    socket.on("pass_off_2fa_false", data=>{
        $.notify(data, "error")
        $("#pass_off_2fa").val(null)
        $("#no_1").val(null)
        $("#no_2").val(null)
        $("#no_3").val(null)
        $("#no_4").val(null)
        $("#no_5").val(null)
        $("#no_6").val(null)
    })
    socket.on("setting_off_2fa_success", data=>{
        $.notify(data, "success")
        $("#form_off_2fa").addClass("d-none")
        $("#text_2fa").removeClass("d-none")
        $("#status_2fa_setting").prop("checked", false)
        $("#status_2fa_setting").val("off")
        $("#setting_2fa").html("Disabled").removeClass("text-green").addClass("text-danger")
        $("#pass_off_2fa").val(null)
        $("#no_1").val(null)
        $("#no_2").val(null)
        $("#no_3").val(null)
        $("#no_4").val(null)
        $("#no_5").val(null)
        $("#no_6").val(null)
        $("#detail_setting_2fa").remove()
    })
    socket.on("setting_off_2fa_faile", data=>{
        $.notify(data, "error")
        $("#no_1").val(null)
        $("#no_2").val(null)
        $("#no_3").val(null)
        $("#no_4").val(null)
        $("#no_5").val(null)
        $("#no_6").val(null)
    })
    $("#secret_code_2fa_1").click(()=>{
        var copyText = document.getElementById("secret_code_2fa_1")
        copyText.select()
        copyText.setSelectionRange(0, 99999)
        document.execCommand("copy")
    })
    $("#secret_code_2fa_2").click(()=>{
        var copyText = document.getElementById("secret_code_2fa_2")
        copyText.select()
        copyText.setSelectionRange(0, 99999)
        document.execCommand("copy")
    })
   
});