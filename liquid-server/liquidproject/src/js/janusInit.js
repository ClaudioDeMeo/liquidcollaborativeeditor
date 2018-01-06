var servers = (window.location.protocol==='https:') ?
            ['ws://' + window.location.hostname + ':8188/janus',//TODO fixme use wss at port 8989
            'https://' + window.location.hostname + ':8089/janus']
            :
            ['ws://' + window.location.hostname + ':8188/jansu',
            'http://' + window.location.hostname + ':8088/janus'];

var ICEServers=[{'url': 'stun:stun.voip.eutelia.it'}];

Janus.init({
   debug: ['log'],
   callback: function(){
      console.log("Janus initialization completed");
  }
});

function startSession(onSuccess, onError, tkn){
   var janus=new Janus({
      server: servers,
      iceServers: ICEServers,
      token: tkn,
      success: function(){
         Janus.log("Established connection to the server: " + janus.getServer() + " (connected=" + janus.isConnected() + ")");
         Janus.log("Session was successfully created! ID: " + janus.getSessionId());
         if (onSuccess){
            onSuccess();
         }
         join(username, room);
      },
      error: function(cause) {
         Janus.log("Session was not created! because: " + cause);
         if (onError){
            onError();
         }
         janus=null;
      },
      destroyed: function() {
         Janus.log("Session was destroyed and can't be used any more!");
         if (onError){
            onError();
         }
         janus=null;
      }
   });
   return janus;
}
