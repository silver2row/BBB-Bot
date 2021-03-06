    var avoidingObstacle = false;

    function draw_arrow(context, startX, startY, size) { 
      var arrowX = startX + 0.75*size; 
      var arrowTopY = startY - 0.707*(0.25*size);  
      var arrowBottomY = startY + 0.707*(0.25*size); 
      context.beginPath();
      context.moveTo(startX, startY); 
      context.lineTo(startX+size, startX); 
      context.lineTo(arrowX, arrowTopY); 
      context.moveTo(startX+size, startX); 
      context.lineTo(arrowX, arrowBottomY); 
      context.stroke(); 
    }

    function init() {
      $("#BeagleURL").val("ws://beaglebone.local:8000/");
      $("#fwd, #left, #right, #stop, #rev, #speed_value, #speed").attr('disabled', 'disabled');
      $("#connectButton").on('click', function(){
        doConnect();
      });
      $("#fwd, #left, #right, #rev, #stop, #speed_value, #speed").on('click', function(){
        socket.send( 'drive', {cmd: this.id, speed: $("#speed_value").val() } );
      });
    }
    
    function doConnect() {
      socket = new FancyWebSocket($("#BeagleURL").val());
      socket.bind('open', function(evt) { onOpen(evt) });
      socket.bind('close', function(evt) { onClose(evt) });
      socket.bind('obstacle', function(data) { onObstacle(data) });
      socket.bind('ack', function(data) { onAck(data) });
      socket.bind('angle', function(data) { onAngle(data) });
      socket.bind('heading', function(data) { onHeading(data) });
      socket.bind('error', function(data) { onError(data) }) ;
      clearText();
      writeToScreen("connecting\n");
      $("#connectButton").html('<span class="glyphicon glyphicon-flash">');
      $("#connectButton").removeClass("btn-success").addClass("btn-info");
      setTimeout(function(){
            if (socket.readyState() == 0 || socket.readyState() == 3) {
                writeToScreen("connection failed\n");
                $("#connectButton").removeClass("btn-info").addClass("btn-success");
                $("#connectButton").html('<span class="glyphicon glyphicon-play">');
            }
       }, 5000);
       setInterval(function(){
          if (socket.readyState() == 1) {
            socket.send('fetch', {cmd: "angle"});
          }
       }, 100);
       setInterval(function(){
           if (socket.readyState() == 1) {
             socket.send('fetch', {cmd: "heading"});
           }
       }, 500);
    }
    
    function onOpen(evt) {
      writeToScreen("connected\n");  
      $("#connectButton").html('<span class="glyphicon glyphicon-stop">');
      $("#connectButton").removeClass("btn-info").addClass("btn-danger");
      $("#connectButton").off('click').on('click', function(){
        doDisconnect();
      });
      $("#fwd, #left, #right, #stop, #rev, #speed, #speed_value").removeAttr('disabled');
    }
    
    function onClose(evt) {
      writeToScreen("disconnected\n");
      $("#fwd, #left, #right, #stop, #rev, #speed, #speed_value").attr('disabled', 'disabled');
      $("#connectButton").html('<span class="glyphicon glyphicon-play">');
      $("#connectButton").removeClass("btn-danger").addClass("btn-success");
      $("#connectButton").off('click').on('click', function(){
        doConnect();
      });
    }
    
    function onObstacle(data) {
      if (!avoidingObstacle) {
        avoidingObstacle = true;
        $("body").addClass("flash");
        setTimeout( function(){ $("body").removeClass("flash"); }, 3000);
        writeToScreen('Obstacle detected on the ' + data.name + '\n');
        beep();
        switch (data.name) {
          case "left":
            dir = "right";
            break;
          case "right":
            dir = "left";
            break;
        }
        setTimeout(function() {
          writeToScreen("Taking evasive action\n");
          socket.send( 'drive', {cmd: dir, speed: $("#speed_value").val() } ) 
          avoidingObstacle = false;
        }, 1500);
      }
    }

    function onAck(data) {
      writeToScreen('Ack: ' + data.cmd + '\n');
    }
    
    function onError(evt, err) {
      writeToScreen(evt.data + '\n' + err);
      socket.close();
    }
    
    function doSend(message) {
      socket.send(message);
    }
    
    function clearText() {
        $("#ticker").html("");
    }
    function writeToScreen(message) {
      $("#ticker").append(message.replace('\n', '<br />'));
      $("#ticker").scrollTop($("#ticker")[0].scrollHeight);
    }
    
    function onAngle(data) {
      var canvas = $("#angle")[0];
      var context = canvas.getContext("2d");
      var startX = 0;  
      var startY = 0;  
      var size   = 50; 
      context.lineWidth = 2; 
      context.strokeStyle="red";
      context.setTransform(1, 0, 0, 1, 0, 0);                        
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.translate(canvas.width/2,canvas.height/2);
      context.rotate((data.angle-180)*Math.PI/180);
      draw_arrow(context, startX, startY, size);
    }
    
     function onHeading(data) {
       $("#heading").html("Heading: " + data.angle + "°");
     }
    
    function doDisconnect() {
      socket.close();
    }

    function beep() {
        var snd = new  Audio("data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");  
        snd.play();
    }
  
    $(document).ready(function() {
      init();
    });