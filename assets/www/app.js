

// If you want to prevent dragging, uncomment this section
/*
function preventBehavior(e) 
{ 
  e.preventDefault(); 
};
document.addEventListener("touchmove", preventBehavior, false);
*/

/* If you are supporting your own protocol, the var invokeString will contain any arguments to the app launch.
see http://iphonedevelopertips.com/cocoa/launching-your-own-application-via-a-custom-url-scheme.html
for more details -jm */
/*
function handleOpenURL(url)
{
	// TODO: do something with the url passed in.
}
*/

function onBodyLoad()
{		
	document.addEventListener("deviceready", onDeviceReady, false);
}

var api = "https://test.wikipedia.org/w/api.php";
var commonsApi = 'https://commons.wikimedia.org/w/api.php';
var wlmapi = 'http://toolserver.org/~erfgoed/api/api.php';
var state = {
	fileUri: null,
	fileKey: null,
	fileSize: null,
	title: null
};
var countries = {
	'ad': 'Andorra',
	'at': 'Austria',
	'be-bru': 'Belgium (Brussels)',
	'be-vlg': 'Belgium (Flanders)',
	'be-wal': 'Belgium (Wallonia)',
	'by': 'Belarus',
	'ch': 'Switzerland',
	'de-by': 'Germany (Bavaria)',
	'de-he': 'Germany (Hesse)',
	'de-nrw-bm': 'Germany (nrw-bm)',
	'de-nrw-k': 'Germany (nrw-k)',
	'dk-bygning': 'Denmark (bygning)',
	'dk-fortids': 'Denmark (fortids)',
	'ee': 'Estonia',
	'es': 'Spain',
	'es-ct': 'Catalonia',
	'es-vc': 'Valencia',
	'fr': 'France',
	'ie': 'Ireland',
	'it-88': 'Italy (88)',
	'it-bz': 'Italy (bz)',
	'lu': 'Luxemburg',
	'mt': 'Malta',
	'nl': 'Netherlands',
	'no': 'Norway',
	'pl': 'Poland',
	'pt': 'Portugal',
	'ro': 'Romania',
	'se': 'Sweden',
	'sk': 'Slovakia',
	'us': 'United States'
};


/* When this function is called, Cordova has been initialized and is ready to roll */
/* If you are supporting your own protocol, the var invokeString will contain any arguments to the app launch.
see http://iphonedevelopertips.com/cocoa/launching-your-own-application-via-a-custom-url-scheme.html
for more details -jm */
function onDeviceReady()
{
	$.each(countries, function(code, name) {
		var $li = $('<li>'),
			$button = $('<button>');
		$button.addClass('country-search').text(name);
		$button.click(function() {
			showPage('results-page');
			$.ajax({
				url: wlmapi,
				data: {
					'action': 'search',
					'srcountry': code,
					'format': 'xml',
				},
				success: function(data) {
					showSearchResults(data);
				}
			});
		});
		$button.appendTo($li);
		$li.appendTo('#country-list');
	});

	$('#nearby').click(function() {
		showPage('results-page');
		/*
			monuments: [
				{
					country,
					lang,
					id, // string
					name,
					address, // may be empty
					municipality, // may be empty
					lat, // string
					lon, // string
					image, // may be empty
					source, // URL for the image? may be empty
					monument_article, // seems mostly empty
					registrant_url, // what's this mean exactly?
					
					
		*/
		//This gives... nothing so far
		navigator.geolocation.getCurrentPosition(function(pos) {
			//alert(pos.coords.latitude + ', ' + pos.coords.longitude);
			var dist = 0.5; // degree 'radius' approx on the bounding box
			var bbox = [
				pos.coords.longitude - dist,
				pos.coords.latitude - dist,
				pos.coords.longitude + dist,
				pos.coords.latitude + dist
			].join(',');
			console.log(bbox);
			$.ajax({
				url: wlmapi,
				data: {
					'action': 'search',
					//'srlat': pos.coords.latitude,
					//'srlon': pos.coords.longitude,
					'bbox': bbox,
					'format': 'xml',
				},
				success: function(data) {
					showSearchResults(data, pos);
				}
			});
		}, function(err) {
			alert('Error in geolocation');
		});

	});
	
	$('#back-welcome').click(function() {
		showPage('welcome-page');
	});

	$('#back-results').click(function() {
		showPage('results-page');
	});

	$('#start-upload').click(function() {
		showPage('login-page');
	});

	$('#back-detail').click(function() {
		showPage('detail-page');
	});

	// do your thing!
	//navigator.notification.alert("Cordova is working")
	$('#login').click(function() {
		function submitLogin(callback, token) {
			var params = {
				action: 'login',
				lgname: $('#login-user').val(),
				lgpassword: $('#login-pass').val(),
				format: 'json'
			};
			if (token) {
				params.lgtoken = token;
			}
			$.ajax({
				url: api,
				data: params,
				type: 'POST',
				success: function(data) {
					console.log(JSON.stringify(data));
					console.log('data.login.result is ' + data.login.result);
					if (data.login.result == 'NeedToken') {
						console.log('got NeedToken');
						if (!token) {
							console.log('resubmitting with token');
							submitLogin(callback, data.login.token);
						} else {
							console.log('got asked for token twice');
						}
					} else if (data.login.result == 'Success') {
						console.log('success');
						callback(true);
					} else {
						console.log('fail');
						callback(false);
					}
				},
				error: function(err) {
					console.log('faaaaailed');
					callback(false);
				},
			});
		};
		submitLogin(function(ok) {
			if (ok) {
				showPage('upload-page');
			} else {
				alert('not logged in');
			}
		});
	});
	
	// upload-page
	$('#takephoto').click(function() {
		navigator.camera.getPicture(function(data) {
			// success
			state.fileUri = data;
			prepUploadConfirmation();
		}, function(msg) {
			// error
			alert('fail: ' + msg);
		}, {
			// options
			destinationType: Camera.DestinationType.FILE_URI
		});
	});
	$('#selectphoto').click(function() {
		navigator.camera.getPicture(function(data) {
			// success
			state.fileUri = data;
			prepUploadConfirmation();
		}, function(msg) {
			// error
			alert('fail: ' + msg);
		}, {
			// options
			destinationType: Camera.DestinationType.FILE_URI,
			sourceType: Camera.PictureSourceType.PHOTOLIBRARY
		});
	});
	
	// upload-status-page
	$('#continue').click(function() {
		showPage('upload-progress');
		continueButtonCheck();
		startUpload(state.fileUri);
	});
	$('#change-photo').click(function() {
		showPage('upload-page');
	});
	
	// upload-progress
	$('#self-confirmation').click(function() {
		continueButtonCheck();
	});
	$('#cancel-post-upload').click(function() {
		// @fixme cancel the file transfer if still running
		showPage('upload-status-page');
	});
	$('#continue-post-upload').click(function() {
		if (!state.fileKey) {
			alert('no file key yet');
		} else {
			showPage('upload-description');
		}
	});
	
	// upload-description
	$('#submit-upload').click(function() {
		console.log('Completing upload...');
		completeUpload(state.fileKey);
	});
	
	showPage('welcome-page');
}

function showPage(page) {
	$('.page').hide();
	$('#' + page).show();
}


function prepUploadConfirmation() {
	showPage('upload-status-page');
}


/**
 * @return promise, resolves with token value, rejects with error message
 */
function getToken() {
	var defer = new $.Deferred();
	$.ajax({
		url: api,
		data: {
			action: 'query',
			prop: 'info',
			intoken: 'edit',
			titles: 'Foo',
			format: 'json'
		},
		success: function(data) {
			var token;
			$.each(data.query.pages, function(i, item) {
				token = item.edittoken;
			});
			if (token) {
				defer.resolve(token);
			} else {
				defer.reject("No token found");
			}
		},
		fail: function(xhr, err) {
			defer.reject("HTTP error");
		}
	});
	return defer.promise();
}


/**
 * @return promise, resolves with stashed file key, rejects with error message
 */
function doUpload(sourceUri) {
	var defer = new $.Deferred();
	getToken().done(function(token) {
		var options = new FileUploadOptions();
		options.fileKey = "file";
		options.fileName = sourceUri.substr(sourceUri.lastIndexOf('/')+1);
		options.mimeType = "image/jpg";
		options.chunkedMode = false;
		options.params = {
			action: 'upload',
			filename: 'Test_file.jpg',
			comment: 'Uploaded with WLMTest',
			text: 'Photo uploaded with WLMTest',
			ignorewarnings: 1,
			stash: 1,
			token: token,
			format: 'json'
		};
		
		var ft = new FileTransfer();
		ft.upload(sourceUri, api, function(r) {
			// success
			console.log("Code = " + r.responseCode);
			console.log("Response = " + r.response);
			console.log("Sent = " + r.bytesSent);
			var data = JSON.parse(r.response);
			if (data.upload.result == 'Success') {
				defer.resolve(data.upload.filekey);
			} else {
				defer.reject("Upload did not succeed");
			}
		}, function(error) {
			console.log("upload error source " + error.source);
			console.log("upload error target " + error.target);
			defer.reject("HTTP error");
		}, options);
	});
	return defer.promise();
}

/**
 * @return promise resolves with imageinfo structure, rejects with error message
 */
function completeUpload(fileKey) {
	var defer = new $.Deferred();
	console.log('upload completing... getting token...');
	getToken().done(function(token) {
		console.log('.... got token');
		console.log('starting ajax upload completion...');
		$.ajax({
			url: api,
			type: 'POST',
			data: {
				action: 'upload',
				filekey: fileKey,
				filename: 'Test_file.jpg',
				comment: 'Uploaded with WLMTest',
				text: 'Photo uploaded with WLMTest',
				ignorewarnings: 1,
				token: token,
				format: 'json'
			},
			success: function(data) {
				console.log(JSON.stringify(data));
				if (data.upload.result == 'Success') {
					defer.resolve(data.upload.imageinfo);
				} else {
					defer.reject("Upload did not succeed");
				}
			},
			fail: function(xhr, error) {
				console.log("upload error source " + error.source);
				console.log("upload error target " + error.target);
				defer.reject("HTTP error");
			}
		});
	});
	return defer.promise();
}

function startUpload(fileUri) {
	doUpload(fileUri).done(function(fileKey) {
		state.fileKey = fileKey;
		$('#upload-progress-bar').text('done');
		continueButtonCheck();
	});
}

function continueButtonCheck() {
	var okToContinue = (state.fileKey && $('#self-confirmation').is(':checked'));
	if (okToContinue) {
		$('#continue-post-upload').removeAttr('disabled');
	} else {
		$('#continue-post-upload').attr('disabled', 'disabled');
	}
}

function showSearchResults(data, pos) {
	//alert(data);
	var fields = [
		'country',
		'lang',
		'id',
		'name',
		'address',
		'municipality',
		'lat',
		'lon',
		'image',
		'source',
		'monument_article',
		'registrant_url',
		'changed'
	];
	var results = [];
	// XML -> JSON
	$('monument', data).each(function(i, node) {
		var obj = {};
		$.each(fields, function(i, field) {
			obj[field] = node.getAttribute(field);
			if (field == 'lat' || field == 'lon') {
				obj[field] = parseFloat(obj[field]);
			}
		});
		results.push(obj);
	});
	
	// Sort by location
	if (pos !== undefined) {
		/**
		 * Distance approximation, in degrees
		 */
		function dist(lat, lon) {
			var dlat = (lat - pos.coords.latitude),
				dlon = (lon - pos.coords.longitude),
				degrees = Math.sqrt(dlat * dlat + dlon * dlon);
			return degrees;
		}
		$.each(results, function(i, item) {
			item.dist = dist(item.lat, item.lon);
		});
		results = results.sort(function(a, b) {
			return a.dist - b.dist;
		});
	}
	
	// whee
	$('#results').empty();
	var fetcher = new ImageFetcher(commonsApi, 64, 64);
	$.each(results, function(i, item) {
		var $li = $('<li><img> <div class="stuff"><div class="name"></div><div class="address"></div></div></li>');
		$li.find('.name').text(stripWikiText(item.name));
		$li.find('.address').text(stripWikiText(item.address));
		if (item.image) {
			fetcher.request(item.image, function(imageinfo) {
				$li.find('img').attr('src', imageinfo.thumburl);
			});
		}
		$li.appendTo('#results');
		$li.click(function() {
			showPage('detail-page');
			$('#detail-country').text(item.country);
			$('#detail-lang').text(item.lang);
			$('#detail-id').text(item.id);
			$('#detail-name').text(item.name); // may contain wikitext
			$('#detail-link').empty();
			if (item.monument_article) {
				var $a = $('<a>');
				// @fixme may contain a #foo hash
				var url = 'https://' + item.lang + '.wikipedia.org/wiki/' +
					encodeURIComponent(item.monument_article.replace(/ /g, '_'));
				$a.attr('href', url).text('Wikipedia article').addClass('external');
				$('#detail-link').append($a);
			}
			$('#detail-address').text(item.address); // may contain wikitext
			$('#detail-municipality').text(item.municipality); // may contain wikitext
			$('#detail-location').text(item.lat + ', ' + item.lon);
			$('#detail-source').text(item.source); // URL?
			$('#detail-changed').text(item.changed); // timestamp - format me
			$('#detail-image').empty();
			if (item.image) {
				var fetcher2 = new ImageFetcher(commonsApi, 300, 240);
				fetcher2.request(item.image, function(imageinfo) {
					console.log('?? ' + JSON.stringify(imageinfo));
					var $img = $('<img>');
					$img.attr('src', imageinfo.thumburl);
					$('#detail-image').empty().append($img);
				});
				fetcher2.send();
			}
		});
	});
	fetcher.send();
}


/**
 * Fetch image info for one or more images via MediaWiki API
 */
function ImageFetcher(api, width, height) {
	this.api = api || commonsApi;
	this.titles = [];
	this.callbacks = {};
	this.width = width;
	this.height = height;
}

ImageFetcher.prototype.request = function(filename, callback) {
	var title = 'File:' + filename;
	this.titles.push(title);
	this.callbacks[title] = callback;
};

ImageFetcher.prototype.send = function() {
	var that = this;
	var data = {
		action: 'query',
		titles: this.titles.join('|'),
		prop: 'imageinfo',
		iiprop: 'url',
		format: 'json'
	};
	if (this.width) {
		data.iiurlwidth = this.width;
	}
	if (this.height) {
		data.iiurlheight = this.height;
	}
	$.ajax({
		url: this.api,
		data: data,
		success: function(data) {
			// Get the normalization map
			if (!('query' in data)) {
				console.log('no return image data');
				return;
			}
			var origName = {};
			if ('normalized' in data.query) {
				$.each(data.query.normalized, function(i, pair) {
					origName[pair.to] = pair.from;
				});
			}

			$.each(data.query.pages, function(pageId, page) {
				var title = page.title;
				if (title in origName) {
					console.log('Normalizing title');
					title = origName[title];
				}
				if ('imageinfo' in page) {
					var imageinfo = page.imageinfo[0];
					if (title in that.callbacks) {
						that.callbacks[title].apply(imageinfo, [imageinfo]);
					} else {
						console.log('No callback for image ' + title);
					}
				}
			});
		}
	});
};



function stripWikiText(str) {
	str = str.replace(/\[\[[^\|]+\|([^\]]+)\]\]/g, '$1');
	str = str.replace(/\[\[([^\]]+)\]\]/g, '$1');
	return str;
}

