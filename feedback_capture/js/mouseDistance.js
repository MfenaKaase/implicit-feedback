
var mouseTracking = 
{
	pos : -1,     // 
	old_pos : -1, //
	total_mouse_distance : 0,
	// how many 100ms intervals there were during which mouse was moved
	mouse_moves_intervals_count : 0,
	// how many times the mouse was moved (moved and stopped)
	mouse_moves_count : 0,

	init: function()
	{
		console.log("Mouse events called.");

		$(document).mousemove(function(e) {
			mouseTracking.checkMouse();

		   // every time mouse moves remember where it is
		   mouseTracking.pos = [e.pageX, e.pageY];
			
		   // first start 
		   if(mouseTracking.old_pos == -1)
		   {
			  mouseTracking.old_pos = [mouseTracking.pos[0], mouseTracking.pos[1]];
			  return;
		   }
		});

		/**setInterval(function(){
	       mouseTracking.checkMouse();
     	}, 100);**/
	},
	
	wasMouseMovingInLastInterval : false,

	checkMouse : function ()
	{
		// mouse wasn't moved yet
		if(mouseTracking.pos == -1)    return;

		// now mouse is somewhere on the document and 100ms has passed
		if(mouseTracking.pos[0] == mouseTracking.old_pos[0] && mouseTracking.pos[1] == mouseTracking.old_pos[1])
		{
			mouseTracking.wasMouseMovingInLastInterval = false;
			return; // nothing moved
		}	
		
		mouseTracking.mouse_moves_intervals_count++;
		if(!mouseTracking.wasMouseMovingInLastInterval)
		   mouseTracking.mouse_moves_count++;
		mouseTracking.wasMouseMovingInLastInterval = true;
		
		// current movement
		var dX = mouseTracking.pos[0]-mouseTracking.old_pos[0];
		var dY = mouseTracking.pos[1]-mouseTracking.old_pos[1];
		var distance = Math.sqrt(dX*dX + dY*dY);
		var velocity = (distance/0.1); // 0.1s == 100ms

		mouseTracking.logMouseAction(distance, velocity, dX, dY);
		
	   // do something with the fact that mouse    has moved from old_pos to pos;
	   mouseTracking.old_pos = [mouseTracking.pos[0], mouseTracking.pos[1]];   
	},
	velocity_sum : 0,
	logMouseAction : function (distance, velocity, dX, dY)
	{
		// total movement
		distance = Math.round(distance);
        velocity = Math.round(velocity);

		mouseTracking.total_mouse_distance = mouseTracking.total_mouse_distance + distance;	
		mouseTracking.velocity_sum = mouseTracking.velocity_sum + velocity;
		
		saveCaptureData.total_mouse_distance = mouseTracking.total_mouse_distance;
		saveCaptureData.total_mouse_speed = mouseTracking.velocity_sum;
		saveCaptureData.average_mouse_speed =  (Math.round(mouseTracking.velocity_sum / mouseTracking.mouse_moves_intervals_count));
        
		
		saveCaptureData.total_mouse_movement_x += Math.abs(dX);
		saveCaptureData.total_mouse_movement_y += Math.abs(dY);
		saveCaptureData.velocity_time_count = (mouseTracking.mouse_moves_intervals_count);
		
		console.log("The mouse distance " + distance 
		+ ", velocity: " + velocity 
		+ ", total distance " + mouseTracking.total_mouse_distance
		+ ", time moving " + (mouseTracking.mouse_moves_intervals_count) + "s"
		+ ", times moved " + mouseTracking.mouse_moves_count 
		+ ", Average Speed " + (Math.round(mouseTracking.velocity_sum / mouseTracking.mouse_moves_intervals_count))
		+ ", mouse x " + saveCaptureData.total_mouse_movement_x
		+ ", mouse y " + saveCaptureData.total_mouse_movement_y);
	}
}
if (window.location.href.indexOf("google.com") > -1 || window.location.href.indexOf("facebook.com") > -1 || window.location.href.indexOf("twitter.com") > -1) {
  console.log("Mouse events wont be recorded");
}
else{
	mouseTracking.init();
}