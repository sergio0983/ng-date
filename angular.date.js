angular.module('ngDate', []);

(function(){ 'use strict' //colorines
	angular.module('ngDate').factory('ColorService', function(){
		function Color(color){
			var self = this;
			
			self.r = 0;
			self.g = 0;
			self.b = 0;
			self.a = 1;

			if ( typeof color === "object" ){
				for ( var i in color ) self[i] = color[i];
			}
			if ( typeof color === "string" ){
				if ( /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d\.]+))?\)/.test(color) ){
					var matches = color.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d\.]+))?\)/);
					self.r = matches[1];
					self.g = matches[2];
					self.b = matches[3];
					if ( matches[4] ) self.a = matches[4];
				}
				if ( /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.test(color) ){
					var matches = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
					self.r = parseInt(matches[1], 16);
					self.g = parseInt(matches[2], 16);
					self.b = parseInt(matches[3], 16);
				}
				if ( /^#?([a-f\d]{1})([a-f\d]{1})([a-f\d]{1})$/i.test(color) ){
					var matches = color.match(/^#?([a-f\d]{1})([a-f\d]{1})([a-f\d]{1})$/i);
					self.r = parseInt(matches[1]+matches[1], 16);
					self.g = parseInt(matches[2]+matches[2], 16);
					self.b = parseInt(matches[3]+matches[3], 16);
				}
			}

			//Ya tenemos los colores, calculamos el hsv
			var max = Math.max(self.r,self.g,self.b);
			var dif = max - Math.min(self.r,self.g,self.b);
			self.saturation = ( max==0.0 )? 0 : (100*dif/max);
			if ( self.saturation == 0 ) self.hue = 0;
			else if ( self.r == max ) self.hue = 60.0*(self.g-self.b)/dif;
			else if ( self.g == max ) self.hue = 120.0+60.0*(self.b-self.r)/dif;
			else if ( self.b == max ) self.hue = 240.0+60.0*(self.r-self.g)/dif;
			if (self.hue < 0.0) self.hue+=360.0;
			self.value = Math.round(max*100/255);
			self.hue = Math.round(self.hue);
			self.saturation = Math.round(self.saturation);


			//calculamos la expresión hexadecimal
			function componentToHex(c) {
				var hex = c.toString(16);
				return hex.length == 1 ? "0" + hex : hex;
			}
			self.hex = "#" + componentToHex(self.r) + componentToHex(self.g) + componentToHex(self.b);
			
			return self;
		}
		Color.prototype.hsv2rgb = function(){ //Actualiza las componentes rgb cuando cambia el hsv
			var self = this;
		
			if ( self.saturation==0 ) {
				self.r = self.g = self.b = Math.round(self.value*2.55);
			} else {
				var hue = self.hue/60;
				var sat = self.saturation/100;
				var value = self.value/100;
				var i = Math.floor(hue);
				var f = hue-i;
				var p = value*(1-sat);
				var q = value*(1-sat*f);
				var t = value*(1-sat*(1-f));
				switch(i) {
					case 0: self.r = value; self.g = t; self.b = p; break;
					case 1: self.r = q; self.g = value; self.b = p; break;
					case 2: self.r = p; self.g = value; self.b = t; break;
					case 3: self.r = p; self.g = q; self.b = value; break;
					case 4: self.r = t; self.g = p; self.b = value; break;
					default: self.r = value; self.g = p; self.b = q;
				}
				self.r=Math.round(self.r*255);
				self.g=Math.round(self.g*255);
				self.b=Math.round(self.b*255);
			}
			return self;
		}
		Color.prototype.hueShift = function(deg){
			var self = this;
			
			self.hue+=deg; 
			while ( self.hue >= 360.0 ) self.hue-=360.0; 
			while ( self.hue < 0.0) self.hue+=360.0; 
			
			self.hsv2rgb();
			
			return self;
		}	
		Color.prototype.complementary = function(){
			var newColor = new Color(this);
			newColor.hueShift(180.0);
			return newColor;
		}
		
		var factory = {
			complementary:function(color){
				var color = new Color(color);
				var complementario = color.complementary();
				
				return "rgba("+complementario.r+", "+complementario.g+", "+complementario.b+", "+complementario.a+")";
			},
			saturate:function(color, percent){
				var color = new Color(color);
				color.saturate(percent);
				return "rgba("+color.r+", "+color.g+", "+color.b+", "+color.a+")";
			},
			lighter:function(color){
				var color = new Color(color);
				color.value = 100;
				color.saturation/=2;
				console.debug(color);
				color.hsv2rgb();
				
				return "rgba("+color.r+", "+color.g+", "+color.b+", "+color.a+")";
			}
		}
		
		return factory;
	})
})();

(function(){ 'use strict' //range filter
	angular.module('ngDate').filter('range', function() {
		return function(input, min, max) {
			min = parseInt(min); //Make string input int
			max = parseInt(max);
			for (var i=min; i<=max; i++) input.push(i);
			return input;
		};
	})
})();

(function(){ //toTime filter
	angular.module('ngDate').filter('toTime', function($filter) {
		return function(value) {
			if ( !value ) return undefined;
			
			var hours = Math.floor(value);
			var minutes = Math.floor(((value - hours)*3600)/60);
			
			var padHours = '', padMinutes = '';
			if ( hours < 10 ) padHours = "0";
			if ( minutes < 10 ) padMinutes = "0";
			
			return padHours+hours+":"+padMinutes+minutes;
		};
	})
})();

(function(){ 'use strict' //PATH value
	var scripts = document.getElementsByTagName("script");
	angular.module('ngDate').value("ngDate.PATH", scripts[scripts.length-1].src.substring(0, scripts[scripts.length-1].src.lastIndexOf('/') + 1));
})();

(function(){ 'use strict' //ngDate
	angular.module('ngDate').factory('ngDate', function($window, $filter){
		var FORMAT_REGEXP = /[a-zA-Z]/g;
		var monthNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
		var lang = window.navigator.language;
		var monthNames = monthNumbers.map(function(monthNumber){
			var d = new Date(2000,1,1,0,0,0);
			d.setMonth(monthNumber - 1);
			return d.toLocaleString(lang, { month: "long" });
		});
		function pad(n, width, z) {
			z = z || '0';
			n = n + '';
			return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
		}
		
		return {
			monthNames:function(){ return monthNames; },
			age:function(birthday){
				var birthday = Date.parse(birthday);
				var ageDifMs = Date.now() - birthday.getTime();
				var ageDate = new Date(ageDifMs); // miliseconds from epoch
				return Math.abs(ageDate.getUTCFullYear() - 1970);
			},
			strtodate:function(string){
				if ( !string ) return null;
				if ( string instanceof Date ) return string;
				
				//d-m-Y with optional H:i with optional :s
				var matches = string.match(/^(\d{1,2})-(\d{1,2})-(\d{4})(\s(\d{1,2}):(\d{1,2})(:(\d{1,2}))?)?$/);
				if ( matches ){
					var date = new Date(matches[3], matches[2]-1, matches[1], 0, 0, 0);
					
					if ( matches[5] ) date.setHours(matches[5]);
					if ( matches[6] ) date.setMinutes(matches[6]);
					if ( matches[8] ) date.setSeconds(matches[8]);
					
					return date;
				}
				
				 //Y-m-d with optional H:i with optional :s
				var matches = string.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(\s(\d{1,2}):(\d{1,2})(:(\d{1,2}))?)?$/);
				if ( matches ){
					var date = new Date(matches[1], matches[2]-1, matches[3], 0, 0, 0);
					
					if ( matches[5] ) date.setHours(matches[5]);
					if ( matches[6] ) date.setMinutes(matches[6]);
					if ( matches[8] ) date.setSeconds(matches[8]);
					
					return date;
				}
				
				//H:i with optional :s
				var matches = string.match(/^(\d{1,2}):(\d{1,2})(:(\d{1,2}))?$/);
				if ( matches ){
					var date = new Date();
					date.setHours(matches[1]);
					date.setMinutes(matches[2]);
					if ( matches[3] ) date.setSeconds(matches[3]);
					
					date.setMilliseconds(0);
					
					return date;
				}
				
				//2015W52 (Primer día de la semana dada del año dado...)
				var matches = string.match(/^(\d{4})W(\d{1,2})$/);
				if ( matches ){
					var year = matches[1];
					var week = matches[2];
					
					var date = new Date("Jan 01, "+year);
					//var firstDay = new Date(year, 0, 1).getDay();
					if ( date.getDay() == 1 ) week-=1; //Si el primer día del año es lunes, la primera semana será 1 en vez de 0, y por lo tanto, hemos de restar uno al cálculo (de todas las semanas del año)
					this.add(date, week*7+" days");
					
					return this.monday(date);
					
					return date;
				}

				//d-m-Y with optional H:i with optional :s with option +1 day(s), months, etc...
				var matches = string.match(/^((\d{1,2})-(\d{1,2})-(\d{4})(\s(\d{1,2}):(\d{1,2})(:(\d{1,2}))?)?)?\s*(([\+|-](\d)+)\s*(seconds?|minutes?|hours?|days?|weeks?|months?|years?))?$/);
				if ( matches ){
					var date;
					if ( matches[1] ) date = this.strtodate(matches[1]);
					else date = new Date();
					if ( matches[10] ){
						this.add(date, matches[10] );
						return date;
					}
					else return date;
				}

				//Y-m-d with optional H:i with optional :s with option +1 day(s), months, etc...
				var matches = string.match(/^((\d{4})-(\d{1,2})-(\d{1,2})(\s(\d{1,2}):(\d{1,2})(:(\d{1,2}))?)?)?\s*(([\+|-](\d)+)\s*(seconds?|minutes?|hours?|days?|weeks?|months?|years?))?$/);
				if ( matches ){
					var date;
					if ( matches[1] ) date = this.strtodate(matches[1]);
					else date = new Date();
					if ( matches[10] ){
						this.add(date, matches[10] );
						return date;
					}
					else return date;
				}

				
				return null;
			},
			today:function(){
				return new Date();
			},
			date:function(format, date){
				if ( !date ) date = new Date();
				if ( date instanceof String || typeof date === "string" ) date = this.strtodate(date);

				if (!date) throw ("No se pudo aplicar el formato; el segundo argumento no es una fecha válida: ");
				
				return format
					.replace("t", (new Date(date.getFullYear(), date.getMonth()+1, 0)).getDate())
					.replace("d", pad(date.getDate(), 2))
					.replace("m", pad(date.getMonth()+1, 2))
					.replace("H", pad(date.getHours(), 2))
					.replace("i", pad(date.getMinutes(), 2))
					.replace("s", pad(date.getSeconds(), 2))
					.replace("w", this.weekNumber(date))
					.replace("l", date.getDay())
					.replace("Y", date.getFullYear())
					.replace("M", monthNames[date.getMonth()]);
			},
			format:function(format, date){ //Alias para date
				if ( !date ) date = new Date();
				if ( date instanceof String || typeof date === "string" ) date = this.strtodate(date);

				if (!date) throw("No se pudo aplicar el formato; el segundo argumento no es una fecha válida: ");
				
				return format
					.replace("t", (new Date(date.getFullYear(), date.getMonth()+1, 0)).getDate())
					.replace("d", pad(date.getDate(), 2))
					.replace("m", pad(date.getMonth()+1, 2))
					.replace("H", pad(date.getHours(), 2))
					.replace("i", pad(date.getMinutes(), 2))
					.replace("s", pad(date.getSeconds(), 2))
					.replace("w", this.weekNumber(date))
					.replace("l", date.getDay())
					.replace("Y", date.getFullYear())
					.replace("M", monthNames[date.getMonth()]);
			},
			monday:function(date){
				date = date === undefined ? new Date():date;
				
				var day = date.getDay();
				var diff = date.getDate() - day + (day == 0 ? -6:1); // ajustar cuando es domingo
				var monday = new Date(date);
				monday.setDate(diff);
				
				monday.setHours(0);
				monday.setMinutes(0);
				monday.setSeconds(0);
				monday.setMilliseconds(0);
				
				return monday;
			},
			add:function(date, expr){
				var matches = expr.match(/^([+-]?\d+) (days?|months?|years?|hours?|minutes?|seconds?)$/);
				var value = parseInt(matches[1]);
				var measure = matches[2];

				switch(measure.toLowerCase()){
					case "days": case "day" : date.setDate(date.getDate() + value); break;
					case "months": case "month" : date.setMonth(date.getMonth() + value); break;
					case "years": case "year" : date.setFullYear(date.getFullYear() + value); break;
					case "hours": case "hour" : date.setTime(date.getTime() + (value*60*60*1000)); break;
					case "minutes": case "minute" : date.setTime(date.getTime() + (value*60*1000)); break;
					case "seconds": case "second" : date.setTime(date.getTime() + (value*1000)); break;
				}
			},
			lastDayOfMonth:function(date){
				var day = new Date(date.getFullYear(), date.getMonth()+1, 0);
				return day;
			},
			firstDayOfMonth:function(date){
				var day = new Date(date.getFullYear(), date.getMonth(), 1);
				return day;
			},
			weekNumber:function(date){
				//La parte comentada, en lugar de usar el lunes como referencia, usa el jueves del 1 de enero para calcular si la semana es uno o 0: lo comento por si nos lo exigen.
				//var d = new Date(date);
				//d.setHours(0,0,0,0);
				//d.setDate(d.getDate()+4-(d.getDay()||7));
				var d = this.monday(date);
				return Math.ceil((((d-new Date(d.getFullYear(),0,1))/8.64e7)+1)/7);
			}
		}
	})	
})();

(function(){ 'use strict' //INPUTS
	angular.module('ngDate').directive('input', function (ngDate) {
		return {
			restrict: 'E',
			require: '?ngModel',
			link: function(scope, element, attrs, ctrl) {
				if (!ctrl) return;
				if ( attrs.type != "date" ) return;
				
				ctrl.$parsers.push(function(value) {
					return ngDate.format("d-m-Y", value);
				});
				ctrl.$formatters.push(function(value) {
					return ngDate.strtodate(value);
				});
			}
		};
	});
})();

(function(){ 'use strict' //scheduler-event
	angular.module('ngDate').directive('schedulerEvent', function($timeout) {
		return {
			restrict: 'C',
			replace:true,
			require: '^scheduler',
			scope: { 
				startTime:'@' ,
				endTime:'@',
				weekday:'@',
				monthday:'@',
				startDate:'@',
				endDate:'@',
				color:'@',
				name:"@",
				schedule:"@",
				allDay:"=",
				click:"&"
			},
			
			link:function (scope, elem, attr, SchedulerCtrl) {
				var event = {
					startTime:scope.startTime,
					endTime:scope.endTime,
					weekday:scope.weekday,
					monthday:scope.monthday,
					startDate:scope.startDate,
					endDate:scope.endDate,
					color:scope.color,
					name:scope.name,
					schedule:scope.schedule,
					allDay:scope.allDay,
					click:scope.click
				}
				SchedulerCtrl.addEvent(event);
			}
		}
	})
})();

(function(){ 'use strict' //scheduler
	angular.module('ngDate').directive("scheduler", ["$compile", "$timeout", "ngDate", "ColorService", "ngDate.PATH", function($compile, $timeout, ngDate, ColorService, PATH){
		function pad(n, width, z) {
			z = z || '0';
			n = n + '';
			return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
		}
		
		
		var Scheduler = {textProcessor:{}};
		Scheduler.textProcessor.getDayName = function(i){
			var d = ngDate.monday();
			ngDate.add(d, (i-1) + " days");
			return d.toLocaleString(window.navigator.language, {weekday: "long"});
		};
		
		var ctrlFn = function($scope, $element, $attrs){
			var self = this;
			self.schedule = self.schedule || "weekly";
			self.events = self.ngModel || [];
			
			for ( var i = 0; i < self.events.length; i++ ){
				if ( "weekDay" in self.events[i] )  self.events[i].weekday = self.events[i].weekDay;
			}

			if ( typeof self.editable == "undefined" ) self.editable = true;

			self.size = self.size ? self.size : 13;
			self.color = self.color ? self.color : "rgb(115, 135, 156)";
			self.color2 = ColorService.lighter(self.color);

			self.style = {
				fontSize:self.size+"px",
				color:self.color,
				height: "100%",
				overflow: "auto",
				border: "1px solid lightgray",
				borderRadius: "1px"
			}
			
			self.map = [];
			
			self.build = function(){
				switch ( self.schedule ){
					case "daily":{
						self.map = [];
						for ( var j = 0; j < 24; j++ ){
							self.map[j] = self.getEvents(self.from, j);
						}	
						//El índice 24 corresponde a eventos de todo el día
						self.map[24] = self.getEvents(self.from);
					}
					break;
					case "weekly":{
						self.weekdays = [];
						self.map = [ [], [], [], [], [], [], [] ]; //Cada subarray corresponde a un día de la semana
						
						for ( i=0; i < 7; i++ ){
							var weekday = ngDate.monday(self.from);
							ngDate.add(weekday, i+" days");
							self.weekdays.push(weekday);
								
							for ( var j = 0; j < 24; j++ ){
								self.map[i][j] = self.getEvents(weekday, j);
							}
							
							//El índice 24 corresponde a eventos de todo el día
							self.map[i][24] = self.getEvents(weekday);
						}
					}
					break;
					case "monthly":{
						self.weeks = [];
						self.map = [ [], [], [], [], [], [] ]; //Cada subarray corresponde a una semana del mes
						
						var w0 = parseInt(ngDate.date("w", self.from));
						var w1 = parseInt(ngDate.date("w", self.to));
						
						//Si corresponde a la última semana del año anterior, actuamos en consecuencia
						if ( w0 > w1 ) w0 = 0;

						for ( var i = w0; i <= w1; i++ ){
							var week = {
								firstDay: ngDate.strtodate(self.from.getFullYear()+"W"+i),
								weekdays:[]
							}
							week.lastDay = new Date(week.firstDay); 
							ngDate.add(week.lastDay, "6 days");
							
							for ( var j = 0; j < 7; j++ ){
								var weekday = new Date(week.firstDay);
								ngDate.add(weekday, j+" days");
								week.weekdays.push(weekday);
								
								self.map[i - w0][j] =  self.getEvents(weekday); //Aquí restamos w0: necesitamos que los indices comiencen en 0
							}
							
							self.weeks.push(week);
						}
					}
					break;
				}
				
				self.hours = []; for ( var i=0; i < 24; i++ ) self.hours.push(i);
				self.minutes = []; for ( var i=0; i < 60; i++ ) self.minutes.push(i);
			}

			self.addEvent = function(ev){
				var len = $element.find(".scheduler-event").length;
				//if ( !ev.color ) ev.color = self.color2;
				self.events.push(ev);
			}

			self.getEvents = function(day, hour){
				var events = self.events.filter(function(ev){
					//Comprobar día de la semana
					if ( ev.weekday ){
						var eventWeekday = ev.weekday;
						var weekday = day.getDay();
						if ( weekday != eventWeekday ) return false;
					}
					if (ev.monthday){
						var eventMonthday = ev.monthday;
						var monthday = day.getDate();
						if ( monthday != eventMonthday ) return false;
					}
					
	
					//Comprobar fecha de inicio del evento
					if ( ev.startDate ){
						var eventStartDate = ngDate.strtodate(ev.startDate);
						if ( day < eventStartDate ) return false;
					}
						
					//Comprobar fecha de fin del evento
					if ( ev.endDate ){
						var eventEndDate = ngDate.strtodate(ev.endDate);
						if ( day > eventEndDate ) return false;
					}
					
					//Comprobar el schedule
					if ( ev.schedule ){
						switch( ev.schedule ){
							case "weekly": break;
							case "oddly":{
								var w = ngDate.date("w", day);
								if ( w % 2 == 0 ) return false;
							}
							break;
							case "evenly":{
								var w = ngDate.date("w", day);
								if ( w % 2 == 1 ) return false;
							}
							break;
						}
					}

					//Comprobar hora de inicio
					if ( hour !== undefined ){
						if ( !ev.startTime ) return false;
						
						var hInicio = ngDate.strtodate(ev.startTime).getHours();
						if ( hInicio != hour  ) return false;
					}
					//Si no pedimos la hora, y estamos en modo semana, quitamos todos los que no sean de todo el día.
					if ( hour === undefined ){
						if ( self.schedule == "weekly" && !ev.allDay ) return false;
					}
	
					
					return true;
				});

				return events;
			}

			self.getStyle = function(ev){
				if ( ev.allDay ){
					
				}
				else{
					var top = 100*ngDate.strtodate(ev.startTime).getMinutes()/60;
					var height = 100*(ngDate.strtodate(ev.endTime) - ngDate.strtodate(ev.startTime))/(60*60*1000);
				}
				

				var style = {
					background:ev.color,
				}
				
				switch (self.schedule){
					case "monthly":{
						//style.height = (self.size*1.618+11)+"px";
					}
					break;
					case "weekly":{
						if ( ev.allDay ){
							style.position = "relative";
						}
						else{
							style.top = top+"%";
							style.height = height+"%";
						}
					}
					break;
				}
				
				return style;
			}
			
			self.next = function(){
				switch(self.schedule){
					case "weekly": ngDate.add(self.from, "7 days"); break;
					case "daily": ngDate.add(self.from, "1 days"); break;
					case "monthly": ngDate.add(self.from, "1 month"); break;
				}
				self.setDate(self.from);
			}
			self.prev = function(){
				switch(self.schedule){
					case "weekly": ngDate.add(self.from, "-7 days"); break;
					case "daily": ngDate.add(self.from, "-1 days"); break;
					case "monthly": ngDate.add(self.from, "-1 month"); break;
				}
				self.setDate(self.from);
			}
			self.today = function(){
				self.setDate(ngDate.today());
			}
			self.setDate = function(date){
				switch(self.schedule){
					case "daily":{
						self.from = date;
						self.to = date;
					}
					break;
					case "weekly":{
						self.from = ngDate.monday(date);
						self.to = new Date(self.from);
						ngDate.add(self.to, "7 days");
					}
					break;
					case "monthly":{
						self.from = ngDate.firstDayOfMonth(date);
						self.to = ngDate.lastDayOfMonth(date);
					}
					break;
				}
				
				
				
				self.build();
			}
			
			
			self.openEditor = function(day, hour){
				var weekday = day.getDay() == 0 ? 7 : day.getDay();

				self.EventCreator = {startTime:{}, endTime:{}};
				self.EventCreator.weekdays = [false, false, false, false, false, false, false];
				self.EventCreator.weekdays[weekday - 1] = true;
				
				if ( hour ){
					self.EventCreator.startTime.hour = hour;
					self.EventCreator.endTime.hour = hour+1;
					self.EventCreator.allDay = false;
				}
				else{
					self.EventCreator.startTime.hour = 0;
					self.EventCreator.endTime.hour = 1;
					self.EventCreator.allDay = true;
				}
				
				self.EventCreator.startTime.minute = 0;
				self.EventCreator.endTime.minute = 0;
				self.EventCreator.schedule = self.schedule;
				
				self.editMode = true;
			}
			self.createEvent = function(){
				var events = [];
				for ( var i = 0; i < self.EventCreator.weekdays.length; i++ ){
					var weekdayChecked = self.EventCreator.weekdays[i];
					var allDay = self.EventCreator.allDay;

					if ( weekdayChecked ){
						var weekday = i+1 == 7 ? 0: i+1;
						var event = {
							weekday: weekday,
							schedule:self.EventCreator.schedule
						}
	
						if ( self.EventCreator.allDay ){
							event.allDay = true;
							event.name = "Todo el día";
						}
						else{
							event.startTime = pad(self.EventCreator.startTime.hour, 2)+":"+pad(self.EventCreator.startTime.minute, 2);
							event.endTime = pad(self.EventCreator.endTime.hour, 2)+":"+pad(self.EventCreator.endTime.minute, 2);
							
							event.name = event.startTime+" - " + event.endTime;
						}
						
						self.addEvent(event);
					}
				}
				self.EventCreator = {startTime:{}, endTime:{}};
				self.editMode = false;
				
				self.build();
			}
			self.click = function(o){
				o.ev.click(o);
				event.stopPropagation();
			}
			self.delete = function(ev){
				self.events.splice(self.events.indexOf(ev),1);
				if ( self.selectedDay ) self.selectedEvents.splice(self.selectedEvents.indexOf(ev),1);
				self.build();
				event.stopPropagation();
			}
			self.viewMore = function(day){
				self.selectedEvents = self.getEvents(day);
				self.selectedDay = day;
				event.stopPropagation();
			}
			
			self.today();
			
			
			self.getText = function(){
				var groups = {};
				
				for (var i = 0; i < self.events.length; i++ ){
					var ev = self.events[i];
					if ( ev.endTime == "23:59:59" ) var index = ev.startTime+" - 00:00";
					else var index = ev.startTime+" - "+ev.endTime;
					if ( !(index in groups) ) groups[index] = [ev];
					else groups[index].push(ev);
				}
				
				var textos = [];
				for ( i in groups ){
					var events = groups[i];
					var __eventos = [];
					for ( var j = 0; j < events.length; j++ ){
						var ev = events[j];
						if ( j == 0 ) {
							__eventos.push(ev);
						}
						else{
							if ( ( parseInt(ev.weekday) == parseInt(lastDay) + 1 ) || (lastDay == 6 && ev.weekday == 0) ){
								__eventos.push(ev);
							}
							else{
								if ( __eventos.length > 2 ){
									var text = 
										"De"+
										" " +
										Scheduler.textProcessor.getDayName(__eventos[0].weekday) +  
										" " +
										"a"+
										" " +
										Scheduler.textProcessor.getDayName(__eventos[__eventos.length - 1].weekday) +  
										", " +i;
								}
								else if ( __eventos.length == 2 ){
									var text = 
										Scheduler.textProcessor.getDayName(__eventos[0].weekday) +  
										" " +
										"y"+
										" " +
										Scheduler.textProcessor.getDayName(__eventos[1].weekday) +  
										", " +i;
								}
								else{
									var text = 
										Scheduler.textProcessor.getDayName(__eventos[0].weekday) +  
										", " +i;
								}
								textos.push(text);
								__eventos = [ev];
							}
						}
						var lastDay = ev.weekday;
					}
					
					
					if ( __eventos.length > 2 ){
						var text = 
							"De"+
							" " +
							Scheduler.textProcessor.getDayName(__eventos[0].weekday) +  
							" " +
							"a"+
							" " +
							Scheduler.textProcessor.getDayName(__eventos[__eventos.length - 1].weekday) +  
							", " +i;
					}
					else if ( __eventos.length == 2 ){
						var text = 
							Scheduler.textProcessor.getDayName(__eventos[0].weekday) +  
							" " +
							"y"+
							" " +
							Scheduler.textProcessor.getDayName(__eventos[1].weekday) +  
							", " +i;
					}
					else{
						var text = 
							Scheduler.textProcessor.getDayName(__eventos[0].weekday) +  
							", " +i;
					}
					textos.push(text);
				}
				
				return textos.join(", ");
			}

			self.getWeeklyHours = function(){
				var hours = 0;
				for ( var i=0; i < self.events.length; i++ ){
					var d1 = ngDate.strtodate(self.events[i].startTime);
					var d2 = ngDate.strtodate(self.events[i].endTime);
					hours+= Math.abs(d1 - d2) / 36e5;
				}
				return hours;
			}
			
			
			//Chapuza al canto: corregir cuando tengamos más tiempo
			$timeout(function(){
				self.build();
			}, 100);
		}
		
		var linkFn = function($scope, $element, $attrs, ngModelCtrl){
			var SchedulerCtrl = $scope.SchedulerCtrl;
			$scope.pad = pad;

			var watchers = [
				$scope.$watch("SchedulerCtrl.EventCreator.allDays", function(newValue, oldValue){
					if ( newValue === true && SchedulerCtrl.EventCreator.weekdays ){
						for ( var i = 0; i < SchedulerCtrl.EventCreator.weekdays.length; i++ ){
							SchedulerCtrl.EventCreator.weekdays[i] = true;
						}
						
						SchedulerCtrl.EventCreator.laborableDays = false;
					}
				}),
				$scope.$watch("SchedulerCtrl.EventCreator.laborableDays", function(newValue, oldValue){
					if ( newValue === true && SchedulerCtrl.EventCreator.weekdays ){
						for ( var i = 0; i < SchedulerCtrl.EventCreator.weekdays.length; i++ ){
							if ( i < 5 ) SchedulerCtrl.EventCreator.weekdays[i] = true;
							else SchedulerCtrl.EventCreator.weekdays[i] = false; 
						}
						
						SchedulerCtrl.EventCreator.allDays = false;
					}
				}),
				$scope.$watch("SchedulerCtrl.schedule", function(newValue, oldValue){
					SchedulerCtrl.setDate(SchedulerCtrl.from);
				}),
				$scope.$watchCollection("SchedulerCtrl.events", function(newValue, oldValue){
					try{
						if ( SchedulerCtrl.schedule == 'weekly' ) SchedulerCtrl.text = SchedulerCtrl.getText();
						if ( SchedulerCtrl.schedule == 'weekly' ) SchedulerCtrl.weeklyHours = SchedulerCtrl.getWeeklyHours();
					}
					catch(err){
						
					}
					if ( newValue === oldValue ) return;
					if (ngModelCtrl) ngModelCtrl.$setViewValue(newValue);
				})
			];
		}
	
		var templateUrl = PATH + 'angular.scheduler.template.html';
	
		return{
			restrict:"C",
			/*template:"<ng-transclude style = 'display: inline-block;overflow: hidden; width:100%;'></ng-transclude>",*/
			templateUrl:templateUrl,
			replace:true,
			transclude:true,
			require:"?ngModel",
			bindToController:{
				schedule:"@",
				lang:"@",
				size:"=?",
				color:"@",
				ngModel:"=",
				editable:"=?",
				text:"=?",
				weeklyHours:"=?"
				
			},
			scope:{},
			controller:ctrlFn,
			controllerAs:"SchedulerCtrl",
			link:linkFn,
		}
	}])	
})();

(function(){ 'use strict' //decorar el filtro fecha
	angular.module('ngDate').config(function($provide) {
		$provide.decorator('dateFilter', ['$delegate', 'ngDate', function ($delegate, ngDate) {
			var originalFilter = $delegate;
			return parseDate;

			function parseDate(date, format, timezone) {
				if (! (date instanceof Date) ){
					date = ngDate.strtodate(date);
				}
				return originalFilter(date, format, timezone);
			}
		}]);
	});
})();

(function(){ 'use strict' //filtro para poner el nombre del día de la semana (0 es domingo);
	angular.module('ngDate').filter('weekday', function($filter, ngDate){
		return function(input) {
			var date = ngDate.monday();
			var diff = input == 0 ? -1 : input - 1;
			date.setDate(date.getDate() + diff);
			return $filter("date")(date, "EEEE");
		}
	})
})();

(function(){ 'use strict' //filtro para sacar la hora con los minutos a partir de un número normal (1.5 se convierte en 1:30)
	angular.module('ngDate').filter('time', function($filter) {
		return function(value){
			var hours = Math.floor(value);
			var minutes = ((value - hours)*3600)/60;
			
			var padHours = '', padMinutes = '';
			if ( hours < 10 ) padHours = "0";
			if ( minutes < 10 ) padMinutes = "0";
			
			return padHours+$filter('number')(hours, 0)+":"+padMinutes+$filter('number')(minutes, 0); 
		}
	});
})();