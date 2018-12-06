function renderClusterAnalysis(resp) {
  d3.select(".chart12").remove();
  var document_topic = resp["document_topic"][0];
  var topic_vectors = resp["topic_vectors"];
  var bb = document.querySelector('#cluster')
    .getBoundingClientRect(),
    width = 400;
  var height = 400;
  var margin = 80;
  var data = [];

  Object.keys(topic_vectors).forEach(function(key) {
    var value = topic_vectors[key];
    data.push({
      x: value[0],
      y: value[1],
      c: 1,
      size: document_topic[key],
      key: key
    });
  });
  var labelX = 'X';
  var labelY = 'Y';

  var svg = d3.select('#cluster')
    .append('svg')
    .attr('class', 'chart12')
    .attr('id','cluster_id')
    .attr("width", width + margin + margin)
    .attr("height", height + margin + margin)
    .append("g")
    .attr("transform", "translate(" + margin + "," + margin + ")");

  var x = d3.scaleLinear()
    .domain([d3.min(data, function (d) {
      return d.x;
    }), d3.max(data, function (d) {
      return d.x;
    })])
    .range([0, width]);

  var y = d3.scaleLinear()
    .domain([d3.min(data, function (d) {
      return d.y;
    }), d3.max(data, function (d) {
      return d.y;
    })])
    .range([height, 0]);

  var scale = d3.scaleSqrt()
    .domain([d3.min(data, function (d) {
      return d.size;
    }), d3.max(data, function (d) {
      return d.size;
    })])
    .range([10, 20]);

  var opacity = d3.scaleSqrt()
    .domain([d3.min(data, function (d) {
      return d.size;
    }), d3.max(data, function (d) {
      return d.size;
    })])
    .range([1, .5]);


  var xAxis = d3.axisBottom().scale(x);
  var yAxis = d3.axisLeft().scale(y);


  svg.append("g")
    .attr("class", "y axis")
    .call(yAxis)
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", 20)
    .attr("y", -margin)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text(labelY);
  // x axis and label
  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis)
    .append("text")
    .attr("x", width + 20)
    .attr("y", margin - 10)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text(labelX);

  svg.selectAll("circle")
    .data(data)
    .enter()
    .append("g")
    .insert("circle")
    .attr("cx", width / 2)
    .attr("cy", height / 2)
    .attr("r", function (d) {
      return scale(d.size);
    })
    .attr("id",function(d) {
      return d.key
    })
    .style("fill", function (d) {
      return "#D0E3F0";
    })
    .on('mouseover', function (d, i) {
      renderBarGraph(d["key"], resp);
      fade(d["key"], 1);
    })
    .on('mouseout', function (d, i) {
      fadeOut();
    })
    .transition()
    .delay(function (d, i) {
      return x(d.x) - y(d.y);
    })
    .duration(500)
    .attr("cx", function (d) {
      return x(d.x);
    })
    .attr("cy", function (d) {
      return y(d.y);
    });

      // text label for the x axis
  svg.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height +40)
    .text("PC1");


  svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", -50)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("PC2");


  function fade(key, opacity) {
    svg.selectAll("circle")
      .filter(function (d) {
        
        return d.key == key;
      }).
      style("fill", "#C8423E")
  }

  function fadeOut() {
    svg.selectAll("circle")
      .transition()
      .style("fill","#D0E3F0");
  }
}