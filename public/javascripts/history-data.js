$(document).ready(()=>{
	var start
	var end
	var range 
   $(function() {

        start = moment().subtract(29, 'days');
        console.log( `start: ${start}`);
        end = moment();
        console.log( `end: ${end}`);

        function cb(start, end) {
            $('#reportrange span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
            range = {
            	start: start,
            	end: end
            }
            return range;
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
        	range = {
            	start: start,
            	end: end
            }
            return range;
        });

        cb(start, end);
        
    })
   console.log(range)
	// Set the dimensions of the canvas / graph
	var margin = {top: 10, right: 20, bottom: 40, left: 30};
	var width = 350 - margin.left - margin.right;
	var height = 600 - margin.top - margin.bottom;

	// Adds the svg canvas
	var svg = d3.select("#graph-container") .append("svg")
	        .attr("width", width + margin.left + margin.right)
	        .attr("height", height + margin.top + margin.bottom)
	    .append("g")
	        .attr("transform",
	              "translate(" + margin.left + "," + margin.top + ")");

	//Add the data tablev
	// var fields = '<th>Time</th><th>Location</th><th>Status</th>'
	// d3.select('#graph-container').append("table").append('thead').append("tr")
	
	// Set the ranges
	var x = d3.scaleTime().range([0, width]);
	var y = d3.scaleBand().range([0, height]).paddingInner(0.1).paddingOuter(0.1);

	// Define the axes
	var xAxis = d3.axisBottom(x).ticks();
	var yAxis = d3.axisLeft(y).ticks(24);

	// Get the data
	d3.json('http://ec2-18-221-219-61.us-east-2.compute.amazonaws.com/Readings', function(error,data){
		console.log(data);
		var dataFormated = formatJSON(data);
		console.log(dataFormated);
		var dataByLocation = nestedLocation(dataFormated);
		// var dataForTable = filteredData(dataFormated)
		// console.log(dataForTable)


	// Timeframe Scales
	var mostRecent = d3.max(dataFormated, function(d){return d.dateTimeInfo.timeStamp});
	var fifteenMinutes = 15*60*1000;
	var halfHour = 31*60*1000;
	var oneHour = 60*60*1000;
	var oneDay = 24*60*60*1000;
	var oneWeek = oneDay*7;
	var oneMonth = oneDay*30;

	// Set Domains
	x.domain([start, end]);
	x.clamp('true');
	y.domain(['East Cobb', 'West Cobb', 'Roswell']);

	// // Add StoreHours
	// var startYear =
	// var startMonth = 
	// var startDay = timeframeStart.get(Day);


    // Add the rects.
    svg.selectAll(".rect")
		.data(dataFormated)
	.enter().append("rect")
		.attr("class", "rect")
		.attr("x", function(d) {return x(d.dateTimeInfo.dateComplete); })
		.attr("y", function(d) {return y(d.location); })
		.attr("width", function(d) {return x(new Date(d.dateTimeInfo.timeStamp + oneHour)) - x(d.dateTimeInfo.dateComplete); })
		.attr("height", y.bandwidth())
		// .style("opacity", )
		.style("fill", function(d) {return colorPicker(d.status)})

    // Add the X Axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
          .selectAll("text")	
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", function(d) {
                return "rotate(-60)" 
                });


    // Add the Y Axis

	svg.append("g")
	    .attr("class", "y axis")
	    .call(yAxis)
	    .selectAll("text")	
            .style("text-anchor", "middle")
            .attr("y", -10)
            .attr("dx", "5px")
            .attr("dy", "1px")
            .attr("transform", function(d) {
                return "rotate(-90)" 
                });



    var peopleTable = tabulate(dataFormated, ["date", "location", "status"]);
	});

	$('#history-table').dataTable();

	// create the legend
	var legKeys = ['Scheduled', 'Hold - Temporary', 'Hold - Permanent'];
	var colorArray = ['#27AE60','#F1C40F','#E74C3C'];
  	$('#legend').css('margin-left', margin.left);
 	 legKeys.forEach(function(legKey,i){
    $('#legend').append('<div class="swatch" style="background:' + colorArray[i] + '"></div>' + legKey);
 	 });

	// Add Event Listeners
	$('#oneDay').click(()=>{updateData('oneDay')});
	$('#oneWeek').click(()=>{updateData('oneWeek')});
	$('#oneMonth').click(()=>{updateData('oneMonth')});

	// The table generation function
	function tabulate(data, columns) {
	    var table = d3.select("#table-container").append("table")
	            .attr("style", "margin-left: 400px")
	            .attr("id","history-table")
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
	            	if(column == "date"){
	            		return {column: column, value: d.dateTimeInfo.dateComplete}
	            	}else{
	            		return {column: column, value: d[column]};
	            	}
	            });
	        })
	        .enter()
	        .append("td")
	        .attr("style", "color: black") // sets the font style
	            .html(function(d) { return d.value; });
	    
	    return table;
	}



	// render the table
	 


	function formatJSON(rawData){
		var dataFormated = []
		rawData.forEach(function(d,i){
			dataFormated[i] = {};
			dataFormated[i].location = LocationName(d.thermostatId);
			dataFormated[i].dateTimeInfo = new DateTime(d.created);
			dataFormated[i].status = determineStatus(d.statusHeat, d.systemSwitchPos);
			if(i>2){
				dataFormated[i-3].endTimeInfo =new DateTime(d.created);
				if(i>=rawData.length - 3){
					var oneHour = 60*60*1000;
					var future = dataFormated[i].dateTimeInfo.timeStamp + oneHour;
					console.log(future)
					dataFormated[i].endTimeInfo =new DateTime(future);
				}
			}
		})
		return dataFormated;
	}

	// function filteredData(dataFormated){
	// 	var filteredData = [];
	// 	for(let i = 0; i<dataFormated.length; i++){
	// 		if(dataFormated[i].dateTimeInfo.timeStamp > Date.parse(range.start) && dataFormated[i].dateTimeInfo.timeStamp < Date.parse(range.end)){
	// 			filteredData.push(dataFormated[i])
	// 		}
	// 	}
	// 	return filteredData;
	// }

	// function filteredData(d){
	// 	if(d.dateTimeInfo.timeStamp > Date.parse(range.start) && d.dateTimeInfo.timeStamp < Date.parse(range.end)){
	// 		return d
	// 	}
	// }


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

	function colorPicker(status){
		if(status == 'Off'){
        		return '#BDC3C7'
        }else if(status == 'Scheduled'){
        		return '#27AE60'
        }else if(status == 'Hold - Temporary'){
        		return '#F1C40F'
        }else if (status == 'Hold - Permanent'){
        		return '#E74C3C'
        }
	}

	function nestedLocation(dataFormated){
		d3.nest()
			.key(function(d) {return d.location}).sortKeys(d3.ascending)
			.key(function(d) {return d.dateTime}).sortKeys(d3.ascending)
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
	}

	function updateData(start,end){
	
		// console.log(timeframe);
		// Get the data again
		d3.json('http://ec2-18-221-219-61.us-east-2.compute.amazonaws.com/Readings', function(error,data){
			console.log(data);
			var dataFormated = formatJSON(data);
			console.log(dataFormated);
			// var dataForTable = filteredData(dataFormated)
			// console.log(dataForTable)

		// Timeframe Scales
		var halfHour = 30*60*1000;
		var oneHour = 60*60*1000;
		// console.log(mostRecent);

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

	    });
	};


})
