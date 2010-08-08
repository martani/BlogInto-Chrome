function Bloginy(user, password, root_url){
	this.user = user;
	this.password = password;
	this.root_url = root_url;

	var loggedInKeywords = ["loading hiddendiv", "/images/loading.gif"];
	
	function connect(callback){
		$.ajax({
		   type: "POST",
		   url: root_url + "/user/connect/",
		   data: ({'connect[user]' : user, 'connect[password]' : password}),
		   beforeSend: function(xhr){
				xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
			},
		   success: function(msg){
				var arr = ['<a href="/user/apicode">API Code</a>', '<a href="#userTimelineTab"', 'Ma Timeline</a>', 'Mes articles'];

				for(var i = 0; i<arr.length; i++){
					if(msg.indexOf(arr[i]) < 1)
					{
					 	console.log('failed to log in: username or password wrong');
						callback(false);
						return;
					}
				}
				
				console.log('user logged in successefuly');
				callback(true);
		   },
		   error: function(xhr, msg, exn){
				console.log('failed to log in : ' + msg + " : " + exn);
				callback(false);
		   }
		 });
	}
	
	function isUserLoggedIn(callback){
		var url_ = root_url + "/user/commentModeration";
		$.ajax({
						type: "GET",
						url: url_,
						dataType: "html",
						beforeSend: function(xhr){
							xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
						},
						success: function(msg){
							if(msg.indexOf("n'avez aucun commentaire")>0 && msg.indexOf("n'avez aucun commentaire")<30){
								callback(true);
								return;
							}
							
							for(var i = 0; i<loggedInKeywords.length; i++){
								if(msg.indexOf(loggedInKeywords[i]) < 1)
								{
									console.log('failed to log in: username or password wrong');
									callback(false);
									return;
								}
							}
							
							console.log('user logged in successefuly');
							callback(true);
					   },
					   error: function(xhr, msg, exn){
							console.log('failed to log in : ' + msg + " : " + exn);
							callback(false);
					   }
		});
	}
	
	function tryVote(feedID, callback){
		jQuery.ajax({
			type: 'POST',
			dataType: 'html',
			url: root_url + '/feeds/vote/id/' + feedID.toString(),
			beforeSend: function(xhr){
				xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
			},
			success: function(data, textStatus){
				if(data.indexOf('article_has_voted_button'))
					callback($(data).text().trim());
				else
					callback('0');
			},
			error: function(xhr, msg, exn){
							console.log('failed to vote : ' + msg + " : " + exn);
							callback('0');
					   }
		});
	}
	
	this.connect = connect;
	this.tryVote = tryVote;
	this.isUserLoggedIn = isUserLoggedIn;
}