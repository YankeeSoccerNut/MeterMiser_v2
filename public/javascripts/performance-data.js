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
	var settingRowScale = d3.scaleBand().range([0,height]).paddingInner(0.25);

	// var storeHoursRow = function(d) {return d.}
	var storeHoursRowScale = d3.scaleBand().range([0, height]).paddingInner(0.2);

	

	// var colorScale = d3.scaleOrdinal().


	// Define Domains
	xScale.domain(['East Cobb', 'West Cobb', 'Roswell']);
	settingRowScale.domain(['Off', 'Scheduled', 'Hold - Temporary', 'Hold - Permanent',]);
	storeHoursRowScale.domain(['Store Open','Store Closed']);

	// Define the axes
	var xAxis = d3.axisBottom(xScale).ticks(3);
	var yAxis = d3.axisLeft(settingRowScale);

	var ySplitScale = d3.scaleLinear().range([settingRowScale.bandwidth(),0]);;
	var yStackScale = d3.scaleLinear().range([height,0]);

	// Get the data
	d3.json('/api/Readings', function(error,data){
		console.log(data);
		var dataFormated = formatJSON(data);
		console.log(dataFormated)
		console.log(nestedHours(dataFormated))
		var dataBySetting = nestedSetting(dataFormated);
		console.log(dataBySetting)
		console.log(d3.max(dataBySetting, function(d){return d3.max(d, function(v){return v.value})}))


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
		
		yStackScale.domain([0,(endingTimeStamp-startingTimeStamp)])
		

		// yStackScale.domain([0,d3.max(dataByLocation, function(d) {return d.value})])

		svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);


		var gRow = svg.append('g').attr('class', 'row')
            .selectAll('.row').data(dataBySetting)
        .enter().append('g')
            .attr('class', 'group')
            .attr('fill', function(d) { return colorScale(d); });

        gRow.append('text').attr('class', 'title')
	        .attr('dx', '-0.34em')
	        .text(function(d) {return d.key});

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
			dataFormated[i].operatingHours = d.operatingHoursFlag;
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
	var setting_order = ['Hold - Permanent','Hold - Temporary', 'Scheduled', 'Off'];
	function nestedLocation(dataFormated){
		return d3.nest()
			.key(function(d) {return d.location}).sortKeys(function(a,b) { return location_order.indexOf(a) - location_order.indexOf(b); })
			.rollup(function(leaves) { return leaves.length; })
			.entries(dataFormated);
	}

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

	function maxNestedSetting(nestedSettingData){
		for(let i = 0; i<nestedSettingData.length; i++){


		}
		
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
			for(let j = 0; j < nestedData[i].values.length; j++){
				for(let k = 0; k < nestedData[i].values[j].values.length; k++)
				if(nestedData[i].values[j].values[k].key == 'East Cobb'){
					nestedData[i].values[j].values[k].stackSum = ecSum;
					ecSum += nestedData[i].values[j].values[k].value;
				}else if(nestedData[i].values[j].values[k].key == 'West Cobb'){
					nestedData[i].values[j].values[k].stackSum = wcSum;
					wcSum += nestedData[i].values[j].values[k].value;
				}else if(nestedData[i].values[j].values[k].key == 'Roswell'){
					nestedData[i].values[j].values[k].stackSum = rSum;
					rSum += nestedData[i].values[j].values[k].value;
				}
			}

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
		d3.select("#table-container").select("#history-table_wrapper").remove();
		// Get the data again
		d3.json('/api/Readings', function(error,data){
			console.log(data);
			var dataFormated = formatJSON(data);
			console.log(dataFormated);

			var dataInRange = data.filter(function(d){
				return Date.parse(d.created) > Date.parse(start) && Date.parse(d.created) < Date.parse(end)
			})
			var dataForTable = formatJSON(dataInRange)
			console.log(dataForTable)

			// Reset Domains
			x.domain([start, end]);
			// console.log(new Date(mostRecent-timeframe));
			y.domain(['East Cobb', 'West Cobb', 'Roswell']);

			 // Select the section we want to apply our changes to
		    var svg = d3.select("#graph-container");

		    // Data join
		    var rects = svg.selectAll('.rect')
		    	.data(dataFormated);

		    // Make the changes
		    //remove unneeded rects
		    rects.exit().remove();
		    //add any new rects
		    rects.enter().append('rect')
		    	.attr("class", "rect")
		    	.style("fill", function(d) {return colorPicker(d.status)})
			//update all rects to new position
			rects.transition()
				.duration(750)
				.attr("x", function(d) {return x(d.dateTimeInfo.dateComplete); })
				.attr("y", function(d) {return y(d.location); })
				.attr("width", function(d) {return x(d.endTimeInfo.dateComplete) - x(d.dateTimeInfo.dateComplete); })
				.attr("height", y.bandwidth())
				// .style("opacity", )


		    svg.select(".x.axis").transition()
		    	.duration(750) // change the x axis
		        .call(xAxis)
		         .selectAll("text")	
	            .style("text-anchor", "end")
	            .attr("dx", "-.8em")
	            .attr("dy", ".15em")
	            .attr("transform", function(d) {
	                return "rotate(-60)" 
	                });
		    svg.select(".y.axis").transition() // change the y axis
		        .duration(750)
		        .call(yAxis)
		        .selectAll("text")	
	            .style("text-anchor", "middle")
	            .attr("y", -10)
	            .attr("dx", "5px")
	            .attr("dy", "1px")
	            .attr("transform", function(d) {
	                return "rotate(-90)" 
	                });

             //render the table

		    var dataTable = tabulate(dataForTable, ["Date", "Location", "Status"]);
		    $('#history-table').dataTable();

	    });
	}





	
})//doc ready