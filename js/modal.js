
var formDataSchema = { "fields": {}}; 
var jiraFieldSchema ; 

$(document).ready(function () {

  chrome.storage.local.get(null, function(items) {
        if(items.name && items.value && items.jiraUrl){
             $.ajax({
                url: "https://"+items.jiraUrl+"/rest/api/2/project",
                type: 'GET',
                success: function(data) {
                    $('#prudle-qa-project').html('');
                    if(data.length > 0){
                        $('<option value="" disabled selected>Select Project</option>').appendTo('#prudle-qa-project');
                        $.each(data,function(i){
                            $('<option value="'+data[i].id+'" data="'+data[i].key+'">'+data[i].name+'</option>').appendTo('#prudle-qa-project');
                        });
                        //$('#prudle-qa-project').find('option:eq(1)').prop('selected',true);

                        chrome.storage.local.get('screenshotImg', function(items) {
                            if(items.screenshotImg && items.screenshotImg!==''){
                                document.getElementById('img-bug-screenshot').src = items.screenshotImg;
                            }
                        });  
                    }else{
                        $('#jiraModal').hide();
                    }
                      
                }
            });

            $.ajax({
                url: "https://"+items.jiraUrl+"/rest/api/2/issuetype",
                type: 'GET',
                success: function(data) {
                    $('#prudle-qa-issuetype').html('');

                    if(data.length > 0){
                        $('<option value="" disabled selected>Select issue type</option>').appendTo('#prudle-qa-issuetype');
                        $.each(data,function(i){
                            var id = +data[i].id;
                            if(id === 10000 || id === 10102){
                            
                            }else{
                                $('<option value="'+id+'">'+data[i].name+'</option>').appendTo('#prudle-qa-issuetype');
                            } 
                        });
                        //$('#prudle-qa-issuetype').find('option:eq(1)').prop('selected',true);
                    }else{
                        $('#jiraModal').hide();
                    }
                        
                }
            });

            // generate JIRA form  from project schema 
            $('.project-control').on('change',function(){
                if($('#prudle-qa-project :selected').val() !=='' && $('#prudle-qa-issuetype :selected').val()!==''){
                    generateFields(items.jiraUrl);
                }
                    
            }); 
            // generateFields(items.jiraUrl);

            // $('.form-control').on('change',function(){
            //     $('#'+$(this).attr('id')).css('border-color', 'rgb(204, 204, 204)');
            // });
        }
       
    });
 

    var jiraModal = $('<div class="modal fade" id="jiraModal" role="dialog" style="z-index:100000;"></div>')
        .html('<div class="modal-dialog modal-lg">'+
            '<div class="modal-content">'+
                '<div class="modal-header">'+
                    '<button type="button" class="close" data-dismiss="modal">&times;</button>'+
                    '<h4 class="modal-title">Create Issue</h4>'+
                '</div>'+
                '<div class="modal-body" style="max-height: 470px;overflow: auto;">'+
                    '<form id="prudle-qa-jira-form" data-toggle="validator" class="form-horizontal">'+
                        '<div class="form-group">'+
                            '<label class="col-sm-2 control-label" for="prudle-qa-project">Project<span style="color:red">*</span></label>'+
                            '<div class="col-sm-6">'+
                                '<select class="form-control project-control" id="prudle-qa-project" name="prudle-qa-project" required data-error="Please select project">'+
                                '</select>'+
                            '</div>'+
                        '</div>'+
                        '<div class="form-group">'+
                            '<label class="col-sm-2 control-label" for="prudle-qa-issuetype">Issue Type<span style="color:red">*</span></label>'+
                            '<div class="col-sm-6">'+
                                '<select class="form-control project-control" id="prudle-qa-issuetype" name="prudle-qa-issuetype" required data-error="Please select issue type">'+
                                '</select>'+
                            '</div>'+
                        '</div>'+
                        '<div style="border-bottom:1px solid rgb(229, 229, 229); margin-bottom:20px;" ></div>'+
                        '<div id="jira-form-fields" ></div>'+
                        '<div class="form-group">'+
                            '<label class="col-sm-2 control-label" for="include-screenshot">Include Screenshot</label>'+
                            '<div class="col-sm-6">'+                            
                                '<input type="checkbox" id="include-screenshot" checked value="1">'+
                            '</div>'+
                        '</div>'+
                        '<div class="form-group" >'+
                            '<label class="col-sm-2 control-label" for="img-bug-screenshot">Issue screenshot</label>'+
                            '<div class="col-sm-10" style="border:1px solid #ccc">'+
                                '<input type="image" src="" id="img-bug-screenshot" alt="Bug screenshot" style="width:100%;height:100%;">'+
                            '</div>'+
                        '</div>'+
                    '</form>'+
                '</div>'+
                '<div class="modal-footer">'+
                    '<span id="gifLoader" style="display:none;"><img src=""></span>'+
                    '<button type="button" class="btn btn-primary btn-sm" id="create-issue-btn" data-loading-text="Creating...">Create Issue</button>'+
                    '<button type="button" class="btn btn-primary btn-sm" class="modal-close-btn" data-dismiss="modal">Close</button>'+
                '</div>'+
            '</div>'+
        '</div>');

    $(jiraModal).appendTo('body');
    $("#jiraModal").modal();
    
    $('#create-issue-btn').on('click',function(){

        var dirtyFields = {};
        var formDirty = false;
        // form validation 
        $("#prudle-qa-jira-form").find('.form-control').each(function(i){
            if($(this).attr('required') && $(this).val()=== ''){
                dirtyFields[$(this).attr('id')] = true;
                formDirty = true ; 
            }
        });

        $.each(dirtyFields,function(i,j){
            $('#'+i).css('border-color','red');
        });

        if(formDirty){
            alert('You missed some fields.');
            return;
        }else if($('#prudle-qa-project :selected').val() === '' ||  $('#prudle-qa-issuetype :selected').val() === ''){
            alert('You missed some fields.');
            return;
        }

        var enteredFormData = $("#prudle-qa-jira-form").serializeArray();
        var include = $('#include-screenshot').is(':checked') ? true : false ;

        var filledForm = populateFormData(enteredFormData,jiraFieldSchema);

        var form_data = {};
        form_data.issueData = filledForm;
        form_data.includeScreenshot = include;

        chrome.runtime.sendMessage({
            method: "createIssue",
            data : form_data
        }, function(response) {
            if(response === 'success'){
                window.setTimeout(function(){
                    $('#jiraModal').modal('hide');
                },1500);
            }
            
        }); 

    });

    $('#include-screenshot').on('change',function(){
        if(!$('#include-screenshot').is(':checked')){
            $('#img-bug-screenshot').parent().parent().hide();
        }else{
            $('#img-bug-screenshot').parent().parent().show();
        }
    });

});

function generateFields(jiraurl){
    var projectId = $('#prudle-qa-project :selected').val();
    var projectKey = $('#prudle-qa-project :selected').attr('data');
    var issueTypeId = $('#prudle-qa-issuetype :selected').val();

    $.ajax({
        url: "https://"+jiraurl+"/rest/api/2/issue/createmeta?expand=projects.issuetypes.fields",
        type: 'GET',
        data:{projectIds:projectId,projectKeys:projectKey},
        beforeSend:function(){
            $('#prudle-qa-jira-form :input').prop('disabled', true);
            $('#create-issue-btn').prop('disabled', true);

        },
        success: function(data) {
            console.log(data);
            var issuetypesList = data.projects[0].issuetypes; 
            $.each(issuetypesList,function(i){
                if(issuetypesList[i].id === issueTypeId ){
                    var formFields = issuetypesList[i].fields;
                    jiraFieldSchema = formFields;

                    // save schema in which form data will be sent
                    saveFieldSchema(formFields);

                    var jira_form_fields = $('#jira-form-fields');
                    $('#jira-form-fields').html('');

                    $.each(formFields,function(k,j){
                        var fieldItem ; 
                        if(formFields[k].required){
                            fieldItem = '<div class="form-group">'+
                                        '<label class="col-sm-2 control-label" for="prudle-qa-'+k+'">'+formFields[k].name+'<span style="color:red">*</span></label>'+
                                            '<div class="col-sm-6" id="prudle-qa-'+k+'-sm-6'+'">'+
                                                
                                            '</div>'+
                                        '</div>';
                        }else {
                            fieldItem = '<div class="form-group">'+
                                        '<label class="col-sm-2 control-label" for="prudle-qa-'+k+'">'+formFields[k].name+'</label>'+
                                            '<div class="col-sm-6" id="prudle-qa-'+k+'-sm-6'+'">'+
                                                
                                            '</div>'+
                                        '</div>';
                        }

                        var qa_input_field;

                        switch(formFields[k].schema.type){
                            case 'string':
                                    if(formFields[k].key === 'description' || formFields[k].key === 'environment'){
                                        qa_input_field = '<textarea id="prudle-qa-'+k+'" name="prudle-qa-'+k+'" class="form-control" rows="3"></textarea>';
                                    }else{
                                        qa_input_field = '<input id="prudle-qa-'+k+'" name="prudle-qa-'+k+'" class="form-control" type="text" value="" placeholder="'+formFields[k].name+'">';
                                    }
                                    
                                	break;
                            case 'array':
                                    break;
                            case 'date':
                                    var today = new Date();
                                    var month = today.getMonth()+1;
                                    var day = today.getDate();
                                    var tdate = today.getFullYear() + '-' +
                                        ((''+month).length<2 ? '0' : '') + month + '-' +
                                        ((''+day).length<2 ? '0' : '') + day;
                                    qa_input_field = '<input id="prudle-qa-'+k+'" name="prudle-qa-'+k+'" class="form-control" type="date" value="'+tdate+'" >';
                                    break;

                            default : 

                        }
    
                        var qa_select_field = '<select id="prudle-qa-'+k+'-select"'+' name="prudle-qa-'+k+'" class="form-control" ></select>';

                        if(formFields[k].key === "project" || formFields[k].key === "issuetype")
                            return ;

                        if(formFields[k].allowedValues && formFields[k].allowedValues.length === 0){
                            $(fieldItem).appendTo(jira_form_fields);
                            $('<label class="col-sm-2 control-label">None</label>').appendTo('#prudle-qa-'+k+'-sm-6');
                                
                        }else if(formFields[k].allowedValues && formFields[k].allowedValues.length > 0){
                            $(fieldItem).appendTo(jira_form_fields);
                            $(qa_select_field).appendTo('#prudle-qa-'+k+'-sm-6');

                            var optData = formFields[k].allowedValues;
                            $.each(optData,function(i){
                                if(optData[i].name){
                                    $('#prudle-qa-'+k+'-select').append('<option value="'+optData[i].id+'">'+optData[i].name+'</option>');
                                }else{
                                    $('#prudle-qa-'+k+'-select').append('<option value="'+optData[i].id+'">'+optData[i].value+'</option>');
                                }
                                
                            });

                            if(formFields[k].hasDefaultValue){
                                $('#prudle-qa-'+k+'-select').val(formFields[k].defaultValue.id);
                            }
                            formFields[k].required == true ? $('#prudle-qa-'+k+'-select').prop('required',true): "" ;

                        }else{
                            $(fieldItem).appendTo(jira_form_fields);
                            $(qa_input_field).appendTo('#prudle-qa-'+k+'-sm-6');
                            $('#prudle-qa-'+k+'-sm-6').children('.form-control').length == 0 ? $('#prudle-qa-'+k+'-sm-6').parent('.form-group').remove() : {};
                            
                            formFields[k].required == true ? $('#prudle-qa-'+k).prop('required',true): "" ;
                        }

                    });
                }
            });
        },
        complete: function(){
            $('#prudle-qa-jira-form :input').prop('disabled', false);
            $('#create-issue-btn').prop('disabled', false);
        }
    });
}

function saveFieldSchema(formFields){
    $.each(formFields, function(i){
        if(formFields[i].key !== 'attachment' && formFields[i].key !== 'issuelinks'){
            switch(formFields[i].schema.type){
                case 'string':
                    formDataSchema.fields[formFields[i].key] = "";
                    break;
                case 'array':
                    formDataSchema.fields[formFields[i].key] = new Array();
                default : 
                    formDataSchema.fields[formFields[i].key] = {};
            }
        }

    });

    //console.log(formDataSchema);
}

function populateFormData(enteredFormData, jiraFieldSchema){
    var populatedForm = { "fields": {}};  

    $.each(enteredFormData,function(j){
        var fKey = enteredFormData[j].name.substring(10,enteredFormData[j].name.length);

        $.each(jiraFieldSchema, function(i){
            if(jiraFieldSchema[i].key === fKey ){

                switch(jiraFieldSchema[i].schema.type){
                    case 'string':
                        populatedForm.fields[jiraFieldSchema[i].key] = enteredFormData[j].value;
                        break;
                    case 'array':
                        populatedForm.fields[jiraFieldSchema[i].key] = new Array();
                        if(jiraFieldSchema[i].schema.items === 'string'){
                            populatedForm.fields[jiraFieldSchema[i].key].push(enteredFormData[j].value);
                        }else{
                            populatedForm.fields[jiraFieldSchema[i].key].push({"id": enteredFormData[j].value});
                        }
                        break;
                    case 'date':
                        populatedForm.fields[jiraFieldSchema[i].key] = enteredFormData[j].value;
                        break;
                    default : 
                        populatedForm.fields[jiraFieldSchema[i].key] = {"id" : enteredFormData[j].value };

                }
            }
            
        });

    });

    return populatedForm;
    
}
