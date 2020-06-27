
$(document).ready(()=>{ 
    const socket = io()
    socket.on('connect', () => {})
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
});