Array.prototype.contains = function(v) {
    for(var i = 0; i < this.length; i++) {
        if(this[i] === v) return true;
    }
    return false;
};

Array.prototype.unique = function() {
    var arr = [];
    for(var i = 0; i < this.length; i++) {
        if(!arr.includes(this[i])) {
            arr.push(this[i]);
        }
    }
    return arr; 
}

function renderClusterForceLayout(data){
	var dataVal = data["topic_word"];
	var final_dict = {};
	for (var key in dataVal) {
	    if (dataVal.hasOwnProperty(key)) {

	    	var childrenWords = dataVal[key];

	    	for(var childKey in childrenWords){

	    		if (childrenWords.hasOwnProperty(childKey) && childrenWords[childKey] > window.vueApp.params.wordThreshold) {

	    			if(!(childKey in final_dict)){
	    				final_dict[childKey] = [];
	    			}
    				final_dict[childKey].push(key);
	    			
	    		}
	    	} 
	    }
  	}
  	var cluster_data = {
  		"name":"",
  		"children":[]
  	}

  	var count=0;
  	for(var key in final_dict){
  		if (final_dict.hasOwnProperty(key) && (data["overall_word"][key] && data["overall_word"][key] > window.vueApp.params.wordOverallThreshold)) {
  			count = count + 1;
  			var hash = {};
  			hash["order"] = count;
  			hash["alias"] = "White/red/jack pine";
  			hash["color"] = "#C7EAFB";
  			hash["name"] = key;


  			var array_child = final_dict[key].unique();
  			var childs =[];
  			for(var i=0; i < array_child.length;i++){
  				var child_hash = {};
  				child_hash["order"] = i+1;
  				child_hash["alias"] = i+1 + "";
  				child_hash["color"] = "#C7EAFB";
  				child_hash["name"]= array_child[i];
  				childs.push(child_hash);
  			}
  			hash["children"] = childs;
  			cluster_data.children.push(hash);
  		}
  	}
  	var d3 =   window.d3V3;
  	renderCluster(cluster_data, d3);
}

function renderCluster(cluster_data, d3){
  var radius = 200;
  var dendogramContainer = "speciescollapsible";


  var rootNodeSize = 6;
  var levelOneNodeSize = 3;
  var levelTwoNodeSize = 3;
  var levelThreeNodeSize = 2;


  var i = 0;
  var duration = 300; //Changing value doesn't seem any changes in the duration ??

  var rootJsonData;

  var cluster = d3.layout.cluster()
      .size([360,radius - 120])
      .separation(function(a, b) {
        return (a.parent == b.parent ? 1 : 2) / a.depth;
      });

  var diagonal = d3.svg.diagonal.radial()
      .projection(function(d) { return [d.y, d.x / 180 * Math.PI]; });

  var containerDiv = d3.select(document.getElementById(dendogramContainer));

  containerDiv.append("button")
      .attr("id","collapse-button")
      .text("Collapse!")
      .on("click",collapseLevels);

  var svgRoot = containerDiv.append("svg:svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", "-" + (radius) + " -" + (radius - 50) +" "+ radius*2 +" "+ radius*2)
      .call(d3.behavior.zoom().scale(0.9).scaleExtent([0.1, 3]).on("zoom", zoom)).on("dblclick.zoom", null)
      .append("svg:g");

  // Add the clipping path
  svgRoot.append("svg:clipPath").attr("id", "clipper-path")
      .append("svg:rect")
      .attr('id', 'clip-rect-anim');

  var animGroup = svgRoot.append("svg:g")
      .attr("clip-path", "url(#clipper-path)");

  	rootJsonData = cluster_data;

    //Start with all children collapsed
    rootJsonData.children.forEach(collapse);

    //Initialize the dendrogram
  	createCollapsibleDendroGram(rootJsonData);




  function createCollapsibleDendroGram(source) {

    // Compute the new tree layout.
    var nodes = cluster.nodes(rootJsonData);
    var pathlinks = cluster.links(nodes);

    // Normalize for nodes' fixed-depth.
    nodes.forEach(function(d) {
      if(d.depth <=2){
        d.y = d.depth*70;
      }else
      {
        d.y = d.depth*100;
      }
    });

    // Update the nodes…
    var node = svgRoot.selectAll("g.node")
        .data(nodes, function(d) { return d.id || (d.id = ++i); });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .on("click", toggleChildren);

    nodeEnter.append("circle");

    nodeEnter.append("text")
    .attr("x", 10)
    .attr("dy", ".35em")
    .attr("text-anchor", "start")
    .text(function(d) {
          if(d.depth === 2){
            return d.alias;
          }
         return d.name;
    });


    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })

    nodeUpdate.select("circle")
        .attr("r", function(d){
            if (d.depth == 0) {
                return rootNodeSize;
              }
              else if (d.depth === 1) {
                  return levelOneNodeSize;
              }
              else if (d.depth === 2) {
                  return levelTwoNodeSize;
              }
                  return levelThreeNodeSize;

        })
        .style("fill", function(d) {
               if(d.depth ===0){
                return "#808080";
               }else if(d.depth === 1){
                if(d.name=="Hardwoods") return "#816854";
                return "#C3B9A0";
               }else{
                return d.color;
               }
        })
        .style("stroke",function(d){
              if(d.depth>1){
                  return "white";
              }
              else{
                  return "lightgray";
              }
        });

    nodeUpdate.select("text")

        .attr('id', function(d){
          var order = 0;
          if(d.order)order = d.order;
          return 'T-' + d.depth + "-" + order;
        })
        .attr("text-anchor", function (d) {
            if (d.depth === 1) {
                return d.x < 180 ? "end" : "start";
            }
            return d.x < 180 ? "start" : "end";
        })
        .attr("dy", function(d){
            if (d.depth === 1) {
                return d.x < 180 ? "1.4em" : "-0.2em";
            }
            return ".31em";
        })
        .attr("dx", function (d) {
            if (d.depth === 1) {
                return 0; //return d.x > 180 ? 2 : -2;
            }
            return d.x < 180 ? 1 : -20;
        })
        .attr("transform", function (d) {
            if (d.depth < 2) {
                return "rotate(" + (90 - d.x) + ")";
            }else {
                return d.x < 180 ? null : "rotate(180)";
            }
        });

    // TODO: appropriate transform
    var nodeExit = node.exit().transition()
        .duration(duration)
        .remove();

    // Update the links…
    var link = svgRoot.selectAll("path.link")
        .data(pathlinks, function(d) { return d.target.id; });

    // Enter any new links at the parent's previous position.
    link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", function(d) {
          var o = {x: source.x0, y: source.y0};
          return diagonal({source: o, target: o});
        })
        .style("fill",function(d){
          return d.color;
        });

    // Transition links to their new position.
    link.transition()
        .duration(duration)
        .attr("d", diagonal);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
        .duration(duration)
        .attr("d", function(d) {
          var o = {x: source.x, y: source.y};
          return diagonal({source: o, target: o});
        })
        .remove();
  }

  // Toggle children on click.
  function toggleChildren(d,clickType) {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }

    var type = typeof clickType == undefined ? "node" : clickType;

    //Activities on node click
    createCollapsibleDendroGram(d);
    highlightNodeSelections(d);

    highlightRootToNodePath(d,type);

  }

  // Collapse nodes
  function collapse(d) {
    if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
      }
  }


  // highlights subnodes of a node
  function highlightNodeSelections(d) {
      var highlightLinkColor = "darkslategray";//"#f03b20";
      var defaultLinkColor = "lightgray";

      var depth =  d.depth;
      var nodeColor = d.color;
      if (depth === 1) {
          nodeColor = highlightLinkColor;
      }

      var pathLinks = svgRoot.selectAll("path.link");

      pathLinks.style("stroke",function(dd) {
          if (dd.source.depth === 0) {
              if (d.name === '') {
                  return highlightLinkColor;
              }
              return defaultLinkColor;
          }

          if (dd.source.name === d.name) {
              return nodeColor;
          }else {
              return defaultLinkColor;
          }
      });
  }

  //Walking parents' chain for root to node tracking
  function highlightRootToNodePath(d,clickType){
    var ancestors = [];
    var parent = d;
    while (!_.isUndefined(parent)) {
        ancestors.push(parent);
        parent = parent.parent;
    }

    // Get the matched links
    var matchedLinks = [];

    svgRoot.selectAll('path.link')
        .filter(function(d, i)
        {
            return _.any(ancestors, function(p)
            {
                return p === d.target;
            });

        })
        .each(function(d)
        {
            matchedLinks.push(d);
        });

    animateChains(matchedLinks,clickType);

    function animateChains(links,clickType){
      animGroup.selectAll("path.selected")
          .data([])
          .exit().remove();

      animGroup.selectAll("path.selected")
          .data(links)
          .enter().append("svg:path")
          .attr("class", "selected")
          .attr("d", diagonal);


      //Reset path highlight if collapse button clicked
      if(clickType == 'button'){
        animGroup.selectAll("path.selected").classed('reset-selected',true);
      }

      var overlayBox = svgRoot.node().getBBox();

      svgRoot.select("#clip-rect-anim")
          .attr("x", -radius)
          .attr("y", -radius)
          .attr("width",0)
          .attr("height",radius*2)
          .transition().duration(duration)
          .attr("width", radius*2);
    }

  }

  function zoom() {
     svgRoot.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  }

  function collapseLevels(){

    if(checkForThirdLevelOpenChildren()){
      toggleAllSecondLevelChildren();
    }else{
     toggleSecondLevelChildren();
    }

    // Open first level only by collapsing second level
    function toggleSecondLevelChildren(){
      for(var rootIndex = 0, rootLength = rootJsonData.children.length; rootIndex<rootLength; rootIndex++){
          if(isNodeOpen(rootJsonData.children[rootIndex])){
               toggleChildren(rootJsonData.children[rootIndex],'button');
          }
      }
    }

    // Open first level only by collapsing second level
    function toggleAllSecondLevelChildren(){
      for(var rootIndex = 0, rootLength = rootJsonData.children.length; rootIndex<rootLength; rootIndex++){
        if(isNodeOpen(rootJsonData.children[rootIndex])){

          for(var childIndex = 0, childLength = rootJsonData.children[rootIndex].children.length; childIndex<childLength; childIndex++){
            var secondLevelChild = rootJsonData.children[rootIndex].children[childIndex];
            if(isNodeOpen(secondLevelChild)){
              toggleChildren(rootJsonData.children[rootIndex].children[childIndex],'button');
            }
          }

        }

      }
    }

    // Check if any nodes opens at second level
    function checkForThirdLevelOpenChildren(){
      for(var rootIndex = 0, rootLength = rootJsonData.children.length; rootIndex<rootLength; rootIndex++){
        if(isNodeOpen(rootJsonData.children[rootIndex])){

          for(var childIndex = 0, childLength = rootJsonData.children[rootIndex].children.length; childIndex<childLength; childIndex++){

            var secondLevelChild = rootJsonData.children[rootIndex].children[childIndex];
            if(isNodeOpen(secondLevelChild)){
              return true;
            }
          }
        }
      }
    }

    function isNodeOpen(d){
      if(d.children){return true;}
      return false;
    }
  }




}

  