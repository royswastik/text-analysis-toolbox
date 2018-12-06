"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Array.prototype.contains = function (v) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] === v) return true;
  }

  return false;
};

Array.prototype.unique = function () {
  var arr = [];

  for (var i = 0; i < this.length; i++) {
    if (!arr.includes(this[i])) {
      arr.push(this[i]);
    }
  }

  return arr;
};

function renderClusterForceLayout(data) {
  var dataVal = data["topic_word"];
  var final_dict = {};

  for (var key in dataVal) {
    if (dataVal.hasOwnProperty(key)) {
      var childrenWords = dataVal[key];

      for (var childKey in childrenWords) {
        if (childrenWords.hasOwnProperty(childKey) && childrenWords[childKey] > window.vueApp.params.wordThreshold) {
          if (!(childKey in final_dict)) {
            final_dict[childKey] = [];
          }

          final_dict[childKey].push(key);
        }
      }
    }
  }

  var cluster_data = {
    "name": "",
    "children": []
  };
  var count = 0;

  for (var key in final_dict) {
    if (final_dict.hasOwnProperty(key) && data["overall_word"][key] && data["overall_word"][key] > window.vueApp.params.wordOverallThreshold) {
      count = count + 1;
      var hash = {};
      hash["order"] = count;
      hash["alias"] = "White/red/jack pine";
      hash["color"] = "#C7EAFB";
      hash["name"] = key;
      var array_child = final_dict[key].unique();
      var childs = [];

      for (var i = 0; i < array_child.length; i++) {
        var child_hash = {};
        child_hash["order"] = i + 1;
        child_hash["alias"] = i + 1 + "";
        child_hash["color"] = "#C7EAFB";
        child_hash["name"] = array_child[i];
        childs.push(child_hash);
      }

      hash["children"] = childs;
      cluster_data.children.push(hash);
    }
  }

  var d3 = window.d3V3;
  renderCluster(cluster_data, d3);
}

function renderCluster(cluster_data, d3) {
  var radius = 200;
  var dendogramContainer = "speciescollapsible";
  var rootNodeSize = 6;
  var levelOneNodeSize = 3;
  var levelTwoNodeSize = 3;
  var levelThreeNodeSize = 2;
  var i = 0;
  var duration = 300; //Changing value doesn't seem any changes in the duration ??

  var rootJsonData;
  var cluster = d3.layout.cluster().size([360, radius - 120]).separation(function (a, b) {
    return (a.parent == b.parent ? 1 : 2) / a.depth;
  });
  var diagonal = d3.svg.diagonal.radial().projection(function (d) {
    return [d.y, d.x / 180 * Math.PI];
  });
  var containerDiv = d3.select(document.getElementById(dendogramContainer));
  containerDiv.append("button").attr("id", "collapse-button").text("Collapse!").on("click", collapseLevels);
  var svgRoot = containerDiv.append("svg:svg").attr("width", "100%").attr("height", "100%").attr("viewBox", "-" + radius + " -" + (radius - 50) + " " + radius * 2 + " " + radius * 2).call(d3.behavior.zoom().scale(0.9).scaleExtent([0.1, 3]).on("zoom", zoom)).on("dblclick.zoom", null).append("svg:g"); // Add the clipping path

  svgRoot.append("svg:clipPath").attr("id", "clipper-path").append("svg:rect").attr('id', 'clip-rect-anim');
  var animGroup = svgRoot.append("svg:g").attr("clip-path", "url(#clipper-path)");
  rootJsonData = cluster_data; //Start with all children collapsed

  rootJsonData.children.forEach(collapse); //Initialize the dendrogram

  createCollapsibleDendroGram(rootJsonData);

  function createCollapsibleDendroGram(source) {
    // Compute the new tree layout.
    var nodes = cluster.nodes(rootJsonData);
    var pathlinks = cluster.links(nodes); // Normalize for nodes' fixed-depth.

    nodes.forEach(function (d) {
      if (d.depth <= 2) {
        d.y = d.depth * 70;
      } else {
        d.y = d.depth * 100;
      }
    }); // Update the nodes…

    var node = svgRoot.selectAll("g.node").data(nodes, function (d) {
      return d.id || (d.id = ++i);
    }); // Enter any new nodes at the parent's previous position.

    var nodeEnter = node.enter().append("g").attr("class", "node").on("click", toggleChildren);
    nodeEnter.append("circle");
    nodeEnter.append("text").attr("x", 10).attr("dy", ".35em").attr("text-anchor", "start").text(function (d) {
      if (d.depth === 2) {
        return d.alias;
      }

      return d.name;
    }); // Transition nodes to their new position.

    var nodeUpdate = node.transition().duration(duration).attr("transform", function (d) {
      return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")";
    });
    nodeUpdate.select("circle").attr("r", function (d) {
      if (d.depth == 0) {
        return rootNodeSize;
      } else if (d.depth === 1) {
        return levelOneNodeSize;
      } else if (d.depth === 2) {
        return levelTwoNodeSize;
      }

      return levelThreeNodeSize;
    }).style("fill", function (d) {
      if (d.depth === 0) {
        return "#808080";
      } else if (d.depth === 1) {
        if (d.name == "Hardwoods") return "#816854";
        return "#C3B9A0";
      } else {
        return d.color;
      }
    }).style("stroke", function (d) {
      if (d.depth > 1) {
        return "white";
      } else {
        return "lightgray";
      }
    });
    nodeUpdate.select("text").attr('id', function (d) {
      var order = 0;
      if (d.order) order = d.order;
      return 'T-' + d.depth + "-" + order;
    }).attr("text-anchor", function (d) {
      if (d.depth === 1) {
        return d.x < 180 ? "end" : "start";
      }

      return d.x < 180 ? "start" : "end";
    }).attr("dy", function (d) {
      if (d.depth === 1) {
        return d.x < 180 ? "1.4em" : "-0.2em";
      }

      return ".31em";
    }).attr("dx", function (d) {
      if (d.depth === 1) {
        return 0; //return d.x > 180 ? 2 : -2;
      }

      return d.x < 180 ? 1 : -20;
    }).attr("transform", function (d) {
      if (d.depth < 2) {
        return "rotate(" + (90 - d.x) + ")";
      } else {
        return d.x < 180 ? null : "rotate(180)";
      }
    }); // TODO: appropriate transform

    var nodeExit = node.exit().transition().duration(duration).remove(); // Update the links…

    var link = svgRoot.selectAll("path.link").data(pathlinks, function (d) {
      return d.target.id;
    }); // Enter any new links at the parent's previous position.

    link.enter().insert("path", "g").attr("class", "link").attr("d", function (d) {
      var o = {
        x: source.x0,
        y: source.y0
      };
      return diagonal({
        source: o,
        target: o
      });
    }).style("fill", function (d) {
      return d.color;
    }); // Transition links to their new position.

    link.transition().duration(duration).attr("d", diagonal); // Transition exiting nodes to the parent's new position.

    link.exit().transition().duration(duration).attr("d", function (d) {
      var o = {
        x: source.x,
        y: source.y
      };
      return diagonal({
        source: o,
        target: o
      });
    }).remove();
  } // Toggle children on click.


  function toggleChildren(d, clickType) {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }

    var type = _typeof(clickType) == undefined ? "node" : clickType; //Activities on node click

    createCollapsibleDendroGram(d);
    highlightNodeSelections(d);
    highlightRootToNodePath(d, type);
  } // Collapse nodes


  function collapse(d) {
    if (d.children) {
      d._children = d.children;

      d._children.forEach(collapse);

      d.children = null;
    }
  } // highlights subnodes of a node


  function highlightNodeSelections(d) {
    var highlightLinkColor = "darkslategray"; //"#f03b20";

    var defaultLinkColor = "lightgray";
    var depth = d.depth;
    var nodeColor = d.color;

    if (depth === 1) {
      nodeColor = highlightLinkColor;
    }

    var pathLinks = svgRoot.selectAll("path.link");
    pathLinks.style("stroke", function (dd) {
      if (dd.source.depth === 0) {
        if (d.name === '') {
          return highlightLinkColor;
        }

        return defaultLinkColor;
      }

      if (dd.source.name === d.name) {
        return nodeColor;
      } else {
        return defaultLinkColor;
      }
    });
  } //Walking parents' chain for root to node tracking


  function highlightRootToNodePath(d, clickType) {
    var ancestors = [];
    var parent = d;

    while (!_.isUndefined(parent)) {
      ancestors.push(parent);
      parent = parent.parent;
    } // Get the matched links


    var matchedLinks = [];
    svgRoot.selectAll('path.link').filter(function (d, i) {
      return _.any(ancestors, function (p) {
        return p === d.target;
      });
    }).each(function (d) {
      matchedLinks.push(d);
    });
    animateChains(matchedLinks, clickType);

    function animateChains(links, clickType) {
      animGroup.selectAll("path.selected").data([]).exit().remove();
      animGroup.selectAll("path.selected").data(links).enter().append("svg:path").attr("class", "selected").attr("d", diagonal); //Reset path highlight if collapse button clicked

      if (clickType == 'button') {
        animGroup.selectAll("path.selected").classed('reset-selected', true);
      }

      var overlayBox = svgRoot.node().getBBox();
      svgRoot.select("#clip-rect-anim").attr("x", -radius).attr("y", -radius).attr("width", 0).attr("height", radius * 2).transition().duration(duration).attr("width", radius * 2);
    }
  }

  function zoom() {
    svgRoot.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  }

  function collapseLevels() {
    if (checkForThirdLevelOpenChildren()) {
      toggleAllSecondLevelChildren();
    } else {
      toggleSecondLevelChildren();
    } // Open first level only by collapsing second level


    function toggleSecondLevelChildren() {
      for (var rootIndex = 0, rootLength = rootJsonData.children.length; rootIndex < rootLength; rootIndex++) {
        if (isNodeOpen(rootJsonData.children[rootIndex])) {
          toggleChildren(rootJsonData.children[rootIndex], 'button');
        }
      }
    } // Open first level only by collapsing second level


    function toggleAllSecondLevelChildren() {
      for (var rootIndex = 0, rootLength = rootJsonData.children.length; rootIndex < rootLength; rootIndex++) {
        if (isNodeOpen(rootJsonData.children[rootIndex])) {
          for (var childIndex = 0, childLength = rootJsonData.children[rootIndex].children.length; childIndex < childLength; childIndex++) {
            var secondLevelChild = rootJsonData.children[rootIndex].children[childIndex];

            if (isNodeOpen(secondLevelChild)) {
              toggleChildren(rootJsonData.children[rootIndex].children[childIndex], 'button');
            }
          }
        }
      }
    } // Check if any nodes opens at second level


    function checkForThirdLevelOpenChildren() {
      for (var rootIndex = 0, rootLength = rootJsonData.children.length; rootIndex < rootLength; rootIndex++) {
        if (isNodeOpen(rootJsonData.children[rootIndex])) {
          for (var childIndex = 0, childLength = rootJsonData.children[rootIndex].children.length; childIndex < childLength; childIndex++) {
            var secondLevelChild = rootJsonData.children[rootIndex].children[childIndex];

            if (isNodeOpen(secondLevelChild)) {
              return true;
            }
          }
        }
      }
    }

    function isNodeOpen(d) {
      if (d.children) {
        return true;
      }

      return false;
    }
  }
}
"use strict";

function loadJquery() {
  $(document).ready(function () {
    $("#toggle-sidebar").click(function () {
      $('.ui.sidebar').sidebar('toggle');
    });
  });
}
"use strict";

require.config({
  paths: {
    "d3": "https://d3js.org/d3.v3.min"
  }
});

function loadD3() {
  window.d3Old = d3;

  require(['d3'], function (d3V3) {
    window.d3V3 = d3V3;
    window.d3 = d3Old; // window.documents = [
    //         //   ["i", "am", "batman", "of", "winterfall"],
    //         //   ["there", "should", "always", "be", "a", "stark", "in", "winterfell"],
    //         //   ["prophecy", "says", "prince", "will", "be" , "reborn"]
    //         // ];
    //     window.documents = [['project', 'classification', 'compare', 'neural', 'nets', 'SVM', 'due', 'due'], ['two', 'new', 'progress', 'checks', 'final', 'project',  'assigned', 'follows'], ['report', 'graded',  'contribute', 'points',  'total', 'semester', 'grade'], ['progress', 'update', 'evaluated', 'TA', 'peers'], ['class', 'meeting', 'tomorrow','teams', 'work', 'progress', 'report', 'final', 'project'], [ 'quiz',  'sections', 'regularization', 'Tuesday'], [ 'quiz', 'Thursday', 'logistics', 'work', 'online', 'student', 'postpone',  'quiz', 'Tuesday'], ['quiz', 'cover', 'Thursday'], ['quiz', 'chap', 'chap', 'linear', 'regression']];

    window.documents = [['serious', 'talk', 'friends', 'flaky', 'lately', 'understood', 'good', 'evening', 'hanging'], ['got', 'gift', 'elder', 'brother', 'really', 'surprising'], ['completed', '5', 'miles', 'run', 'without', 'break', 'makes', 'feel', 'strong'], ['son', 'performed', 'well', 'test', 'preparation']]; // getAnalysis("LDA");
  });
}

function getDocs(texts) {
  return window.documents = texts.map(function (x) {
    return x.split();
  });
}

function getAnalysis(method, success, fail) {
  var docs = vueApp.newDocs;

  var fnc = function fnc(x) {
    return x;
  };

  if (method === "LDA") {
    fnc = getLDAClusters;
  } else {
    fnc = getWord2VecClusters;
  }

  window.loadDFunc = fnc;
  fnc(docs, function (resp) {
    window.global_data = resp;
    initPage1(resp);
    initPage2(resp);
    initPage3(resp);
    initPage4();

    if (success) {
      success(resp);
    }
  }, fail);
}

function loadVisualizations() {}

function initPage1(resp) {
  renderClusterAnalysis(resp);
}

function initPage2(resp) {
  $("#speciescollapsible").html("");
  renderClusterForceLayout(resp);
}

function initPage3(resp) {
  $("#parallel-coordinate-vis").html("");
  $("#pc-container").html("");
  loadParallelCoordinate(resp);
  loadParallelCoordinatesHC(resp);
}

function initPage4() {
  $("#overall-wc").html("");
  loadWordCloud(window.global_data);
}
"use strict";

//vectors format: Map[string(topic_id): List[float]]
function get2DVectors(vectors, successCallback) {
  var request = $.ajax({
    url: "/get2DVectors",
    method: "POST",
    data: vectors
  });
  request.done(function (response) {
    successCallback(response);
  });
  request.fail(function (jqXHR, textStatus) {
    alert("Request failed: " + textStatus);
  });
}

function getTokenizedDocs(docs, successCallback, failureCallback) {
  var request = $.ajax({
    url: "/getDocsFromTexts",
    method: "POST",
    data: JSON.stringify({
      docs: docs
    }),
    contentType: "application/json; charset=utf-8",
    dataType: "json"
  });
  request.done(function (response) {
    successCallback(response.docs);
  });
  request.fail(function (jqXHR, textStatus) {
    if (failureCallback) failureCallback(textStatus);else {
      alert("Request failed: " + textStatus);
    }
  });
} // docs format: List[List[string(word)]]


function getWord2VecClusters(docs, successCallback, failureCallback) {
  var request = $.ajax({
    url: "/api/getClustersWord2Vec",
    method: "POST",
    data: JSON.stringify({
      docs: docs,
      start: window.vueApp.settings.start2,
      end: window.vueApp.settings.end2,
      selected: window.vueApp.settings.selectedDataset
    }),
    contentType: "application/json; charset=utf-8",
    dataType: "json"
  });
  request.done(function (response) {
    successCallback(JSON.parse(response));
  });
  request.fail(function (jqXHR, textStatus) {
    if (failureCallback) failureCallback(textStatus);else {
      alert("Request failed: " + textStatus);
    }
  });
}

function getLDAClusters(docs, successCallback, failureCallback) {
  var request = $.ajax({
    url: "/api/getLDAData",
    method: "POST",
    data: JSON.stringify({
      docs: docs,
      start: window.vueApp.settings.start1,
      end: window.vueApp.settings.end1,
      selected: window.vueApp.settings.selectedDataset
    }),
    contentType: "application/json; charset=utf-8",
    dataType: "json"
  });
  request.done(function (response) {
    successCallback(response);
  });
  request.fail(function (jqXHR, textStatus) {
    if (failureCallback) failureCallback(textStatus);else {
      alert("Request failed: " + textStatus);
    }
  });
}
"use strict";

function loadParallelCoordinatesHC(resp) {
  var data = generateParallelCoordinateDataHC(resp, window.vueApp.params.topicThreshold, window.vueApp.params.wordThreshold);
  Highcharts.chart('pc-container', {
    chart: {
      type: 'spline',
      parallelCoordinates: true,
      parallelAxes: {
        lineWidth: 2
      }
    },
    title: {
      text: 'Document - Topic - Word Relationship'
    },
    plotOptions: {
      series: {
        animation: false,
        marker: {
          enabled: false,
          states: {
            hover: {
              enabled: false
            }
          }
        },
        states: {
          hover: {
            halo: {
              size: 0
            }
          }
        },
        events: {
          mouseOver: function mouseOver() {
            this.group.toFront();
          }
        }
      }
    },
    // tooltip: {
    //     pointFormat: '<span style="color:{point.color}">\u25CF</span>' +
    //         '{series.name}: <b>{point.formattedValue}</b><br/>'
    // },
    xAxis: {
      categories: ['Document', 'Topic', 'Word'],
      offset: 10
    },
    yAxis: [{
      categories: Object.keys(resp["document_topic"]).map(function (x) {
        return "................Document " + x;
      })
    }, {
      categories: resp["topics"].map(function (x) {
        return "................Topic " + x;
      })
    }, {
      categories: Object.values(resp["words"]).map(function (x) {
        return "................" + x;
      })
    }],
    colors: ['rgba(11, 200, 200, 0.1)'],
    series: data.map(function (set, i) {
      return {
        name: '',
        data: set,
        shadow: false
      };
    })
  });
}
"use strict";

function loadParallelCoordinate(resp) {
  var margin = {
    top: 30,
    right: 10,
    bottom: 10,
    left: 10
  },
      width = 960 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;
  var x = d3V3.scale.ordinal().rangePoints([0, width], 1),
      y = {},
      dragging = {};
  var line = d3V3.svg.line(),
      background,
      foreground;
  var svg = d3V3.select("#parallel-coordinate-vis").append("svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")"),
      dimensions; // Extract the list of dimensions and create a scale for each.

  var cars = generateParallelCoordinateData(resp, window.vueApp.params.topicThreshold, window.vueApp.params.wordThreshold); // var axisD = d3V3.svg.axis().orient("left").ticks(Object.keys(resp["document_topic"]).length),

  var axisD = d3V3.svg.axis().orient("left").tickValues(Object.keys(resp["document_topic"]).map(function (x) {
    return parseInt(x);
  })),
      axisT = d3V3.svg.axis().orient("left").tickValues(resp["topics"].map(function (x) {
    return parseInt(x);
  })),
      axisW = d3V3.svg.axis().orient("left").tickValues(Object.values(resp["overall_word"]).map(function (x) {
    return parseFloat(x);
  }));
  x.domain(dimensions = d3V3.keys(cars[0]).filter(function (d) {
    return d != "name" && (y[d] = d3V3.scale.linear().domain(d3V3.extent(cars, function (p) {
      return +p[d];
    })).range([height, 0]));
  })); // Add grey background lines for context.

  background = svg.append("g").attr("class", "background").selectAll("path").data(cars).enter().append("path").attr("d", path); // Add blue foreground lines for focus.

  foreground = svg.append("g").attr("class", "foreground").selectAll("path").data(cars).enter().append("path").attr("d", path); // Add a group element for each dimension.

  var g = svg.selectAll(".dimension").data(dimensions).enter().append("g").attr("class", "dimension").attr("transform", function (d) {
    return "translate(" + x(d) + ")";
  }).call(d3V3.behavior.drag().origin(function (d) {
    return {
      x: x(d)
    };
  }).on("dragstart", function (d) {
    dragging[d] = x(d);
    background.attr("visibility", "hidden");
  }).on("drag", function (d) {
    dragging[d] = Math.min(width, Math.max(0, d3V3.event.x));
    foreground.attr("d", path);
    dimensions.sort(function (a, b) {
      return position(a) - position(b);
    });
    x.domain(dimensions);
    g.attr("transform", function (d) {
      return "translate(" + position(d) + ")";
    });
  }).on("dragend", function (d) {
    delete dragging[d];
    transition(d3V3.select(this)).attr("transform", "translate(" + x(d) + ")");
    transition(foreground).attr("d", path);
    background.attr("d", path).transition().delay(500).duration(0).attr("visibility", null);
  })); // Add an axis and title.

  g.append("g").attr("class", "axis").each(function (d) {
    var axis = null;

    if (d == "document") {
      axis = axisD;
    } else if (d == "topic") {
      axis = axisT;
    } else {
      axis = axisW;
    }

    d3V3.select(this).call(axis.scale(y[d]));
  }).append("text").style("text-anchor", "middle").attr("y", -9).text(function (d) {
    return d;
  }); // Add and store a brush for each axis.

  g.append("g").attr("class", "brush").each(function (d) {
    d3V3.select(this).call(y[d].brush = d3V3.svg.brush().y(y[d]).on("brushstart", brushstart).on("brush", brush));
  }).selectAll("rect").attr("x", -8).attr("width", 16);

  function position(d) {
    var v = dragging[d];
    return v == null ? x(d) : v;
  }

  function transition(g) {
    return g.transition().duration(500);
  } // Returns the path for a given data point.


  function path(d) {
    return line(dimensions.map(function (p) {
      return [position(p), y[p](d[p])];
    }));
  }

  function brushstart() {
    d3V3.event.sourceEvent.stopPropagation();
  } // Handles a brush event, toggling the display of foreground lines.


  function brush() {
    var actives = dimensions.filter(function (p) {
      return !y[p].brush.empty();
    }),
        extents = actives.map(function (p) {
      return y[p].brush.extent();
    });
    foreground.style("display", function (d) {
      return actives.every(function (p, i) {
        return extents[i][0] <= d[p] && d[p] <= extents[i][1];
      }) ? null : "none";
    });
  }
}
"use strict";

function renderClusterAnalysis(resp) {
  d3.select(".chart12").remove();
  var document_topic = resp["document_topic"][0];
  var topic_vectors = resp["topic_vectors"];
  var bb = document.querySelector('#cluster').getBoundingClientRect(),
      width = 400;
  var height = 400;
  var margin = 80;
  var data = [];
  Object.keys(topic_vectors).forEach(function (key) {
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
  var svg = d3.select('#cluster').append('svg').attr('class', 'chart12').attr('id', 'cluster_id').attr("width", width + margin + margin).attr("height", height + margin + margin).append("g").attr("transform", "translate(" + margin + "," + margin + ")");
  var x = d3.scaleLinear().domain([d3.min(data, function (d) {
    return d.x;
  }), d3.max(data, function (d) {
    return d.x;
  })]).range([0, width]);
  var y = d3.scaleLinear().domain([d3.min(data, function (d) {
    return d.y;
  }), d3.max(data, function (d) {
    return d.y;
  })]).range([height, 0]);
  var scale = d3.scaleSqrt().domain([d3.min(data, function (d) {
    return d.size;
  }), d3.max(data, function (d) {
    return d.size;
  })]).range([10, 20]);
  var opacity = d3.scaleSqrt().domain([d3.min(data, function (d) {
    return d.size;
  }), d3.max(data, function (d) {
    return d.size;
  })]).range([1, .5]);
  var xAxis = d3.axisBottom().scale(x);
  var yAxis = d3.axisLeft().scale(y);
  svg.append("g").attr("class", "y axis").call(yAxis).append("text").attr("transform", "rotate(-90)").attr("x", 20).attr("y", -margin).attr("dy", ".71em").style("text-anchor", "end").text(labelY); // x axis and label

  svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis).append("text").attr("x", width + 20).attr("y", margin - 10).attr("dy", ".71em").style("text-anchor", "end").text(labelX);
  svg.selectAll("circle").data(data).enter().append("g").insert("circle").attr("cx", width / 2).attr("cy", height / 2).attr("r", function (d) {
    return scale(d.size);
  }).attr("id", function (d) {
    return d.key;
  }).style("fill", function (d) {
    return "#D0E3F0";
  }).on('mouseover', function (d, i) {
    renderBarGraph(d["key"], resp);
    fade(d["key"], 1);
  }).on('mouseout', function (d, i) {
    fadeOut();
  }).transition().delay(function (d, i) {
    return x(d.x) - y(d.y);
  }).duration(500).attr("cx", function (d) {
    return x(d.x);
  }).attr("cy", function (d) {
    return y(d.y);
  }); // text label for the x axis

  svg.append("text").attr("class", "x label").attr("text-anchor", "end").attr("x", width).attr("y", height + 40).text("PC1");
  svg.append("text").attr("class", "y label").attr("text-anchor", "end").attr("y", -50).attr("dy", ".75em").attr("transform", "rotate(-90)").text("PC2");

  function fade(key, opacity) {
    svg.selectAll("circle").filter(function (d) {
      return d.key == key;
    }).style("fill", "#C8423E");
  }

  function fadeOut() {
    svg.selectAll("circle").transition().style("fill", "#D0E3F0");
  }
}
"use strict";

function renderBarGraph(topic_number, resp) {
  d3.select("#stack-bar").remove();
  d3.select("#legendsvg").remove();
  var final_data = [];
  var dataVal = resp["topic_word"][topic_number];

  for (var key in dataVal) {
    if (dataVal.hasOwnProperty(key)) {
      var temp = {};
      temp.State = key;
      temp.topic_frequency = Math.abs(dataVal[key]);
      temp.overall = Math.abs(resp["overall_word"][key]);
      temp.total = temp.topic_frequency + temp.overall;
      final_data.push(temp);
      console.log(key + "->" + resp["overall_word"][key]);
    }
  }

  var bb = document.querySelector('#stacked-bar').getBoundingClientRect(),
      width = 400;
  var data = final_data;
  var height = data.length * 25 + 100;
  var svg = d3.select("#stacked-bar").append("svg").attr("width", width).attr("height", height).attr("id", "stack-bar"),
      margin = {
    top: 20,
    right: 0,
    bottom: 50,
    left: 80
  },
      width = +svg.attr("width") - margin.left - margin.right,
      height = +svg.attr("height") - margin.top - margin.bottom,
      g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  var y = d3.scaleBand() // x = d3.scaleBand()  
  .rangeRound([0, height]) // .rangeRound([0, width])
  .paddingInner(0.25).align(0.1);
  var x = d3.scaleLinear() // y = d3.scaleLinear()
  .rangeRound([0, width]); // .rangeRound([height, 0]);

  var z = d3.scaleOrdinal().range(["#C8423E", "#A1C7E0"]);
  var keys = ["topic_frequency", "overall"];
  data.sort(function (a, b) {
    return b.total - a.total;
  });
  y.domain(data.map(function (d) {
    return d.State;
  })); // x.domain...

  x.domain([0, d3.max(data, function (d) {
    return d.total;
  })]).nice(); // y.domain...

  z.domain(keys);
  g.append("g").selectAll("g").data(d3.stack().keys(keys)(data)).enter().append("g").attr("fill", function (d) {
    return z(d.key);
  }).selectAll("rect").data(function (d) {
    return d;
  }).enter().append("rect").attr("y", function (d) {
    return y(d.data.State);
  }) //.attr("x", function(d) { return x(d.data.State); })
  .attr("x", function (d) {
    return x(d[0]);
  }) //.attr("y", function(d) { return y(d[1]); }) 
  .attr("width", function (d) {
    return x(d[1]) - x(d[0]);
  }) //.attr("height", function(d) { return y(d[0]) - y(d[1]); })
  .attr("height", y.bandwidth()); //.attr("width", x.bandwidth());  

  g.append("g").attr("class", "axis").attr("transform", "translate(0,0)") //  .attr("transform", "translate(0," + height + ")")
  .call(d3.axisLeft(y)); //   .call(d3.axisBottom(x));

  g.append("g").attr("class", "axis").attr("transform", "translate(0," + height + ")") // New line
  .call(d3.axisBottom(x).ticks(null, "s")) //  .call(d3.axisLeft(y).ticks(null, "s"))
  .append("text").attr("y", 2) //     .attr("y", 2)
  .attr("x", x(x.ticks().pop()) + 0.5) //     .attr("y", y(y.ticks().pop()) + 0.5)
  .attr("dy", "4em") //     .attr("dy", "0.32em")
  .attr("fill", "#000").attr("text-anchor", "start").text("Probability/Cosine Similarity").attr("transform", "translate(" + -width + ",-10)"); // Newline

  var legend = g.append("g").attr("font-family", "sans-serif").attr("font-size", 10).attr("text-anchor", "end").selectAll("g").data(keys.slice().reverse()).enter().append("g") //.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });
  .attr("transform", function (d, i) {
    return "translate(-50," + (300 + i * 20) + ")";
  });
  var keys1 = ["Overall Term Frequency/Overall Relevance", "Estimated Term frequency within the selected topic"];
  var svg1 = d3.select("#legendT").append("svg").attr("width", 500).attr("height", height).attr("id", "legendsvg");
  var legend = svg1.append("g").attr("font-family", "sans-serif").attr("font-size", 10).attr("text-anchor", "end").selectAll("g").data(keys1.slice().reverse()).enter().append("g") //.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });
  .attr("transform", function (d, i) {
    return "translate(-50," + (0 + i * 20) + ")";
  });
  legend.append("rect").attr("x", width).attr("width", function (d, i) {
    if (i == 0) {
      return 60;
    }

    return 160;
  }).attr("height", 19).attr("fill", z);
  legend.append("text").attr("x", width - 10).attr("y", 18).attr("dy", "0.0em").text(function (d) {
    return d;
  });
}
"use strict";

function generateTopicVectors() {
  window.topicVectors = {};

  if (window.topic_word_probability_in_topic) {
    for (var x in window.topic_word_probability_in_topic) {
      var vector = [];

      for (var y in window.topic_word_probability_in_topic[x]) {
        vector.push(window.topic_word_probability_in_topic[x][y]);
      }

      window.topicVectors[x] = vector;
    }
  }
}

function generateParallelCoordinateData(response, topic_threshold, word_threshold) {
  var visData = [];

  for (var docKey in response["document_topic"]) {
    for (var topic in response["document_topic"][docKey]) {
      var topicScore = response["document_topic"][docKey][topic];

      if (topicScore > topic_threshold) {
        for (var word in response["topic_word"][topic]) {
          var wordScore = response["topic_word"][topic][word];

          if (wordScore > word_threshold) {
            visData.push({
              "name": docKey,
              "document": docKey,
              "topic": topic,
              "word": response["overall_word"][word]
            });
          }
        }
      }
    }
  }

  return visData;
}

function generateParallelCoordinateDataHC(response, topic_threshold, word_threshold) {
  var visData = [];

  for (var docKey in response["document_topic"]) {
    for (var topic in response["document_topic"][docKey]) {
      var topicScore = response["document_topic"][docKey][topic];

      if (topicScore > topic_threshold) {
        for (var word in response["topic_word"][topic]) {
          var wordScore = response["topic_word"][topic][word];

          if (wordScore > word_threshold) {
            visData.push([parseInt(docKey), parseInt(topic), response["words"].indexOf(word)]);
          }
        }
      }
    }
  }

  return visData;
}
"use strict";

window.vueApp = new Vue({
  el: '#vue-app',
  data: {
    message: 'Hello user!',
    noneSelected: true,
    selectedPage: 5,
    playerDetail: {
      name: "<Player Name>"
    },
    overviewFilters: {},
    newDocs: [],
    selectedMap: 1,
    success: false,
    loading: false,
    failure: false,
    newDoc: '',
    newDocsProccessed: '',
    showProcessed: false,
    settings: {
      selectedMethod: "LDA",
      selectedDataset: 0,
      ldaTopicThreshold: 0,
      word2VecThreshold: 0
    },
    params: {
      topicThreshold: 0.02,
      wordThreshold: 0.02,
      wordOverallThreshold: 0
    }
  },
  methods: {
    selectPage: function selectPage(x) {
      this.selectedPage = x;

      if (x == 1) {
        initPage1(window.global_data);
      }

      if (x == 2) {
        initPage2(window.global_data);
      }

      if (x == 3) {
        initPage3(window.global_data);
      }

      if (x == 4) {
        initPage4(window.global_data);
      }
    },
    addNewDoc: function addNewDoc() {
      if (this.newDoc.trim().split(" ").length < 3) {
        alert("Please add at least 3 words");
        return;
      }

      this.newDocs.push(this.newDoc);
      this.newDoc = '';
      this.showProcessed = false;
    },
    saveChanges: function saveChanges() {
      var self = this;
      self.success = false;
      self.failure = false;
      self.loading = true;

      if (self.newDocs.length == 0) {
        alert("No documents.");
        return;
      }

      getAnalysis(this.settings.selectedMethod, function (resp) {
        self.success = true;
        self.loading = false;
      }, function (errorStatus) {
        self.loading = false;
        self.failure = true;
      });
    }
  },
  mounted: function mounted() {
    console.log("Mounted");
    loadD3();
    loadJquery();
  }
});
"use strict";

function loadWordCloud(resp) {
  var data = [];

  for (var word in resp["overall_word"]) {
    var weight = resp["overall_word"][word];
    data.push({
      name: word,
      weight: weight
    });
  }

  createWordCloud("overall-wc", data, "All Documents");

  for (var topic in resp["topic_word"]) {
    var _data = [];

    for (var word in resp["topic_word"][topic]) {
      var _weight = resp["topic_word"][topic][word];

      _data.push({
        name: word,
        weight: _weight
      });
    }

    $("#topic-wcs").append('<div class="col-sm-6"><div style="outline: solid 1px;" id="topic' + topic + '" style="height: 300px;"></div></div>');
    createWordCloud("topic" + topic, _data, "Topic " + topic);
  }
}

function createWordCloud(id, data, title) {
  Highcharts.chart(id, {
    series: [{
      type: 'wordcloud',
      data: data,
      rotation: {
        from: 0,
        to: 0,
        orientations: 5
      },
      name: 'Score'
    }],
    title: {
      text: title
    }
  });
}
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNsdXN0ZXJfZm9yY2VfbGF5b3V0LmpzIiwiZXZlbnRzLmpzIiwibWFpbi5qcyIsIm5ldHdvcmsuanMiLCJwYXJhbGxlbC1jb29yZGluYXRlLWhjLmpzIiwicGFyYWxsZWwtY29vcmRpbmF0ZS5qcyIsInNjYXR0ZXJfcGxvdF93aXRoX3dlaWdodHMuanMiLCJzdGFja2VkX2Jhcl9ncmFwaC5qcyIsInV0aWwuanMiLCJ2dWVfbW9kZWwuanMiLCJ3b3JkY2xvdWQuanMiXSwibmFtZXMiOlsiQXJyYXkiLCJwcm90b3R5cGUiLCJjb250YWlucyIsInYiLCJpIiwibGVuZ3RoIiwidW5pcXVlIiwiYXJyIiwiaW5jbHVkZXMiLCJwdXNoIiwicmVuZGVyQ2x1c3RlckZvcmNlTGF5b3V0IiwiZGF0YSIsImRhdGFWYWwiLCJmaW5hbF9kaWN0Iiwia2V5IiwiaGFzT3duUHJvcGVydHkiLCJjaGlsZHJlbldvcmRzIiwiY2hpbGRLZXkiLCJ3aW5kb3ciLCJ2dWVBcHAiLCJwYXJhbXMiLCJ3b3JkVGhyZXNob2xkIiwiY2x1c3Rlcl9kYXRhIiwiY291bnQiLCJ3b3JkT3ZlcmFsbFRocmVzaG9sZCIsImhhc2giLCJhcnJheV9jaGlsZCIsImNoaWxkcyIsImNoaWxkX2hhc2giLCJjaGlsZHJlbiIsImQzIiwiZDNWMyIsInJlbmRlckNsdXN0ZXIiLCJyYWRpdXMiLCJkZW5kb2dyYW1Db250YWluZXIiLCJyb290Tm9kZVNpemUiLCJsZXZlbE9uZU5vZGVTaXplIiwibGV2ZWxUd29Ob2RlU2l6ZSIsImxldmVsVGhyZWVOb2RlU2l6ZSIsImR1cmF0aW9uIiwicm9vdEpzb25EYXRhIiwiY2x1c3RlciIsImxheW91dCIsInNpemUiLCJzZXBhcmF0aW9uIiwiYSIsImIiLCJwYXJlbnQiLCJkZXB0aCIsImRpYWdvbmFsIiwic3ZnIiwicmFkaWFsIiwicHJvamVjdGlvbiIsImQiLCJ5IiwieCIsIk1hdGgiLCJQSSIsImNvbnRhaW5lckRpdiIsInNlbGVjdCIsImRvY3VtZW50IiwiZ2V0RWxlbWVudEJ5SWQiLCJhcHBlbmQiLCJhdHRyIiwidGV4dCIsIm9uIiwiY29sbGFwc2VMZXZlbHMiLCJzdmdSb290IiwiY2FsbCIsImJlaGF2aW9yIiwiem9vbSIsInNjYWxlIiwic2NhbGVFeHRlbnQiLCJhbmltR3JvdXAiLCJmb3JFYWNoIiwiY29sbGFwc2UiLCJjcmVhdGVDb2xsYXBzaWJsZURlbmRyb0dyYW0iLCJzb3VyY2UiLCJub2RlcyIsInBhdGhsaW5rcyIsImxpbmtzIiwibm9kZSIsInNlbGVjdEFsbCIsImlkIiwibm9kZUVudGVyIiwiZW50ZXIiLCJ0b2dnbGVDaGlsZHJlbiIsImFsaWFzIiwibmFtZSIsIm5vZGVVcGRhdGUiLCJ0cmFuc2l0aW9uIiwic3R5bGUiLCJjb2xvciIsIm9yZGVyIiwibm9kZUV4aXQiLCJleGl0IiwicmVtb3ZlIiwibGluayIsInRhcmdldCIsImluc2VydCIsIm8iLCJ4MCIsInkwIiwiY2xpY2tUeXBlIiwiX2NoaWxkcmVuIiwidHlwZSIsInVuZGVmaW5lZCIsImhpZ2hsaWdodE5vZGVTZWxlY3Rpb25zIiwiaGlnaGxpZ2h0Um9vdFRvTm9kZVBhdGgiLCJoaWdobGlnaHRMaW5rQ29sb3IiLCJkZWZhdWx0TGlua0NvbG9yIiwibm9kZUNvbG9yIiwicGF0aExpbmtzIiwiZGQiLCJhbmNlc3RvcnMiLCJfIiwiaXNVbmRlZmluZWQiLCJtYXRjaGVkTGlua3MiLCJmaWx0ZXIiLCJhbnkiLCJwIiwiZWFjaCIsImFuaW1hdGVDaGFpbnMiLCJjbGFzc2VkIiwib3ZlcmxheUJveCIsImdldEJCb3giLCJldmVudCIsInRyYW5zbGF0ZSIsImNoZWNrRm9yVGhpcmRMZXZlbE9wZW5DaGlsZHJlbiIsInRvZ2dsZUFsbFNlY29uZExldmVsQ2hpbGRyZW4iLCJ0b2dnbGVTZWNvbmRMZXZlbENoaWxkcmVuIiwicm9vdEluZGV4Iiwicm9vdExlbmd0aCIsImlzTm9kZU9wZW4iLCJjaGlsZEluZGV4IiwiY2hpbGRMZW5ndGgiLCJzZWNvbmRMZXZlbENoaWxkIiwibG9hZEpxdWVyeSIsIiQiLCJyZWFkeSIsImNsaWNrIiwic2lkZWJhciIsInJlcXVpcmUiLCJjb25maWciLCJwYXRocyIsImxvYWREMyIsImQzT2xkIiwiZG9jdW1lbnRzIiwiZ2V0RG9jcyIsInRleHRzIiwibWFwIiwic3BsaXQiLCJnZXRBbmFseXNpcyIsIm1ldGhvZCIsInN1Y2Nlc3MiLCJmYWlsIiwiZG9jcyIsIm5ld0RvY3MiLCJmbmMiLCJnZXRMREFDbHVzdGVycyIsImdldFdvcmQyVmVjQ2x1c3RlcnMiLCJsb2FkREZ1bmMiLCJyZXNwIiwiZ2xvYmFsX2RhdGEiLCJpbml0UGFnZTEiLCJpbml0UGFnZTIiLCJpbml0UGFnZTMiLCJpbml0UGFnZTQiLCJsb2FkVmlzdWFsaXphdGlvbnMiLCJyZW5kZXJDbHVzdGVyQW5hbHlzaXMiLCJodG1sIiwibG9hZFBhcmFsbGVsQ29vcmRpbmF0ZSIsImxvYWRQYXJhbGxlbENvb3JkaW5hdGVzSEMiLCJsb2FkV29yZENsb3VkIiwiZ2V0MkRWZWN0b3JzIiwidmVjdG9ycyIsInN1Y2Nlc3NDYWxsYmFjayIsInJlcXVlc3QiLCJhamF4IiwidXJsIiwiZG9uZSIsInJlc3BvbnNlIiwianFYSFIiLCJ0ZXh0U3RhdHVzIiwiYWxlcnQiLCJnZXRUb2tlbml6ZWREb2NzIiwiZmFpbHVyZUNhbGxiYWNrIiwiSlNPTiIsInN0cmluZ2lmeSIsImNvbnRlbnRUeXBlIiwiZGF0YVR5cGUiLCJzdGFydCIsInNldHRpbmdzIiwic3RhcnQyIiwiZW5kIiwiZW5kMiIsInNlbGVjdGVkIiwic2VsZWN0ZWREYXRhc2V0IiwicGFyc2UiLCJzdGFydDEiLCJlbmQxIiwiZ2VuZXJhdGVQYXJhbGxlbENvb3JkaW5hdGVEYXRhSEMiLCJ0b3BpY1RocmVzaG9sZCIsIkhpZ2hjaGFydHMiLCJjaGFydCIsInBhcmFsbGVsQ29vcmRpbmF0ZXMiLCJwYXJhbGxlbEF4ZXMiLCJsaW5lV2lkdGgiLCJ0aXRsZSIsInBsb3RPcHRpb25zIiwic2VyaWVzIiwiYW5pbWF0aW9uIiwibWFya2VyIiwiZW5hYmxlZCIsInN0YXRlcyIsImhvdmVyIiwiaGFsbyIsImV2ZW50cyIsIm1vdXNlT3ZlciIsImdyb3VwIiwidG9Gcm9udCIsInhBeGlzIiwiY2F0ZWdvcmllcyIsIm9mZnNldCIsInlBeGlzIiwiT2JqZWN0Iiwia2V5cyIsInZhbHVlcyIsImNvbG9ycyIsInNldCIsInNoYWRvdyIsIm1hcmdpbiIsInRvcCIsInJpZ2h0IiwiYm90dG9tIiwibGVmdCIsIndpZHRoIiwiaGVpZ2h0Iiwib3JkaW5hbCIsInJhbmdlUG9pbnRzIiwiZHJhZ2dpbmciLCJsaW5lIiwiYmFja2dyb3VuZCIsImZvcmVncm91bmQiLCJkaW1lbnNpb25zIiwiY2FycyIsImdlbmVyYXRlUGFyYWxsZWxDb29yZGluYXRlRGF0YSIsImF4aXNEIiwiYXhpcyIsIm9yaWVudCIsInRpY2tWYWx1ZXMiLCJwYXJzZUludCIsImF4aXNUIiwiYXhpc1ciLCJwYXJzZUZsb2F0IiwiZG9tYWluIiwibGluZWFyIiwiZXh0ZW50IiwicmFuZ2UiLCJwYXRoIiwiZyIsImRyYWciLCJvcmlnaW4iLCJtaW4iLCJtYXgiLCJzb3J0IiwicG9zaXRpb24iLCJkZWxheSIsImJydXNoIiwiYnJ1c2hzdGFydCIsInNvdXJjZUV2ZW50Iiwic3RvcFByb3BhZ2F0aW9uIiwiYWN0aXZlcyIsImVtcHR5IiwiZXh0ZW50cyIsImV2ZXJ5IiwiZG9jdW1lbnRfdG9waWMiLCJ0b3BpY192ZWN0b3JzIiwiYmIiLCJxdWVyeVNlbGVjdG9yIiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0IiwidmFsdWUiLCJjIiwibGFiZWxYIiwibGFiZWxZIiwic2NhbGVMaW5lYXIiLCJzY2FsZVNxcnQiLCJvcGFjaXR5IiwiYXhpc0JvdHRvbSIsImF4aXNMZWZ0IiwicmVuZGVyQmFyR3JhcGgiLCJmYWRlIiwiZmFkZU91dCIsInRvcGljX251bWJlciIsImZpbmFsX2RhdGEiLCJ0ZW1wIiwiU3RhdGUiLCJ0b3BpY19mcmVxdWVuY3kiLCJhYnMiLCJvdmVyYWxsIiwidG90YWwiLCJjb25zb2xlIiwibG9nIiwic2NhbGVCYW5kIiwicmFuZ2VSb3VuZCIsInBhZGRpbmdJbm5lciIsImFsaWduIiwieiIsInNjYWxlT3JkaW5hbCIsIm5pY2UiLCJzdGFjayIsImJhbmR3aWR0aCIsInRpY2tzIiwicG9wIiwibGVnZW5kIiwic2xpY2UiLCJyZXZlcnNlIiwia2V5czEiLCJzdmcxIiwiZ2VuZXJhdGVUb3BpY1ZlY3RvcnMiLCJ0b3BpY1ZlY3RvcnMiLCJ0b3BpY193b3JkX3Byb2JhYmlsaXR5X2luX3RvcGljIiwidmVjdG9yIiwidG9waWNfdGhyZXNob2xkIiwid29yZF90aHJlc2hvbGQiLCJ2aXNEYXRhIiwiZG9jS2V5IiwidG9waWMiLCJ0b3BpY1Njb3JlIiwid29yZCIsIndvcmRTY29yZSIsImluZGV4T2YiLCJWdWUiLCJlbCIsIm1lc3NhZ2UiLCJub25lU2VsZWN0ZWQiLCJzZWxlY3RlZFBhZ2UiLCJwbGF5ZXJEZXRhaWwiLCJvdmVydmlld0ZpbHRlcnMiLCJzZWxlY3RlZE1hcCIsImxvYWRpbmciLCJmYWlsdXJlIiwibmV3RG9jIiwibmV3RG9jc1Byb2NjZXNzZWQiLCJzaG93UHJvY2Vzc2VkIiwic2VsZWN0ZWRNZXRob2QiLCJsZGFUb3BpY1RocmVzaG9sZCIsIndvcmQyVmVjVGhyZXNob2xkIiwibWV0aG9kcyIsInNlbGVjdFBhZ2UiLCJhZGROZXdEb2MiLCJ0cmltIiwic2F2ZUNoYW5nZXMiLCJzZWxmIiwiZXJyb3JTdGF0dXMiLCJtb3VudGVkIiwid2VpZ2h0IiwiY3JlYXRlV29yZENsb3VkIiwicm90YXRpb24iLCJmcm9tIiwidG8iLCJvcmllbnRhdGlvbnMiXSwibWFwcGluZ3MiOiI7Ozs7QUFBQUEsS0FBSyxDQUFDQyxTQUFOLENBQWdCQyxRQUFoQixHQUEyQixVQUFTQyxDQUFULEVBQVk7QUFDbkMsT0FBSSxJQUFJQyxDQUFDLEdBQUcsQ0FBWixFQUFlQSxDQUFDLEdBQUcsS0FBS0MsTUFBeEIsRUFBZ0NELENBQUMsRUFBakMsRUFBcUM7QUFDakMsUUFBRyxLQUFLQSxDQUFMLE1BQVlELENBQWYsRUFBa0IsT0FBTyxJQUFQ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cUVBQW1FeVEsS0FBbkUsR0FBeUUsdUNBQWhHO0FBQ0E4QixJQUFBQSxlQUFlLENBQUMsVUFBUTlCLEtBQVQsRUFBZ0I1VCxLQUFoQixFQUFzQixXQUFTNFQsS0FBL0IsQ0FBZjtBQUNIO0FBQ0o7O0FBRUQsU0FBUzhCLGVBQVQsQ0FBeUJsUixFQUF6QixFQUE2QnhFLElBQTdCLEVBQW1DcU0sS0FBbkMsRUFBeUM7QUFDckNMLEVBQUFBLFVBQVUsQ0FBQ0MsS0FBWCxDQUFpQnpILEVBQWpCLEVBQXFCO0FBQ2pCK0gsSUFBQUEsTUFBTSxFQUFFLENBQUM7QUFDTHpHLE1BQUFBLElBQUksRUFBRSxXQUREO0FBRUw5RixNQUFBQSxJQUFJLEVBQUVBLElBRkQ7QUFHTDJWLE1BQUFBLFFBQVEsRUFBRTtBQUNOQyxRQUFBQSxJQUFJLEVBQUUsQ0FEQTtBQUVOQyxRQUFBQSxFQUFFLEVBQUUsQ0FGRTtBQUdOQyxRQUFBQSxZQUFZLEVBQUU7QUFIUixPQUhMO0FBUUxqUixNQUFBQSxJQUFJLEVBQUU7QUFSRCxLQUFELENBRFM7QUFXakJ3SCxJQUFBQSxLQUFLLEVBQUU7QUFDSGhKLE1BQUFBLElBQUksRUFBRWdKO0FBREg7QUFYVSxHQUFyQjtBQWVIIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIkFycmF5LnByb3RvdHlwZS5jb250YWlucyA9IGZ1bmN0aW9uKHYpIHtcclxuICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgaWYodGhpc1tpXSA9PT0gdikgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn07XHJcblxyXG5BcnJheS5wcm90b3R5cGUudW5pcXVlID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgYXJyID0gW107XHJcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGlmKCFhcnIuaW5jbHVkZXModGhpc1tpXSkpIHtcclxuICAgICAgICAgICAgYXJyLnB1c2godGhpc1tpXSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGFycjsgXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlbmRlckNsdXN0ZXJGb3JjZUxheW91dChkYXRhKXtcclxuXHR2YXIgZGF0YVZhbCA9IGRhdGFbXCJ0b3BpY193b3JkXCJdO1xyXG5cdHZhciBmaW5hbF9kaWN0ID0ge307XHJcblx0Zm9yICh2YXIga2V5IGluIGRhdGFWYWwpIHtcclxuXHQgICAgaWYgKGRhdGFWYWwuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG5cclxuXHQgICAgXHR2YXIgY2hpbGRyZW5Xb3JkcyA9IGRhdGFWYWxba2V5XTtcclxuXHJcblx0ICAgIFx0Zm9yKHZhciBjaGlsZEtleSBpbiBjaGlsZHJlbldvcmRzKXtcclxuXHJcblx0ICAgIFx0XHRpZiAoY2hpbGRyZW5Xb3Jkcy5oYXNPd25Qcm9wZXJ0eShjaGlsZEtleSkgJiYgY2hpbGRyZW5Xb3Jkc1tjaGlsZEtleV0gPiB3aW5kb3cudnVlQXBwLnBhcmFtcy53b3JkVGhyZXNob2xkKSB7XHJcblxyXG5cdCAgICBcdFx0XHRpZighKGNoaWxkS2V5IGluIGZpbmFsX2RpY3QpKXtcclxuXHQgICAgXHRcdFx0XHRmaW5hbF9kaWN0W2NoaWxkS2V5XSA9IFtdO1xyXG5cdCAgICBcdFx0XHR9XHJcbiAgICBcdFx0XHRcdGZpbmFsX2RpY3RbY2hpbGRLZXldLnB1c2goa2V5KTtcclxuXHQgICAgXHRcdFx0XHJcblx0ICAgIFx0XHR9XHJcblx0ICAgIFx0fSBcclxuXHQgICAgfVxyXG4gIFx0fVxyXG4gIFx0dmFyIGNsdXN0ZXJfZGF0YSA9IHtcclxuICBcdFx0XCJuYW1lXCI6XCJcIixcclxuICBcdFx0XCJjaGlsZHJlblwiOltdXHJcbiAgXHR9XHJcblxyXG4gIFx0dmFyIGNvdW50PTA7XHJcbiAgXHRmb3IodmFyIGtleSBpbiBmaW5hbF9kaWN0KXtcclxuICBcdFx0aWYgKGZpbmFsX2RpY3QuaGFzT3duUHJvcGVydHkoa2V5KSAmJiAoZGF0YVtcIm92ZXJhbGxfd29yZFwiXVtrZXldICYmIGRhdGFbXCJvdmVyYWxsX3dvcmRcIl1ba2V5XSA+IHdpbmRvdy52dWVBcHAucGFyYW1zLndvcmRPdmVyYWxsVGhyZXNob2xkKSkge1xyXG4gIFx0XHRcdGNvdW50ID0gY291bnQgKyAxO1xyXG4gIFx0XHRcdHZhciBoYXNoID0ge307XHJcbiAgXHRcdFx0aGFzaFtcIm9yZGVyXCJdID0gY291bnQ7XHJcbiAgXHRcdFx0aGFzaFtcImFsaWFzXCJdID0gXCJXaGl0ZS9yZWQvamFjayBwaW5lXCI7XHJcbiAgXHRcdFx0aGFzaFtcImNvbG9yXCJdID0gXCIjQzdFQUZCXCI7XHJcbiAgXHRcdFx0aGFzaFtcIm5hbWVcIl0gPSBrZXk7XHJcblxyXG5cclxuICBcdFx0XHR2YXIgYXJyYXlfY2hpbGQgPSBmaW5hbF9kaWN0W2tleV0udW5pcXVlKCk7XHJcbiAgXHRcdFx0dmFyIGNoaWxkcyA9W107XHJcbiAgXHRcdFx0Zm9yKHZhciBpPTA7IGkgPCBhcnJheV9jaGlsZC5sZW5ndGg7aSsrKXtcclxuICBcdFx0XHRcdHZhciBjaGlsZF9oYXNoID0ge307XHJcbiAgXHRcdFx0XHRjaGlsZF9oYXNoW1wib3JkZXJcIl0gPSBpKzE7XHJcbiAgXHRcdFx0XHRjaGlsZF9oYXNoW1wiYWxpYXNcIl0gPSBpKzEgKyBcIlwiO1xyXG4gIFx0XHRcdFx0Y2hpbGRfaGFzaFtcImNvbG9yXCJdID0gXCIjQzdFQUZCXCI7XHJcbiAgXHRcdFx0XHRjaGlsZF9oYXNoW1wibmFtZVwiXT0gYXJyYXlfY2hpbGRbaV07XHJcbiAgXHRcdFx0XHRjaGlsZHMucHVzaChjaGlsZF9oYXNoKTtcclxuICBcdFx0XHR9XHJcbiAgXHRcdFx0aGFzaFtcImNoaWxkcmVuXCJdID0gY2hpbGRzO1xyXG4gIFx0XHRcdGNsdXN0ZXJfZGF0YS5jaGlsZHJlbi5wdXNoKGhhc2gpO1xyXG4gIFx0XHR9XHJcbiAgXHR9XHJcbiAgXHR2YXIgZDMgPSAgIHdpbmRvdy5kM1YzO1xyXG4gIFx0cmVuZGVyQ2x1c3RlcihjbHVzdGVyX2RhdGEsIGQzKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVuZGVyQ2x1c3RlcihjbHVzdGVyX2RhdGEsIGQzKXtcclxuICB2YXIgcmFkaXVzID0gMjAwO1xyXG4gIHZhciBkZW5kb2dyYW1Db250YWluZXIgPSBcInNwZWNpZXNjb2xsYXBzaWJsZVwiO1xyXG5cclxuXHJcbiAgdmFyIHJvb3ROb2RlU2l6ZSA9IDY7XHJcbiAgdmFyIGxldmVsT25lTm9kZVNpemUgPSAzO1xyXG4gIHZhciBsZXZlbFR3b05vZGVTaXplID0gMztcclxuICB2YXIgbGV2ZWxUaHJlZU5vZGVTaXplID0gMjtcclxuXHJcblxyXG4gIHZhciBpID0gMDtcclxuICB2YXIgZHVyYXRpb24gPSAzMDA7IC8vQ2hhbmdpbmcgdmFsdWUgZG9lc24ndCBzZWVtIGFueSBjaGFuZ2VzIGluIHRoZSBkdXJhdGlvbiA/P1xyXG5cclxuICB2YXIgcm9vdEpzb25EYXRhO1xyXG5cclxuICB2YXIgY2x1c3RlciA9IGQzLmxheW91dC5jbHVzdGVyKClcclxuICAgICAgLnNpemUoWzM2MCxyYWRpdXMgLSAxMjBdKVxyXG4gICAgICAuc2VwYXJhdGlvbihmdW5jdGlvbihhLCBiKSB7XHJcbiAgICAgICAgcmV0dXJuIChhLnBhcmVudCA9PSBiLnBhcmVudCA/IDEgOiAyKSAvIGEuZGVwdGg7XHJcbiAgICAgIH0pO1xyXG5cclxuICB2YXIgZGlhZ29uYWwgPSBkMy5zdmcuZGlhZ29uYWwucmFkaWFsKClcclxuICAgICAgLnByb2plY3Rpb24oZnVuY3Rpb24oZCkgeyByZXR1cm4gW2QueSwgZC54IC8gMTgwICogTWF0aC5QSV07IH0pO1xyXG5cclxuICB2YXIgY29udGFpbmVyRGl2ID0gZDMuc2VsZWN0KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRlbmRvZ3JhbUNvbnRhaW5lcikpO1xyXG5cclxuICBjb250YWluZXJEaXYuYXBwZW5kKFwiYnV0dG9uXCIpXHJcbiAgICAgIC5hdHRyKFwiaWRcIixcImNvbGxhcHNlLWJ1dHRvblwiKVxyXG4gICAgICAudGV4dChcIkNvbGxhcHNlIVwiKVxyXG4gICAgICAub24oXCJjbGlja1wiLGNvbGxhcHNlTGV2ZWxzKTtcclxuXHJcbiAgdmFyIHN2Z1Jvb3QgPSBjb250YWluZXJEaXYuYXBwZW5kKFwic3ZnOnN2Z1wiKVxyXG4gICAgICAuYXR0cihcIndpZHRoXCIsIFwiMTAwJVwiKVxyXG4gICAgICAuYXR0cihcImhlaWdodFwiLCBcIjEwMCVcIilcclxuICAgICAgLmF0dHIoXCJ2aWV3Qm94XCIsIFwiLVwiICsgKHJhZGl1cykgKyBcIiAtXCIgKyAocmFkaXVzIC0gNTApICtcIiBcIisgcmFkaXVzKjIgK1wiIFwiKyByYWRpdXMqMilcclxuICAgICAgLmNhbGwoZDMuYmVoYXZpb3Iuem9vbSgpLnNjYWxlKDAuOSkuc2NhbGVFeHRlbnQoWzAuMSwgM10pLm9uKFwiem9vbVwiLCB6b29tKSkub24oXCJkYmxjbGljay56b29tXCIsIG51bGwpXHJcbiAgICAgIC5hcHBlbmQoXCJzdmc6Z1wiKTtcclxuXHJcbiAgLy8gQWRkIHRoZSBjbGlwcGluZyBwYXRoXHJcbiAgc3ZnUm9vdC5hcHBlbmQoXCJzdmc6Y2xpcFBhdGhcIikuYXR0cihcImlkXCIsIFwiY2xpcHBlci1wYXRoXCIpXHJcbiAgICAgIC5hcHBlbmQoXCJzdmc6cmVjdFwiKVxyXG4gICAgICAuYXR0cignaWQnLCAnY2xpcC1yZWN0LWFuaW0nKTtcclxuXHJcbiAgdmFyIGFuaW1Hcm91cCA9IHN2Z1Jvb3QuYXBwZW5kKFwic3ZnOmdcIilcclxuICAgICAgLmF0dHIoXCJjbGlwLXBhdGhcIiwgXCJ1cmwoI2NsaXBwZXItcGF0aClcIik7XHJcblxyXG4gIFx0cm9vdEpzb25EYXRhID0gY2x1c3Rlcl9kYXRhO1xyXG5cclxuICAgIC8vU3RhcnQgd2l0aCBhbGwgY2hpbGRyZW4gY29sbGFwc2VkXHJcbiAgICByb290SnNvbkRhdGEuY2hpbGRyZW4uZm9yRWFjaChjb2xsYXBzZSk7XHJcblxyXG4gICAgLy9Jbml0aWFsaXplIHRoZSBkZW5kcm9ncmFtXHJcbiAgXHRjcmVhdGVDb2xsYXBzaWJsZURlbmRyb0dyYW0ocm9vdEpzb25EYXRhKTtcclxuXHJcblxyXG5cclxuXHJcbiAgZnVuY3Rpb24gY3JlYXRlQ29sbGFwc2libGVEZW5kcm9HcmFtKHNvdXJjZSkge1xyXG5cclxuICAgIC8vIENvbXB1dGUgdGhlIG5ldyB0cmVlIGxheW91dC5cclxuICAgIHZhciBub2RlcyA9IGNsdXN0ZXIubm9kZXMocm9vdEpzb25EYXRhKTtcclxuICAgIHZhciBwYXRobGlua3MgPSBjbHVzdGVyLmxpbmtzKG5vZGVzKTtcclxuXHJcbiAgICAvLyBOb3JtYWxpemUgZm9yIG5vZGVzJyBmaXhlZC1kZXB0aC5cclxuICAgIG5vZGVzLmZvckVhY2goZnVuY3Rpb24oZCkge1xyXG4gICAgICBpZihkLmRlcHRoIDw9Mil7XHJcbiAgICAgICAgZC55ID0gZC5kZXB0aCo3MDtcclxuICAgICAgfWVsc2VcclxuICAgICAge1xyXG4gICAgICAgIGQueSA9IGQuZGVwdGgqMTAwO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBVcGRhdGUgdGhlIG5vZGVz4oCmXHJcbiAgICB2YXIgbm9kZSA9IHN2Z1Jvb3Quc2VsZWN0QWxsKFwiZy5ub2RlXCIpXHJcbiAgICAgICAgLmRhdGEobm9kZXMsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuaWQgfHwgKGQuaWQgPSArK2kpOyB9KTtcclxuXHJcbiAgICAvLyBFbnRlciBhbnkgbmV3IG5vZGVzIGF0IHRoZSBwYXJlbnQncyBwcmV2aW91cyBwb3NpdGlvbi5cclxuICAgIHZhciBub2RlRW50ZXIgPSBub2RlLmVudGVyKCkuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJub2RlXCIpXHJcbiAgICAgICAgLm9uKFwiY2xpY2tcIiwgdG9nZ2xlQ2hpbGRyZW4pO1xyXG5cclxuICAgIG5vZGVFbnRlci5hcHBlbmQoXCJjaXJjbGVcIik7XHJcblxyXG4gICAgbm9kZUVudGVyLmFwcGVuZChcInRleHRcIilcclxuICAgIC5hdHRyKFwieFwiLCAxMClcclxuICAgIC5hdHRyKFwiZHlcIiwgXCIuMzVlbVwiKVxyXG4gICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcInN0YXJ0XCIpXHJcbiAgICAudGV4dChmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICBpZihkLmRlcHRoID09PSAyKXtcclxuICAgICAgICAgICAgcmV0dXJuIGQuYWxpYXM7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgIHJldHVybiBkLm5hbWU7XHJcbiAgICB9KTtcclxuXHJcblxyXG4gICAgLy8gVHJhbnNpdGlvbiBub2RlcyB0byB0aGVpciBuZXcgcG9zaXRpb24uXHJcbiAgICB2YXIgbm9kZVVwZGF0ZSA9IG5vZGUudHJhbnNpdGlvbigpXHJcbiAgICAgICAgLmR1cmF0aW9uKGR1cmF0aW9uKVxyXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIFwicm90YXRlKFwiICsgKGQueCAtIDkwKSArIFwiKXRyYW5zbGF0ZShcIiArIGQueSArIFwiKVwiOyB9KVxyXG5cclxuICAgIG5vZGVVcGRhdGUuc2VsZWN0KFwiY2lyY2xlXCIpXHJcbiAgICAgICAgLmF0dHIoXCJyXCIsIGZ1bmN0aW9uKGQpe1xyXG4gICAgICAgICAgICBpZiAoZC5kZXB0aCA9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcm9vdE5vZGVTaXplO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBlbHNlIGlmIChkLmRlcHRoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBsZXZlbE9uZU5vZGVTaXplO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBlbHNlIGlmIChkLmRlcHRoID09PSAyKSB7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBsZXZlbFR3b05vZGVTaXplO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIGxldmVsVGhyZWVOb2RlU2l6ZTtcclxuXHJcbiAgICAgICAgfSlcclxuICAgICAgICAuc3R5bGUoXCJmaWxsXCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgICAgaWYoZC5kZXB0aCA9PT0wKXtcclxuICAgICAgICAgICAgICAgIHJldHVybiBcIiM4MDgwODBcIjtcclxuICAgICAgICAgICAgICAgfWVsc2UgaWYoZC5kZXB0aCA9PT0gMSl7XHJcbiAgICAgICAgICAgICAgICBpZihkLm5hbWU9PVwiSGFyZHdvb2RzXCIpIHJldHVybiBcIiM4MTY4NTRcIjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBcIiNDM0I5QTBcIjtcclxuICAgICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZC5jb2xvcjtcclxuICAgICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnN0eWxlKFwic3Ryb2tlXCIsZnVuY3Rpb24oZCl7XHJcbiAgICAgICAgICAgICAgaWYoZC5kZXB0aD4xKXtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIFwid2hpdGVcIjtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIFwibGlnaHRncmF5XCI7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIG5vZGVVcGRhdGUuc2VsZWN0KFwidGV4dFwiKVxyXG5cclxuICAgICAgICAuYXR0cignaWQnLCBmdW5jdGlvbihkKXtcclxuICAgICAgICAgIHZhciBvcmRlciA9IDA7XHJcbiAgICAgICAgICBpZihkLm9yZGVyKW9yZGVyID0gZC5vcmRlcjtcclxuICAgICAgICAgIHJldHVybiAnVC0nICsgZC5kZXB0aCArIFwiLVwiICsgb3JkZXI7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgICAgICAgIGlmIChkLmRlcHRoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZC54IDwgMTgwID8gXCJlbmRcIiA6IFwic3RhcnRcIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZC54IDwgMTgwID8gXCJzdGFydFwiIDogXCJlbmRcIjtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5hdHRyKFwiZHlcIiwgZnVuY3Rpb24oZCl7XHJcbiAgICAgICAgICAgIGlmIChkLmRlcHRoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZC54IDwgMTgwID8gXCIxLjRlbVwiIDogXCItMC4yZW1cIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gXCIuMzFlbVwiO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmF0dHIoXCJkeFwiLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICAgICAgICBpZiAoZC5kZXB0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7IC8vcmV0dXJuIGQueCA+IDE4MCA/IDIgOiAtMjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZC54IDwgMTgwID8gMSA6IC0yMDtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgICAgICAgIGlmIChkLmRlcHRoIDwgMikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwicm90YXRlKFwiICsgKDkwIC0gZC54KSArIFwiKVwiO1xyXG4gICAgICAgICAgICB9ZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZC54IDwgMTgwID8gbnVsbCA6IFwicm90YXRlKDE4MClcIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIC8vIFRPRE86IGFwcHJvcHJpYXRlIHRyYW5zZm9ybVxyXG4gICAgdmFyIG5vZGVFeGl0ID0gbm9kZS5leGl0KCkudHJhbnNpdGlvbigpXHJcbiAgICAgICAgLmR1cmF0aW9uKGR1cmF0aW9uKVxyXG4gICAgICAgIC5yZW1vdmUoKTtcclxuXHJcbiAgICAvLyBVcGRhdGUgdGhlIGxpbmtz4oCmXHJcbiAgICB2YXIgbGluayA9IHN2Z1Jvb3Quc2VsZWN0QWxsKFwicGF0aC5saW5rXCIpXHJcbiAgICAgICAgLmRhdGEocGF0aGxpbmtzLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnRhcmdldC5pZDsgfSk7XHJcblxyXG4gICAgLy8gRW50ZXIgYW55IG5ldyBsaW5rcyBhdCB0aGUgcGFyZW50J3MgcHJldmlvdXMgcG9zaXRpb24uXHJcbiAgICBsaW5rLmVudGVyKCkuaW5zZXJ0KFwicGF0aFwiLCBcImdcIilcclxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibGlua1wiKVxyXG4gICAgICAgIC5hdHRyKFwiZFwiLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICB2YXIgbyA9IHt4OiBzb3VyY2UueDAsIHk6IHNvdXJjZS55MH07XHJcbiAgICAgICAgICByZXR1cm4gZGlhZ29uYWwoe3NvdXJjZTogbywgdGFyZ2V0OiBvfSk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuc3R5bGUoXCJmaWxsXCIsZnVuY3Rpb24oZCl7XHJcbiAgICAgICAgICByZXR1cm4gZC5jb2xvcjtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAvLyBUcmFuc2l0aW9uIGxpbmtzIHRvIHRoZWlyIG5ldyBwb3NpdGlvbi5cclxuICAgIGxpbmsudHJhbnNpdGlvbigpXHJcbiAgICAgICAgLmR1cmF0aW9uKGR1cmF0aW9uKVxyXG4gICAgICAgIC5hdHRyKFwiZFwiLCBkaWFnb25hbCk7XHJcblxyXG4gICAgLy8gVHJhbnNpdGlvbiBleGl0aW5nIG5vZGVzIHRvIHRoZSBwYXJlbnQncyBuZXcgcG9zaXRpb24uXHJcbiAgICBsaW5rLmV4aXQoKS50cmFuc2l0aW9uKClcclxuICAgICAgICAuZHVyYXRpb24oZHVyYXRpb24pXHJcbiAgICAgICAgLmF0dHIoXCJkXCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgIHZhciBvID0ge3g6IHNvdXJjZS54LCB5OiBzb3VyY2UueX07XHJcbiAgICAgICAgICByZXR1cm4gZGlhZ29uYWwoe3NvdXJjZTogbywgdGFyZ2V0OiBvfSk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAucmVtb3ZlKCk7XHJcbiAgfVxyXG5cclxuICAvLyBUb2dnbGUgY2hpbGRyZW4gb24gY2xpY2suXHJcbiAgZnVuY3Rpb24gdG9nZ2xlQ2hpbGRyZW4oZCxjbGlja1R5cGUpIHtcclxuICAgIGlmIChkLmNoaWxkcmVuKSB7XHJcbiAgICAgIGQuX2NoaWxkcmVuID0gZC5jaGlsZHJlbjtcclxuICAgICAgZC5jaGlsZHJlbiA9IG51bGw7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBkLmNoaWxkcmVuID0gZC5fY2hpbGRyZW47XHJcbiAgICAgIGQuX2NoaWxkcmVuID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgdHlwZSA9IHR5cGVvZiBjbGlja1R5cGUgPT0gdW5kZWZpbmVkID8gXCJub2RlXCIgOiBjbGlja1R5cGU7XHJcblxyXG4gICAgLy9BY3Rpdml0aWVzIG9uIG5vZGUgY2xpY2tcclxuICAgIGNyZWF0ZUNvbGxhcHNpYmxlRGVuZHJvR3JhbShkKTtcclxuICAgIGhpZ2hsaWdodE5vZGVTZWxlY3Rpb25zKGQpO1xyXG5cclxuICAgIGhpZ2hsaWdodFJvb3RUb05vZGVQYXRoKGQsdHlwZSk7XHJcblxyXG4gIH1cclxuXHJcbiAgLy8gQ29sbGFwc2Ugbm9kZXNcclxuICBmdW5jdGlvbiBjb2xsYXBzZShkKSB7XHJcbiAgICBpZiAoZC5jaGlsZHJlbikge1xyXG4gICAgICAgIGQuX2NoaWxkcmVuID0gZC5jaGlsZHJlbjtcclxuICAgICAgICBkLl9jaGlsZHJlbi5mb3JFYWNoKGNvbGxhcHNlKTtcclxuICAgICAgICBkLmNoaWxkcmVuID0gbnVsbDtcclxuICAgICAgfVxyXG4gIH1cclxuXHJcblxyXG4gIC8vIGhpZ2hsaWdodHMgc3Vibm9kZXMgb2YgYSBub2RlXHJcbiAgZnVuY3Rpb24gaGlnaGxpZ2h0Tm9kZVNlbGVjdGlvbnMoZCkge1xyXG4gICAgICB2YXIgaGlnaGxpZ2h0TGlua0NvbG9yID0gXCJkYXJrc2xhdGVncmF5XCI7Ly9cIiNmMDNiMjBcIjtcclxuICAgICAgdmFyIGRlZmF1bHRMaW5rQ29sb3IgPSBcImxpZ2h0Z3JheVwiO1xyXG5cclxuICAgICAgdmFyIGRlcHRoID0gIGQuZGVwdGg7XHJcbiAgICAgIHZhciBub2RlQ29sb3IgPSBkLmNvbG9yO1xyXG4gICAgICBpZiAoZGVwdGggPT09IDEpIHtcclxuICAgICAgICAgIG5vZGVDb2xvciA9IGhpZ2hsaWdodExpbmtDb2xvcjtcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIHBhdGhMaW5rcyA9IHN2Z1Jvb3Quc2VsZWN0QWxsKFwicGF0aC5saW5rXCIpO1xyXG5cclxuICAgICAgcGF0aExpbmtzLnN0eWxlKFwic3Ryb2tlXCIsZnVuY3Rpb24oZGQpIHtcclxuICAgICAgICAgIGlmIChkZC5zb3VyY2UuZGVwdGggPT09IDApIHtcclxuICAgICAgICAgICAgICBpZiAoZC5uYW1lID09PSAnJykge1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gaGlnaGxpZ2h0TGlua0NvbG9yO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICByZXR1cm4gZGVmYXVsdExpbmtDb2xvcjtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAoZGQuc291cmNlLm5hbWUgPT09IGQubmFtZSkge1xyXG4gICAgICAgICAgICAgIHJldHVybiBub2RlQ29sb3I7XHJcbiAgICAgICAgICB9ZWxzZSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIGRlZmF1bHRMaW5rQ29sb3I7XHJcbiAgICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLy9XYWxraW5nIHBhcmVudHMnIGNoYWluIGZvciByb290IHRvIG5vZGUgdHJhY2tpbmdcclxuICBmdW5jdGlvbiBoaWdobGlnaHRSb290VG9Ob2RlUGF0aChkLGNsaWNrVHlwZSl7XHJcbiAgICB2YXIgYW5jZXN0b3JzID0gW107XHJcbiAgICB2YXIgcGFyZW50ID0gZDtcclxuICAgIHdoaWxlICghXy5pc1VuZGVmaW5lZChwYXJlbnQpKSB7XHJcbiAgICAgICAgYW5jZXN0b3JzLnB1c2gocGFyZW50KTtcclxuICAgICAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEdldCB0aGUgbWF0Y2hlZCBsaW5rc1xyXG4gICAgdmFyIG1hdGNoZWRMaW5rcyA9IFtdO1xyXG5cclxuICAgIHN2Z1Jvb3Quc2VsZWN0QWxsKCdwYXRoLmxpbmsnKVxyXG4gICAgICAgIC5maWx0ZXIoZnVuY3Rpb24oZCwgaSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmFueShhbmNlc3RvcnMsIGZ1bmN0aW9uKHApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBwID09PSBkLnRhcmdldDtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmVhY2goZnVuY3Rpb24oZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG1hdGNoZWRMaW5rcy5wdXNoKGQpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIGFuaW1hdGVDaGFpbnMobWF0Y2hlZExpbmtzLGNsaWNrVHlwZSk7XHJcblxyXG4gICAgZnVuY3Rpb24gYW5pbWF0ZUNoYWlucyhsaW5rcyxjbGlja1R5cGUpe1xyXG4gICAgICBhbmltR3JvdXAuc2VsZWN0QWxsKFwicGF0aC5zZWxlY3RlZFwiKVxyXG4gICAgICAgICAgLmRhdGEoW10pXHJcbiAgICAgICAgICAuZXhpdCgpLnJlbW92ZSgpO1xyXG5cclxuICAgICAgYW5pbUdyb3VwLnNlbGVjdEFsbChcInBhdGguc2VsZWN0ZWRcIilcclxuICAgICAgICAgIC5kYXRhKGxpbmtzKVxyXG4gICAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwic3ZnOnBhdGhcIilcclxuICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJzZWxlY3RlZFwiKVxyXG4gICAgICAgICAgLmF0dHIoXCJkXCIsIGRpYWdvbmFsKTtcclxuXHJcblxyXG4gICAgICAvL1Jlc2V0IHBhdGggaGlnaGxpZ2h0IGlmIGNvbGxhcHNlIGJ1dHRvbiBjbGlja2VkXHJcbiAgICAgIGlmKGNsaWNrVHlwZSA9PSAnYnV0dG9uJyl7XHJcbiAgICAgICAgYW5pbUdyb3VwLnNlbGVjdEFsbChcInBhdGguc2VsZWN0ZWRcIikuY2xhc3NlZCgncmVzZXQtc2VsZWN0ZWQnLHRydWUpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB2YXIgb3ZlcmxheUJveCA9IHN2Z1Jvb3Qubm9kZSgpLmdldEJCb3goKTtcclxuXHJcbiAgICAgIHN2Z1Jvb3Quc2VsZWN0KFwiI2NsaXAtcmVjdC1hbmltXCIpXHJcbiAgICAgICAgICAuYXR0cihcInhcIiwgLXJhZGl1cylcclxuICAgICAgICAgIC5hdHRyKFwieVwiLCAtcmFkaXVzKVxyXG4gICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLDApXHJcbiAgICAgICAgICAuYXR0cihcImhlaWdodFwiLHJhZGl1cyoyKVxyXG4gICAgICAgICAgLnRyYW5zaXRpb24oKS5kdXJhdGlvbihkdXJhdGlvbilcclxuICAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgcmFkaXVzKjIpO1xyXG4gICAgfVxyXG5cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHpvb20oKSB7XHJcbiAgICAgc3ZnUm9vdC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgZDMuZXZlbnQudHJhbnNsYXRlICsgXCIpc2NhbGUoXCIgKyBkMy5ldmVudC5zY2FsZSArIFwiKVwiKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGNvbGxhcHNlTGV2ZWxzKCl7XHJcblxyXG4gICAgaWYoY2hlY2tGb3JUaGlyZExldmVsT3BlbkNoaWxkcmVuKCkpe1xyXG4gICAgICB0b2dnbGVBbGxTZWNvbmRMZXZlbENoaWxkcmVuKCk7XHJcbiAgICB9ZWxzZXtcclxuICAgICB0b2dnbGVTZWNvbmRMZXZlbENoaWxkcmVuKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gT3BlbiBmaXJzdCBsZXZlbCBvbmx5IGJ5IGNvbGxhcHNpbmcgc2Vjb25kIGxldmVsXHJcbiAgICBmdW5jdGlvbiB0b2dnbGVTZWNvbmRMZXZlbENoaWxkcmVuKCl7XHJcbiAgICAgIGZvcih2YXIgcm9vdEluZGV4ID0gMCwgcm9vdExlbmd0aCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbi5sZW5ndGg7IHJvb3RJbmRleDxyb290TGVuZ3RoOyByb290SW5kZXgrKyl7XHJcbiAgICAgICAgICBpZihpc05vZGVPcGVuKHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdKSl7XHJcbiAgICAgICAgICAgICAgIHRvZ2dsZUNoaWxkcmVuKHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdLCdidXR0b24nKTtcclxuICAgICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIE9wZW4gZmlyc3QgbGV2ZWwgb25seSBieSBjb2xsYXBzaW5nIHNlY29uZCBsZXZlbFxyXG4gICAgZnVuY3Rpb24gdG9nZ2xlQWxsU2Vjb25kTGV2ZWxDaGlsZHJlbigpe1xyXG4gICAgICBmb3IodmFyIHJvb3RJbmRleCA9IDAsIHJvb3RMZW5ndGggPSByb290SnNvbkRhdGEuY2hpbGRyZW4ubGVuZ3RoOyByb290SW5kZXg8cm9vdExlbmd0aDsgcm9vdEluZGV4Kyspe1xyXG4gICAgICAgIGlmKGlzTm9kZU9wZW4ocm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0pKXtcclxuXHJcbiAgICAgICAgICBmb3IodmFyIGNoaWxkSW5kZXggPSAwLCBjaGlsZExlbmd0aCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdLmNoaWxkcmVuLmxlbmd0aDsgY2hpbGRJbmRleDxjaGlsZExlbmd0aDsgY2hpbGRJbmRleCsrKXtcclxuICAgICAgICAgICAgdmFyIHNlY29uZExldmVsQ2hpbGQgPSByb290SnNvbkRhdGEuY2hpbGRyZW5bcm9vdEluZGV4XS5jaGlsZHJlbltjaGlsZEluZGV4XTtcclxuICAgICAgICAgICAgaWYoaXNOb2RlT3BlbihzZWNvbmRMZXZlbENoaWxkKSl7XHJcbiAgICAgICAgICAgICAgdG9nZ2xlQ2hpbGRyZW4ocm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0uY2hpbGRyZW5bY2hpbGRJbmRleF0sJ2J1dHRvbicpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBDaGVjayBpZiBhbnkgbm9kZXMgb3BlbnMgYXQgc2Vjb25kIGxldmVsXHJcbiAgICBmdW5jdGlvbiBjaGVja0ZvclRoaXJkTGV2ZWxPcGVuQ2hpbGRyZW4oKXtcclxuICAgICAgZm9yKHZhciByb290SW5kZXggPSAwLCByb290TGVuZ3RoID0gcm9vdEpzb25EYXRhLmNoaWxkcmVuLmxlbmd0aDsgcm9vdEluZGV4PHJvb3RMZW5ndGg7IHJvb3RJbmRleCsrKXtcclxuICAgICAgICBpZihpc05vZGVPcGVuKHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdKSl7XHJcblxyXG4gICAgICAgICAgZm9yKHZhciBjaGlsZEluZGV4ID0gMCwgY2hpbGRMZW5ndGggPSByb290SnNvbkRhdGEuY2hpbGRyZW5bcm9vdEluZGV4XS5jaGlsZHJlbi5sZW5ndGg7IGNoaWxkSW5kZXg8Y2hpbGRMZW5ndGg7IGNoaWxkSW5kZXgrKyl7XHJcblxyXG4gICAgICAgICAgICB2YXIgc2Vjb25kTGV2ZWxDaGlsZCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdLmNoaWxkcmVuW2NoaWxkSW5kZXhdO1xyXG4gICAgICAgICAgICBpZihpc05vZGVPcGVuKHNlY29uZExldmVsQ2hpbGQpKXtcclxuICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGlzTm9kZU9wZW4oZCl7XHJcbiAgICAgIGlmKGQuY2hpbGRyZW4pe3JldHVybiB0cnVlO31cclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcblxyXG5cclxuXHJcbn1cclxuXHJcbiAgIiwiZnVuY3Rpb24gbG9hZEpxdWVyeSgpe1xyXG4gICAgJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKXtcclxuICAgICAgICAkKFwiI3RvZ2dsZS1zaWRlYmFyXCIpLmNsaWNrKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICQoJy51aS5zaWRlYmFyJylcclxuICAgICAgICAgICAgICAgIC5zaWRlYmFyKCd0b2dnbGUnKVxyXG4gICAgICAgICAgICA7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICB9KTtcclxufVxyXG4iLCJyZXF1aXJlLmNvbmZpZyh7XHJcbiAgICBwYXRoczoge1xyXG4gICAgICAgIFwiZDNcIjogXCJodHRwczovL2QzanMub3JnL2QzLnYzLm1pblwiXHJcbiAgICB9XHJcbn0pO1xyXG5cclxuZnVuY3Rpb24gbG9hZEQzKCl7XHJcblxyXG4gICAgd2luZG93LmQzT2xkID0gZDM7XHJcbiAgICByZXF1aXJlKFsnZDMnXSwgZnVuY3Rpb24oZDNWMykge1xyXG4gICAgICAgIHdpbmRvdy5kM1YzID0gZDNWMztcclxuICAgICAgICB3aW5kb3cuZDMgPSBkM09sZDtcclxuICAgICAgICAvLyB3aW5kb3cuZG9jdW1lbnRzID0gW1xyXG4gICAgICAgIC8vICAgICAgICAgLy8gICBbXCJpXCIsIFwiYW1cIiwgXCJiYXRtYW5cIiwgXCJvZlwiLCBcIndpbnRlcmZhbGxcIl0sXHJcbiAgICAgICAgLy8gICAgICAgICAvLyAgIFtcInRoZXJlXCIsIFwic2hvdWxkXCIsIFwiYWx3YXlzXCIsIFwiYmVcIiwgXCJhXCIsIFwic3RhcmtcIiwgXCJpblwiLCBcIndpbnRlcmZlbGxcIl0sXHJcbiAgICAgICAgLy8gICAgICAgICAvLyAgIFtcInByb3BoZWN5XCIsIFwic2F5c1wiLCBcInByaW5jZVwiLCBcIndpbGxcIiwgXCJiZVwiICwgXCJyZWJvcm5cIl1cclxuICAgICAgICAvLyAgICAgICAgIC8vIF07XHJcbiAgICAgICAgLy8gICAgIHdpbmRvdy5kb2N1bWVudHMgPSBbWydwcm9qZWN0JywgJ2NsYXNzaWZpY2F0aW9uJywgJ2NvbXBhcmUnLCAnbmV1cmFsJywgJ25ldHMnLCAnU1ZNJywgJ2R1ZScsICdkdWUnXSwgWyd0d28nLCAnbmV3JywgJ3Byb2dyZXNzJywgJ2NoZWNrcycsICdmaW5hbCcsICdwcm9qZWN0JywgICdhc3NpZ25lZCcsICdmb2xsb3dzJ10sIFsncmVwb3J0JywgJ2dyYWRlZCcsICAnY29udHJpYnV0ZScsICdwb2ludHMnLCAgJ3RvdGFsJywgJ3NlbWVzdGVyJywgJ2dyYWRlJ10sIFsncHJvZ3Jlc3MnLCAndXBkYXRlJywgJ2V2YWx1YXRlZCcsICdUQScsICdwZWVycyddLCBbJ2NsYXNzJywgJ21lZXRpbmcnLCAndG9tb3Jyb3cnLCd0ZWFtcycsICd3b3JrJywgJ3Byb2dyZXNzJywgJ3JlcG9ydCcsICdmaW5hbCcsICdwcm9qZWN0J10sIFsgJ3F1aXonLCAgJ3NlY3Rpb25zJywgJ3JlZ3VsYXJpemF0aW9uJywgJ1R1ZXNkYXknXSwgWyAncXVpeicsICdUaHVyc2RheScsICdsb2dpc3RpY3MnLCAnd29yaycsICdvbmxpbmUnLCAnc3R1ZGVudCcsICdwb3N0cG9uZScsICAncXVpeicsICdUdWVzZGF5J10sIFsncXVpeicsICdjb3ZlcicsICdUaHVyc2RheSddLCBbJ3F1aXonLCAnY2hhcCcsICdjaGFwJywgJ2xpbmVhcicsICdyZWdyZXNzaW9uJ11dO1xyXG5cclxuICAgICAgICB3aW5kb3cuZG9jdW1lbnRzID0gW1xyXG4gICAgICAgICAgICBbJ3NlcmlvdXMnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ3RhbGsnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ2ZyaWVuZHMnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ2ZsYWt5JyxcclxuICAgICAgICAgICAgICAgICAgICAgICdsYXRlbHknLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ3VuZGVyc3Rvb2QnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ2dvb2QnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ2V2ZW5pbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ2hhbmdpbmcnXSxcclxuICAgICAgICAgICAgWydnb3QnLCAnZ2lmdCcsICdlbGRlcicsICdicm90aGVyJywgJ3JlYWxseScsICdzdXJwcmlzaW5nJ10sXHJcbiAgICAgICAgICAgICAgICAgICAgIFsnY29tcGxldGVkJyxcclxuICAgICAgICAgICAgICAgICAgICAgICc1JyxcclxuICAgICAgICAgICAgICAgICAgICAgICdtaWxlcycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAncnVuJyxcclxuICAgICAgICAgICAgICAgICAgICAgICd3aXRob3V0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICdicmVhaycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnbWFrZXMnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ2ZlZWwnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ3N0cm9uZyddLFxyXG5cclxuICAgICAgICAgICAgWydzb24nLCAncGVyZm9ybWVkJywgJ3dlbGwnLCAndGVzdCcsXHJcbiAgICAgICAgICAgICAgICAncHJlcGFyYXRpb24nXVxyXG4gICAgICAgICAgICBdO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGdldEFuYWx5c2lzKFwiTERBXCIpO1xyXG4gICAgICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXREb2NzKHRleHRzKSB7XHJcbiAgcmV0dXJuIHdpbmRvdy5kb2N1bWVudHMgPSB0ZXh0cy5tYXAoeCA9PiB4LnNwbGl0KCkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRBbmFseXNpcyhtZXRob2QsIHN1Y2Nlc3MsIGZhaWwpIHtcclxuICBsZXQgZG9jcyA9IHZ1ZUFwcC5uZXdEb2NzO1xyXG4gIGxldCBmbmMgPSB4ID0+IHg7XHJcbiAgaWYgKG1ldGhvZCA9PT0gXCJMREFcIikge1xyXG4gICAgZm5jID0gZ2V0TERBQ2x1c3RlcnM7XHJcbiAgfSBlbHNlIHtcclxuICAgIGZuYyA9IGdldFdvcmQyVmVjQ2x1c3RlcnM7XHJcbiAgfVxyXG4gIHdpbmRvdy5sb2FkREZ1bmMgPSAgZm5jO1xyXG4gIGZuYyhkb2NzLCByZXNwID0+IHtcclxuICAgICAgd2luZG93Lmdsb2JhbF9kYXRhID0gcmVzcDtcclxuICAgIGluaXRQYWdlMShyZXNwKTtcclxuICAgIGluaXRQYWdlMihyZXNwKTtcclxuICAgIGluaXRQYWdlMyhyZXNwKTtcclxuICAgIGluaXRQYWdlNCgpO1xyXG4gICAgaWYoc3VjY2Vzcyl7XHJcbiAgICAgICAgc3VjY2VzcyhyZXNwKTtcclxuICAgIH1cclxuICB9LCBmYWlsKTtcclxufVxyXG5cclxuZnVuY3Rpb24gbG9hZFZpc3VhbGl6YXRpb25zKCkge1xyXG59XHJcblxyXG5mdW5jdGlvbiBpbml0UGFnZTEocmVzcCkge1xyXG4gIHJlbmRlckNsdXN0ZXJBbmFseXNpcyhyZXNwKTtcclxufVxyXG5cclxuXHJcblxyXG5mdW5jdGlvbiBpbml0UGFnZTIocmVzcCkge1xyXG4gICAgJChcIiNzcGVjaWVzY29sbGFwc2libGVcIikuaHRtbChcIlwiKTtcclxuICByZW5kZXJDbHVzdGVyRm9yY2VMYXlvdXQocmVzcCk7XHJcblxyXG59XHJcblxyXG5mdW5jdGlvbiBpbml0UGFnZTMocmVzcCl7XHJcbiAgICAkKFwiI3BhcmFsbGVsLWNvb3JkaW5hdGUtdmlzXCIpLmh0bWwoXCJcIik7XHJcbiAgICAkKFwiI3BjLWNvbnRhaW5lclwiKS5odG1sKFwiXCIpO1xyXG4gICAgbG9hZFBhcmFsbGVsQ29vcmRpbmF0ZShyZXNwKTtcclxuICAgIGxvYWRQYXJhbGxlbENvb3JkaW5hdGVzSEMocmVzcCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluaXRQYWdlNCgpe1xyXG4gICAgJChcIiNvdmVyYWxsLXdjXCIpLmh0bWwoXCJcIik7XHJcbiAgICBsb2FkV29yZENsb3VkKHdpbmRvdy5nbG9iYWxfZGF0YSk7XHJcbn0iLCIvL3ZlY3RvcnMgZm9ybWF0OiBNYXBbc3RyaW5nKHRvcGljX2lkKTogTGlzdFtmbG9hdF1dXHJcbmZ1bmN0aW9uIGdldDJEVmVjdG9ycyh2ZWN0b3JzLCBzdWNjZXNzQ2FsbGJhY2spe1xyXG4gICAgdmFyIHJlcXVlc3QgPSAkLmFqYXgoe1xyXG4gICAgICAgIHVybDogXCIvZ2V0MkRWZWN0b3JzXCIsXHJcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICBkYXRhOiB2ZWN0b3JzXHJcbiAgICAgIH0pO1xyXG4gICAgICAgXHJcbiAgICAgIHJlcXVlc3QuZG9uZShmdW5jdGlvbiggcmVzcG9uc2UgKSB7XHJcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHJlc3BvbnNlKTtcclxuICAgICAgfSk7XHJcbiAgICAgICBcclxuICAgICAgcmVxdWVzdC5mYWlsKGZ1bmN0aW9uKCBqcVhIUiwgdGV4dFN0YXR1cyApIHtcclxuICAgICAgICBhbGVydCggXCJSZXF1ZXN0IGZhaWxlZDogXCIgKyB0ZXh0U3RhdHVzICk7XHJcbiAgICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRUb2tlbml6ZWREb2NzKGRvY3MsIHN1Y2Nlc3NDYWxsYmFjaywgZmFpbHVyZUNhbGxiYWNrKXtcclxuICAgIHZhciByZXF1ZXN0ID0gJC5hamF4KHtcclxuICAgICAgICB1cmw6IFwiL2dldERvY3NGcm9tVGV4dHNcIixcclxuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHtkb2NzOiBkb2NzfSksXHJcbiAgICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiLFxyXG4gICAgICAgIGRhdGFUeXBlICAgOiBcImpzb25cIlxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHJlcXVlc3QuZG9uZShmdW5jdGlvbiggcmVzcG9uc2UgKSB7XHJcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHJlc3BvbnNlLmRvY3MpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHJlcXVlc3QuZmFpbChmdW5jdGlvbigganFYSFIsIHRleHRTdGF0dXMgKSB7XHJcbiAgICAgICAgaWYoZmFpbHVyZUNhbGxiYWNrKVxyXG4gICAgICAgICAgICBmYWlsdXJlQ2FsbGJhY2sodGV4dFN0YXR1cyk7XHJcbiAgICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICAgIGFsZXJ0KCBcIlJlcXVlc3QgZmFpbGVkOiBcIiArIHRleHRTdGF0dXMgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgfSk7XHJcbn1cclxuXHJcbi8vIGRvY3MgZm9ybWF0OiBMaXN0W0xpc3Rbc3RyaW5nKHdvcmQpXV1cclxuZnVuY3Rpb24gZ2V0V29yZDJWZWNDbHVzdGVycyhkb2NzLCBzdWNjZXNzQ2FsbGJhY2ssIGZhaWx1cmVDYWxsYmFjayl7XHJcbiAgICB2YXIgcmVxdWVzdCA9ICQuYWpheCh7XHJcbiAgICAgICAgdXJsOiBcIi9hcGkvZ2V0Q2x1c3RlcnNXb3JkMlZlY1wiLFxyXG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkoe2RvY3M6IGRvY3MsIHN0YXJ0OiB3aW5kb3cudnVlQXBwLnNldHRpbmdzLnN0YXJ0MiwgZW5kOiB3aW5kb3cudnVlQXBwLnNldHRpbmdzLmVuZDIsIHNlbGVjdGVkOiB3aW5kb3cudnVlQXBwLnNldHRpbmdzLnNlbGVjdGVkRGF0YXNldH0pLFxyXG4gICAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIixcclxuICAgICAgICBkYXRhVHlwZSAgIDogXCJqc29uXCJcclxuICAgICAgfSk7XHJcbiAgICAgICBcclxuICAgICAgcmVxdWVzdC5kb25lKGZ1bmN0aW9uKCByZXNwb25zZSApIHtcclxuICAgICAgICBzdWNjZXNzQ2FsbGJhY2soSlNPTi5wYXJzZShyZXNwb25zZSkpO1xyXG4gICAgICB9KTtcclxuICAgICAgIFxyXG4gICAgICByZXF1ZXN0LmZhaWwoZnVuY3Rpb24oIGpxWEhSLCB0ZXh0U3RhdHVzICkge1xyXG4gICAgICAgICAgaWYoZmFpbHVyZUNhbGxiYWNrKVxyXG4gICAgICAgICAgICBmYWlsdXJlQ2FsbGJhY2sodGV4dFN0YXR1cyk7XHJcbiAgICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICAgIGFsZXJ0KCBcIlJlcXVlc3QgZmFpbGVkOiBcIiArIHRleHRTdGF0dXMgKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRMREFDbHVzdGVycyhkb2NzLCBzdWNjZXNzQ2FsbGJhY2ssIGZhaWx1cmVDYWxsYmFjayl7XHJcbiAgICB2YXIgcmVxdWVzdCA9ICQuYWpheCh7XHJcbiAgICAgICAgdXJsOiBcIi9hcGkvZ2V0TERBRGF0YVwiLFxyXG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkoe2RvY3M6IGRvY3MsIHN0YXJ0OiB3aW5kb3cudnVlQXBwLnNldHRpbmdzLnN0YXJ0MSwgZW5kOiB3aW5kb3cudnVlQXBwLnNldHRpbmdzLmVuZDEsIHNlbGVjdGVkOiB3aW5kb3cudnVlQXBwLnNldHRpbmdzLnNlbGVjdGVkRGF0YXNldH0pLFxyXG4gICAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIixcclxuICAgICAgICBkYXRhVHlwZSAgIDogXCJqc29uXCJcclxuICAgICAgfSk7XHJcbiAgICAgICBcclxuICAgICAgcmVxdWVzdC5kb25lKGZ1bmN0aW9uKCByZXNwb25zZSApIHtcclxuICAgICAgICBzdWNjZXNzQ2FsbGJhY2socmVzcG9uc2UpO1xyXG4gICAgICB9KTtcclxuICAgICAgIFxyXG4gICAgICByZXF1ZXN0LmZhaWwoZnVuY3Rpb24oIGpxWEhSLCB0ZXh0U3RhdHVzICkge1xyXG4gICAgICAgIGlmKGZhaWx1cmVDYWxsYmFjaylcclxuICAgICAgICAgICAgZmFpbHVyZUNhbGxiYWNrKHRleHRTdGF0dXMpO1xyXG4gICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgICBhbGVydCggXCJSZXF1ZXN0IGZhaWxlZDogXCIgKyB0ZXh0U3RhdHVzICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG59XHJcbiIsImZ1bmN0aW9uIGxvYWRQYXJhbGxlbENvb3JkaW5hdGVzSEMocmVzcCl7XHJcblxyXG5cclxuICAgICAgICBsZXQgZGF0YSA9IGdlbmVyYXRlUGFyYWxsZWxDb29yZGluYXRlRGF0YUhDKHJlc3AsIHdpbmRvdy52dWVBcHAucGFyYW1zLnRvcGljVGhyZXNob2xkLCB3aW5kb3cudnVlQXBwLnBhcmFtcy53b3JkVGhyZXNob2xkKTtcclxuICAgICAgICBIaWdoY2hhcnRzLmNoYXJ0KCdwYy1jb250YWluZXInLCB7XHJcbiAgICAgICAgICAgIGNoYXJ0OiB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnc3BsaW5lJyxcclxuICAgICAgICAgICAgICAgIHBhcmFsbGVsQ29vcmRpbmF0ZXM6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBwYXJhbGxlbEF4ZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICBsaW5lV2lkdGg6IDJcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdGl0bGU6IHtcclxuICAgICAgICAgICAgICAgIHRleHQ6ICdEb2N1bWVudCAtIFRvcGljIC0gV29yZCBSZWxhdGlvbnNoaXAnXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHBsb3RPcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICBzZXJpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICBhbmltYXRpb246IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIG1hcmtlcjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVkOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBob3Zlcjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZWQ6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBob3Zlcjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFsbzoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpemU6IDBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vdXNlT3ZlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ncm91cC50b0Zyb250KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8vIHRvb2x0aXA6IHtcclxuICAgICAgICAgICAgLy8gICAgIHBvaW50Rm9ybWF0OiAnPHNwYW4gc3R5bGU9XCJjb2xvcjp7cG9pbnQuY29sb3J9XCI+XFx1MjVDRjwvc3Bhbj4nICtcclxuICAgICAgICAgICAgLy8gICAgICAgICAne3Nlcmllcy5uYW1lfTogPGI+e3BvaW50LmZvcm1hdHRlZFZhbHVlfTwvYj48YnIvPidcclxuICAgICAgICAgICAgLy8gfSxcclxuICAgICAgICAgICAgeEF4aXM6IHtcclxuICAgICAgICAgICAgICAgIGNhdGVnb3JpZXM6IFtcclxuICAgICAgICAgICAgICAgICAgICAnRG9jdW1lbnQnLFxyXG4gICAgICAgICAgICAgICAgICAgICdUb3BpYycsXHJcbiAgICAgICAgICAgICAgICAgICAgJ1dvcmQnXHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgb2Zmc2V0OiAxMFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB5QXhpczogW3tcclxuICAgICAgICAgICAgICAgIGNhdGVnb3JpZXM6IE9iamVjdC5rZXlzKHJlc3BbXCJkb2N1bWVudF90b3BpY1wiXSkubWFwKHg9PiBcIi4uLi4uLi4uLi4uLi4uLi5Eb2N1bWVudCBcIit4KVxyXG4gICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICBjYXRlZ29yaWVzOiByZXNwW1widG9waWNzXCJdLm1hcCh4PT4gXCIuLi4uLi4uLi4uLi4uLi4uVG9waWMgXCIreClcclxuICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgY2F0ZWdvcmllczogT2JqZWN0LnZhbHVlcyhyZXNwW1wid29yZHNcIl0pLm1hcCh4PT4gXCIuLi4uLi4uLi4uLi4uLi4uXCIreClcclxuICAgICAgICAgICAgfV0sXHJcbiAgICAgICAgICAgIGNvbG9yczogWydyZ2JhKDExLCAyMDAsIDIwMCwgMC4xKSddLFxyXG4gICAgICAgICAgICBzZXJpZXM6IGRhdGEubWFwKGZ1bmN0aW9uIChzZXQsIGkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJycsXHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogc2V0LFxyXG4gICAgICAgICAgICAgICAgICAgIHNoYWRvdzogZmFsc2VcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSk7XHJcblxyXG59XHJcblxyXG5cclxuIiwiZnVuY3Rpb24gbG9hZFBhcmFsbGVsQ29vcmRpbmF0ZShyZXNwKXtcclxuICAgIHZhciBtYXJnaW4gPSB7dG9wOiAzMCwgcmlnaHQ6IDEwLCBib3R0b206IDEwLCBsZWZ0OiAxMH0sXHJcbiAgICAgICAgd2lkdGggPSA5NjAgLSBtYXJnaW4ubGVmdCAtIG1hcmdpbi5yaWdodCxcclxuICAgICAgICBoZWlnaHQgPSA1MDAgLSBtYXJnaW4udG9wIC0gbWFyZ2luLmJvdHRvbTtcclxuXHJcbiAgICB2YXIgeCA9IGQzVjMuc2NhbGUub3JkaW5hbCgpLnJhbmdlUG9pbnRzKFswLCB3aWR0aF0sIDEpLFxyXG4gICAgICAgIHkgPSB7fSxcclxuICAgICAgICBkcmFnZ2luZyA9IHt9O1xyXG5cclxuICAgIHZhciBsaW5lID0gZDNWMy5zdmcubGluZSgpLFxyXG4gICAgICAgIGJhY2tncm91bmQsXHJcbiAgICAgICAgZm9yZWdyb3VuZDtcclxuXHJcbiAgICB2YXIgc3ZnID0gZDNWMy5zZWxlY3QoXCIjcGFyYWxsZWwtY29vcmRpbmF0ZS12aXNcIikuYXBwZW5kKFwic3ZnXCIpXHJcbiAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aCArIG1hcmdpbi5sZWZ0ICsgbWFyZ2luLnJpZ2h0KVxyXG4gICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodCArIG1hcmdpbi50b3AgKyBtYXJnaW4uYm90dG9tKVxyXG4gICAgLmFwcGVuZChcImdcIilcclxuICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIG1hcmdpbi5sZWZ0ICsgXCIsXCIgKyBtYXJnaW4udG9wICsgXCIpXCIpLCBkaW1lbnNpb25zO1xyXG5cclxuXHJcbiAgICAvLyBFeHRyYWN0IHRoZSBsaXN0IG9mIGRpbWVuc2lvbnMgYW5kIGNyZWF0ZSBhIHNjYWxlIGZvciBlYWNoLlxyXG4gICAgdmFyIGNhcnMgPSBnZW5lcmF0ZVBhcmFsbGVsQ29vcmRpbmF0ZURhdGEocmVzcCwgd2luZG93LnZ1ZUFwcC5wYXJhbXMudG9waWNUaHJlc2hvbGQsIHdpbmRvdy52dWVBcHAucGFyYW1zLndvcmRUaHJlc2hvbGQpO1xyXG4gICAgLy8gdmFyIGF4aXNEID0gZDNWMy5zdmcuYXhpcygpLm9yaWVudChcImxlZnRcIikudGlja3MoT2JqZWN0LmtleXMocmVzcFtcImRvY3VtZW50X3RvcGljXCJdKS5sZW5ndGgpLFxyXG4gICAgdmFyIGF4aXNEID0gZDNWMy5zdmcuYXhpcygpLm9yaWVudChcImxlZnRcIikudGlja1ZhbHVlcyhPYmplY3Qua2V5cyhyZXNwW1wiZG9jdW1lbnRfdG9waWNcIl0pLm1hcCh4ID0+IHBhcnNlSW50KHgpKSksXHJcbiAgICAgICAgYXhpc1QgPSBkM1YzLnN2Zy5heGlzKCkub3JpZW50KFwibGVmdFwiKS50aWNrVmFsdWVzKHJlc3BbXCJ0b3BpY3NcIl0ubWFwKHggPT4gcGFyc2VJbnQoeCkpKSxcclxuICAgICAgICBheGlzVyA9IGQzVjMuc3ZnLmF4aXMoKS5vcmllbnQoXCJsZWZ0XCIpLnRpY2tWYWx1ZXMoT2JqZWN0LnZhbHVlcyhyZXNwW1wib3ZlcmFsbF93b3JkXCJdKS5tYXAoeCA9PiBwYXJzZUZsb2F0KHgpKSk7XHJcblxyXG4gICAgeC5kb21haW4oZGltZW5zaW9ucyA9IGQzVjMua2V5cyhjYXJzWzBdKS5maWx0ZXIoZnVuY3Rpb24oZCkge1xyXG4gICAgICAgIHJldHVybiBkICE9IFwibmFtZVwiICYmICh5W2RdID0gZDNWMy5zY2FsZS5saW5lYXIoKVxyXG4gICAgICAgICAgICAuZG9tYWluKGQzVjMuZXh0ZW50KGNhcnMsIGZ1bmN0aW9uKHApIHsgcmV0dXJuICtwW2RdOyB9KSlcclxuICAgICAgICAgICAgLnJhbmdlKFtoZWlnaHQsIDBdKSk7XHJcbiAgICB9KSk7XHJcblxyXG4gICAgLy8gQWRkIGdyZXkgYmFja2dyb3VuZCBsaW5lcyBmb3IgY29udGV4dC5cclxuICAgIGJhY2tncm91bmQgPSBzdmcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJiYWNrZ3JvdW5kXCIpXHJcbiAgICAgICAgLnNlbGVjdEFsbChcInBhdGhcIilcclxuICAgICAgICAuZGF0YShjYXJzKVxyXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZChcInBhdGhcIilcclxuICAgICAgICAuYXR0cihcImRcIiwgcGF0aCk7XHJcblxyXG4gICAgLy8gQWRkIGJsdWUgZm9yZWdyb3VuZCBsaW5lcyBmb3IgZm9jdXMuXHJcbiAgICBmb3JlZ3JvdW5kID0gc3ZnLmFwcGVuZChcImdcIilcclxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiZm9yZWdyb3VuZFwiKVxyXG4gICAgICAgIC5zZWxlY3RBbGwoXCJwYXRoXCIpXHJcbiAgICAgICAgLmRhdGEoY2FycylcclxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJwYXRoXCIpXHJcbiAgICAgICAgLmF0dHIoXCJkXCIsIHBhdGgpO1xyXG5cclxuICAgIC8vIEFkZCBhIGdyb3VwIGVsZW1lbnQgZm9yIGVhY2ggZGltZW5zaW9uLlxyXG4gICAgdmFyIGcgPSBzdmcuc2VsZWN0QWxsKFwiLmRpbWVuc2lvblwiKVxyXG4gICAgICAgIC5kYXRhKGRpbWVuc2lvbnMpXHJcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJkaW1lbnNpb25cIilcclxuICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBcInRyYW5zbGF0ZShcIiArIHgoZCkgKyBcIilcIjsgfSlcclxuICAgICAgICAuY2FsbChkM1YzLmJlaGF2aW9yLmRyYWcoKVxyXG4gICAgICAgICAgICAub3JpZ2luKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHt4OiB4KGQpfTsgfSlcclxuICAgICAgICAgICAgLm9uKFwiZHJhZ3N0YXJ0XCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgZHJhZ2dpbmdbZF0gPSB4KGQpO1xyXG4gICAgICAgICAgICBiYWNrZ3JvdW5kLmF0dHIoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAub24oXCJkcmFnXCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgZHJhZ2dpbmdbZF0gPSBNYXRoLm1pbih3aWR0aCwgTWF0aC5tYXgoMCwgZDNWMy5ldmVudC54KSk7XHJcbiAgICAgICAgICAgIGZvcmVncm91bmQuYXR0cihcImRcIiwgcGF0aCk7XHJcbiAgICAgICAgICAgIGRpbWVuc2lvbnMuc29ydChmdW5jdGlvbihhLCBiKSB7IHJldHVybiBwb3NpdGlvbihhKSAtIHBvc2l0aW9uKGIpOyB9KTtcclxuICAgICAgICAgICAgeC5kb21haW4oZGltZW5zaW9ucyk7XHJcbiAgICAgICAgICAgIGcuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBcInRyYW5zbGF0ZShcIiArIHBvc2l0aW9uKGQpICsgXCIpXCI7IH0pXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5vbihcImRyYWdlbmRcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICBkZWxldGUgZHJhZ2dpbmdbZF07XHJcbiAgICAgICAgICAgIHRyYW5zaXRpb24oZDNWMy5zZWxlY3QodGhpcykpLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyB4KGQpICsgXCIpXCIpO1xyXG4gICAgICAgICAgICB0cmFuc2l0aW9uKGZvcmVncm91bmQpLmF0dHIoXCJkXCIsIHBhdGgpO1xyXG4gICAgICAgICAgICBiYWNrZ3JvdW5kXHJcbiAgICAgICAgICAgICAgICAuYXR0cihcImRcIiwgcGF0aClcclxuICAgICAgICAgICAgICAgIC50cmFuc2l0aW9uKClcclxuICAgICAgICAgICAgICAgIC5kZWxheSg1MDApXHJcbiAgICAgICAgICAgICAgICAuZHVyYXRpb24oMClcclxuICAgICAgICAgICAgICAgIC5hdHRyKFwidmlzaWJpbGl0eVwiLCBudWxsKTtcclxuICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgIC8vIEFkZCBhbiBheGlzIGFuZCB0aXRsZS5cclxuICAgIGcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJheGlzXCIpXHJcbiAgICAgICAgLmVhY2goZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICBsZXQgYXhpcyA9IG51bGw7XHJcbiAgICAgICAgICAgIGlmKGQgPT0gXCJkb2N1bWVudFwiKXtcclxuICAgICAgICAgICAgICAgIGF4aXMgPSBheGlzRDtcclxuICAgICAgICAgICAgfSBlbHNlIGlmKGQgPT0gXCJ0b3BpY1wiKXtcclxuICAgICAgICAgICAgICAgIGF4aXMgPSBheGlzVDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGF4aXMgPSBheGlzVztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBkM1YzLnNlbGVjdCh0aGlzKS5jYWxsKFxyXG4gICAgICAgICAgICAgICAgYXhpcy5zY2FsZSh5W2RdKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmFwcGVuZChcInRleHRcIilcclxuICAgICAgICAuc3R5bGUoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxyXG4gICAgICAgIC5hdHRyKFwieVwiLCAtOSlcclxuICAgICAgICAudGV4dChmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBkO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIC8vIEFkZCBhbmQgc3RvcmUgYSBicnVzaCBmb3IgZWFjaCBheGlzLlxyXG4gICAgZy5hcHBlbmQoXCJnXCIpXHJcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImJydXNoXCIpXHJcbiAgICAgICAgLmVhY2goZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICBkM1YzLnNlbGVjdCh0aGlzKS5jYWxsKHlbZF0uYnJ1c2ggPSBkM1YzLnN2Zy5icnVzaCgpLnkoeVtkXSkub24oXCJicnVzaHN0YXJ0XCIsIGJydXNoc3RhcnQpLm9uKFwiYnJ1c2hcIiwgYnJ1c2gpKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5zZWxlY3RBbGwoXCJyZWN0XCIpXHJcbiAgICAgICAgLmF0dHIoXCJ4XCIsIC04KVxyXG4gICAgICAgIC5hdHRyKFwid2lkdGhcIiwgMTYpO1xyXG5cclxuXHJcbiAgICBmdW5jdGlvbiBwb3NpdGlvbihkKSB7XHJcbiAgICB2YXIgdiA9IGRyYWdnaW5nW2RdO1xyXG4gICAgcmV0dXJuIHYgPT0gbnVsbCA/IHgoZCkgOiB2O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHRyYW5zaXRpb24oZykge1xyXG4gICAgcmV0dXJuIGcudHJhbnNpdGlvbigpLmR1cmF0aW9uKDUwMCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUmV0dXJucyB0aGUgcGF0aCBmb3IgYSBnaXZlbiBkYXRhIHBvaW50LlxyXG4gICAgZnVuY3Rpb24gcGF0aChkKSB7XHJcbiAgICByZXR1cm4gbGluZShkaW1lbnNpb25zLm1hcChmdW5jdGlvbihwKSB7IHJldHVybiBbcG9zaXRpb24ocCksIHlbcF0oZFtwXSldOyB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gYnJ1c2hzdGFydCgpIHtcclxuICAgIGQzVjMuZXZlbnQuc291cmNlRXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSGFuZGxlcyBhIGJydXNoIGV2ZW50LCB0b2dnbGluZyB0aGUgZGlzcGxheSBvZiBmb3JlZ3JvdW5kIGxpbmVzLlxyXG4gICAgZnVuY3Rpb24gYnJ1c2goKSB7XHJcbiAgICB2YXIgYWN0aXZlcyA9IGRpbWVuc2lvbnMuZmlsdGVyKGZ1bmN0aW9uKHApIHsgcmV0dXJuICF5W3BdLmJydXNoLmVtcHR5KCk7IH0pLFxyXG4gICAgICAgIGV4dGVudHMgPSBhY3RpdmVzLm1hcChmdW5jdGlvbihwKSB7IHJldHVybiB5W3BdLmJydXNoLmV4dGVudCgpOyB9KTtcclxuICAgIGZvcmVncm91bmQuc3R5bGUoXCJkaXNwbGF5XCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICByZXR1cm4gYWN0aXZlcy5ldmVyeShmdW5jdGlvbihwLCBpKSB7XHJcbiAgICAgICAgcmV0dXJuIGV4dGVudHNbaV1bMF0gPD0gZFtwXSAmJiBkW3BdIDw9IGV4dGVudHNbaV1bMV07XHJcbiAgICAgICAgfSkgPyBudWxsIDogXCJub25lXCI7XHJcbiAgICB9KTtcclxuICAgIH1cclxuXHJcbn0iLCJmdW5jdGlvbiByZW5kZXJDbHVzdGVyQW5hbHlzaXMocmVzcCkge1xyXG4gIGQzLnNlbGVjdChcIi5jaGFydDEyXCIpLnJlbW92ZSgpO1xyXG4gIHZhciBkb2N1bWVudF90b3BpYyA9IHJlc3BbXCJkb2N1bWVudF90b3BpY1wiXVswXTtcclxuICB2YXIgdG9waWNfdmVjdG9ycyA9IHJlc3BbXCJ0b3BpY192ZWN0b3JzXCJdO1xyXG4gIHZhciBiYiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNjbHVzdGVyJylcclxuICAgIC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcclxuICAgIHdpZHRoID0gNDAwO1xyXG4gIHZhciBoZWlnaHQgPSA0MDA7XHJcbiAgdmFyIG1hcmdpbiA9IDgwO1xyXG4gIHZhciBkYXRhID0gW107XHJcblxyXG4gIE9iamVjdC5rZXlzKHRvcGljX3ZlY3RvcnMpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XHJcbiAgICB2YXIgdmFsdWUgPSB0b3BpY192ZWN0b3JzW2tleV07XHJcbiAgICBkYXRhLnB1c2goe1xyXG4gICAgICB4OiB2YWx1ZVswXSxcclxuICAgICAgeTogdmFsdWVbMV0sXHJcbiAgICAgIGM6IDEsXHJcbiAgICAgIHNpemU6IGRvY3VtZW50X3RvcGljW2tleV0sXHJcbiAgICAgIGtleToga2V5XHJcbiAgICB9KTtcclxuICB9KTtcclxuICB2YXIgbGFiZWxYID0gJ1gnO1xyXG4gIHZhciBsYWJlbFkgPSAnWSc7XHJcblxyXG4gIHZhciBzdmcgPSBkMy5zZWxlY3QoJyNjbHVzdGVyJylcclxuICAgIC5hcHBlbmQoJ3N2ZycpXHJcbiAgICAuYXR0cignY2xhc3MnLCAnY2hhcnQxMicpXHJcbiAgICAuYXR0cignaWQnLCdjbHVzdGVyX2lkJylcclxuICAgIC5hdHRyKFwid2lkdGhcIiwgd2lkdGggKyBtYXJnaW4gKyBtYXJnaW4pXHJcbiAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQgKyBtYXJnaW4gKyBtYXJnaW4pXHJcbiAgICAuYXBwZW5kKFwiZ1wiKVxyXG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBtYXJnaW4gKyBcIixcIiArIG1hcmdpbiArIFwiKVwiKTtcclxuXHJcbiAgdmFyIHggPSBkMy5zY2FsZUxpbmVhcigpXHJcbiAgICAuZG9tYWluKFtkMy5taW4oZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQueDtcclxuICAgIH0pLCBkMy5tYXgoZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQueDtcclxuICAgIH0pXSlcclxuICAgIC5yYW5nZShbMCwgd2lkdGhdKTtcclxuXHJcbiAgdmFyIHkgPSBkMy5zY2FsZUxpbmVhcigpXHJcbiAgICAuZG9tYWluKFtkMy5taW4oZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQueTtcclxuICAgIH0pLCBkMy5tYXgoZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQueTtcclxuICAgIH0pXSlcclxuICAgIC5yYW5nZShbaGVpZ2h0LCAwXSk7XHJcblxyXG4gIHZhciBzY2FsZSA9IGQzLnNjYWxlU3FydCgpXHJcbiAgICAuZG9tYWluKFtkMy5taW4oZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQuc2l6ZTtcclxuICAgIH0pLCBkMy5tYXgoZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQuc2l6ZTtcclxuICAgIH0pXSlcclxuICAgIC5yYW5nZShbMTAsIDIwXSk7XHJcblxyXG4gIHZhciBvcGFjaXR5ID0gZDMuc2NhbGVTcXJ0KClcclxuICAgIC5kb21haW4oW2QzLm1pbihkYXRhLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gZC5zaXplO1xyXG4gICAgfSksIGQzLm1heChkYXRhLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gZC5zaXplO1xyXG4gICAgfSldKVxyXG4gICAgLnJhbmdlKFsxLCAuNV0pO1xyXG5cclxuXHJcbiAgdmFyIHhBeGlzID0gZDMuYXhpc0JvdHRvbSgpLnNjYWxlKHgpO1xyXG4gIHZhciB5QXhpcyA9IGQzLmF4aXNMZWZ0KCkuc2NhbGUoeSk7XHJcblxyXG5cclxuICBzdmcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgLmF0dHIoXCJjbGFzc1wiLCBcInkgYXhpc1wiKVxyXG4gICAgLmNhbGwoeUF4aXMpXHJcbiAgICAuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJyb3RhdGUoLTkwKVwiKVxyXG4gICAgLmF0dHIoXCJ4XCIsIDIwKVxyXG4gICAgLmF0dHIoXCJ5XCIsIC1tYXJnaW4pXHJcbiAgICAuYXR0cihcImR5XCIsIFwiLjcxZW1cIilcclxuICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpXHJcbiAgICAudGV4dChsYWJlbFkpO1xyXG4gIC8vIHggYXhpcyBhbmQgbGFiZWxcclxuICBzdmcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgLmF0dHIoXCJjbGFzc1wiLCBcInggYXhpc1wiKVxyXG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMCxcIiArIGhlaWdodCArIFwiKVwiKVxyXG4gICAgLmNhbGwoeEF4aXMpXHJcbiAgICAuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgLmF0dHIoXCJ4XCIsIHdpZHRoICsgMjApXHJcbiAgICAuYXR0cihcInlcIiwgbWFyZ2luIC0gMTApXHJcbiAgICAuYXR0cihcImR5XCIsIFwiLjcxZW1cIilcclxuICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpXHJcbiAgICAudGV4dChsYWJlbFgpO1xyXG5cclxuICBzdmcuc2VsZWN0QWxsKFwiY2lyY2xlXCIpXHJcbiAgICAuZGF0YShkYXRhKVxyXG4gICAgLmVudGVyKClcclxuICAgIC5hcHBlbmQoXCJnXCIpXHJcbiAgICAuaW5zZXJ0KFwiY2lyY2xlXCIpXHJcbiAgICAuYXR0cihcImN4XCIsIHdpZHRoIC8gMilcclxuICAgIC5hdHRyKFwiY3lcIiwgaGVpZ2h0IC8gMilcclxuICAgIC5hdHRyKFwiclwiLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gc2NhbGUoZC5zaXplKTtcclxuICAgIH0pXHJcbiAgICAuYXR0cihcImlkXCIsZnVuY3Rpb24oZCkge1xyXG4gICAgICByZXR1cm4gZC5rZXlcclxuICAgIH0pXHJcbiAgICAuc3R5bGUoXCJmaWxsXCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiBcIiNEMEUzRjBcIjtcclxuICAgIH0pXHJcbiAgICAub24oJ21vdXNlb3ZlcicsIGZ1bmN0aW9uIChkLCBpKSB7XHJcbiAgICAgIHJlbmRlckJhckdyYXBoKGRbXCJrZXlcIl0sIHJlc3ApO1xyXG4gICAgICBmYWRlKGRbXCJrZXlcIl0sIDEpO1xyXG4gICAgfSlcclxuICAgIC5vbignbW91c2VvdXQnLCBmdW5jdGlvbiAoZCwgaSkge1xyXG4gICAgICBmYWRlT3V0KCk7XHJcbiAgICB9KVxyXG4gICAgLnRyYW5zaXRpb24oKVxyXG4gICAgLmRlbGF5KGZ1bmN0aW9uIChkLCBpKSB7XHJcbiAgICAgIHJldHVybiB4KGQueCkgLSB5KGQueSk7XHJcbiAgICB9KVxyXG4gICAgLmR1cmF0aW9uKDUwMClcclxuICAgIC5hdHRyKFwiY3hcIiwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIHgoZC54KTtcclxuICAgIH0pXHJcbiAgICAuYXR0cihcImN5XCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiB5KGQueSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAgIC8vIHRleHQgbGFiZWwgZm9yIHRoZSB4IGF4aXNcclxuICBzdmcuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgLmF0dHIoXCJjbGFzc1wiLCBcInggbGFiZWxcIilcclxuICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcclxuICAgIC5hdHRyKFwieFwiLCB3aWR0aClcclxuICAgIC5hdHRyKFwieVwiLCBoZWlnaHQgKzQwKVxyXG4gICAgLnRleHQoXCJQQzFcIik7XHJcblxyXG5cclxuICBzdmcuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgLmF0dHIoXCJjbGFzc1wiLCBcInkgbGFiZWxcIilcclxuICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcclxuICAgIC5hdHRyKFwieVwiLCAtNTApXHJcbiAgICAuYXR0cihcImR5XCIsIFwiLjc1ZW1cIilcclxuICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwicm90YXRlKC05MClcIilcclxuICAgIC50ZXh0KFwiUEMyXCIpO1xyXG5cclxuXHJcbiAgZnVuY3Rpb24gZmFkZShrZXksIG9wYWNpdHkpIHtcclxuICAgIHN2Zy5zZWxlY3RBbGwoXCJjaXJjbGVcIilcclxuICAgICAgLmZpbHRlcihmdW5jdGlvbiAoZCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBkLmtleSA9PSBrZXk7XHJcbiAgICAgIH0pLlxyXG4gICAgICBzdHlsZShcImZpbGxcIiwgXCIjQzg0MjNFXCIpXHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBmYWRlT3V0KCkge1xyXG4gICAgc3ZnLnNlbGVjdEFsbChcImNpcmNsZVwiKVxyXG4gICAgICAudHJhbnNpdGlvbigpXHJcbiAgICAgIC5zdHlsZShcImZpbGxcIixcIiNEMEUzRjBcIik7XHJcbiAgfVxyXG59IiwiZnVuY3Rpb24gcmVuZGVyQmFyR3JhcGgodG9waWNfbnVtYmVyLCByZXNwKSB7XHJcbiAgZDMuc2VsZWN0KFwiI3N0YWNrLWJhclwiKS5yZW1vdmUoKTtcclxuICBkMy5zZWxlY3QoXCIjbGVnZW5kc3ZnXCIpLnJlbW92ZSgpO1xyXG4gIHZhciBmaW5hbF9kYXRhID0gW107XHJcbiAgdmFyIGRhdGFWYWwgPXJlc3BbXCJ0b3BpY193b3JkXCJdW3RvcGljX251bWJlcl07XHJcbiAgZm9yICh2YXIga2V5IGluIGRhdGFWYWwpIHtcclxuICAgIGlmIChkYXRhVmFsLmhhc093blByb3BlcnR5KGtleSkpIHtcclxuICAgICAgICB2YXIgdGVtcCA9e307XHJcbiAgICAgICAgdGVtcC5TdGF0ZSA9IGtleTtcclxuICAgICAgICB0ZW1wLnRvcGljX2ZyZXF1ZW5jeSA9IE1hdGguYWJzKGRhdGFWYWxba2V5XSk7XHJcbiAgICAgICAgdGVtcC5vdmVyYWxsID0gTWF0aC5hYnMocmVzcFtcIm92ZXJhbGxfd29yZFwiXVtrZXldKTtcclxuICAgICAgICB0ZW1wLnRvdGFsID0gdGVtcC50b3BpY19mcmVxdWVuY3kgKyB0ZW1wLm92ZXJhbGw7XHJcbiAgICAgICAgZmluYWxfZGF0YS5wdXNoKHRlbXApO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGtleSArIFwiLT5cIiArIHJlc3BbXCJvdmVyYWxsX3dvcmRcIl1ba2V5XSk7XHJcbiAgICB9XHJcbiAgICBcclxuICB9XHJcbiAgXHJcbiAgdmFyIGJiID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3N0YWNrZWQtYmFyJylcclxuICAgIC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcclxuICAgIHdpZHRoID0gNDAwO1xyXG5cclxuICB2YXIgZGF0YSA9IGZpbmFsX2RhdGE7XHJcbiAgdmFyIGhlaWdodCA9IGRhdGEubGVuZ3RoICogMjUgKzEwMDtcclxuICB2YXIgc3ZnID0gZDMuc2VsZWN0KFwiI3N0YWNrZWQtYmFyXCIpLmFwcGVuZChcInN2Z1wiKS5hdHRyKFwid2lkdGhcIiwgd2lkdGgpLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0KS5hdHRyKFwiaWRcIixcInN0YWNrLWJhclwiKSxcclxuICAgIG1hcmdpbiA9IHtcclxuICAgICAgdG9wOiAyMCxcclxuICAgICAgcmlnaHQ6IDAsXHJcbiAgICAgIGJvdHRvbTogNTAsXHJcbiAgICAgIGxlZnQ6IDgwXHJcbiAgICB9LFxyXG4gICAgd2lkdGggPSArc3ZnLmF0dHIoXCJ3aWR0aFwiKSAtIG1hcmdpbi5sZWZ0IC0gbWFyZ2luLnJpZ2h0LFxyXG4gICAgaGVpZ2h0ID0gK3N2Zy5hdHRyKFwiaGVpZ2h0XCIpIC0gbWFyZ2luLnRvcCAtIG1hcmdpbi5ib3R0b20sXHJcbiAgICBnID0gc3ZnLmFwcGVuZChcImdcIikuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIG1hcmdpbi5sZWZ0ICsgXCIsXCIgKyBtYXJnaW4udG9wICsgXCIpXCIpO1xyXG4gIHZhciB5ID0gZDMuc2NhbGVCYW5kKCkgLy8geCA9IGQzLnNjYWxlQmFuZCgpICBcclxuICAgIC5yYW5nZVJvdW5kKFswLCBoZWlnaHRdKSAvLyAucmFuZ2VSb3VuZChbMCwgd2lkdGhdKVxyXG4gICAgLnBhZGRpbmdJbm5lcigwLjI1KS5hbGlnbigwLjEpO1xyXG4gIHZhciB4ID0gZDMuc2NhbGVMaW5lYXIoKSAvLyB5ID0gZDMuc2NhbGVMaW5lYXIoKVxyXG4gICAgLnJhbmdlUm91bmQoWzAsIHdpZHRoXSk7IC8vIC5yYW5nZVJvdW5kKFtoZWlnaHQsIDBdKTtcclxuXHJcbiAgdmFyIHogPSBkMy5zY2FsZU9yZGluYWwoKS5yYW5nZShbXCIjQzg0MjNFXCIsIFwiI0ExQzdFMFwiXSk7XHJcbiAgdmFyIGtleXMgPSBbXCJ0b3BpY19mcmVxdWVuY3lcIiwgXCJvdmVyYWxsXCJdO1xyXG4gIGRhdGEuc29ydChmdW5jdGlvbiAoYSwgYikge1xyXG4gICAgcmV0dXJuIGIudG90YWwgLSBhLnRvdGFsO1xyXG4gIH0pO1xyXG4gIHkuZG9tYWluKGRhdGEubWFwKGZ1bmN0aW9uIChkKSB7XHJcbiAgICByZXR1cm4gZC5TdGF0ZTtcclxuICB9KSk7IC8vIHguZG9tYWluLi4uXHJcblxyXG4gIHguZG9tYWluKFswLCBkMy5tYXgoZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgIHJldHVybiBkLnRvdGFsO1xyXG4gIH0pXSkubmljZSgpOyAvLyB5LmRvbWFpbi4uLlxyXG5cclxuICB6LmRvbWFpbihrZXlzKTtcclxuICBnLmFwcGVuZChcImdcIilcclxuICAgIC5zZWxlY3RBbGwoXCJnXCIpXHJcbiAgICAuZGF0YShkMy5zdGFjaygpLmtleXMoa2V5cykoZGF0YSkpXHJcbiAgICAuZW50ZXIoKS5hcHBlbmQoXCJnXCIpXHJcbiAgICAgIC5hdHRyKFwiZmlsbFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiB6KGQua2V5KTsgfSlcclxuICAgIC5zZWxlY3RBbGwoXCJyZWN0XCIpXHJcbiAgICAuZGF0YShmdW5jdGlvbihkKSB7IHJldHVybiBkOyB9KVxyXG4gICAgLmVudGVyKCkuYXBwZW5kKFwicmVjdFwiKVxyXG4gICAgICAuYXR0cihcInlcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4geShkLmRhdGEuU3RhdGUpOyB9KSAgICAgLy8uYXR0cihcInhcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4geChkLmRhdGEuU3RhdGUpOyB9KVxyXG4gICAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4geChkWzBdKTsgfSkgICAgICAgICAvLy5hdHRyKFwieVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiB5KGRbMV0pOyB9KSBcclxuICAgICAgLmF0dHIoXCJ3aWR0aFwiLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICByZXR1cm4geChkWzFdKSAtIHgoZFswXSk7IFxyXG4gICAgfSkgLy8uYXR0cihcImhlaWdodFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiB5KGRbMF0pIC0geShkWzFdKTsgfSlcclxuICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgeS5iYW5kd2lkdGgoKSk7ICAgICAgICAgICAgICAgLy8uYXR0cihcIndpZHRoXCIsIHguYmFuZHdpZHRoKCkpOyAgXHJcblxyXG4gIGcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAuYXR0cihcImNsYXNzXCIsIFwiYXhpc1wiKVxyXG4gICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgwLDApXCIpICAgICAgICAgICAgLy8gIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKDAsXCIgKyBoZWlnaHQgKyBcIilcIilcclxuICAgICAgLmNhbGwoZDMuYXhpc0xlZnQoeSkpOyAgICAgICAgICAgICAgICAgIC8vICAgLmNhbGwoZDMuYXhpc0JvdHRvbSh4KSk7XHJcblxyXG4gIGcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAuYXR0cihcImNsYXNzXCIsIFwiYXhpc1wiKVxyXG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMCxcIitoZWlnaHQrXCIpXCIpICAgICAgIC8vIE5ldyBsaW5lXHJcbiAgICAgIC5jYWxsKGQzLmF4aXNCb3R0b20oeCkudGlja3MobnVsbCwgXCJzXCIpKSAgICAgICAgICAvLyAgLmNhbGwoZDMuYXhpc0xlZnQoeSkudGlja3MobnVsbCwgXCJzXCIpKVxyXG4gICAgLmFwcGVuZChcInRleHRcIilcclxuICAgICAgLmF0dHIoXCJ5XCIsIDIpICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgLmF0dHIoXCJ5XCIsIDIpXHJcbiAgICAgIC5hdHRyKFwieFwiLCB4KHgudGlja3MoKS5wb3AoKSkgKyAwLjUpICAgICAgICAgICAgLy8gICAgIC5hdHRyKFwieVwiLCB5KHkudGlja3MoKS5wb3AoKSkgKyAwLjUpXHJcbiAgICAgIC5hdHRyKFwiZHlcIiwgXCI0ZW1cIikgICAgICAgICAgICAgICAgICAgLy8gICAgIC5hdHRyKFwiZHlcIiwgXCIwLjMyZW1cIilcclxuICAgICAgLmF0dHIoXCJmaWxsXCIsIFwiIzAwMFwiKVxyXG4gICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwic3RhcnRcIilcclxuICAgICAgLnRleHQoXCJQcm9iYWJpbGl0eS9Db3NpbmUgU2ltaWxhcml0eVwiKVxyXG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIrICgtd2lkdGgpICtcIiwtMTApXCIpOyAgICAvLyBOZXdsaW5lXHJcblxyXG4gIHZhciBsZWdlbmQgPSBnLmFwcGVuZChcImdcIilcclxuICAgICAgLmF0dHIoXCJmb250LWZhbWlseVwiLCBcInNhbnMtc2VyaWZcIilcclxuICAgICAgLmF0dHIoXCJmb250LXNpemVcIiwgMTApXHJcbiAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcclxuICAgIC5zZWxlY3RBbGwoXCJnXCIpXHJcbiAgICAuZGF0YShrZXlzLnNsaWNlKCkucmV2ZXJzZSgpKVxyXG4gICAgLmVudGVyKCkuYXBwZW5kKFwiZ1wiKVxyXG4gICAgLy8uYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBcInRyYW5zbGF0ZSgwLFwiICsgaSAqIDIwICsgXCIpXCI7IH0pO1xyXG4gICAuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBcInRyYW5zbGF0ZSgtNTAsXCIgKyAoMzAwICsgaSAqIDIwKSArIFwiKVwiOyB9KTtcclxuICBcclxuXHJcbiAgdmFyIGtleXMxID0gW1wiT3ZlcmFsbCBUZXJtIEZyZXF1ZW5jeS9PdmVyYWxsIFJlbGV2YW5jZVwiLCBcIkVzdGltYXRlZCBUZXJtIGZyZXF1ZW5jeSB3aXRoaW4gdGhlIHNlbGVjdGVkIHRvcGljXCJdO1xyXG4gIHZhciBzdmcxID0gZDMuc2VsZWN0KFwiI2xlZ2VuZFRcIikuYXBwZW5kKFwic3ZnXCIpLmF0dHIoXCJ3aWR0aFwiLCA1MDApLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0KS5hdHRyKFwiaWRcIixcImxlZ2VuZHN2Z1wiKVxyXG52YXIgbGVnZW5kID0gc3ZnMS5hcHBlbmQoXCJnXCIpLmF0dHIoXCJmb250LWZhbWlseVwiLCBcInNhbnMtc2VyaWZcIikuYXR0cihcImZvbnQtc2l6ZVwiLCAxMCkuYXR0cihcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpLnNlbGVjdEFsbChcImdcIikuZGF0YShrZXlzMS5zbGljZSgpLnJldmVyc2UoKSkuZW50ZXIoKS5hcHBlbmQoXCJnXCIpIC8vLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gXCJ0cmFuc2xhdGUoMCxcIiArIGkgKiAyMCArIFwiKVwiOyB9KTtcclxuICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uIChkLCBpKSB7XHJcbiAgICAgIHJldHVybiBcInRyYW5zbGF0ZSgtNTAsXCIgKyAoMCArIGkgKiAyMCkgKyBcIilcIjtcclxuICAgIH0pO1xyXG4gIGxlZ2VuZC5hcHBlbmQoXCJyZWN0XCIpLmF0dHIoXCJ4XCIsIHdpZHRoKVxyXG4gIC5hdHRyKFwid2lkdGhcIiwgZnVuY3Rpb24gKGQsIGkpe1xyXG4gICAgICBpZihpPT0wKXtcclxuICAgICAgICByZXR1cm4gNjA7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIDE2MDtcclxuICB9KS5hdHRyKFwiaGVpZ2h0XCIsIDE5KS5hdHRyKFwiZmlsbFwiLCB6KTtcclxuXHJcbiAgbGVnZW5kLmFwcGVuZChcInRleHRcIikuYXR0cihcInhcIiwgd2lkdGggLSAxMCkuYXR0cihcInlcIiwgMTgpLmF0dHIoXCJkeVwiLCBcIjAuMGVtXCIpLnRleHQoZnVuY3Rpb24gKGQpIHtcclxuICAgIHJldHVybiBkO1xyXG4gIH0pO1xyXG4gIFxyXG59IiwiZnVuY3Rpb24gZ2VuZXJhdGVUb3BpY1ZlY3RvcnMoKXtcclxuICAgIHdpbmRvdy50b3BpY1ZlY3RvcnMgPSB7fTtcclxuICAgIGlmKHdpbmRvdy50b3BpY193b3JkX3Byb2JhYmlsaXR5X2luX3RvcGljKXtcclxuICAgICAgICBmb3IodmFyIHggaW4gd2luZG93LnRvcGljX3dvcmRfcHJvYmFiaWxpdHlfaW5fdG9waWMpe1xyXG4gICAgICAgICAgICB2YXIgdmVjdG9yID0gW107XHJcbiAgICAgICAgICAgIGZvcih2YXIgeSBpbiB3aW5kb3cudG9waWNfd29yZF9wcm9iYWJpbGl0eV9pbl90b3BpY1t4XSl7XHJcbiAgICAgICAgICAgICAgICB2ZWN0b3IucHVzaCh3aW5kb3cudG9waWNfd29yZF9wcm9iYWJpbGl0eV9pbl90b3BpY1t4XVt5XSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgd2luZG93LnRvcGljVmVjdG9yc1t4XSA9IHZlY3RvcjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdlbmVyYXRlUGFyYWxsZWxDb29yZGluYXRlRGF0YShyZXNwb25zZSwgdG9waWNfdGhyZXNob2xkLCB3b3JkX3RocmVzaG9sZCl7XHJcbiAgICBsZXQgdmlzRGF0YSA9IFtdO1xyXG4gICAgZm9yICh2YXIgZG9jS2V5IGluIHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl0pe1xyXG4gICAgICAgIGZvcih2YXIgdG9waWMgaW4gcmVzcG9uc2VbXCJkb2N1bWVudF90b3BpY1wiXVtkb2NLZXldKXtcclxuICAgICAgICAgICAgbGV0IHRvcGljU2NvcmUgPSByZXNwb25zZVtcImRvY3VtZW50X3RvcGljXCJdW2RvY0tleV1bdG9waWNdO1xyXG4gICAgICAgICAgICBpZiAodG9waWNTY29yZSA+IHRvcGljX3RocmVzaG9sZCl7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yKHZhciB3b3JkIGluIHJlc3BvbnNlW1widG9waWNfd29yZFwiXVt0b3BpY10pe1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCB3b3JkU2NvcmUgPSByZXNwb25zZVtcInRvcGljX3dvcmRcIl1bdG9waWNdW3dvcmRdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh3b3JkU2NvcmUgPiB3b3JkX3RocmVzaG9sZCl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZpc0RhdGEucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm5hbWVcIjogZG9jS2V5LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJkb2N1bWVudFwiOiAgZG9jS2V5LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ0b3BpY1wiOiB0b3BpYyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwid29yZFwiOiByZXNwb25zZVtcIm92ZXJhbGxfd29yZFwiXVt3b3JkXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHZpc0RhdGE7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdlbmVyYXRlUGFyYWxsZWxDb29yZGluYXRlRGF0YUhDKHJlc3BvbnNlLCB0b3BpY190aHJlc2hvbGQsIHdvcmRfdGhyZXNob2xkKXtcclxuICAgIGxldCB2aXNEYXRhID0gW107XHJcbiAgICBmb3IgKHZhciBkb2NLZXkgaW4gcmVzcG9uc2VbXCJkb2N1bWVudF90b3BpY1wiXSl7XHJcbiAgICAgICAgZm9yKHZhciB0b3BpYyBpbiByZXNwb25zZVtcImRvY3VtZW50X3RvcGljXCJdW2RvY0tleV0pe1xyXG4gICAgICAgICAgICBsZXQgdG9waWNTY29yZSA9IHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl1bZG9jS2V5XVt0b3BpY107XHJcbiAgICAgICAgICAgIGlmICh0b3BpY1Njb3JlID4gdG9waWNfdGhyZXNob2xkKXtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IodmFyIHdvcmQgaW4gcmVzcG9uc2VbXCJ0b3BpY193b3JkXCJdW3RvcGljXSl7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHdvcmRTY29yZSA9IHJlc3BvbnNlW1widG9waWNfd29yZFwiXVt0b3BpY11bd29yZF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHdvcmRTY29yZSA+IHdvcmRfdGhyZXNob2xkKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmlzRGF0YS5wdXNoKFtwYXJzZUludChkb2NLZXkpLCBwYXJzZUludCh0b3BpYyksIHJlc3BvbnNlW1wid29yZHNcIl0uaW5kZXhPZih3b3JkKV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdmlzRGF0YTtcclxufVxyXG5cclxuXHJcbiIsIndpbmRvdy52dWVBcHAgPSBuZXcgVnVlKHtcclxuICAgIGVsOiAnI3Z1ZS1hcHAnLFxyXG4gICAgZGF0YToge1xyXG4gICAgICAgIG1lc3NhZ2U6ICdIZWxsbyB1c2VyIScsXHJcbiAgICAgICAgbm9uZVNlbGVjdGVkOiB0cnVlLFxyXG4gICAgICAgIHNlbGVjdGVkUGFnZTogNSxcclxuICAgICAgICBwbGF5ZXJEZXRhaWw6IHtcclxuICAgICAgICAgICAgbmFtZTogXCI8UGxheWVyIE5hbWU+XCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIG92ZXJ2aWV3RmlsdGVyczoge30sXHJcbiAgICAgICAgbmV3RG9jczogW10sXHJcbiAgICAgICAgc2VsZWN0ZWRNYXA6IDEsXHJcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgbG9hZGluZzogZmFsc2UsXHJcbiAgICAgICAgZmFpbHVyZTogZmFsc2UsXHJcbiAgICAgICAgbmV3RG9jOiAnJyxcclxuICAgICAgICBuZXdEb2NzUHJvY2Nlc3NlZDogJycsXHJcbiAgICAgICAgc2hvd1Byb2Nlc3NlZDogZmFsc2UsXHJcbiAgICAgICAgc2V0dGluZ3M6IHtcclxuICAgICAgICAgICAgc2VsZWN0ZWRNZXRob2Q6IFwiTERBXCIsXHJcbiAgICAgICAgICAgIHNlbGVjdGVkRGF0YXNldDogMCxcclxuICAgICAgICAgICAgbGRhVG9waWNUaHJlc2hvbGQ6IDAsXHJcbiAgICAgICAgICAgIHdvcmQyVmVjVGhyZXNob2xkOiAwXHJcbiAgICAgICAgfSxcclxuICAgICAgICBwYXJhbXM6IHtcclxuICAgICAgICAgICAgdG9waWNUaHJlc2hvbGQ6IDAuMDIsXHJcbiAgICAgICAgICAgIHdvcmRUaHJlc2hvbGQ6IDAuMDIsXHJcbiAgICAgICAgICAgIHdvcmRPdmVyYWxsVGhyZXNob2xkOiAwLFxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBtZXRob2RzOiB7XHJcbiAgICAgICAgc2VsZWN0UGFnZTogZnVuY3Rpb24oeCl7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRQYWdlID0geDtcclxuICAgICAgICAgICAgaWYgKHggPT0gMSl7XHJcbiAgICAgICAgICAgICAgICBpbml0UGFnZTEod2luZG93Lmdsb2JhbF9kYXRhKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoeCA9PSAyKXtcclxuICAgICAgICAgICAgICAgIGluaXRQYWdlMih3aW5kb3cuZ2xvYmFsX2RhdGEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh4ID09IDMpe1xyXG4gICAgICAgICAgICAgICAgaW5pdFBhZ2UzKHdpbmRvdy5nbG9iYWxfZGF0YSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHggPT0gNCl7XHJcbiAgICAgICAgICAgICAgICBpbml0UGFnZTQod2luZG93Lmdsb2JhbF9kYXRhKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYWRkTmV3RG9jOiBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICBpZiAodGhpcy5uZXdEb2MudHJpbSgpLnNwbGl0KFwiIFwiKS5sZW5ndGggPCAzKXtcclxuICAgICAgICAgICAgICAgIGFsZXJ0KFwiUGxlYXNlIGFkZCBhdCBsZWFzdCAzIHdvcmRzXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMubmV3RG9jcy5wdXNoKHRoaXMubmV3RG9jKTtcclxuICAgICAgICAgICAgdGhpcy5uZXdEb2MgPSAnJztcclxuICAgICAgICAgICAgdGhpcy5zaG93UHJvY2Vzc2VkID0gZmFsc2U7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzYXZlQ2hhbmdlczogZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgICAgICBzZWxmLnN1Y2Nlc3MgPSBmYWxzZTtcclxuICAgICAgICAgICAgc2VsZi5mYWlsdXJlID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHNlbGYubG9hZGluZyA9IHRydWU7XHJcbiAgICAgICAgICAgIGlmKHNlbGYubmV3RG9jcy5sZW5ndGggPT0gMCl7XHJcbiAgICAgICAgICAgICAgICBhbGVydChcIk5vIGRvY3VtZW50cy5cIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGdldEFuYWx5c2lzKHRoaXMuc2V0dGluZ3Muc2VsZWN0ZWRNZXRob2QsIGZ1bmN0aW9uKHJlc3Ape1xyXG4gICAgICAgICAgICAgICAgc2VsZi5zdWNjZXNzID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHNlbGYubG9hZGluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3JTdGF0dXMpIHtcclxuICAgICAgICAgICAgICAgIHNlbGYubG9hZGluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5mYWlsdXJlID0gdHJ1ZTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIG1vdW50ZWQ6IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJNb3VudGVkXCIpO1xyXG4gICAgICAgIGxvYWREMygpO1xyXG4gICAgICAgIGxvYWRKcXVlcnkoKTtcclxuICAgIH1cclxufSk7IiwiZnVuY3Rpb24gbG9hZFdvcmRDbG91ZChyZXNwKXtcclxuICAgIGxldCBkYXRhID0gW107XHJcbiAgICBmb3IodmFyIHdvcmQgaW4gcmVzcFtcIm92ZXJhbGxfd29yZFwiXSl7XHJcbiAgICAgICAgbGV0IHdlaWdodCA9IHJlc3BbXCJvdmVyYWxsX3dvcmRcIl1bd29yZF07XHJcbiAgICAgICAgIGRhdGEucHVzaCh7XHJcbiAgICAgICAgICAgIG5hbWU6IHdvcmQsXHJcbiAgICAgICAgICAgIHdlaWdodDogd2VpZ2h0XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBjcmVhdGVXb3JkQ2xvdWQoXCJvdmVyYWxsLXdjXCIsIGRhdGEsIFwiQWxsIERvY3VtZW50c1wiKTtcclxuXHJcbiAgICBmb3IodmFyIHRvcGljIGluIHJlc3BbXCJ0b3BpY193b3JkXCJdKXtcclxuICAgICAgICBsZXQgZGF0YSA9IFtdO1xyXG4gICAgICAgIGZvcih2YXIgd29yZCBpbiByZXNwW1widG9waWNfd29yZFwiXVt0b3BpY10pe1xyXG4gICAgICAgICAgICBsZXQgd2VpZ2h0ID0gcmVzcFtcInRvcGljX3dvcmRcIl1bdG9waWNdW3dvcmRdO1xyXG4gICAgICAgICAgICBkYXRhLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgbmFtZTogd29yZCxcclxuICAgICAgICAgICAgICAgIHdlaWdodDogd2VpZ2h0XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICAkKFwiI3RvcGljLXdjc1wiKS5hcHBlbmQoJzxkaXYgY2xhc3M9XCJjb2wtc20tNlwiPjxkaXYgc3R5bGU9XCJvdXRsaW5lOiBzb2xpZCAxcHg7XCIgaWQ9XCJ0b3BpYycrdG9waWMrJ1wiIHN0eWxlPVwiaGVpZ2h0OiAzMDBweDtcIj48L2Rpdj48L2Rpdj4nKTtcclxuICAgICAgICBjcmVhdGVXb3JkQ2xvdWQoXCJ0b3BpY1wiK3RvcGljLCBkYXRhLCBcIlRvcGljIFwiK3RvcGljKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gY3JlYXRlV29yZENsb3VkKGlkLCBkYXRhLCB0aXRsZSl7XHJcbiAgICBIaWdoY2hhcnRzLmNoYXJ0KGlkLCB7XHJcbiAgICAgICAgc2VyaWVzOiBbe1xyXG4gICAgICAgICAgICB0eXBlOiAnd29yZGNsb3VkJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YSxcclxuICAgICAgICAgICAgcm90YXRpb246IHtcclxuICAgICAgICAgICAgICAgIGZyb206IDAsXHJcbiAgICAgICAgICAgICAgICB0bzogMCxcclxuICAgICAgICAgICAgICAgIG9yaWVudGF0aW9uczogNVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBuYW1lOiAnU2NvcmUnXHJcbiAgICAgICAgfV0sXHJcbiAgICAgICAgdGl0bGU6IHtcclxuICAgICAgICAgICAgdGV4dDogdGl0bGVcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufSJdfQ==
