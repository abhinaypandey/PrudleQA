var JIRA_API = {
    getAllProjects: function(){
        var projects;
        $.ajax({
            url: "https://prudlelabs.atlassian.net/rest/api/2/project",
            type: 'GET',
            success: function(data) {
                  projects = data;
            }
        });

        return projects;
    }

};

