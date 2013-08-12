var w=460,h=500,
svg=d3.select(".playground").select("svg")
//.append("svg")
.attr("width",w)
.attr("height",h)
.on("mouseover", function() {      
		console.log("mouse over me circle!!");
            div.transition()        
                .duration(200)      
                .style("opacity", .5);
            })
.on("mouseout", function() {      
		console.log("mouse out!!");
            })
.on("mousein", function() {      
		console.log("mouse in!!");
            });
 
var text = svg
.append("text")
.text("hello world")
.attr("y",50)
.on("mouseover", function(d) {      
		console.log("mouse over me!!");
            div.transition()        
                .duration(200)      
                .style("opacity", .5);
            });


var circle = svg
.append("circle")
.attr("r", 10)
.attr("cx", 30)
.attr("cy", 150)
;


// svg.selectAll(".playground").select("svg")   
//         .data([1,2,3,4])
//     .enter().append("circle")                               
//         .attr("r", 5)       
//         .attr("cx", function(d) { 
//         	return x(d.date); console.log('asdfasdf', d); })       
//         .attr("cy", function(d) { return y(d.close); })     
//         .on("mouseover", function(d) {      
//             div.transition()        
//                 .duration(200)      
//                 .style("opacity", .9);      
//             div .html(formatTime(d.date) + "<br/>"  + d.close)  
//                 .style("left", (d3.event.pageX) + "px")     
//                 .style("top", (d3.event.pageY - 28) + "px");    
//             })                  
//         .on("mouseout", function(d) {       
//             div.transition()        
//                 .duration(500)      
//                 .style("opacity", 0);   
//         });


 // d3.json('static_media/nxt_graph/stackedAreaData.json', function(data) {
 //   nv.addGraph(function() {
 //     var chart = nv.models.stackedAreaChart()
 //                   .x(function(d) { return d[0] })
 //                   .y(function(d) { return d[1] })
 //                   .clipEdge(true);
 
 //     // chart.xAxis
 //     //     .tickFormat(function(d) { return d3.time.format('%x')(new Date(d)) });

 //     chart.xAxis
 //         .tickFormat(d3.format(',.2f'));
 
 //     chart.yAxis
 //         .tickFormat(d3.format(',.2f'));
 
 //     d3.select('.nxt-profile svg')
 //       .datum(data)
 //         .transition().duration(500).call(chart);
 
 //     nv.utils.windowResize(chart.update);
 
 //     return chart;
 //   });
 // })



 // nv.addGraph(function() {  
 //   var chart = nv.models.lineChart();
 
 //   chart.xAxis
 //       .axisLabel('Time (ms)')
 //       .tickFormat(d3.format(',r'));
 
 //   chart.yAxis
 //       .axisLabel('Voltage (v)')
 //       .tickFormat(d3.format('.02f'));
 
 //   d3.select('.nxt-profile svg')
 //       .datum(sinAndCos())
 //     .transition().duration(500)
 //       .call(chart);
 
 //   nv.utils.windowResize(function() { d3.select('.nxt-profile svg').call(chart) });
 
 //   return chart;
 // });

  /**************************************
  * Simple test data generator
  */
 

 // function sinAndCos() {
 //   var sin = [],
 //       cos = [];
 
 //   for (var i = 0; i < 100; i++) {
 //     sin.push({x: i, y: Math.sin(i/10)});
 //     cos.push({x: i, y: .5 * Math.cos(i/10)});
 //   }
 
 //   return [
 //     {
 //       values: sin,
 //       key: 'Sine Wave',
 //       color: '#ff7f0e'
 //     },
 //     {
 //       values: cos,
 //       key: 'Cosine Wave',
 //       color: '#2ca02c'
 //     }
 //   ];
 // }