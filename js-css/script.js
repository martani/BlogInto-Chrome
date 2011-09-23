//------------ Variables	
var selectedTab = (localStorage["default_feed"] != "ma")? "dz" : "ma";		
var read_posts = localStorage["read_posts"];
var timeout_ = IsNumeric(localStorage["timeout"]) ? localStorage["timeout"] : 20;
var defaultFeed = (localStorage["default_feed"] != "ma")? "dz" : "ma";
var defaultShowHide = (localStorage["default_show_hide"] != "show")? 'hide' : 'show';

var posts_should_be_shown = new Array();
posts_should_be_shown['dz'] = defaultShowHide=='show'?true:false;
posts_should_be_shown['ma'] = defaultShowHide=='show'?true:false;

var user_dz = (localStorage["user-dz"] || "");
var pass_dz = (localStorage["pass-dz"] || "");

var user_ma = (localStorage["user-ma"] || "");
var pass_ma = (localStorage["pass-ma"] || "");

var lang = localStorage["lang"] || 'en';
var l = chrome.extension.getBackgroundPage().getLanguageResources()[lang];

$.shortenUrl.settings.login = 'bloginto';
$.shortenUrl.settings.apiKey = 'R_715338d707945c2ab6214b5ae3ff74e0';
//------------ Functions
function IsNumeric(input)
{
   return (input - 0) == input && input.length > 0;
}

//To be used in the backgroud page
function getDzUrl(){
	return "http://www.bloginy.com/api/topFeeds/7RaLaXvDsZhBcYhS/bloginto";
}
function getMaUrl(){
	return "http://bloginy.ma/api/topFeeds/oWxPfPyUkAb5q3aL/bloginto";
}

// function called when the page loads to show the default feed 
// [default_feed] : parameter chosen by the user in the settings page
function loadDefaultFeed(){
	if (defaultFeed == "dz")
		ajaxIt(getDzUrl(), "dz", false);
	else
   	  ajaxIt(getMaUrl(), "ma", false);
}

function getDefaultFeedIndex(){
	if (defaultFeed == "dz")
		return 0;
	else
		return 1;
}

function getRootUrl(category){
	if(category == 'dz')
		return 'http://bloginy.com';
	else
		return 'http://bloginy.ma';
}

// returns the selected tab "dz" for "Bloginy Algérie", "ma" for "Bloginy Maroc"
function getSelectedTab(s){
	var i = (s.toString()).lastIndexOf("#");
	var selected_tab = (s.toString()).substr(i + 1);
			
	// refreh the global variable selectedTab used to refreh the current tab.
	selectedTab = selected_tab;
	return selected_tab; 
}
		
// Handles errors during the XMLHttpRequest.
function handleError(msg) {
	$("#dz").text(msg);
	$('#error').dialog('open');
}

//checks if the post is in arabic or latin
function isArabic(text){
	var c = 0;
	var i = 0;
	for(i=0; i<text.length; i++)
		c += text[i].charCodeAt(0);
		
	return (c>(500*i))?true:false;
}

//checks if the posts if available in the localStorage of read posts
function isPostRead(title, feed){
	var read_posts = new Array();
	
	if(localStorage.getItem('read_posts_' + feed) != null)
		read_posts = JSON.parse(localStorage.getItem('read_posts_' + feed));
	else
		read_posts = null;
	
	if(read_posts != null)
		for(var i=0; i<read_posts.length; i++)
			if(title == read_posts[i])
				return true;

	return false;
}

//mark read posts or hide them after a user click
function hideOrMark(elt){
	elt.addClass('post-read');
	if(defaultShowHide == 'hide')
		elt.hide('slow');
}

//marks the posts as read by storing its title in the localStorage and updating the number
//of read posts in the badge
function markAsRead(elt, feed){
	var post_title = elt.find('h3 > a').text();
	var read_posts = new Array();
	var post_read = false;
	
	if(localStorage.getItem('read_posts_' + feed) != null)
		read_posts = JSON.parse(localStorage.getItem('read_posts_' + feed));
	else
		read_posts = null;
			
	if(isPostRead(post_title, feed))
		post_read = true;
				
	if(read_posts == null)
		read_posts = new Array();
						
	if(!post_read){
		read_posts.push(post_title);
		
		if(feed == defaultFeed){
			var unread_count = IsNumeric(localStorage["unread_count_" + feed]) ? localStorage["unread_count_" + feed] : '?';
			if(unread_count > 0){
				unread_count--;
				localStorage["unread_count_" + feed] = unread_count;
			}
			
			chrome.browserAction.setBadgeText({text: unread_count.toString()});
		}
	}
			
	localStorage.setItem('read_posts_' + feed, JSON.stringify(read_posts));
	
	hideOrMark(elt);
}

// when new posts arrive, deletes the old read posts that are no more present in the feed from the website.
function deleteOldPostsFromLocalStorage(arr_titles, feed){
	var new_arr = new Array();
			
	for(var i=0; i<arr_titles.length; i++){
		var title = arr_titles[i];
		if(isPostRead(title, feed))
			new_arr.push(title);
	}
			
	localStorage.setItem('read_posts_' + feed, JSON.stringify(new_arr));
}

function showWrongPasswordError(){
	$('#password-error').dialog('open');
}
	
//function for voting
//is this the best way to do it??? augmenting callback to infinity, or there is 
//a better pattern anyways? I cant figure it out.
function vote(elt){
	var user = selectedTab == 'dz' ? user_dz : user_ma;
	var password = selectedTab == 'dz' ? pass_dz : pass_ma;
	
	var bloginy = new Bloginy(user, password, getRootUrl(selectedTab));
	var postId = elt.parent().find('.post-id:first').text();
	
	function assert_vote(arg){
		var element, img;
		if(arg != '0'){
			element = elt.find('a:first');
			img = element.html().substring(element.html().indexOf('<'));
			element.html(arg + '  ' + img);
			element.fadeOut('slow');
			element.fadeIn('fast');
		}
		else{
			elt.fadeOut('slow');
			elt.fadeIn('fast');
		}
	}
	
	function vote_helper(){
		bloginy.tryVote(postId, assert_vote);
	}
	
	function failed_helper(arg){
		if(arg == true)
			vote_helper();
		else
			showWrongPasswordError();
	}
	
	function retry_helper(arg){
		if(arg == true)
			vote_helper();
		else
			bloginy.isUserLoggedIn(failed_helper);
	}
	
	function connect_helper(arg){
		if(arg == false)
			bloginy.connect(retry_helper);
		else
			vote_helper();
	}
	
	bloginy.isUserLoggedIn(connect_helper);
}

function twitterThis(elt){
	var h3 = elt.parent().parent().children('h3');
	var a = h3.children('a:first');
	
	var title = a.attr('complete_title').substring(0, 98) + "... ";
	var url = a.attr('href').trim().replace('\n', '');
	
	url = url.substring(0, url.length - 1);
	var index = url.lastIndexOf('/');
	url = url.substring(0, index);
	url += '/a/'
	
	$.shortenUrl(url, function(short_url) {
		var tweet = 'http://twitter.com/home?status=' +
			encodeURI(title + short_url + ' (via ') +
			'%23Bloginto)';
		chrome.tabs.create({url : tweet});
	});
}

// returns the HTML of a single feed element
function getFeedHTML(title, description, author, date, url, votes, id){
	
	title = $('<a>' + title + '</a>').text();
	
	var rtl = (isArabic(title) == true?'ar':'');
	var isReadCSS = (isPostRead(title.substring(0, 50), selectedTab)?' post-read':'');
	
	return '<div class="post' + isReadCSS + ' ' + rtl + '"><h3 class="h3-style"><a complete_title="' + title + '" href="' + url + '" class="url-title-style" target=_blank>' + title.substring(0, 50) + '</a></h3>' +
			'<p class="description-style">' + description.substring(0, 155) + '...</p>' +
			'<div class="post-footer">' +
			'<span class="author-style"><span class="by">By : </span>' + author + '</span>' +	
			'<span class="date-style"><span class="at">@ </span>' + date + '</span>' +
			'<span class="votes" title="Click to vote"><a href="#" alt="click to vote">' + votes + '<img src="images/vote.gif" height="18" width="18" style="' + (selectedTab == 'ma'? 'padding-left: 5px;':'') + '"></a></span>' +
			'<span class="twitter-share" title="Twitter this"><a href="#"><img src="images/twitter.png" height="18" width="18"/></a></span>' + 
			'<div class="post-id">' + id + '</div>' +
			'</div></div>';
}

//enumerating through the feed and builds the HTML elements corresponding
//deletes old posts from localStorage
//hides read posts if choosen by default
//sets the click event for the voting elements
function showFeeds(xml, cat) {
	$("#" + cat).text("");
			
	var url_root = (cat == "dz")? "" : "http://bloginy.ma";			
	var titles = new Array();
			
	try{
		var feeds = xml.getElementsByTagName("feed");
				
		for (var i = 0, feed; feed = feeds[i]; i++) {
			var author = feed.getElementsByTagName("author")[0].childNodes[0].nodeValue;
			var date = feed.getElementsByTagName("pubdate")[0].childNodes[0].nodeValue;
			var title = feed.getElementsByTagName("title")[0].childNodes[0].nodeValue;
			var description = feed.getElementsByTagName("description")[0].childNodes[0].nodeValue;
			var url = url_root + feed.getElementsByTagName("link")[0].childNodes[0].nodeValue;
			var votes = feed.getElementsByTagName("votes")[0].childNodes[0].nodeValue;
			
			var id;
			if(cat == 'dz')
				id =  feed.getElementsByTagName("feed_id")[0].childNodes[0].nodeValue;
			else{
				var tmp = (feed.getElementsByTagName("link")[0].childNodes[0].nodeValue);
				var start = tmp.indexOf('/', 0);
				start = tmp.indexOf('/', start + 1);
				var end = tmp.indexOf('/', start + 1);
				id = tmp.substring(start + 1, end);
			}
			
			$("#" + cat).append(getFeedHTML(title, description, author, date, url, votes, id));
			
			titles.push($('<a>' + title + '</a>').text().substring(0, 50));
		}
				
		deleteOldPostsFromLocalStorage(titles, cat);
				
		if(defaultShowHide == 'hide')
			setTimeout(function(){$('#' + cat + ' .post-read').hide('slow');}, 300);
				
	}catch(error){
		handleError(error);
	}
	
	$("#" + cat + " > .post:first").css('margin-top', '-15px');
	$('.votes').click(function(){
		vote($(this));
	});
	
	$(".twitter-share").click(function(){
		twitterThis($(this));
	});
}

// function that handles the XHR requests
function ajaxIt(url_, category, cached){
	$.ajax({
		  url: url_,
		  cache: cached,
		  timeout: (timeout_ * 1000),
		  dataType: (category == "dz" ? "xml" : "html"),
		  success: function(html){
				$("#error").hide();
				$("#password-error").hide();
				
				if(category == "dz")
					showFeeds(html, category); 
				else{
					try{
                        if ((html.indexOf("bloginy_api") < 0) || (html.indexOf("<erreur>") > 0))
                            throw("Problem loading the feeds");
                            
							xmlParser = new DOMParser();
                            xmlDocum = xmlParser.parseFromString( html, 'text/xml');
                            showFeeds(xmlDocum, category); 
                    }
                    catch(err){
                        handleError(err);
                    }
				}
						
				$('.post').hover(
					function(){
						$(this).addClass('post-hover');
					},
					function(){
						$(this).removeClass('post-hover');
					}
				);
				$(".post > p").click(
					function(){
						markAsRead($(this).parent(), selectedTab)
				});
		  },
		  error: function(xhr, msg, exn){
			  
				handleError(msg);
		  }
	});	
}

// Refresh the current selected feed
function refresh(){
   	if (selectedTab == "dz")
		ajaxIt(getDzUrl(), "dz", false);
	else
		ajaxIt(getMaUrl(), "ma", false);
}

$(document).ready(function() {

	    $('#loadingDiv')
	    .hide()
	    .ajaxStart(function() {
	        $(this).show();
	    })
	    .ajaxStop(function() {
	        $(this).hide();
	    });
		
		var btn_go_to_bloginy = l['btn_go_to_bloginy'];
		var btn_parameters_dialog = l['btn_parameters_dialog'];
		var ok = l['ok']
		
		var error_buttons = {}, password_error_buttons = {};
		password_error_buttons[btn_go_to_bloginy] = function() { chrome.tabs.create({url : getRootUrl(selectedTab)})};
		password_error_buttons[btn_parameters_dialog] = error_buttons[btn_parameters_dialog] = function() { chrome.tabs.create({url : "options.html"});	};
		password_error_buttons[ok] = error_buttons[ok] = function() { $(this).dialog("close"); };
		
		// Dialogs
		$('#error').dialog({
			autoOpen: false,
			width: 300,
			modal: true,
			buttons: error_buttons
		});
		
		$('#password-error').dialog({
			autoOpen: false,
			width: 370,
			modal: true,
			buttons: password_error_buttons
		});
				
		$("button").button()
			.each(function(i, elt){
				$(elt).attr('title', l['tt_' + $(elt).attr('id')]);
			});
		$("#show-hide").button()
			.click(function(){
				if(posts_should_be_shown[selectedTab])
					$('#' + selectedTab + ' .post-read').hide('slow');
				else
					$('#' + selectedTab + ' .post-read').show('slow');
				posts_should_be_shown[selectedTab] = !posts_should_be_shown[selectedTab];
			});
			
		$('#options').click(function(){
			chrome.tabs.create({url : "options.html"});
		});
		
    	$('#refresh').click(function(){
    		$('#' + selectedTab).animate({
									"height": "toggle", "opacity": "toggle"
										}, { duration: "slow" });
    		refresh();
    		$('#' + selectedTab).animate({
									"height": "toggle", "opacity": "toggle"
										}, { duration: "slow" });

    	});
		
		var $tabs = $("#tabs").tabs({selected : getDefaultFeedIndex(), fx: { opacity: 'toggle' },
		    select: function(event, ui) {
				var selected = $tabs.tabs('option', 'selected');
				$("#error").dialog('close');
				$("#password-error").dialog('close');
				var id = getSelectedTab(ui.tab);
				if (id != "dz")
				   	  ajaxIt(getMaUrl(), id, true);
				else
				   	  ajaxIt(getDzUrl(), id, true);
		    }
		});
		
		setTimeout(loadDefaultFeed, 500);
		
		$("span[name='lbl']").each(function(i, elt){
			$(elt).text(l[$(elt).attr("caption")]);
		});	
 });