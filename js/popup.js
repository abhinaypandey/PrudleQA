
var statusDisplay = null;

// Initialize Firebase
  var fire_config = {
    apiKey: "AIzaSyAwRZpTOHPbcnA9nrqqhzWmyKml611U-X8",
    authDomain: "prudle-qa-5d4fd.firebaseapp.com",
    databaseURL: "https://prudle-qa-5d4fd.firebaseio.com",
    projectId: "prudle-qa-5d4fd",
    storageBucket: "prudle-qa-5d4fd.appspot.com",
    messagingSenderId: "992595635225"
  };
  firebase.initializeApp(fire_config);

  // Get a reference to the database service
  //var fire_database = firebase.database();

// POST the data to the server using XMLHttpRequest
function login() {
    // Cancel the form submit
    event.preventDefault();

    // Prepare the data to be POSTed by URLEncoding each field's contents
    var jiraUrl = document.getElementById('jiraUrl').value;
    var user = document.getElementById('username').value;
    var pass = document.getElementById('password').value;

    if(isEmpty(jiraUrl) || isEmpty(user) || isEmpty(pass)){
        openMsgSnackbar("Oops! You missed some fields. ");
        return;
    }else if(!firebase.auth().currentUser){
        openMsgSnackbar("Access denied");
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
                openMsgSnackbar('Logged in');
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
                openMsgSnackbar('Something went wrong!', 'red');
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

function firebaseLogin(){
    event.preventDefault();

    var email = document.getElementById('f-email').value;
    var password = document.getElementById('f-password').value;

    if(isEmpty(email) || isEmpty(password)){
          openMsgSnackbar("Oops! You missed some fields.");
          return;
    }

    startLogin(email,password);
}


function logout(){
    // Cancel the form submit
    event.preventDefault();

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
                            openMsgSnackbar(data.responseJSON.errorMessages[0]);
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
                        document.getElementById('jira-logout-form').style.display = "none";
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
               openMsgSnackbar("Select project from dropdown");
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
    chrome.storage.local.set({'name': session.name,'value': session.value,'jiraUrl':session.jiraUrl}, function() {
        document.getElementById('jira-logout-form').style.display = "block";
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
            document.getElementById('jira-logout-form').style.display = "block";
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

}

function loadProjectList(jiraUrl){
     $.ajax({
            url: "https://"+jiraUrl+"/rest/api/2/project",
            type: 'GET',
            success: function(data) {
                $('#project-drop-issues').html('');
                $('<option value="">Select Project</option>').appendTo('#project-drop-issues');
                $.each(data,function(i){
                    $('<option value="'+data[i].key+'">'+data[i].name+'</option>').appendTo('#project-drop-issues');
                });
            }
        });
}

function openSnackbar() {
    var x = document.getElementById("about-snackbar");
    x.className = "show";
    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 5000);
}

function openMsgSnackbar(content) {
    var x = document.getElementById("msg-snackbar");
    x.innerHTML = content;
    x.className = "show";
    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
}

function initApp() {
    // Listen for auth state changes.
    // [START authstatelistener]
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
        // User is signed in.
        document.getElementById('f-signin-container').style.display = 'none';
        document.getElementById('jira-container').style.display = 'block';
        document.getElementById('f-logout-form').style.display = 'block';
        
        } else {
            document.getElementById('jira-container').style.display = 'none';
            document.getElementById('f-signin-container').style.display = 'block';
            document.getElementById('f-logout-form').style.display = 'none';
            //openMsgSnackbar("Please login");
        }
    });

}

function startAuth(email,password) {

    firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage;
        switch(errorCode){
            case 'auth/invalid-email':
                errorMessage = 'Invalid email';
            break;
            case 'auth/wrong-password':
                errorMessage = 'Wrong Password';
            break;
            case 'auth/user-disabled':
                errorMessage = 'The given user has been disabled.';
            break;
            case 'auth/user-not-found':
                errorMessage = 'There is no user corresponding to the given email.'
            break;
            default:
            errorMessage = error.message;
        }

        openMsgSnackbar(errorMessage);
    });
}

/**
 * Starts the sign-in process.
 */
 function startLogin(email,password) {
    //document.getElementById('quickstart-button').disabled = true;
    if (firebase.auth().currentUser) {
        firebase.auth().signOut();
    } else {
        startAuth(email,password);
    }
}

/**
 * Starts the sign-out process.
 */
 function startLogout() {
    firebase.auth().signOut().then(function() {
        logout();
        openMsgSnackbar("Logged out");
    // Sign-out successful.
    }).catch(function(error) {
    // An error happened.
        openMsgSnackbar("You are not logged in");
    });
   
}

// When the popup HTML has loaded
window.addEventListener('load', function(evt) {
    // initilize firebase services 
    initApp();

    //show splash till data gets loaded 
    document.getElementById('splash').style.display = 'block';
    window.setTimeout(function(){
        document.getElementById('splash').style.display = 'none';
    },2000);

    // check for existing session on extension icon click
    chrome.browserAction.onClicked.addListener(getSession());

    // Handle the form submit event with our signinfunction
    document.getElementById('login-form').addEventListener('submit', login);
    document.getElementById('jira-logout-form').addEventListener('submit', logout);
    document.getElementById('f-logout-form').addEventListener('submit', startLogout);
    document.getElementById('tools-btn').addEventListener('click', loadTools);
    document.getElementById('issues-btn').addEventListener('click', loadIssues);
    document.getElementById("abt_btn").addEventListener("click", openSnackbar);
    document.getElementById('f-signin-btn').addEventListener('click', firebaseLogin);
    
    // load version no.
    var manifestData = chrome.runtime.getManifest();
    document.getElementById('qa-version-no').innerText = 'Version '+ manifestData.version ;

});







