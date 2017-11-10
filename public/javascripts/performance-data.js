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
	var ySplitScale = d3.scaleLinear();
	var yStackScale = d3.scaleLinear();

	// var settingRow = function(d) {return d.status};
	var settingRowScale = d3.scaleBand().range([height,0]).paddingInner(0.25);

	// var storeHoursRow = function(d) {return d.}
	var storeHoursRowScale = d3.scaleBand().range([0, height]).paddingInner(0.2);

	// var colorScale = d3.scaleOrdinal().


	// Define Domains
	xScale.domain(['East Cobb', 'West Cobb', 'Roswell']);
	settingRowScale.domain(['Hold - Permanent','Hold - Temporary', 'Scheduled', 'Off']);

	// Define the axes
	var xAxis = d3.axisBottom(xScale).ticks(3);
	var yAxis = d3.axisLeft(settingRowScale);

	// Get the data
	d3.json('/api/Readings', function(error,data){
		console.log(data);
		var dataFormated = formatJSON(data);
		console.log(dataFormated)
		var dataBySetting = nestedSetting(dataFormated);
		console.log(dataBySetting)
		// var dataByStoreHours = nestedHours(dataFormated);
		// console.log(dataByStoreHours);
		// console.log(d3.max(dataByStoreHours, function(d,i) {
		// 	for(let i = 0; i< d.values.length; i++){
		// 		return d.values[i].value;	
		// 	}}))
		// var dataBySettingPerStoreHours = nestedHoursSetting(dataFormated);
		// console.log(dataBySettingPerStoreHours);
		// console.log(d3.max(dataBySettingPerStoreHours, function(d,i,j) {
		// 	for(let i = 0; i< d.values.length; i++){
		// 		for(let j =0; j < d.values[i].values.length; j++)
		// 		return d.values[i].values[j].value;	
		// 	}}))
		// var dataByLocation = nestedLocation(dataFormated);
		// console.log(dataByLocation);
		// console.log(d3.max(dataByLocation, function(d) {return d.value;}))

		var startingTimeStamp = Date.parse(start);
		var endingTimeStamp = Date.parse(end);
		if(startingTimeStamp < dataFormated[0].dateTimeInfo.timeStamp){
			startingTimeStamp = dataFormated[0].dateTimeInfo.timeStamp
		}
		if(endingTimeStamp > dataFormated[dataFormated.length-1].endTimeInfo.timeStamp){
			endingTimeStamp = dataFormated[dataFormated.length-1].endTimeInfo.timeStamp
		}

		ySplitScale.domain([0,(endingTimeStamp-startingTimeStamp)])
		.range([settingRowScale.bandwidth(),0]);

		// yStackScale.domain([0,d3.max(dataByLocation, function(d) {return d.value})])

		svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);


		var gRow = svg.append('g').attr('class', 'rows')
            .selectAll('.row').data(dataBySetting)
        .enter().append('g')
            .attr('class', 'row')
            .attr('transform', function(d) { return 'translate(0,' + settingRowScale(d.key) + ')'; });

        gRow.append('text').attr('class', 'title')
        .attr('dx', '-0.34em')
        .text(function(d) {return d.key});

        var bars = gRow.append('g').attr('class', 'bars').style("fill", function(d){
        	if(d.key == 'Off'){
        		return '#BDC3C7'
        	}else if(d.key == 'Scheduled'){
        		return '#27AE60'
        	}else if(d.key == 'Hold - Temporary'){
        		return '#F1C40F'
        	}else if (d.key == 'Hold - Permanent'){
        		return '#E74C3C'
        	}
        });

        bars.selectAll(".bar-underlying").data(function(d) {return d.values;})
        	.enter().append('rect')
        		.attr('class', 'bar bar-underlying')
	            .attr('x', function(d) {return xScale(d.key);})
	            .attr('y', 0)
	            .attr('width', xScale.bandwidth())
	            .attr('height', function(d) { return ySplitScale.range()[1];})
	            .style('fill', '#fff');



        bars.selectAll(".bar-overlying").data(function(d) {return d.values;})
        	.enter().append('rect')
        		.attr('class', 'bar bar-overlying')
	            .attr('x', function(d) {return xScale(d.key);})
	            .attr('y', function(d) {return ySplitScale(d.value);})
	            .attr('width', xScale.bandwidth())
	            .attr('height', function(d) { return ySplitScale(0) - ySplitScale(d.value);})
	 //            

		
	});






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
	var setting_order = ['Off','Hold - Permanent','Hold - Temporary', 'Scheduled'];
	function nestedLocation(dataFormated){
		return d3.nest()
			.key(function(d) {return d.location}).sortKeys(function(a,b) { return location_order.indexOf(a) - location_order.indexOf(b); })
			.rollup(function(leaves) { return leaves.length; })
			.entries(dataFormated);
	}

	function nestedSetting(dataFormated){
		return d3.nest()
			.key(function(d) {return d.status}).sortKeys(function(a,b) { return setting_order.indexOf(a) - setting_order.indexOf(b); })
			.key(function(d) {return d.location}).sortKeys(function(a,b) { return location_order.indexOf(a) - location_order.indexOf(b); })
			.rollup(function(v) { return d3.sum(v, function(d) { 
				return d.endTimeInfo.timeStamp-d.dateTimeInfo.timeStamp; })})
			.entries(dataFormated);
	}

	function sumNestedSetting(dataFormated){
		return d3.nest()
			.key(function(d) {return d.status}).sortKeys(function(a,b) { return setting_order.indexOf(a) - setting_order.indexOf(b); })
			.rollup(function(leaves) { return leaves.length; })
			.entries(dataFormated);
	}

	function nestedHours(dataFormated){
		return d3.nest()
			.key(function(d) {return d.dateTimeInfo.duringOperationHours}).sortKeys(d3.ascending)
			.key(function(d) {return d.location}).sortKeys(function(a,b) { return location_order.indexOf(a) - location_order.indexOf(b); })
			.rollup(function(leaves) { return leaves.length; })
			.entries(dataFormated);
	}



	function nestedHoursSetting(dataFormated){
		return d3.nest()
			.key(function(d) {return d.dateTimeInfo.duringOperationHours}).sortKeys(d3.ascending)
			.key(function(d) {return d.status}).sortKeys(function(a,b) { return setting_order.indexOf(a) - setting_order.indexOf(b); })
			.key(function(d) {return d.location}).sortKeys(function(a,b) { return location_order.indexOf(a) - location_order.indexOf(b); })
			.rollup(function(leaves) { return leaves.length; })
			.entries(dataFormated);
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
		this.duringOperationHours = compareToStoreHours(this.hour);
	}

	function compareToStoreHours(hour){
		var storeHours = {
			open: 14, //9am (shifted 5 for UTC)
			close: 23  //6pm (shifted 5 for UTC)
		}
		if(hour >= storeHours.open && hour < storeHours.close){
			return true;
		}else{
			return false;
		}
	}

	function filterByTimeframe(data, timeframe){
		var dataByTimeframe = [];
		var mostRecent = d3.max(dataFormated, function(d){return d.dateTimeInfo.timeStamp});
		var timeframe;
		if(domain == 'oneDay'){
			timeframe = 24*60*60*1000;
		}else if(domain == 'oneWeek'){
			timeframe = 24*60*60*1000*7;
		}else{//month
			timeframe = 24*60*60*1000*30;
		}
		data.forEach(function(d){
			if(d.dateTimeInfo.timeStamp >= mostRecent - timeframe){
				dataByTimeframe.push(d);
			}
		})
		return dataByTimeframe;		
	}





	
})//doc ready