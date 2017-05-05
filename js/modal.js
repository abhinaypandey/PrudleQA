
$(document).ready(function () {

  chrome.storage.local.get(null, function(items) {
        if(items.name && items.value && items.jiraUrl){
             $.ajax({
                url: "https://"+items.jiraUrl+"/rest/api/2/project",
                type: 'GET',
                success: function(data) {
                    $('#project-drop').html('');
                    $('<option value="">Select Project</option>').appendTo('#project-drop');
                    $.each(data,function(i){
                        $('<option value="'+data[i].id+'">'+data[i].key+'</option>').appendTo('#project-drop');
                    });
                }
            });

            $.ajax({
                url: "https://"+items.jiraUrl+"/rest/api/2/issuetype",
                type: 'GET',
                success: function(data) {
                    $('#issue-drop').html('');
                    $('<option value="">Select issue type</option>').appendTo('#issue-drop');
                
                    $.each(data,function(i){
                        var id = +data[i].id;
                        if(id === 10000 || id === 10102){
                           
                        }else{
                            $('<option value="'+id+'">'+data[i].name+'</option>').appendTo('#issue-drop');
                        }
                        
                    });
                }
            });
        }
       
    });
 

    var jiraModal = $('<div class="modal fade" id="jiraModal" role="dialog" style="z-index:100000;"></div>')
        .html('<div class="modal-dialog modal-md">'+
            '<div class="modal-content">'+
                '<div class="modal-header">'+
                    '<button type="button" class="close" data-dismiss="modal">&times;</button>'+
                    '<h4 class="modal-title">Create Issue</h4>'+
                '</div>'+
                '<div class="modal-body">'+
                    '<form id="jira-form" data-toggle="validator">'+
                        '<div class="form-group">'+
                            '<select class="form-control" id="project-drop" required data-error="Please select project">'+
                            '</select>'+
                        '</div>'+
                        '<div class="form-group">'+
                            '<select class="form-control" id="issue-drop" required data-error="Please select issue type">'+
                            '</select>'+
                        '</div>'+
                        '<div class="form-group">'+
                            '<label for="issue-summary">Summary</label>'+
                            '<textarea class="form-control" rows="3" id="issue-summary" ></textarea>'+
                        '</div>'+
                        '<div class="form-group">'+
                            '<label for="issue-descr">Description</label>'+
                            '<textarea class="form-control" rows="5" id="issue-descr"></textarea>'+
                        '</div>'+
                        '<div class="checkbox">'+
                            '<label><input type="checkbox" id="include-screenshot" checked value="1">Include Screenshot</label>'+
                        '</div>'+
                        '<label for="img-bug-screenshot">Issue screenshot</label>'+
                        '<div class="form-group" style="overflow:auto;max-height:600px;max-width:500px;">'+
                            '<input type="image" src="" id="img-bug-screenshot" alt="Bug screenshot" style="width:100%;height:100%;">'+
                        '</div>'+
                    '</form>'+
                '</div>'+
                '<div class="modal-footer">'+
                    '<button type="button" class="btn btn-primary btn-lg" id="create-issue-btn" data-loading-text="Reporting issue. Have patience ....">Create Issue</button>'+
                    '<button type="button" class="btn btn-primary btn-lg" class="modal-close-btn" data-dismiss="modal">Close</button>'+
                '</div>'+
            '</div>'+
        '</div>');

    $(jiraModal).appendTo('body');
    $("#jiraModal").modal();
    
    chrome.storage.local.get('screenshotImg', function(items) {
        if(items.screenshotImg && items.screenshotImg!==''){
            document.getElementById('img-bug-screenshot').src = items.screenshotImg;
        }
    });
    

    $('#create-issue-btn').on('click',function(){
        var issueTypeId = $('#issue-drop').val();
        var issueTypeName = $('#issue-drop option:selected').text();
        var projectId = $('#project-drop').val();
        var projectKey = $('#project-drop option:selected').text();
        var summary = $('#issue-summary').val();
        var descr = $('#issue-descr').val();
        var img = $('#img-bug-screenshot').val();
        var include = $('#include-screenshot').is(':checked') ? true : false ;

        var issue ={
                        "fields": {
                            "project":
                            { 
                                "id": projectId,
                                "key": projectKey
                            },
                            "summary": summary,
                            "description": descr,
                            "issuetype": {
                                "id": issueTypeId,
                                "name": issueTypeName
                            }       
                        }
                    };

        var form_data = {};
        form_data.issueData = issue;
        form_data.includeScreenshot = include;

        // console.log(issue);

        if(issueTypeId!=='' && projectId!=='' && summary!=='' && descr!==''){
            chrome.runtime.sendMessage({
                method: "createIssue",
                data : form_data
            }, function(response) {
                $('#jiraModal').modal('hide');
            }); 
        }else{
             alert("Please fill all the fields !!");
        }

    });

});

