var handleDataTableDefault = function() {
	"use strict";
    
	if ($('#new_group_tb').length !== 0) {
		$('#new_group_tb').DataTable({
			responsive: true
		});
	}
	if ($('#member_group_tb').length !== 0) {
		$('#member_group_tb').DataTable({
			responsive: true
		});
	}
};

var TableManageDefault = function () {
	"use strict";
	return {
		//main function
		init: function () {
			handleDataTableDefault();
		}
	};
}();

$(document).ready(function() {
	const socket = io()
	TableManageDefault.init();
	//edit group
	$("#edit_group").click(()=>{
		$("#edit_group").addClass("d-none")
		$("#cancel_edit_group").removeClass("d-none")
		$("#edit_name_group").removeClass("d-none")
		$("#edit_location_group").removeClass("d-none")
		$("#edit_time_group").removeClass("d-none")
	})
	$("#cancel_edit_group").click(()=>{
		$("#edit_group").removeClass("d-none")
		$("#cancel_edit_group").addClass("d-none")
		$("#edit_name_group").addClass("d-none")
		$("#edit_location_group").addClass("d-none")
		$("#edit_time_group").addClass("d-none")
	})
	$("#btn_submit_name_group").click(()=>{
		socket.emit("change_group_name_event", {name:$("#update_name_group_val").val(), groupId : $("#mem_list").data("gid")})
	})
	socket.on("change_group_name_event_success", data=>{
		$.notify(data.note, "success")
		$("#update_name_group_val").val(null)
		$("#edit_name_group_md").modal("hide")
		$("#name_group_pick").html(data.newName)
	})
	$("#btn_submit_location_group").click(()=>{
		socket.emit("change_group_location_event", {location:$("#update_location_group_val").val(), groupId : $("#mem_list").data("gid")})
	})
	socket.on("change_group_location_event_success", data=>{
		$.notify(data.note, "success")
		$("#update_location_group_val").val(null)
		$("#edit_location_group_md").modal("hide")
		$("#location_group_pick").html(data.newLocation)

	})
	$("#btn_submit_time_group").click(()=>{
		socket.emit("change_group_time_event", {time:$("#update_time_group_val").val(), groupId : $("#mem_list").data("gid")})
	})
	socket.on("change_group_time_event_success", data=>{
		$.notify(data.note, "success")
		$("#update_time_group_val").val(null)
		$("#edit_time_group_md").modal("hide")
		$("#time_group_pick").html(data.newTime)

	})
	//join group
	$(".btn_join_group").click((e)=>{
		const groupId = $(e.target).data("group")
		socket.emit("join_group", groupId)
	})
	socket.on("join_group_error", data=>{
		$.notify(data, "error")
	})
	socket.on("join_group_success", data=>{
		$.notify(data.note, "success")
		$("#join_group").remove()
		var htmlContent = ''
		data.listMem.mem.forEach(function(item){

			htmlContent += `<tr class="odd gradeX" id="tr-currency.symbol">
				<td width="1%" class="f-s-600 text-inverse">1</td>
				<td>${item.id}</td>
				<td>${item.info.first_name} ${item.info.last_name}</td>
				<td>${item.info.email}</td>
				<td>${item.info.phone}</td>
				<td>${item.info.job}</td>
				<td>${item.sales}</td>
				<!-- if(role == "leader"){ -->
				<td><input type="button" class="btn_remove_mem btn btn-danger" value="Delete" data-id="${item.id}"></td><!-- add id member here-->
				<!-- } -->
			</tr>`
		})
		$("#all_group").html(`
		<div class="row" id="info_group">
			<div class="col-xl-9 col-lg-9">
				<div class="card border-0 mb-3 overflow-hidden " style="min-height: 150px;">
					<div class="card-body">
						<div class="mb-3 text-greyn text-center">
							<b>GROUP INFORMATION</b>
						</div>
						<div class="row">
							<div class="col-xl-4 col-lg-4">
								<div class="d-flex">
									<h5 class="f-s-14 text-gray">Group Id: &nbsp;&nbsp;&nbsp;<span class="text-grey">${data.listMem.team.code}</span></h5>
								</div>
								<div class="d-flex">
									<h5 class="f-s-14 text-gray">Name: &nbsp;&nbsp;&nbsp;<span class="text-grey">${data.listMem.team.name}</span> &nbsp;&nbsp;&nbsp;<input id="edit_name_group" type="button" class="btn btn-xs btn-outline-grey d-none"value="Edit Name" data-toggle="modal" data-target="#edit_name_group_md"></h5>
								</div>
								<div class="d-flex">
									<h5 class="f-s-14 text-gray">Members: &nbsp;&nbsp;&nbsp;<span class="text-grey">${data.listMem.mem.length}</span></h5>
								</div>
							</div>
							<div class="col-xl-4 col-lg-4">
								<div class="d-flex">
									<h5 class="f-s-14 text-gray">Group Link: &nbsp;&nbsp;&nbsp;<span class="text-grey">${data.listMem.team.chat}</span></h5>
								</div>
								<div class="d-flex">
									<h5 class="f-s-14 text-gray">Zoom Room: &nbsp;&nbsp;&nbsp;<span class="text-grey">${data.listMem.team.meeting}</span></h5>
								</div>
							</div>
							<div class="col-xl-4 col-lg-4">
								<div class="d-flex">
									<h5 class="f-s-14 text-gray">Area: &nbsp;&nbsp;&nbsp;<span class="text-grey">${data.listMem.team.local}</span></h5>
								</div>
								<div class="d-flex">
									<h5 class="f-s-14 text-gray">Offline Location: &nbsp;&nbsp;&nbsp;<span class="text-grey">${data.listMem.team.offline}</span> &nbsp;&nbsp;&nbsp;<input id="edit_location_group" type="button" class="btn btn-xs btn-outline-grey d-none"value="Edit Offline Location" data-toggle="modal" data-target="#edit_location_group_md"></h5>
								</div>
								<div class="d-flex">
								<h5 class="f-s-14 text-gray">Offline Time: &nbsp;&nbsp;&nbsp;<span class="text-grey">${data.listMem.team.time}</span> &nbsp;&nbsp;&nbsp;<input id="edit_time_group" type="button" class="btn btn-xs btn-outline-grey d-none"value="Edit Offline Times" data-toggle="modal" data-target="#edit_time_group_md"></h5>
								</div>

							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="col-xl-3 col-lg-3">
				<div class="card border-0 mb-3 overflow-hidden " style="min-height: 150px;">
					<div class="card-body">
						<div class="row">
							<div class="col-xl-12 col-lg-12">
								<div class="mb-3 text-grey text-center">
									<b>TOTAL SALES</b>
								</div>
								<div class="mb-3 text-grey text-center">
									<h2><span>${data.listMem.salesGroup}</span> $</h2>
									<p class="text-grey">= <span>60000</span> FFT</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div class="row" id="mem_list">
			<div class="col-xl-12">
				<div class="panel panel-inverse">
					<h4 class="p-10">MEMBERS</h4>
					<div class="panel-body">
						<table id="member_group_tb" class="table table-striped table-bordered table-td-valign-middle text-center">
							<thead>
								<tr>
									<th width="1%"></th>
									<th class="text-nowrap">Id</th>
									<th class="text-nowrap">Name</th>
									<th class="text-nowrap">Email</th>
									<th class="text-nowrap">Phone</th>
									<th class="text-nowrap">Job</th>
									<th class="text-nowrap">Sale</th>
									<!-- if(role = leader){ -->
									<th class="text-nowrap">Action</th>
									<!-- } -->
								</tr>
							</thead>
							<tbody>
							${htmlContent}
							</tbody>
						</table>
						
					</div>
				</div>
			</div>
		</div>
		
		`)
	})
	$(".btn_remove_mem").click((e)=>{
		e.preventDefault()
		const userId = $(e.target).data("id")
		const groupId = $("#mem_list").data("gid")
		socket.emit("remove_mem", {userId, groupId})
	})
	socket.on("remove_mem_success", data => {
		$(`#r_${data}`).remove()
		$.notify("Remove User From Group Success", "success")
	})
	socket.on("remove_mem_err", data => {
		$.notify(data, "error")
	})
});