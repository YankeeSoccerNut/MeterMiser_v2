$(document).ready(()=>{
	var start
	var end
	
   $(function() {

        start = moment().subtract(29, 'days');
        console.log( `start: ${start}`);
        end = moment();
        console.log( `end: ${end}`);

        function cb(start, end) {
            $('#reportrange span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
            
        }

        $('#reportrange').daterangepicker({
            startDate: start,
            endDate: end,
            ranges: {
               'Today': [moment(), moment()],
               'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
               'Last 7 Days': [moment().subtract(6, 'days'), moment()],
               'Last 30 Days': [moment().subtract(29, 'days'), moment()],
               'This Month': [moment().startOf('month'), moment().endOf('month')],
               'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
            }
        }, cb);
        $('#reportrange').on('apply.daterangepicker',(ev, picker)=>{
        	updateData(picker.startDate,picker.endDate);
        	
        });

        cb(start, end);
        
    })
	// Set the dimensions of the canvas / graph	
	var margin = {top: 10, right: 20, bottom: 20, left: 60},
	    width = 400 - margin.left - margin.right,
	    height = 500 - margin.top - margin.bottom;

	// Adds the svg canvas
	var svg = d3.select("#graph-container") .append("svg")
	        .attr("width", width + margin.left + margin.right)
	        .attr("height", height + margin.top + margin.bottom)
	    .append("g")
	        .attr("transform",
	              "translate(" + margin.left + "," + margin.top + ")");

	// Define Ranges
	// var x = function(d) {return d.location;};
	var xScale = d3.scaleBand().range([0,width]).paddingInner(0.2).paddingOuter(0.1);
	
	// var y = function(d) {return d.value};
	

	// var settingRow = function(d) {return d.status};
	var settingRowScale = d3.scaleBand().paddingInner(0.25);

	// var storeHoursRow = function(d) {return d.}
	var storeHoursRowScale = d3.scaleBand().range([0, height]).paddingInner(0.2);

	

	// var colorScale = d3.scaleOrdinal().


	// Define Domains
	xScale.domain(['East Cobb', 'West Cobb', 'Roswell']);
	settingRowScale.domain(['Off', 'Scheduled', 'Hold - Temporary', 'Hold - Permanent']);
	storeHoursRowScale.domain(['Closed','Open']);
	settingRowScale.range([0,storeHoursRowScale.bandwidth()]);

	// Define the axes
	var xAxis = d3.axisBottom(xScale).ticks(3);
	var yAxis = d3.axisLeft(settingRowScale);

	var ySplitScale = d3.scaleLinear().range([settingRowScale.bandwidth(),0]);;
	var yStackScale = d3.scaleLinear().range([storeHoursRowScale.bandwidth(),0]);

	// Get the data
	d3.json('/api/Readings', function(error,data){
		console.log(data);
		
		
		var dataInRange = data.filter(function(d){
			return Date.parse(d.created) > Date.parse(start) && Date.parse(d.created) < Date.parse(end)
		})
		var holdsOnly = dataInRange.filter(function(d){
			return(d.systemSwitchPos != 2 && d.statusHeat > 0)
		})

		var dataFormated = formatJSON(dataInRange);
		// var holdsOnly = dataFormated.filter(function(d){
		// 	return(d.status == 'Hold - Temporary' || d.staus == 'Hold - Permanent')
		// })
		
		

		var dataByHours = nestedHours(dataFormated);
		
		var locationTimeSums =totalTimeByLocation(dataByHours);
		console.log(locationTimeSums);
		console.log(holdsData(holdsOnly, locationTimeSums));
		var dataByHoursPercents = percentValues(dataByHours);
		


		var startingTimeStamp = Date.parse(start);
		var endingTimeStamp = Date.parse(end);
		if(startingTimeStamp < dataFormated[0].dateTimeInfo.timeStamp){
			startingTimeStamp = dataFormated[0].dateTimeInfo.timeStamp
		}
		if(endingTimeStamp > dataFormated[dataFormated.length-1].endTimeInfo.timeStamp){
			endingTimeStamp = dataFormated[dataFormated.length-1].endTimeInfo.timeStamp
		}
		console.log(endingTimeStamp-startingTimeStamp)
		var totalMilliseconds = endingTimeStamp-startingTimeStamp;

		ySplitScale.domain([0,(endingTimeStamp-startingTimeStamp)])
		
		yStackScale.domain([0,1])
		

		// yStackScale.domain([0,d3.max(dataByLocation, function(d) {return d.value})])

		svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);


		var oRow = svg.append('g').attr('class', 'row')
            .selectAll('.row').data(dataByHoursPercents)
        .enter().append('g')
            .attr('class', 'hours-group')
            .attr("transform", function(d) {  return "translate(0," + storeHoursRowScale(d.key) + ")"; });

        oRow.append('text').attr('class', 'title')
	        .attr('dx', '-0.34em')
	        .text(function(d) {return d.key});

	    var gRow = oRow.append('g').attr('class', 'row')
            .selectAll('.row').data(function(d) {return d.values;})
        .enter().append('g')
            .attr('class', 'group')
            .attr('fill', function(d) { return colorScale(d); });

        // gRow.append('text').attr('class', 'title')
	       //  .attr('dx', '-0.34em')
	       //  .text(function(d) {return d.key});

         var bars = gRow.append('g').attr('class', 'bars');

        bars.selectAll(".bar-underlying").data(function(d) {return d.values;})
        	.enter().append('rect')
        		.attr('class', 'bar bar-underlying')
	            .attr('x', function(d) {return xScale(d.key);})
	            .attr('y', 0)
	            .attr('width', xScale.bandwidth())
	            .attr('height', function(d) { return yStackScale.range()[1];})
	            .style('fill', '#fff');



        bars.selectAll(".bar-overlying").data(function(d) {return d.values;})
        	.enter().append('rect')
        		.attr('class', 'bar bar-overlying')
	            .attr('x', function(d) {return xScale(d.key);})
	            .attr('y', function(d) {return yStackScale(d.stackSumPercByLocPerH + d.pByLocPerH);})
	            .attr('width', xScale.bandwidth())
	            .attr('height', function(d) { return yStackScale(0) - yStackScale(d.pByLocPerH);})


   
	         

	 //            

		 //check selected element in div with property 'check'
	    d3.selectAll("input")
	      .on("change", change);
	    
	    function change() {
		    if (this.value === "stacked") transitionStacked();
		    else transitionMultiples ();
	    }

	    d3.select("input[value=\"stacked\"]")
	    .property("checked", true)
	});





	function colorScale(d){
		if(d.key == 'Off'){
        		return '#BDC3C7'
    	}else if(d.key == 'Scheduled'){
    		return '#27AE60'
    	}else if(d.key == 'Hold - Temporary'){
    		return '#F1C40F'
    	}else if (d.key == 'Hold - Permanent'){
    		return '#E74C3C'
    	}
	}

	function formatJSON(rawData){
		var dataFormated = []
		rawData.forEach(function(d,i){
			dataFormated[i] = {};
			dataFormated[i].location = LocationName(d.thermostatId);
			dataFormated[i].dateTimeInfo = new DateTime(d.created);
			dataFormated[i].status = determineStatus(d.statusHeat, d.systemSwitchPos);
			if(i>2){
				dataFormated[i-3].endTimeInfo = new DateTime(d.created);
				if(i>=rawData.length - 3){
					dataFormated[i].endTimeInfo =new DateTime(Date.now());
				}
			}
			if(d.operatingHoursFlag == 0){
				dataFormated[i].operatingHours = 'Closed';
			}else{
				dataFormated[i].operatingHours = 'Open';
			}

		})
		return dataFormated;
	}


	function LocationName(thermostatId){
		if(thermostatId == 581279){
			return 'Roswell';
		}
		else if(thermostatId == 594679){
			return 'East Cobb';
		}
		else if(thermostatId == 597696){
			return 'West Cobb';
		}
		else{
			return 'Not Valid Id';
		}
	}

	function determineStatus(statusHeat,systemSwitchPos){
		if(systemSwitchPos == 1 || systemSwitchPos == 3){
			if(statusHeat == 0){
				return 'Scheduled';
			}else if(statusHeat == 1){
				return 'Hold - Temporary';
			}else if(statusHeat == 2){
				return 'Hold - Permanent'
			}
		}
		else if(systemSwitchPos == 2){
			return 'Off';
		}else{
			return 'error';
		}
	}
	var location_order = ['East Cobb', 'West Cobb', 'Roswell'];
	var setting_order = ['Hold - Permanent','Hold - Temporary', 'Scheduled', 'Off'];
	function nestedLocation(dataFormated){
		return d3.nest()
			.key(function(d) {return d.location}).sortKeys(function(a,b) { return location_order.indexOf(a) - location_order.indexOf(b); })
			.key(function(d) {return d.operatingHours}).sortKeys(d3.ascending)
			.key(function(d) {return d.status}).sortKeys(function(a,b) { return setting_order.indexOf(a) - setting_order.indexOf(b); })
			.entries(dataFormated);
	}
	function LocationSettingHours(dataFormated){
		return d3.nest()
			.key(function(d) {return d.location}).sortKeys(function(a,b) { return location_order.indexOf(a) - location_order.indexOf(b); })
			.key(function(d) {return d.status}).sortKeys(function(a,b) { return setting_order.indexOf(a) - setting_order.indexOf(b); })
			.key(function(d) {return d.operatingHours}).sortKeys(d3.ascending)
			.entries(dataFormated);
	}

	
	
	// function holdTally(holdsOnly){
	// 	var tallies = [];
	// 	var nestedHolds = nestedLocation(holdsOnly);
	// 	for(let i = 0; i < nestedData.length; i++){
	// 		for(let j = 0; j < nestedData[i].values.length; j++){
	// 			for(let k = 0; k < nestedData[i].values[j].values.length; k++){
	// 				var loc = nestedData[i].key;
	// 				var hrs = nestedData[i].values[j].key;
	// 				var numDays = 0;
	// 				var curTime = 0;
	// 				var totalTime = 0;
	// 				var hoursinMS = 60*60*1000;
	// 				for(let m = 0; m < nestedData[i].values[j].values[k].values.length; m++){
	// 					var n = nestedData[i].values[j].values[k].values[m];
	// 					if(n.dateTimeInfo.timeStamp > (curTime+(18*hoursinMS))){
	// 						numDays += 1;
	// 					}
	// 					curTime = n.dateTimeInfo.timeStamp;
	// 					totalTime += (n.endTimeInfo.timeStamp - n.dateTimeInfo.timeStamp);
	// 				}
				
	// 			}
	// 		}
	// 	}
	// 	return tallies;
	// }

	
	

	function nestedSetting(dataFormated){
		var nestedData = d3.nest()
			.key(function(d) {return d.status}).sortKeys(function(a,b) { return setting_order.indexOf(a) - setting_order.indexOf(b); })
			.key(function(d) {return d.location}).sortKeys(function(a,b) { return location_order.indexOf(a) - location_order.indexOf(b); })
			.rollup(function(v) { return d3.sum(v, function(d) { 
				return d.endTimeInfo.timeStamp-d.dateTimeInfo.timeStamp; })})
			.entries(dataFormated);

		var ecSum = 0;
		var wcSum = 0;
		var rSum = 0;
		for(let i = 0; i < nestedData.length; i++){
			switch (nestedHoursData[i].values[j].key) {
					case 'Hold - Permanent':
						timeByLocal.ph[h] = nestedHoursData[i].values[j].settingSum;
						timeByLocal.ph[0] += nestedHoursData[i].values[j].settingSum;
					case 'Hold - Temporary':
						timeByLocal.th[h] = nestedHoursData[i].values[j].settingSum;
						timeByLocal.th[0] += nestedHoursData[i].values[j].settingSum;
					case 'Scheduled':
						timeByLocal.s[h] = nestedHoursData[i].values[j].settingSum;
						timeByLocal.s[0] += nestedHoursData[i].values[j].settingSum;
					case 'Off':
						timeByLocal.o[h] = nestedHoursData[i].values[j].settingSum;
						timeByLocal.o[0] += nestedHoursData[i].values[j].settingSum;
				}
			for(let j = 0; j < nestedData[i].values.length; j++){
				if(nestedData[i].values[j].key == 'East Cobb'){
					nestedData[i].values[j].stackSum = ecSum;
					ecSum += nestedData[i].values[j].value;
				}else if(nestedData[i].values[j].key == 'West Cobb'){
					nestedData[i].values[j].stackSum = wcSum;
					wcSum += nestedData[i].values[j].value;
				}else if(nestedData[i].values[j].key == 'Roswell'){
					nestedData[i].values[j].stackSum = rSum;
					rSum += nestedData[i].values[j].value;
				}
			}

		}
		return nestedData;
	}

	// function percentageThreshold(type, cp, op, ap){
	// 	this.type = type;
	// 	this.maxPercent = {'Closed': cp}, 'Open': op, 'All Hours': ap};
	// }

	var holdsThresholdArray =[['Hold - Temporary',33,67,50],['Hold - Permanent',25,50,33],['Hold - Any',33,50,50]];
	console.log(holdsThresholdArray)

	function holdsData(holdsOnly, timeByLocal,thresholds){
		var analysis = [];		
		var formatedHolds =formatJSON(holdsOnly);
		var nestedHolds = d3.nest()
			.key(function(d) {return d.location}).sortKeys(function(a,b) { return location_order.indexOf(a) - location_order.indexOf(b); })
			.key(function(d) {return d.operatingHours}).sortKeys(d3.ascending)
			.key(function(d) {return d.status}).sortKeys(function(a,b) { return setting_order.indexOf(a) - setting_order.indexOf(b); })
			.rollup(function(v) { return d3.sum(v, function(d) { 
				return d.endTimeInfo.timeStamp-d.dateTimeInfo.timeStamp; })})
			.entries(formatedHolds);

		var pHoldTotal = [0,0,0];
		var tHoldTotal = [0,0,0];
		for(let i = 0; i < nestedHolds.length; i++){ //i locations
			var t;
			switch(nestedHolds[i].key) {
				case 'East Cobb':
					t = timeByLocal.ec;
				case 'West Cobb':
					t = timeByLocal.wc;
				case 'Roswell':
					t = timeByLocal.r;
			}
			var pHold = 0;
			var tHold = 0;
			for(let j = 0; j < nestedHolds[i].values.length; j++){ // j hours (0 close 1 open // time 0 any 1 close 2 open)
				var timeIndex;
				if(nestedHolds[i].values[j].key == 'Closed'){
					timeIndex = 1;
				}else{
					timeIndex = 2;
				}
				console.log(timeIndex)
				var anyHold = 0;
				for(let k = 0; k < nestedHolds[i].values[j].values.length; k++){ //k settings
					nestedHolds[i].values[j].values[k].percentage = Math.round(100*nestedHolds[i].values[j].values[k].value/t[timeIndex]);
					anyHold += nestedHolds[i].values[j].values[k].value;
					if(nestedHolds[i].values[j].values[k].key == 'Hold - Permanent'){
						if(nestedHolds[i].values[j].values[k].percentage >= holdsThresholdArray[1][j+1]){
							analysis.push(`Threshold exceeded: ${nestedHolds[i].key} is on permanent hold for ${nestedHolds[i].values[j].values[k].percentage}% the time store is ${nestedHolds[i].values[j].key}`)
						}
						pHold += nestedHolds[i].values[j].values[k].value;
						pHold[timeIndex] += nestedHolds[i].values[j].values[k].value;
					}else{
						if(nestedHolds[i].values[j].values[k].percentage >= holdsThresholdArray[0][j+1]){
							analysis.push(`Threshold exceeded: ${nestedHolds[i].key} is on temporary hold for ${nestedHolds[i].values[j].values[k].percentage}% the time store is ${nestedHolds[i].values[j].key}`)
						}
						tHold += nestedHolds[i].values[j].values[k].value;
						tHold[timeIndex] += nestedHolds[i].values[j].values[k].value;
					}
				}
				if(nestedHolds[i].values[j].values.length > 1){
					nestedHolds[i].values[j].values[2] = {};
					nestedHolds[i].values[j].values[2].key = 'Hold - Any';
					nestedHolds[i].values[j].values[2].value = anyHold;
					nestedHolds[i].values[j].values[2].percentage = Math.round(100*anyHold/t[j+1]);
					if(nestedHolds[i].values[j].values[2].percentage >= holdsThresholdArray[2][j+1]){
							analysis.push(`Threshold exceeded: ${nestedHolds[i].key} is set to hold for ${nestedHolds[i].values[j].values[2].percentage}% the time store is ${nestedHolds[i].values[j].key}`)
						}
				}
			}
			if(nestedHolds[i].values.length > 1){
				nestedHolds[i].values[2] = {};
				nestedHolds[i].values[2].key = 'All Hours';
				nestedHolds[i].values[2].values = [];
				if(pHold > 0 && tHold > 0){
					nestedHolds[i].values[2].values.push({'key': 'Hold - Temporary', 'value': tHold, 'percentage': Math.round(100*tHold/t[0])});
					nestedHolds[i].values[2].values.push({'key': 'Hold - Permanent', 'value': pHold, 'percentage': Math.round(100*pHold/t[0])});
					nestedHolds[i].values[2].values.push({'key': 'Hold - Any', 'value': (tHold + pHold), 'percentage': Math.round(100*(tHold+pHold)/t[0])});
					if(nestedHolds[i].values[2].values[2].percentage >= holdsThresholdArray[1][3]){
						analysis.push(`Threshold exceeded: ${nestedHolds[i].key} is set to permanent hold for ${nestedHolds[i].values[2].values[3].percentage}% of time store is ${nestedHolds[i].values[j].key}`)
					}
					if(nestedHolds[i].values[2].values[3].percentage >= holdsThresholdArray[2][3]){
						analysis.push(`Threshold exceeded: ${nestedHolds[i].key} is set to hold for ${nestedHolds[i].values[2].values[3].percentage}% of time store is ${nestedHolds[i].values[j].key}`)
					}
				}else if(pHold > 0){
					nestedHolds[i].values[2].values.push({'key': 'Hold - Permanent', 'value': pHold, 'percentage': Math.round(100*pHold/t[0])});					// nestedHolds[i].values[2].values[0].percentage = pHold/t[0];
				}else if(tHold >0){
					nestedHolds[i].values[2].values.push({'key': 'Hold - Temporary', 'value': tHold, 'percentage': Math.round(100*tHold/t[0])});
				}

				if(nestedHolds[i].values[2].values[0].key == 'Hold - Temporary'){
					if(nestedHolds[i].values[2].values[0].percentage >= holdsThresholdArray[0][3]){
						analysis.push(`Threshold exceeded: ${nestedHolds[i].key} is set to temporary hold for ${nestedHolds[i].values[2].values[0].percentage}% of the time`)
					}
				}else{
					if(nestedHolds[i].values[2].values[0].percentage >= holdsThresholdArray[1][3]){
						analysis.push(`Threshold exceeded: ${nestedHolds[i].key} is set to permanent hold for ${nestedHolds[i].values[2].values[0].percentage}% of the time`)
					}
				}	
			}
		}
		
	
			


		pHold[0] = pHold[1]+pHold[2];
		tHold[0] = tHold[1]+tHold[2];

		var hoursTypes = ['Closed', 'Open', 'All Hours'];
		var holdTypes = ['Hold - Temporary','Hold - Permanent','Hold - Any'];
		var n = nestedHolds.length;

		nestedHolds[n] = {};
		nestedHolds[n].key = 'All Locations';
		nestedHolds[n].values = [];
		var locationsTotal = nestedHolds[n];
		for(let i = 0; i<hoursTypes.length; i++){
			var v = 0;
			if(i<2){
				v = i+1;
			};
			locationsTotal.values.push({'key': hoursTypes[i], 'values': []});
			for(let j = 0; j < holdTypes.length; j++){
				if(j == 0){
					locationsTotal.values[i].values.push({'key': holdTypes[i], 'value': tHold[v], 'percentage': Math.round(100*tHold[v]/timeByLocal.total[v])});
				}else if(j == 1){
					locationsTotal.values[i].values.push({'key': holdTypes[i], 'value': pHold[v], 'percentage': Math.round(100*pHold[v]/timeByLocal.total[v])});
				}else{
					locationsTotal.values[i].values.push({'key': holdTypes[i], 'value': (tHold[v]+pHold[v]), 'percentage': Math.round(100*(tHold[v]+pHold[v])/timeByLocal.total[v])});
				}
			}
		}

		

	


		return {nestedHolds,analysis}
		
	}


	function nestedHours(dataFormated){
		var nestedData = d3.nest()
			.key(function(d) {return d.operatingHours}).sortKeys(d3.ascending)
			.key(function(d) {return d.status}).sortKeys(function(a,b) { return setting_order.indexOf(a) - setting_order.indexOf(b); })
			.key(function(d) {return d.location}).sortKeys(function(a,b) { return location_order.indexOf(a) - location_order.indexOf(b); })
			.rollup(function(v) { return d3.sum(v, function(d) { 
				return d.endTimeInfo.timeStamp-d.dateTimeInfo.timeStamp; })})
			.entries(dataFormated);

		
		for(let i = 0; i < nestedData.length; i++){
			var ecSum = 0;
			var wcSum = 0;
			var rSum = 0;
			var locSum = [ecSum,wcSum,rSum];
			for(let j = 0; j < nestedData[i].values.length; j++){
				var settingSum = 0;
				for(let k = 0; k < nestedData[i].values[j].values.length; k++){
					var s;
					switch(nestedData[i].values[j].values[k].key) {
						case 'East Cobb':
							s = 0;
						case 'West Cobb':
							s = 1;
						case 'Roswell':
							s = 2;
					}
					nestedData[i].values[j].values[k].stackSum = locSum[s];
					locSum[s] += nestedData[i].values[j].values[k].value;
					settingSum += nestedData[i].values[j].values[k].value;
					
				}
				nestedData[i].values[j].settingSum = settingSum;
			}
			nestedData[i].hoursSum = d3.sum(function(i){return locSum[i]});
			nestedData[i].ecSum = locSum[0];
			nestedData[i].wcSum = locSum[1];
			nestedData[i].rSum = locSum[2];
		}
		return nestedData;	
	}

	function totalTimeByLocation(nestedHoursData){
		var timeByLocal = {
			ec: [0],
			wc: [0],
			r: [0],
			ph: [0,0,0],
			th: [0,0,0],
			s: [0,0,0],
			o: [0,0,0],
			total: [0]
		};
		for(let i = 0; i < nestedHoursData.length; i++){
			var h;
			if(nestedHoursData[i].key == 'Closed'){
				h = 1;
			}else{
				h = 2;
			}
			timeByLocal.ec[h] = nestedHoursData[i].ecSum;
			timeByLocal.ec[0] += nestedHoursData[i].ecSum;
			timeByLocal.wc[h] = nestedHoursData[i].wcSum;
			timeByLocal.wc[0] += nestedHoursData[i].wcSum;
			timeByLocal.r[h] = nestedHoursData[i].rSum;
			timeByLocal.r[0] +=nestedHoursData[i].rSum;
			timeByLocal.total[h] = timeByLocal.ec[h]+timeByLocal.wc[h]+timeByLocal.r[h];
			timeByLocal.total[0] += timeByLocal.ec[h]+timeByLocal.wc[h]+timeByLocal.r[h];
			for(let j = 0; j < nestedHoursData[i].values.length; j++){
				switch (nestedHoursData[i].values[j].key) {
					case 'Hold - Permanent':
						timeByLocal.ph[h] = nestedHoursData[i].values[j].settingSum;
						timeByLocal.ph[0] += nestedHoursData[i].values[j].settingSum;
					case 'Hold - Temporary':
						timeByLocal.th[h] = nestedHoursData[i].values[j].settingSum;
						timeByLocal.th[0] += nestedHoursData[i].values[j].settingSum;
					case 'Scheduled':
						timeByLocal.s[h] = nestedHoursData[i].values[j].settingSum;
						timeByLocal.s[0] += nestedHoursData[i].values[j].settingSum;
					case 'Off':
						timeByLocal.o[h] = nestedHoursData[i].values[j].settingSum;
						timeByLocal.o[0] += nestedHoursData[i].values[j].settingSum;
				}

			}
		}
		return timeByLocal
	}

	function percentValues(nestedHoursData){
		var timeByLocal = totalTimeByLocation(nestedHoursData);
		var nestedData = nestedHoursData;

		for(let i = 0; i < nestedData.length; i++){
			for(let j = 0; j < nestedData[i].values.length; j++){
				for(let k = 0; k < nestedData[i].values[j].values.length; k++)
					if(nestedData[i].values[j].values[k].key == 'East Cobb'){
						nestedData[i].values[j].values[k].pByLoc = nestedData[i].values[j].values[k].value/timeByLocal.ec[0];
						nestedData[i].values[j].values[k].pByLocPerH = nestedData[i].values[j].values[k].value/timeByLocal.ec[i+1];
						nestedData[i].values[j].values[k].stackSumPercByLoc = nestedData[i].values[j].values[k].stackSum/timeByLocal.ec[0];
						nestedData[i].values[j].values[k].stackSumPercByLocPerH = nestedData[i].values[j].values[k].stackSum/timeByLocal.ec[i+1];
					}else if(nestedData[i].values[j].values[k].key == 'West Cobb'){
						nestedData[i].values[j].values[k].pByLoc = nestedData[i].values[j].values[k].value/timeByLocal.wc[0];
						nestedData[i].values[j].values[k].pByLocPerH = nestedData[i].values[j].values[k].value/timeByLocal.wc[i+1];
						nestedData[i].values[j].values[k].stackSumPercByLoc = nestedData[i].values[j].values[k].stackSum/timeByLocal.wc[0];
						nestedData[i].values[j].values[k].stackSumPercByLocPerH = nestedData[i].values[j].values[k].stackSum/timeByLocal.wc[i+1]
					}else if(nestedData[i].values[j].values[k].key == 'Roswell'){
						nestedData[i].values[j].values[k].pByLoc = nestedData[i].values[j].values[k].value/timeByLocal.r[0];
						nestedData[i].values[j].values[k].pByLocPerH = nestedData[i].values[j].values[k].value/timeByLocal.r[i+1];
						nestedData[i].values[j].values[k].stackSumPercByLoc = nestedData[i].values[j].values[k].stackSum/timeByLocal.r[0];
						nestedData[i].values[j].values[k].stackSumPercByLocPerH = nestedData[i].values[j].values[k].stackSum/timeByLocal.r[i+1]
					}
					nestedData[i].values[j].settingP = nestedData[i].values[j].settingSum/timeByLocal.total[0];
					nestedData[i].values[j].settingPperH = nestedData[i].values[j].settingSum/timeByLocal.total[i+1];
			}
			
			nestedData[i].hoursP = nestedData[i].hoursSum/timeByLocal.total[0];


		}
		return nestedData;


	}



	

	
	function DateTime(dateString){
		this.timeStamp = Date.parse(dateString);
		this.dateComplete = new Date(dateString);
		this.year = this.dateComplete.getUTCFullYear();
		this.month = this.dateComplete.getUTCMonth();
		this.day = this.dateComplete.getUTCDay();
		this.date = this.dateComplete.getUTCDate();
		this.hour = this.dateComplete.getUTCHours();
		this.minute = this.dateComplete.getUTCMinutes();
	}

	

    function transitionMultiples() {
      var t = svg.transition()
          .duration(750),
        g = t.selectAll(".group")
          .attr("transform", function(d) {  return "translate(0," + settingRowScale(d.key) + ")"; });
        g.selectAll(".bar-underlying")
        	.attr('height', function(d) { return ySplitScale.range()[1];});
        g.selectAll(".bar-overlying")
          .attr('y', function(d) {return ySplitScale(d.value);})
	      .attr('height', function(d) { return ySplitScale(0) - ySplitScale(d.value);});
	  }
  
    function transitionStacked() {
        var t = svg.transition()
        .duration(750),
        g=t.selectAll(".group")
          .attr("transform", "translate(0,0)");
        g.selectAll(".bar-underlying")
        	.attr('height', function(d) { return yStackScale.range()[1];});
        g.selectAll(".bar-overlying")
        	.attr('y', function(d) {return yStackScale(d.stackSum + d.value);})
        	.attr('height', function(d) { return yStackScale(0) - yStackScale(d.value);});
    }

	function updateData(start,end){
		d3.json('/api/Readings', function(error,data){
			console.log(data);
			var dataInRange = data.filter(function(d){
				return Date.parse(d.created) > Date.parse(start) && Date.parse(d.created) < Date.parse(end)
			})
			var dataFormated = formatJSON(dataInRange)
			console.log(dataFormated)
			var dataByHours = nestedHours(dataFormated);
			console.log(dataByHours)
			// indications(dataFormated)
			// console.log(d3.max(dataBySetting, function(d){return d3.max(d, function(v){return v.value})}))


			var startingTimeStamp = Date.parse(start);
			var endingTimeStamp = Date.parse(end);
			if(startingTimeStamp < dataFormated[0].dateTimeInfo.timeStamp){
				startingTimeStamp = dataFormated[0].dateTimeInfo.timeStamp
			}
			if(endingTimeStamp > dataFormated[dataFormated.length-1].endTimeInfo.timeStamp){
				endingTimeStamp = dataFormated[dataFormated.length-1].endTimeInfo.timeStamp
			}
			console.log(endingTimeStamp-startingTimeStamp)
			var totalMilliseconds = endingTimeStamp-startingTimeStamp;

			ySplitScale.domain([0,(endingTimeStamp-startingTimeStamp)]);
			
			yStackScale.domain([0,(endingTimeStamp-startingTimeStamp)]);
			

			// yStackScale.domain([0,d3.max(dataByLocation, function(d) {return d.value})])

			svg.append("g")
	        .attr("class", "x axis")
	        .attr("transform", "translate(0," + height + ")")
	        .call(xAxis);


			var oRow = svg.append('g').attr('class', 'row')
	            .selectAll('.row').data(dataByHours)
	        .enter().append('g')
	            .attr('class', 'hours-group')
	            .attr("transform", function(d) {  return "translate(0," + storeHoursRowScale(d.key) + ")"; });

	        oRow.append('text').attr('class', 'title')
		        .attr('dx', '-0.34em')
		        .text(function(d) {return d.key});

		    var gRow = oRow.append('g').attr('class', 'row')
	            .selectAll('.row').data(function(d) {return d.values;})
	        .enter().append('g')
	            .attr('class', 'group')
	            .attr('fill', function(d) { return colorScale(d); });

	        // gRow.append('text').attr('class', 'title')
		       //  .attr('dx', '-0.34em')
		       //  .text(function(d) {return d.key});

	         var bars = gRow.append('g').attr('class', 'bars');

	        bars.selectAll(".bar-underlying").data(function(d) {return d.values;})
	        	.enter().append('rect')
	        		.attr('class', 'bar bar-underlying')
		            .attr('x', function(d) {return xScale(d.key);})
		            .attr('y', 0)
		            .attr('width', xScale.bandwidth())
		            .attr('height', function(d) { return yStackScale.range()[1];})
		            .style('fill', '#fff');



	        bars.selectAll(".bar-overlying").data(function(d) {return d.values;})
	        	.enter().append('rect')
	        		.attr('class', 'bar bar-overlying')
		            .attr('x', function(d) {return xScale(d.key);})
		            .attr('y', function(d) {return yStackScale(d.stackSum + d.value);})
		            .attr('width', xScale.bandwidth())
		            .attr('height', function(d) { return yStackScale(0) - yStackScale(d.value);})


	   
		         

		 //            

			 //check selected element in div with property 'check'
		    d3.selectAll("input")
		      .on("change", change);
		    
		    function change() {
			    if (this.value === "stacked") transitionStacked();
			    else transitionMultiples ();
		    }

		    d3.select("input[value=\"stacked\"]")
		    .property("checked", true);
	});
	}

	// function indications(dataFormated){
	// 	var dataByLocation = nestedLocation(dataFormated);
	// 	// var tallies = holdTally(dataByLocation);
	// 	var div = d3.select('#table-container').append("div");
	// 	for(x in tallies){
	// 		for(y in tallies[x]){
	// 			for(z in tallies[x][y]){
	// 				console.log(`At ${x}, the thermostat was set to ${z} ${z.numDays} for a total of ${moment.duration(z.totalTime).humanize()} milliseconds`)

	// 			}
	// 		}
	// 	}
	
	// }

	function tabulate(data, columns) {
		formatTimeTable = d3.timeFormat('%a %b %-d %-I:%M %p');
	    var table = d3.select("#table-container").append("table")
	            .attr("id","performance-table")
	            .attr("class","table")
	            .attr("class","table-striped")
	            .attr("class","table-bordered")
	            .attr("cellspacing", "0")
	            .attr("width",'100%'),
	        thead = table.append("thead"),
	        tbody = table.append("tbody");

	    // append the header row
	    thead.append("tr")
	        .selectAll("th")
	        .data(columns)
	        .enter()
	        .append("th")
	            .text(function(column) { return column; });

	    // create a row for each object in the data
	    var rows = tbody.selectAll("tr")
	        .data(data)
	        .enter()
	        .append("tr");

	    // create a cell in each row for each column
	    var cells = rows.selectAll("td")
	        .data(function(d) {
	            return columns.map(function(column) {
	            	if(column == "Date"){
	            		return {column: column, value: formatTimeTable(d.dateTimeInfo.dateComplete)}
	            	}else if(column == "Location"){
	            		return {column: column, value: d.location}
	            	}else if(column == "Status"){
	            		return {column: column, value: d.status};
	            	}else{
	            		icons = ''
	            			if(d.triggers.connection != ''){
	            				icons += `<i class="material-icons">location_off</i>`
	            			}
	            			if(d.triggers.permHold){
	            				icons += `<i class="material-icons">priority_high</i>`
	            			}

	            		return {column: column, value: icons};
	            	}
	            });
	        })
	        .enter()
	        .append("td")
	        .attr("style", "color: black") // sets the font style
	            .html(function(d) { return d.value; });
	    
	    return table;
	}






	
})//doc ready