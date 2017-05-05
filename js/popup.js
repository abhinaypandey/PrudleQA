
var statusDisplay = null;
// POST the data to the server using XMLHttpRequest
function login() {
    // Cancel the form submit
    event.preventDefault();

    // Prepare the data to be POSTed by URLEncoding each field's contents
    var jiraUrl = document.getElementById('jiraUrl').value;
    var user = document.getElementById('username').value;
    var pass = document.getElementById('password').value;

    if(isEmpty(jiraUrl) || isEmpty(user) || isEmpty(pass)){
        openMsgSnackbar("Oops! You missed some fields ");
        return;
    }
    var formData = {
                        "username": user,
                        "password": pass

                   };

    // The URL to POST our data to
    var loginUrl = 'https://'+jiraUrl+'/rest/auth/1/session';
    
    $.ajax({
        url: loginUrl,
        type: 'POST', 
        data: JSON.stringify(formData),
        contentType: 'application/json',
        xhrFields: {
            withCredentials: true
        },
        beforeSend: function(){
            $('#jira-auth-btn').button('loading');
        },
        success: function(data) {
            if(data.session){
                openMsgSnackbar('Logged In');

                data.session.jiraUrl = jiraUrl;
                saveSession(data);  

                // enable report generation button if disabled;
                chrome.runtime.getBackgroundPage(function (backgroundPage) {
                    // clear everything 
                    backgroundPage.BG.enableJiraReporting();
                        
                });

            }
            
        },
        error:function(data){
            if(!data.session){
                openMsgSnackbar(data.responseJSON.errorMessages[0], 'red');
                var intvId = setInterval(function(){
                    $('#login-form input').val('');
                },3000);

                setTimeout(function(){
                    clearInterval(intvId);
                },4000);
            }   
        },
        complete:function(xhr,status){
             $('#jira-auth-btn').button('reset');
        }
    });
}

function logout(){
    // Cancel the form submit
    event.preventDefault();

    //var session = getSession();


    chrome.storage.local.get(null, function(items) {
        session= items;
        if(items.name && items.value && items.jiraUrl){

             // The URL to POST our data to
            var logoutUrl = 'https://'+items.jiraUrl+'/rest/auth/1/session';
    
            $.ajax({
                url: logoutUrl,
                type: 'DELETE', 
                contentType: 'application/json',
                xhrFields: {
                    withCredentials: true
                },
                beforeSend: function(xhr){
                    $('#jira-logout-btn').button('loading');
                },
                success: function(data) {
                    //console.log(data);
                    if(data && data.status==401){
                            statusDisplay.innerHTML = data.responseJSON.errorMessages[0];
                            statusDisplay.style.color = "red";
                    }else if(data && data.status==204){

                    }
                    
                },
                error:function(data){
                    //console.log(data);
                    if(data){
                        openMsgSnackbar(data.responseJSON.errorMessages[0]);
                    }   
                    
                },
                complete:function(xhr,status){
                    chrome.storage.local.clear(function() {
                        document.getElementById('logout-form').style.display = "none";
                        document.getElementById('login-form').style.display = "block";
                        document.getElementById('issues-btn').style.display = "none";
                        document.getElementById('project-drop-issues').style.display = "none";
                        document.getElementById('issues-table').style.display = "none"; 
                    });

                    $('#jira-logout-btn').button('reset');
                    // disable report generation button if disabled;
                    chrome.runtime.getBackgroundPage(function (backgroundPage) {
                        // clear everything 
                        backgroundPage.BG.disableJiraReporting();
                            
                    });
                    
                }
            });
        }
       
    });
}


function loadIssues(){
    // Cancel the form submit
    event.preventDefault();

    //var session = getSession();


    chrome.storage.local.get(null, function(items) {
        session= items;
        if(items.name && items.value && items.jiraUrl){

            var projectKey = $('#project-drop-issues').val();

             // The URL to POST our data to
            var issuesUrl = 'https://'+items.jiraUrl+'/rest/api/2/search?jql=project="'+projectKey+'"';
            var issueHyperlink = 'https://'+items.jiraUrl+'/projects/'+projectKey+'/issues/'; 
    
            if(projectKey!== ""){
                 $.ajax({
                    url: issuesUrl,
                    type: 'GET', 
                    contentType: 'application/json',
                    xhrFields: {
                        withCredentials: true
                    },
                    beforeSend: function(xhr){
                        $('#issues-btn').button('loading');
                    },
                    success: function(data) {
                        //console.log(data);
                        if(data){
                            $.each(data.issues,function(i){
                                if(data.issues.length<1){
                                    $('#r'+i).html("<td>No issue has been created yet.</td>");
                                    $('#issues-table').append('<tr id="r'+(i+1)+'"></tr>').show();
                                }else{
                                    var issue = data.issues[i];
                                    $('#r'+i).html("<td><a href="+issueHyperlink+issue.key+" target='_blank'>"+issue.id+"</td><td><a href="+issueHyperlink+issue.key+" target='_blank'>"+issue.key+"</td>");
                                    
                                    $('#issues-table').append('<tr id="r'+(i+1)+'"></tr>').show();
                                }
                               
                            });
                        }
                        
                    },
                    error:function(data){
                    openMsgSnackbar(data.responseJSON.errorMessages[0]);
                        
                    },
                    complete:function(xhr,status){
                        $('#issues-btn').button('reset');
                    }
                });
            }else{
               openMsgSnackbar("Select project from dropdown first");
            }
           
        }
       
    });
}

function isEmpty(value){
    return value==="";
}


function saveSession(responseData){
    var session = responseData.session;
    var logInfo = responseData.loginInfo;
    console.log(responseData);
    chrome.storage.local.set({'name': session.name,'value': session.value,'jiraUrl':session.jiraUrl}, function() {
        document.getElementById('logout-form').style.display = "block";
        document.getElementById('login-form').style.display = "none";
        document.getElementById('tools-btn').style.display = "block";
        document.getElementById('issues-btn').style.display = "block";
        document.getElementById('project-drop-issues').style.display = "block";
        loadProjectList(session.jiraUrl);

    });
    
}

function getSession(){
    var session ;
    
    chrome.storage.local.get(null, function(items) {
        session= items;
        if(items.name && items.value && items.jiraUrl){
            document.getElementById('logout-form').style.display = "block";
            document.getElementById('login-form').style.display = "none";
            document.getElementById('tools-btn').style.display = "block";
            document.getElementById('issues-btn').style.display = "block";
            document.getElementById('project-drop-issues').style.display = "block";
            loadProjectList(items.jiraUrl);

        }
       
    });
  
    return session;
}

function loadTools(){

    chrome.runtime.getBackgroundPage(function (backgroundPage) {
        // clear out saved screeshot 
        chrome.storage.local.set({'screenshotImg': ''}, function() {
                backgroundPage.BG.inject();
        });
        
            
    });

    // chrome.storage.local.get(null, function(items) {
    //     if(items.name && items.value && items.jiraUrl){
            
    //     }
    // });
   
}

function loadProjectList(jiraUrl){
     $.ajax({
            url: "https://"+jiraUrl+"/rest/api/2/project",
            type: 'GET',
            success: function(data) {
                $('#project-drop-issues').html('');
                $('<option value="">Select Project</option>').appendTo('#project-drop-issues');
                $.each(data,function(i){
                    $('<option value="'+data[i].key+'">'+data[i].key+'</option>').appendTo('#project-drop-issues');
                });
            }
        });
}

function openSnackbar() {
    // Get the snackbar DIV
    var x = document.getElementById("about_snackbar");

    // Add the "show" class to DIV
    x.className = "show";

    // After 3 seconds, remove the show class from DIV
    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 5000);
}

function openMsgSnackbar(content) {
    // Get the snackbar DIV
    var x = document.getElementById("msg_snackbar");
    // x.style.color = '#536DFE';
    x.innerHTML = content;

    // Add the "show" class to DIV
    x.className = "show";

    // After 3 seconds, remove the show class from DIV
    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
}

// When the popup HTML has loaded
window.addEventListener('load', function(evt) {
    // check for existing session on extension icon click
    chrome.browserAction.onClicked.addListener(getSession());

    // Handle the form submit event with our signinfunction
    document.getElementById('login-form').addEventListener('submit', login);
    document.getElementById('logout-form').addEventListener('submit', logout);
    document.getElementById('tools-btn').addEventListener('click', loadTools);
    document.getElementById('issues-btn').addEventListener('click', loadIssues);
    document.getElementById("abt_btn").addEventListener("click", openSnackbar);
    
});



