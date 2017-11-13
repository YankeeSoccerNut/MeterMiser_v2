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

  

	// Get the data
	d3.json('/api/ActivityLog', function(error,data){
		console.log(data);
		// var dataFormated = formatJSON(data);
		// console.log(dataFormated);

		// var dataInRange = data.filter(function(d){
		// 	return Date.parse(d.created) > Date.parse(start) && Date.parse(d.created) < Date.parse(end)
		// })
		// var dataForTable = formatJSON(dataInRange)
		// console.log(dataForTable)


    //render the table
    var dataTable = tabulate(data, ["Date", "Location", "Status","Message"]);
    $('#activity-table').dataTable();
	});



	// The table generation function
	function tabulate(data, columns) {
		formatTimeTable = d3.timeFormat('%a %b %-d %-I:%M %p');
	    var table = d3.select("#table-container").append("table")
	            .attr("id","activity-table")
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
	            		return {column: column, value: formatTimeTable(new Date(d.created))}
	            	}else if(column == "Location"){
	            		return {column: column, value: LocationName(d.locationId)}
	            	}else if(column == "Status"){
	            		return {column: column, value: d.status};
	            	}else if(column == "Message"){
	           

	            		return {column: column, value: d.message};
	            	}
	            });
	        })
	        .enter()
	        .append("td")
	        .attr("style", "color: black") // sets the font style
	            .html(function(d) { return d.value; });
	    
	    return table;
	}

	

	 





	function LocationName(locationId){
		if(locationId == 536145){
			return 'Roswell';
		}
		else if(locationId == 548041){
			return 'East Cobb';
		}
		else if(locationId == 550664){
			return 'West Cobb';
		}
		else{
			return 'Unknown Location';
		}
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

             //render the table

		    var dataTable = tabulate(dataForTable, ["Date", "Location", "Status"]);
		    $('#history-table').dataTable();

	    });
	};


})