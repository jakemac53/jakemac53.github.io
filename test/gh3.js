<html>
<head>
<script src="https://code.jquery.com/jquery-2.1.1.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.6.0/underscore-min.js"></script>
<script type="text/javascript" src="https://raw.githubusercontent.com/k33g/gh3/master/gh3.js"></script>

</head>
<body>

<h1></h1>
<h2></h2>
<ul></ul>
<textarea></textarea>

<script type="text/javascript>

  var user = new Gh3.User("jakemac53")
  var repoTitle = $("h1")
  var branchTitle = $("h2")
  var branchContents = $("ul")
  var rawContent = $("textarea");
  
  //get some repositories of user
  var repos = new Gh3.Repositories(repoTitle);

  repos.fetch({page:1, per_page:10, direction : "desc"},"next", function (err, res) {
    if(err) {
      throw "outch ..."
    }

    console.log("Repositories", repos);
  });

  var repo = new Gh3.Repository("jakemac53.github.com", user);

  repo.fetch(function (err, res) {
    if(err) { throw "outch ..." }

    repoTitle.html(repo.full_name);

    repo.fetchBranches(function (err, res) {
      if(err) { throw "outch ..." }

      var master = repo.getBranchByName("master");
      branchTitle.html(master.name + " (" + master.sha + ") :");

      master.fetchContents(function (err, res) {
        if(err) { throw "outch ..." }

        master.eachContent(function (content) {
          branchContents.append('<li>'+content.name+" : "+content.type);

        });

        //var myfile = master.getContents()[8];

        var myfile = master.getFileByName("index.html");

        console.log("index.html", myfile);

        myfile.fetchContent(function (err, res) {
          if(err) { throw "outch ..." }

          rawContent.text(myfile.getRawContent());
        });

        myfile.fetchCommits(function (err, res) {
          if(err) { throw "outch ..." }

          console.log(myfile.getCommits());

          myfile.eachCommit(function (commit) {
            console.log(commit.author.login, commit.message, commit.date);
          });
        });

      });

    })
  });


</script>
</body>
</html>