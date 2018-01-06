window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;

var filesystem=null;
if (window.requestFileSystem){
	navigator.webkitPersistentStorage.requestQuota(1024 * 1024 * 1000,function(grantedSize) {
		window.requestFileSystem(window.PERSISTENT, grantedSize, function(fs) {
			filesystem = fs;
		}, errorHandler);
	}, errorHandler);
}else{
	alert("Your browser doesn't support the FileSystem API");
}

var mediaRecorder=[];
const options={
	type: {
		//mimeType: 'video/webm;codecs=vp8',
		//mimeType: 'video/mp4';,
		//mimeType: 'video/webm,codecs=vp9',
		mimeType:'video/webm,codec=h264',
		videoBitsPerSecond: 512000,
	},
	container: {type: 'video/webm'},
	ext: 'webm',
};

function startRecording(stream, name){
	var i=1;
	while (mediaRecorder[name]!=undefined && mediaRecorder[name]!=null){
		var end=name.indexOf("(");
		if (end!=-1){
			name=name.substring(0,end)+"("+i+")";
		}else{
			name=name+"("+i+")";
		}
		i++;
	}
	var recorder=null;
	try {
		recorder=new MediaRecorder(stream,options);
		console.log('Created MediaRecorder', recorder, 'with options', options);
		recorder.onstop = handleStop.bind(this,name);
		recorder.ondataavailable = handleDataAvailable.bind(this,name);
		recorder.start(1000);
		mediaRecorder[name]=recorder;
		console.log('MediaRecorder started', recorder);
		return true;
	} catch (e) {
		console.log('Unable to create MediaRecorder with options Object: ', e);
		console.error('Exception while creating MediaRecorder:', e);
		return false;
	}
}

function stopRecording(name){
	if (mediaRecorder[name]!=undefined && mediaRecorder[name]!=null  && mediaRecorder[name].state != "inactive"){
		mediaRecorder[name].stop();
		return true;
	}else{
		return false;
	}
}

function pauseRecording(name){
	if (mediaRecorder[name]!=undefined && mediaRecorder[name]!=null  && mediaRecorder[name].state == "recording" ){
		mediaRecorder[name].pause();
		return true;
	}else{
		return false;
	}
}

function resumeRecording(name){
	if (mediaRecorder[name]!=undefined && mediaRecorder[name]!=null  && mediaRecorder[name].state == "paused"){
		mediaRecorder[name].resume();
		return true;
	}else{
		return false;
	}
}

function deleteRecording(name){
	if (mediaRecorder[name]!=undefined && mediaRecorder[name]!=null){
		delete mediaRecorder[name];
		deleteFile(name+".webm");
		return true;
	}else{
		return false;
	}
}

function download(name){
	readFile(name+".webm",function(e){
		var blob = new Blob([e.srcElement.result], options);
		var url = window.URL.createObjectURL(blob);
		var a = document.createElement('a');
		a.style.display = 'none';
		a.href = url;
		a.download = name+".webm";
		document.body.appendChild(a);
		a.click();
		setTimeout(function() {
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
		}, 100);
	});

}

function dowloadAll(){
	for (var name in mediaRecorder){
		download(name);
	}
}


function stopAllRecording(){
	for (var name in mediaRecorder){
		stopRecording(name);
	}
}

function pauseAllRecording(){
	for (var name in mediaRecorder){
		pauseRecording(name);
	}
}

function resumeAllRecording(){
	for (var name in mediaRecorder){
		resumeRecording(name);
	}
}

function deleteAllRecording(){
	for (var name in mediaRecorder){
		deleteRecording(name);
	}
}

function handleDataAvailable(name,event){
	if (event.data && event.data.size > 0) {
		saveFile(name+".webm",event.data,options,{create: true});
	}
}

function handleStop(name,event){
	console.log("Recorder " + name + " stopped: ", event);
}

function saveFile(filename, data, type, options, callback) {
	filesystem.root.getFile(filename, options, function(fileEntry) {
		fileEntry.createWriter(function(fileWriter) {
			fileWriter.seek(fileWriter.length); //append to file if it exists
			fileWriter.onwriteend = function(e) {
				// Update the file browser.
				if(callback){
					callback(e);
				}
				console.log('onwriteend '+filename,e);
			};
			fileWriter.onerror = function(e) {
				console.log('Write error: ' + e.toString());
				alert('An error occurred and your file could not be saved!');
			};
			var contentBlob = new Blob([data], {type: type});
			fileWriter.write(contentBlob);
		}, errorHandler);
	}, errorHandler);
}

function readFile(filename, cb) {
	filesystem.root.getFile(filename, {}, function(fileEntry) {
		fileEntry.file(function(file) {
			var reader = new FileReader();
			reader.onload = function(e) {
				cb(e);
			};
			reader.readAsArrayBuffer(file);
		}, errorHandler);
	}, errorHandler);
}

function deleteFile(filename){
	filesystem.root.getFile(filename, {create: false}, function(fileEntry) {
	    fileEntry.remove(function(e) {
			console.log("file " + filename + " deleted.");
	    }, errorHandler);
	}, errorHandler);
}

function errorHandler(error) {
	var message = '';
	switch (error.code) {
		case 1:
			message = 'Not Found Error';
			break;
		case 2:
			message = 'Security Error';
			break;
		case 10:
			message = 'Quota Exceeded Error';
			break;
		case 9:
			message = 'Invalid Modification Error';
			break;
		case 7:
			message = 'Invalid State Error';
			break;
		default:
			message = error.name;
			break;
	}
	console.log(message);
}
