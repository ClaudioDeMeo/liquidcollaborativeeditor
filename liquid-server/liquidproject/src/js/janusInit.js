// var servers = (window.location.protocol==='https:') ?
//             ['wss://' + window.location.hostname + ':8989/janus',
//             'https://' + window.location.hostname + ':8089/janus']
//             :
//             ['ws://' + window.location.hostname + ':8188/janus',
//             'http://' + window.location.hostname + ':8088/janus'];
//
// var ICEServers = [{'url': 'stun:stun.voip.eutelia.it'}];
// var janus = null;
// var videoroom = null;
// var remoteDevelopers = [];
//
// Janus.init({
//   debug: ['log'],
//   callback: function(){
//     console.log("Janus initialization completed");
//     createSession();
//   }
// });
//
// function createSession(){
//   if (!janus){
//     janus = new Janus({
//       server: servers,
//       iceServers: ICEServers,
//       //token: tkn,
//       success: function(){
//         Janus.log("Established connection to the server: " + janus.getServer() + " (connected=" + janus.isConnected() + ")");
//         Janus.log("Session was successfully created! ID: " + janus.getSessionId());
//         janus.attach({
//           plugin: "janus.plugin.videoroom",
//           success: function(handle){
//             videoroom = handle;
//             console.log("join plugin:", videoroom.getPlugin(), 'id:', videoroom.getId());
//           },
//           error: function(cause) {
//             console.log("join Couldn't attach to the plugin because: "+cause);
//           },
//           iceState: function(icestate){
//             console.log('join iceState', icestate);
//           },
//           mediaState: function(type, on){
//             console.log('join mediaState', type, on);
//           },
//           slowLink: function(uplink){
//             console.log('join slowLink', uplink);
//           },
//           onmessage: function(msg, jsep){
//             console.log("join onmessage", msg, 'jsep:', jsep);
//             //
//             if(jsep){
//               self.janusRoom.handleRemoteJsep({
//                 jsep: jsep
//               });
//             }
//
//           },
//           oncleanup: function() {
//             console.log('join oncleanup');
//           },
//           detached: function() {
//             console.log('join detached');
//             videoroom = null;
//           }
//         });
//       },
//       error: function(cause) {
//          Janus.log("Session was not created! because: " + cause);
//          janus=null;
//       },
//       destroyed: function() {
//          Janus.log("Session was destroyed and can't be used any more!");
//          janus=null;
//       }
//     });
//   }else{
//     console.log('session already exist; session id:', janus.getSessionId());
//   }
// }
//
// function leave(){
//   if (videoroom){
//     videoroom.detach();
//     videoroom = null;
//   }
// }
//
// function stop(){
//   if (janus){
//     leave();
//     janus = null;
//   }
// }
//
// function startSession(onSuccess, onError, tkn){
//    janus = new Janus({
//       server: servers,
//       iceServers: ICEServers,
//       token: tkn,
//       success: function(){
//          Janus.log("Established connection to the server: " + janus.getServer() + " (connected=" + janus.isConnected() + ")");
//          Janus.log("Session was successfully created! ID: " + janus.getSessionId());
//          if (onSuccess){
//             onSuccess();
//          }
//       },
//       error: function(cause) {
//          Janus.log("Session was not created! because: " + cause);
//          if (onError){
//             onError();
//          }
//          janus=null;
//       },
//       destroyed: function() {
//          Janus.log("Session was destroyed and can't be used any more!");
//          if (onError){
//             onError();
//          }
//          janus=null;
//       }
//    });
// }
