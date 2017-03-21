
$(document).ready(function () {
  $.ajax({
        url: "https://prudlelabs.atlassian.net/rest/api/2/project",
        type: 'GET',
        success: function(data) {
            $('#project-drop').html('');
            $('<option value="">Select Project</option>').appendTo('#project-drop');
            $.each(data,function(i){
                $('<option value="'+data[i].key+'">'+data[i].key+'</option>').appendTo('#project-drop');
            });
        }
    });

    $.ajax({
        url: "https://prudlelabs.atlassian.net/rest/api/2/issuetype",
        type: 'GET',
        success: function(data) {
            $('#issue-drop').html('');
            $('<option value="">Select issue type</option>').appendTo('#issue-drop');
            $.each(data,function(i){
                $('<option value="'+data[i].name+'">'+data[i].name+'</option>').appendTo('#issue-drop');
            });
        }
    });

    var jiraModal = $('<div class="modal fade" id="jiraModal" role="dialog"></div>')
        .html('<div class="modal-dialog modal-lg">'+
            '<div class="modal-content">'+
                '<div class="modal-header">'+
                    '<button type="button" class="close" data-dismiss="modal">&times;</button>'+
                    '<h4 class="modal-title">Create Issue</h4>'+
                '</div>'+
                '<div class="modal-body">'+
                    '<form id="jira-form">'+
                        '<div class="form-group">'+
                            '<select class="form-control" id="project-drop">'+
                            '</select>'+
                        '</div>'+
                        '<div class="form-group">'+
                            '<select class="form-control" id="issue-drop">'+
                            '</select>'+
                        '</div>'+
                        '<div class="form-group">'+
                            '<label for="issue-summary">Summary</label>'+
                            '<textarea class="form-control" rows="3" id="issue-summary"></textarea>'+
                        '</div>'+
                        '<div class="form-group">'+
                            '<label for="issue-descr">Description</label>'+
                            '<textarea class="form-control" rows="5" id="issue-descr"></textarea>'+
                        '</div>'+
                        '<label for="img-bug-screenshot">Issue screenshot</label>'+
                        '<div class="form-group" style="overflow:auto;max-height:600px;max-width:500px;">'+
                            '<input type="image" src="" id="img-bug-screenshot" alt="Bug screenshot" style="width:100%;height:100%;">'+
                        '</div>'+
                    '</form>'+
                '</div>'+
                '<div class="modal-footer">'+
                    '<button type="button" class="btn btn-primary btn-lg" id="create-issue-btn" data-loading-text="Reporting issue. Have patience ....">Create Issue</button>'+
                    '<button type="button" class="btn btn-primary btn-lg" data-dismiss="modal">Close</button>'+
                '</div>'+
            '</div>'+
        '</div>');

    if($('#jiraModal').length){
        $('#jiraModal').remove();
        $(jiraModal).appendTo('body');
        $("#jiraModal").modal({backdrop: true});  
    }
    
    chrome.storage.local.get('screenshotImg', function(items) {
        // Notify that we saved.
        if(items.screenshotImg){
            document.getElementById('img-bug-screenshot').src = items.screenshotImg;
        }
    });

    $('#create-issue-btn').on('click',function(){
        var issueType = $('#issue-drop').val();
        var projectKey = $('#project-drop').val();
        var summary = $('#issue-summary').val();
        var descr = $('#issue-descr').val();
        
        var issue ={
                        "fields": {
                            "project":
                            { 
                                "key": projectKey
                            },
                            "summary": summary,
                            "description": descr,
                            "issuetype": {
                                "name": issueType
                            }       
                        }
                    };


        chrome.runtime.sendMessage({
            name: "createIssue",
            issue
        }, function(response) {
            console.log(response);
        }); 


    });

});

