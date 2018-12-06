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

    window.documents = [['serious', 'talk', 'friends', 'flaky', 'lately', 'understood', 'good', 'evening', 'hanging'], ['got', 'gift', 'elder', 'brother', 'really', 'surprising'], ['completed', '5', 'miles', 'run', 'without', 'break', 'makes', 'feel', 'strong'], ['son', 'performed', 'well', 'test', 'preparation']];
    getAnalysis("LDA");
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNsdXN0ZXJfZm9yY2VfbGF5b3V0LmpzIiwiZXZlbnRzLmpzIiwibWFpbi5qcyIsIm5ldHdvcmsuanMiLCJwYXJhbGxlbC1jb29yZGluYXRlLWhjLmpzIiwicGFyYWxsZWwtY29vcmRpbmF0ZS5qcyIsInNjYXR0ZXJfcGxvdF93aXRoX3dlaWdodHMuanMiLCJzdGFja2VkX2Jhcl9ncmFwaC5qcyIsInV0aWwuanMiLCJ2dWVfbW9kZWwuanMiLCJ3b3JkY2xvdWQuanMiXSwibmFtZXMiOlsiQXJyYXkiLCJwcm90b3R5cGUiLCJjb250YWlucyIsInYiLCJpIiwibGVuZ3RoIiwidW5pcXVlIiwiYXJyIiwiaW5jbHVkZXMiLCJwdXNoIiwicmVuZGVyQ2x1c3RlckZvcmNlTGF5b3V0IiwiZGF0YSIsImRhdGFWYWwiLCJmaW5hbF9kaWN0Iiwia2V5IiwiaGFzT3duUHJvcGVydHkiLCJjaGlsZHJlbldvcmRzIiwiY2hpbGRLZXkiLCJ3aW5kb3ciLCJ2dWVBcHAiLCJwYXJhbXMiLCJ3b3JkVGhyZXNob2xkIiwiY2x1c3Rlcl9kYXRhIiwiY291bnQiLCJ3b3JkT3ZlcmFsbFRocmVzaG9sZCIsImhhc2giLCJhcnJheV9jaGlsZCIsImNoaWxkcyIsImNoaWxkX2hhc2giLCJjaGlsZHJlbiIsImQzIiwiZDNWMyIsInJlbmRlckNsdXN0ZXIiLCJyYWRpdXMiLCJkZW5kb2dyYW1Db250YWluZXIiLCJyb290Tm9kZVNpemUiLCJsZXZlbE9uZU5vZGVTaXplIiwibGV2ZWxUd29Ob2RlU2l6ZSIsImxldmVsVGhyZWVOb2RlU2l6ZSIsImR1cmF0aW9uIiwicm9vdEpzb25EYXRhIiwiY2x1c3RlciIsImxheW91dCIsInNpemUiLCJzZXBhcmF0aW9uIiwiYSIsImIiLCJwYXJlbnQiLCJkZXB0aCIsImRpYWdvbmFsIiwic3ZnIiwicmFkaWFsIiwicHJvamVjdGlvbiIsImQiLCJ5IiwieCIsIk1hdGgiLCJQSSIsImNvbnRhaW5lckRpdiIsInNlbGVjdCIsImRvY3VtZW50IiwiZ2V0RWxlbWVudEJ5SWQiLCJhcHBlbmQiLCJhdHRyIiwidGV4dCIsIm9uIiwiY29sbGFwc2VMZXZlbHMiLCJzdmdSb290IiwiY2FsbCIsImJlaGF2aW9yIiwiem9vbSIsInNjYWxlIiwic2NhbGVFeHRlbnQiLCJhbmltR3JvdXAiLCJmb3JFYWNoIiwiY29sbGFwc2UiLCJjcmVhdGVDb2xsYXBzaWJsZURlbmRyb0dyYW0iLCJzb3VyY2UiLCJub2RlcyIsInBhdGhsaW5rcyIsImxpbmtzIiwibm9kZSIsInNlbGVjdEFsbCIsImlkIiwibm9kZUVudGVyIiwiZW50ZXIiLCJ0b2dnbGVDaGlsZHJlbiIsImFsaWFzIiwibmFtZSIsIm5vZGVVcGRhdGUiLCJ0cmFuc2l0aW9uIiwic3R5bGUiLCJjb2xvciIsIm9yZGVyIiwibm9kZUV4aXQiLCJleGl0IiwicmVtb3ZlIiwibGluayIsInRhcmdldCIsImluc2VydCIsIm8iLCJ4MCIsInkwIiwiY2xpY2tUeXBlIiwiX2NoaWxkcmVuIiwidHlwZSIsInVuZGVmaW5lZCIsImhpZ2hsaWdodE5vZGVTZWxlY3Rpb25zIiwiaGlnaGxpZ2h0Um9vdFRvTm9kZVBhdGgiLCJoaWdobGlnaHRMaW5rQ29sb3IiLCJkZWZhdWx0TGlua0NvbG9yIiwibm9kZUNvbG9yIiwicGF0aExpbmtzIiwiZGQiLCJhbmNlc3RvcnMiLCJfIiwiaXNVbmRlZmluZWQiLCJtYXRjaGVkTGlua3MiLCJmaWx0ZXIiLCJhbnkiLCJwIiwiZWFjaCIsImFuaW1hdGVDaGFpbnMiLCJjbGFzc2VkIiwib3ZlcmxheUJveCIsImdldEJCb3giLCJldmVudCIsInRyYW5zbGF0ZSIsImNoZWNrRm9yVGhpcmRMZXZlbE9wZW5DaGlsZHJlbiIsInRvZ2dsZUFsbFNlY29uZExldmVsQ2hpbGRyZW4iLCJ0b2dnbGVTZWNvbmRMZXZlbENoaWxkcmVuIiwicm9vdEluZGV4Iiwicm9vdExlbmd0aCIsImlzTm9kZU9wZW4iLCJjaGlsZEluZGV4IiwiY2hpbGRMZW5ndGgiLCJzZWNvbmRMZXZlbENoaWxkIiwibG9hZEpxdWVyeSIsIiQiLCJyZWFkeSIsImNsaWNrIiwic2lkZWJhciIsInJlcXVpcmUiLCJjb25maWciLCJwYXRocyIsImxvYWREMyIsImQzT2xkIiwiZG9jdW1lbnRzIiwiZ2V0QW5hbHlzaXMiLCJnZXREb2NzIiwidGV4dHMiLCJtYXAiLCJzcGxpdCIsIm1ldGhvZCIsInN1Y2Nlc3MiLCJmYWlsIiwiZG9jcyIsIm5ld0RvY3MiLCJmbmMiLCJnZXRMREFDbHVzdGVycyIsImdldFdvcmQyVmVjQ2x1c3RlcnMiLCJsb2FkREZ1bmMiLCJyZXNwIiwiZ2xvYmFsX2RhdGEiLCJpbml0UGFnZTEiLCJpbml0UGFnZTIiLCJpbml0UGFnZTMiLCJpbml0UGFnZTQiLCJsb2FkVmlzdWFsaXphdGlvbnMiLCJyZW5kZXJDbHVzdGVyQW5hbHlzaXMiLCJodG1sIiwibG9hZFBhcmFsbGVsQ29vcmRpbmF0ZSIsImxvYWRQYXJhbGxlbENvb3JkaW5hdGVzSEMiLCJsb2FkV29yZENsb3VkIiwiZ2V0MkRWZWN0b3JzIiwidmVjdG9ycyIsInN1Y2Nlc3NDYWxsYmFjayIsInJlcXVlc3QiLCJhamF4IiwidXJsIiwiZG9uZSIsInJlc3BvbnNlIiwianFYSFIiLCJ0ZXh0U3RhdHVzIiwiYWxlcnQiLCJnZXRUb2tlbml6ZWREb2NzIiwiZmFpbHVyZUNhbGxiYWNrIiwiSlNPTiIsInN0cmluZ2lmeSIsImNvbnRlbnRUeXBlIiwiZGF0YVR5cGUiLCJzdGFydCIsInNldHRpbmdzIiwic3RhcnQyIiwiZW5kIiwiZW5kMiIsInNlbGVjdGVkIiwic2VsZWN0ZWREYXRhc2V0IiwicGFyc2UiLCJzdGFydDEiLCJlbmQxIiwiZ2VuZXJhdGVQYXJhbGxlbENvb3JkaW5hdGVEYXRhSEMiLCJ0b3BpY1RocmVzaG9sZCIsIkhpZ2hjaGFydHMiLCJjaGFydCIsInBhcmFsbGVsQ29vcmRpbmF0ZXMiLCJwYXJhbGxlbEF4ZXMiLCJsaW5lV2lkdGgiLCJ0aXRsZSIsInBsb3RPcHRpb25zIiwic2VyaWVzIiwiYW5pbWF0aW9uIiwibWFya2VyIiwiZW5hYmxlZCIsInN0YXRlcyIsImhvdmVyIiwiaGFsbyIsImV2ZW50cyIsIm1vdXNlT3ZlciIsImdyb3VwIiwidG9Gcm9udCIsInhBeGlzIiwiY2F0ZWdvcmllcyIsIm9mZnNldCIsInlBeGlzIiwiT2JqZWN0Iiwia2V5cyIsInZhbHVlcyIsImNvbG9ycyIsInNldCIsInNoYWRvdyIsIm1hcmdpbiIsInRvcCIsInJpZ2h0IiwiYm90dG9tIiwibGVmdCIsIndpZHRoIiwiaGVpZ2h0Iiwib3JkaW5hbCIsInJhbmdlUG9pbnRzIiwiZHJhZ2dpbmciLCJsaW5lIiwiYmFja2dyb3VuZCIsImZvcmVncm91bmQiLCJkaW1lbnNpb25zIiwiY2FycyIsImdlbmVyYXRlUGFyYWxsZWxDb29yZGluYXRlRGF0YSIsImF4aXNEIiwiYXhpcyIsIm9yaWVudCIsInRpY2tWYWx1ZXMiLCJwYXJzZUludCIsImF4aXNUIiwiYXhpc1ciLCJwYXJzZUZsb2F0IiwiZG9tYWluIiwibGluZWFyIiwiZXh0ZW50IiwicmFuZ2UiLCJwYXRoIiwiZyIsImRyYWciLCJvcmlnaW4iLCJtaW4iLCJtYXgiLCJzb3J0IiwicG9zaXRpb24iLCJkZWxheSIsImJydXNoIiwiYnJ1c2hzdGFydCIsInNvdXJjZUV2ZW50Iiwic3RvcFByb3BhZ2F0aW9uIiwiYWN0aXZlcyIsImVtcHR5IiwiZXh0ZW50cyIsImV2ZXJ5IiwiZG9jdW1lbnRfdG9waWMiLCJ0b3BpY192ZWN0b3JzIiwiYmIiLCJxdWVyeVNlbGVjdG9yIiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0IiwidmFsdWUiLCJjIiwibGFiZWxYIiwibGFiZWxZIiwic2NhbGVMaW5lYXIiLCJzY2FsZVNxcnQiLCJvcGFjaXR5IiwiYXhpc0JvdHRvbSIsImF4aXNMZWZ0IiwicmVuZGVyQmFyR3JhcGgiLCJmYWRlIiwiZmFkZU91dCIsInRvcGljX251bWJlciIsImZpbmFsX2RhdGEiLCJ0ZW1wIiwiU3RhdGUiLCJ0b3BpY19mcmVxdWVuY3kiLCJhYnMiLCJvdmVyYWxsIiwidG90YWwiLCJjb25zb2xlIiwibG9nIiwic2NhbGVCYW5kIiwicmFuZ2VSb3VuZCIsInBhZGRpbmdJbm5lciIsImFsaWduIiwieiIsInNjYWxlT3JkaW5hbCIsIm5pY2UiLCJzdGFjayIsImJhbmR3aWR0aCIsInRpY2tzIiwicG9wIiwibGVnZW5kIiwic2xpY2UiLCJyZXZlcnNlIiwia2V5czEiLCJzdmcxIiwiZ2VuZXJhdGVUb3BpY1ZlY3RvcnMiLCJ0b3BpY1ZlY3RvcnMiLCJ0b3BpY193b3JkX3Byb2JhYmlsaXR5X2luX3RvcGljIiwidmVjdG9yIiwidG9waWNfdGhyZXNob2xkIiwid29yZF90aHJlc2hvbGQiLCJ2aXNEYXRhIiwiZG9jS2V5IiwidG9waWMiLCJ0b3BpY1Njb3JlIiwid29yZCIsIndvcmRTY29yZSIsImluZGV4T2YiLCJWdWUiLCJlbCIsIm1lc3NhZ2UiLCJub25lU2VsZWN0ZWQiLCJzZWxlY3RlZFBhZ2UiLCJwbGF5ZXJEZXRhaWwiLCJvdmVydmlld0ZpbHRlcnMiLCJzZWxlY3RlZE1hcCIsImxvYWRpbmciLCJmYWlsdXJlIiwibmV3RG9jIiwibmV3RG9jc1Byb2NjZXNzZWQiLCJzaG93UHJvY2Vzc2VkIiwic2VsZWN0ZWRNZXRob2QiLCJsZGFUb3BpY1RocmVzaG9sZCIsIndvcmQyVmVjVGhyZXNob2xkIiwibWV0aG9kcyIsInNlbGVjdFBhZ2UiLCJhZGROZXdEb2MiLCJ0cmltIiwic2F2ZUNoYW5nZXMiLCJzZWxmIiwiZXJyb3JTdGF0dXMiLCJtb3VudGVkIiwid2VpZ2h0IiwiY3JlYXRlV29yZENsb3VkIiwicm90YXRpb24iLCJmcm9tIiwidG8iLCJvcmllbnRhdGlvbnMiXSwibWFwcGluZ3MiOiI7Ozs7QUFBQUEsS0FBSyxDQUFDQyxTQUFOLENBQWdCQyxRQUFoQixHQUEyQixVQUFTQyxDQUFULEVBQVk7QUFDbkMsT0FBSSxJQUFJQyxDQUFDLEdBQUcsQ0FBWixFQUFlQSxDQUFDLEdBQUcsS0FBS0MsTUFBeEIsRUFBZ0NELENBQUMsRUFBakMsRUFBcUM7QUFDakMsUUFBRyxLQUFLQSxDQUFMLE1BQVlELENBQWYsRUFBa0IsT0FBTyxJQUFQ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Q0FBZ0I1RSxNQUFoQixDQUF1QixxRUFBbUV5USxLQUFuRSxHQUF5RSx1Q0FBaEc7QUFDQThCLElBQUFBLGVBQWUsQ0FBQyxVQUFROUIsS0FBVCxFQUFnQjVULEtBQWhCLEVBQXNCLFdBQVM0VCxLQUEvQixDQUFmO0FBQ0g7QUFDSjs7QUFFRCxTQUFTOEIsZUFBVCxDQUF5QmxSLEVBQXpCLEVBQTZCeEUsSUFBN0IsRUFBbUNxTSxLQUFuQyxFQUF5QztBQUNyQ0wsRUFBQUEsVUFBVSxDQUFDQyxLQUFYLENBQWlCekgsRUFBakIsRUFBcUI7QUFDakIrSCxJQUFBQSxNQUFNLEVBQUUsQ0FBQztBQUNMekcsTUFBQUEsSUFBSSxFQUFFLFdBREQ7QUFFTDlGLE1BQUFBLElBQUksRUFBRUEsSUFGRDtBQUdMMlYsTUFBQUEsUUFBUSxFQUFFO0FBQ05DLFFBQUFBLElBQUksRUFBRSxDQURBO0FBRU5DLFFBQUFBLEVBQUUsRUFBRSxDQUZFO0FBR05DLFFBQUFBLFlBQVksRUFBRTtBQUhSLE9BSEw7QUFRTGpSLE1BQUFBLElBQUksRUFBRTtBQVJELEtBQUQsQ0FEUztBQVdqQndILElBQUFBLEtBQUssRUFBRTtBQUNIaEosTUFBQUEsSUFBSSxFQUFFZ0o7QUFESDtBQVhVLEdBQXJCO0FBZUgiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiQXJyYXkucHJvdG90eXBlLmNvbnRhaW5zID0gZnVuY3Rpb24odikge1xyXG4gICAgZm9yKHZhciBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBpZih0aGlzW2ldID09PSB2KSByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxufTtcclxuXHJcbkFycmF5LnByb3RvdHlwZS51bmlxdWUgPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciBhcnIgPSBbXTtcclxuICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgaWYoIWFyci5pbmNsdWRlcyh0aGlzW2ldKSkge1xyXG4gICAgICAgICAgICBhcnIucHVzaCh0aGlzW2ldKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYXJyOyBcclxufVxyXG5cclxuZnVuY3Rpb24gcmVuZGVyQ2x1c3RlckZvcmNlTGF5b3V0KGRhdGEpe1xyXG5cdHZhciBkYXRhVmFsID0gZGF0YVtcInRvcGljX3dvcmRcIl07XHJcblx0dmFyIGZpbmFsX2RpY3QgPSB7fTtcclxuXHRmb3IgKHZhciBrZXkgaW4gZGF0YVZhbCkge1xyXG5cdCAgICBpZiAoZGF0YVZhbC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcblxyXG5cdCAgICBcdHZhciBjaGlsZHJlbldvcmRzID0gZGF0YVZhbFtrZXldO1xyXG5cclxuXHQgICAgXHRmb3IodmFyIGNoaWxkS2V5IGluIGNoaWxkcmVuV29yZHMpe1xyXG5cclxuXHQgICAgXHRcdGlmIChjaGlsZHJlbldvcmRzLmhhc093blByb3BlcnR5KGNoaWxkS2V5KSAmJiBjaGlsZHJlbldvcmRzW2NoaWxkS2V5XSA+IHdpbmRvdy52dWVBcHAucGFyYW1zLndvcmRUaHJlc2hvbGQpIHtcclxuXHJcblx0ICAgIFx0XHRcdGlmKCEoY2hpbGRLZXkgaW4gZmluYWxfZGljdCkpe1xyXG5cdCAgICBcdFx0XHRcdGZpbmFsX2RpY3RbY2hpbGRLZXldID0gW107XHJcblx0ICAgIFx0XHRcdH1cclxuICAgIFx0XHRcdFx0ZmluYWxfZGljdFtjaGlsZEtleV0ucHVzaChrZXkpO1xyXG5cdCAgICBcdFx0XHRcclxuXHQgICAgXHRcdH1cclxuXHQgICAgXHR9IFxyXG5cdCAgICB9XHJcbiAgXHR9XHJcbiAgXHR2YXIgY2x1c3Rlcl9kYXRhID0ge1xyXG4gIFx0XHRcIm5hbWVcIjpcIlwiLFxyXG4gIFx0XHRcImNoaWxkcmVuXCI6W11cclxuICBcdH1cclxuXHJcbiAgXHR2YXIgY291bnQ9MDtcclxuICBcdGZvcih2YXIga2V5IGluIGZpbmFsX2RpY3Qpe1xyXG4gIFx0XHRpZiAoZmluYWxfZGljdC5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIChkYXRhW1wib3ZlcmFsbF93b3JkXCJdW2tleV0gJiYgZGF0YVtcIm92ZXJhbGxfd29yZFwiXVtrZXldID4gd2luZG93LnZ1ZUFwcC5wYXJhbXMud29yZE92ZXJhbGxUaHJlc2hvbGQpKSB7XHJcbiAgXHRcdFx0Y291bnQgPSBjb3VudCArIDE7XHJcbiAgXHRcdFx0dmFyIGhhc2ggPSB7fTtcclxuICBcdFx0XHRoYXNoW1wib3JkZXJcIl0gPSBjb3VudDtcclxuICBcdFx0XHRoYXNoW1wiYWxpYXNcIl0gPSBcIldoaXRlL3JlZC9qYWNrIHBpbmVcIjtcclxuICBcdFx0XHRoYXNoW1wiY29sb3JcIl0gPSBcIiNDN0VBRkJcIjtcclxuICBcdFx0XHRoYXNoW1wibmFtZVwiXSA9IGtleTtcclxuXHJcblxyXG4gIFx0XHRcdHZhciBhcnJheV9jaGlsZCA9IGZpbmFsX2RpY3Rba2V5XS51bmlxdWUoKTtcclxuICBcdFx0XHR2YXIgY2hpbGRzID1bXTtcclxuICBcdFx0XHRmb3IodmFyIGk9MDsgaSA8IGFycmF5X2NoaWxkLmxlbmd0aDtpKyspe1xyXG4gIFx0XHRcdFx0dmFyIGNoaWxkX2hhc2ggPSB7fTtcclxuICBcdFx0XHRcdGNoaWxkX2hhc2hbXCJvcmRlclwiXSA9IGkrMTtcclxuICBcdFx0XHRcdGNoaWxkX2hhc2hbXCJhbGlhc1wiXSA9IGkrMSArIFwiXCI7XHJcbiAgXHRcdFx0XHRjaGlsZF9oYXNoW1wiY29sb3JcIl0gPSBcIiNDN0VBRkJcIjtcclxuICBcdFx0XHRcdGNoaWxkX2hhc2hbXCJuYW1lXCJdPSBhcnJheV9jaGlsZFtpXTtcclxuICBcdFx0XHRcdGNoaWxkcy5wdXNoKGNoaWxkX2hhc2gpO1xyXG4gIFx0XHRcdH1cclxuICBcdFx0XHRoYXNoW1wiY2hpbGRyZW5cIl0gPSBjaGlsZHM7XHJcbiAgXHRcdFx0Y2x1c3Rlcl9kYXRhLmNoaWxkcmVuLnB1c2goaGFzaCk7XHJcbiAgXHRcdH1cclxuICBcdH1cclxuICBcdHZhciBkMyA9ICAgd2luZG93LmQzVjM7XHJcbiAgXHRyZW5kZXJDbHVzdGVyKGNsdXN0ZXJfZGF0YSwgZDMpO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZW5kZXJDbHVzdGVyKGNsdXN0ZXJfZGF0YSwgZDMpe1xyXG4gIHZhciByYWRpdXMgPSAyMDA7XHJcbiAgdmFyIGRlbmRvZ3JhbUNvbnRhaW5lciA9IFwic3BlY2llc2NvbGxhcHNpYmxlXCI7XHJcblxyXG5cclxuICB2YXIgcm9vdE5vZGVTaXplID0gNjtcclxuICB2YXIgbGV2ZWxPbmVOb2RlU2l6ZSA9IDM7XHJcbiAgdmFyIGxldmVsVHdvTm9kZVNpemUgPSAzO1xyXG4gIHZhciBsZXZlbFRocmVlTm9kZVNpemUgPSAyO1xyXG5cclxuXHJcbiAgdmFyIGkgPSAwO1xyXG4gIHZhciBkdXJhdGlvbiA9IDMwMDsgLy9DaGFuZ2luZyB2YWx1ZSBkb2Vzbid0IHNlZW0gYW55IGNoYW5nZXMgaW4gdGhlIGR1cmF0aW9uID8/XHJcblxyXG4gIHZhciByb290SnNvbkRhdGE7XHJcblxyXG4gIHZhciBjbHVzdGVyID0gZDMubGF5b3V0LmNsdXN0ZXIoKVxyXG4gICAgICAuc2l6ZShbMzYwLHJhZGl1cyAtIDEyMF0pXHJcbiAgICAgIC5zZXBhcmF0aW9uKGZ1bmN0aW9uKGEsIGIpIHtcclxuICAgICAgICByZXR1cm4gKGEucGFyZW50ID09IGIucGFyZW50ID8gMSA6IDIpIC8gYS5kZXB0aDtcclxuICAgICAgfSk7XHJcblxyXG4gIHZhciBkaWFnb25hbCA9IGQzLnN2Zy5kaWFnb25hbC5yYWRpYWwoKVxyXG4gICAgICAucHJvamVjdGlvbihmdW5jdGlvbihkKSB7IHJldHVybiBbZC55LCBkLnggLyAxODAgKiBNYXRoLlBJXTsgfSk7XHJcblxyXG4gIHZhciBjb250YWluZXJEaXYgPSBkMy5zZWxlY3QoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZGVuZG9ncmFtQ29udGFpbmVyKSk7XHJcblxyXG4gIGNvbnRhaW5lckRpdi5hcHBlbmQoXCJidXR0b25cIilcclxuICAgICAgLmF0dHIoXCJpZFwiLFwiY29sbGFwc2UtYnV0dG9uXCIpXHJcbiAgICAgIC50ZXh0KFwiQ29sbGFwc2UhXCIpXHJcbiAgICAgIC5vbihcImNsaWNrXCIsY29sbGFwc2VMZXZlbHMpO1xyXG5cclxuICB2YXIgc3ZnUm9vdCA9IGNvbnRhaW5lckRpdi5hcHBlbmQoXCJzdmc6c3ZnXCIpXHJcbiAgICAgIC5hdHRyKFwid2lkdGhcIiwgXCIxMDAlXCIpXHJcbiAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIFwiMTAwJVwiKVxyXG4gICAgICAuYXR0cihcInZpZXdCb3hcIiwgXCItXCIgKyAocmFkaXVzKSArIFwiIC1cIiArIChyYWRpdXMgLSA1MCkgK1wiIFwiKyByYWRpdXMqMiArXCIgXCIrIHJhZGl1cyoyKVxyXG4gICAgICAuY2FsbChkMy5iZWhhdmlvci56b29tKCkuc2NhbGUoMC45KS5zY2FsZUV4dGVudChbMC4xLCAzXSkub24oXCJ6b29tXCIsIHpvb20pKS5vbihcImRibGNsaWNrLnpvb21cIiwgbnVsbClcclxuICAgICAgLmFwcGVuZChcInN2ZzpnXCIpO1xyXG5cclxuICAvLyBBZGQgdGhlIGNsaXBwaW5nIHBhdGhcclxuICBzdmdSb290LmFwcGVuZChcInN2ZzpjbGlwUGF0aFwiKS5hdHRyKFwiaWRcIiwgXCJjbGlwcGVyLXBhdGhcIilcclxuICAgICAgLmFwcGVuZChcInN2ZzpyZWN0XCIpXHJcbiAgICAgIC5hdHRyKCdpZCcsICdjbGlwLXJlY3QtYW5pbScpO1xyXG5cclxuICB2YXIgYW5pbUdyb3VwID0gc3ZnUm9vdC5hcHBlbmQoXCJzdmc6Z1wiKVxyXG4gICAgICAuYXR0cihcImNsaXAtcGF0aFwiLCBcInVybCgjY2xpcHBlci1wYXRoKVwiKTtcclxuXHJcbiAgXHRyb290SnNvbkRhdGEgPSBjbHVzdGVyX2RhdGE7XHJcblxyXG4gICAgLy9TdGFydCB3aXRoIGFsbCBjaGlsZHJlbiBjb2xsYXBzZWRcclxuICAgIHJvb3RKc29uRGF0YS5jaGlsZHJlbi5mb3JFYWNoKGNvbGxhcHNlKTtcclxuXHJcbiAgICAvL0luaXRpYWxpemUgdGhlIGRlbmRyb2dyYW1cclxuICBcdGNyZWF0ZUNvbGxhcHNpYmxlRGVuZHJvR3JhbShyb290SnNvbkRhdGEpO1xyXG5cclxuXHJcblxyXG5cclxuICBmdW5jdGlvbiBjcmVhdGVDb2xsYXBzaWJsZURlbmRyb0dyYW0oc291cmNlKSB7XHJcblxyXG4gICAgLy8gQ29tcHV0ZSB0aGUgbmV3IHRyZWUgbGF5b3V0LlxyXG4gICAgdmFyIG5vZGVzID0gY2x1c3Rlci5ub2Rlcyhyb290SnNvbkRhdGEpO1xyXG4gICAgdmFyIHBhdGhsaW5rcyA9IGNsdXN0ZXIubGlua3Mobm9kZXMpO1xyXG5cclxuICAgIC8vIE5vcm1hbGl6ZSBmb3Igbm9kZXMnIGZpeGVkLWRlcHRoLlxyXG4gICAgbm9kZXMuZm9yRWFjaChmdW5jdGlvbihkKSB7XHJcbiAgICAgIGlmKGQuZGVwdGggPD0yKXtcclxuICAgICAgICBkLnkgPSBkLmRlcHRoKjcwO1xyXG4gICAgICB9ZWxzZVxyXG4gICAgICB7XHJcbiAgICAgICAgZC55ID0gZC5kZXB0aCoxMDA7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFVwZGF0ZSB0aGUgbm9kZXPigKZcclxuICAgIHZhciBub2RlID0gc3ZnUm9vdC5zZWxlY3RBbGwoXCJnLm5vZGVcIilcclxuICAgICAgICAuZGF0YShub2RlcywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5pZCB8fCAoZC5pZCA9ICsraSk7IH0pO1xyXG5cclxuICAgIC8vIEVudGVyIGFueSBuZXcgbm9kZXMgYXQgdGhlIHBhcmVudCdzIHByZXZpb3VzIHBvc2l0aW9uLlxyXG4gICAgdmFyIG5vZGVFbnRlciA9IG5vZGUuZW50ZXIoKS5hcHBlbmQoXCJnXCIpXHJcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcIm5vZGVcIilcclxuICAgICAgICAub24oXCJjbGlja1wiLCB0b2dnbGVDaGlsZHJlbik7XHJcblxyXG4gICAgbm9kZUVudGVyLmFwcGVuZChcImNpcmNsZVwiKTtcclxuXHJcbiAgICBub2RlRW50ZXIuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgLmF0dHIoXCJ4XCIsIDEwKVxyXG4gICAgLmF0dHIoXCJkeVwiLCBcIi4zNWVtXCIpXHJcbiAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwic3RhcnRcIilcclxuICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgIGlmKGQuZGVwdGggPT09IDIpe1xyXG4gICAgICAgICAgICByZXR1cm4gZC5hbGlhcztcclxuICAgICAgICAgIH1cclxuICAgICAgICAgcmV0dXJuIGQubmFtZTtcclxuICAgIH0pO1xyXG5cclxuXHJcbiAgICAvLyBUcmFuc2l0aW9uIG5vZGVzIHRvIHRoZWlyIG5ldyBwb3NpdGlvbi5cclxuICAgIHZhciBub2RlVXBkYXRlID0gbm9kZS50cmFuc2l0aW9uKClcclxuICAgICAgICAuZHVyYXRpb24oZHVyYXRpb24pXHJcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gXCJyb3RhdGUoXCIgKyAoZC54IC0gOTApICsgXCIpdHJhbnNsYXRlKFwiICsgZC55ICsgXCIpXCI7IH0pXHJcblxyXG4gICAgbm9kZVVwZGF0ZS5zZWxlY3QoXCJjaXJjbGVcIilcclxuICAgICAgICAuYXR0cihcInJcIiwgZnVuY3Rpb24oZCl7XHJcbiAgICAgICAgICAgIGlmIChkLmRlcHRoID09IDApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByb290Tm9kZVNpemU7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGVsc2UgaWYgKGQuZGVwdGggPT09IDEpIHtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIGxldmVsT25lTm9kZVNpemU7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGVsc2UgaWYgKGQuZGVwdGggPT09IDIpIHtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIGxldmVsVHdvTm9kZVNpemU7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gbGV2ZWxUaHJlZU5vZGVTaXplO1xyXG5cclxuICAgICAgICB9KVxyXG4gICAgICAgIC5zdHlsZShcImZpbGxcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICAgICBpZihkLmRlcHRoID09PTApe1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiIzgwODA4MFwiO1xyXG4gICAgICAgICAgICAgICB9ZWxzZSBpZihkLmRlcHRoID09PSAxKXtcclxuICAgICAgICAgICAgICAgIGlmKGQubmFtZT09XCJIYXJkd29vZHNcIikgcmV0dXJuIFwiIzgxNjg1NFwiO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiI0MzQjlBMFwiO1xyXG4gICAgICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgIHJldHVybiBkLmNvbG9yO1xyXG4gICAgICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuc3R5bGUoXCJzdHJva2VcIixmdW5jdGlvbihkKXtcclxuICAgICAgICAgICAgICBpZihkLmRlcHRoPjEpe1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gXCJ3aGl0ZVwiO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gXCJsaWdodGdyYXlcIjtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgbm9kZVVwZGF0ZS5zZWxlY3QoXCJ0ZXh0XCIpXHJcblxyXG4gICAgICAgIC5hdHRyKCdpZCcsIGZ1bmN0aW9uKGQpe1xyXG4gICAgICAgICAgdmFyIG9yZGVyID0gMDtcclxuICAgICAgICAgIGlmKGQub3JkZXIpb3JkZXIgPSBkLm9yZGVyO1xyXG4gICAgICAgICAgcmV0dXJuICdULScgKyBkLmRlcHRoICsgXCItXCIgKyBvcmRlcjtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgICAgICAgaWYgKGQuZGVwdGggPT09IDEpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBkLnggPCAxODAgPyBcImVuZFwiIDogXCJzdGFydFwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBkLnggPCAxODAgPyBcInN0YXJ0XCIgOiBcImVuZFwiO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmF0dHIoXCJkeVwiLCBmdW5jdGlvbihkKXtcclxuICAgICAgICAgICAgaWYgKGQuZGVwdGggPT09IDEpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBkLnggPCAxODAgPyBcIjEuNGVtXCIgOiBcIi0wLjJlbVwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBcIi4zMWVtXCI7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuYXR0cihcImR4XCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgICAgICAgIGlmIChkLmRlcHRoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMDsgLy9yZXR1cm4gZC54ID4gMTgwID8gMiA6IC0yO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBkLnggPCAxODAgPyAxIDogLTIwO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgICAgICAgaWYgKGQuZGVwdGggPCAyKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJyb3RhdGUoXCIgKyAoOTAgLSBkLngpICsgXCIpXCI7XHJcbiAgICAgICAgICAgIH1lbHNlIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBkLnggPCAxODAgPyBudWxsIDogXCJyb3RhdGUoMTgwKVwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgLy8gVE9ETzogYXBwcm9wcmlhdGUgdHJhbnNmb3JtXHJcbiAgICB2YXIgbm9kZUV4aXQgPSBub2RlLmV4aXQoKS50cmFuc2l0aW9uKClcclxuICAgICAgICAuZHVyYXRpb24oZHVyYXRpb24pXHJcbiAgICAgICAgLnJlbW92ZSgpO1xyXG5cclxuICAgIC8vIFVwZGF0ZSB0aGUgbGlua3PigKZcclxuICAgIHZhciBsaW5rID0gc3ZnUm9vdC5zZWxlY3RBbGwoXCJwYXRoLmxpbmtcIilcclxuICAgICAgICAuZGF0YShwYXRobGlua3MsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGFyZ2V0LmlkOyB9KTtcclxuXHJcbiAgICAvLyBFbnRlciBhbnkgbmV3IGxpbmtzIGF0IHRoZSBwYXJlbnQncyBwcmV2aW91cyBwb3NpdGlvbi5cclxuICAgIGxpbmsuZW50ZXIoKS5pbnNlcnQoXCJwYXRoXCIsIFwiZ1wiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJsaW5rXCIpXHJcbiAgICAgICAgLmF0dHIoXCJkXCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgIHZhciBvID0ge3g6IHNvdXJjZS54MCwgeTogc291cmNlLnkwfTtcclxuICAgICAgICAgIHJldHVybiBkaWFnb25hbCh7c291cmNlOiBvLCB0YXJnZXQ6IG99KTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5zdHlsZShcImZpbGxcIixmdW5jdGlvbihkKXtcclxuICAgICAgICAgIHJldHVybiBkLmNvbG9yO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIC8vIFRyYW5zaXRpb24gbGlua3MgdG8gdGhlaXIgbmV3IHBvc2l0aW9uLlxyXG4gICAgbGluay50cmFuc2l0aW9uKClcclxuICAgICAgICAuZHVyYXRpb24oZHVyYXRpb24pXHJcbiAgICAgICAgLmF0dHIoXCJkXCIsIGRpYWdvbmFsKTtcclxuXHJcbiAgICAvLyBUcmFuc2l0aW9uIGV4aXRpbmcgbm9kZXMgdG8gdGhlIHBhcmVudCdzIG5ldyBwb3NpdGlvbi5cclxuICAgIGxpbmsuZXhpdCgpLnRyYW5zaXRpb24oKVxyXG4gICAgICAgIC5kdXJhdGlvbihkdXJhdGlvbilcclxuICAgICAgICAuYXR0cihcImRcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgdmFyIG8gPSB7eDogc291cmNlLngsIHk6IHNvdXJjZS55fTtcclxuICAgICAgICAgIHJldHVybiBkaWFnb25hbCh7c291cmNlOiBvLCB0YXJnZXQ6IG99KTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5yZW1vdmUoKTtcclxuICB9XHJcblxyXG4gIC8vIFRvZ2dsZSBjaGlsZHJlbiBvbiBjbGljay5cclxuICBmdW5jdGlvbiB0b2dnbGVDaGlsZHJlbihkLGNsaWNrVHlwZSkge1xyXG4gICAgaWYgKGQuY2hpbGRyZW4pIHtcclxuICAgICAgZC5fY2hpbGRyZW4gPSBkLmNoaWxkcmVuO1xyXG4gICAgICBkLmNoaWxkcmVuID0gbnVsbDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGQuY2hpbGRyZW4gPSBkLl9jaGlsZHJlbjtcclxuICAgICAgZC5fY2hpbGRyZW4gPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciB0eXBlID0gdHlwZW9mIGNsaWNrVHlwZSA9PSB1bmRlZmluZWQgPyBcIm5vZGVcIiA6IGNsaWNrVHlwZTtcclxuXHJcbiAgICAvL0FjdGl2aXRpZXMgb24gbm9kZSBjbGlja1xyXG4gICAgY3JlYXRlQ29sbGFwc2libGVEZW5kcm9HcmFtKGQpO1xyXG4gICAgaGlnaGxpZ2h0Tm9kZVNlbGVjdGlvbnMoZCk7XHJcblxyXG4gICAgaGlnaGxpZ2h0Um9vdFRvTm9kZVBhdGgoZCx0eXBlKTtcclxuXHJcbiAgfVxyXG5cclxuICAvLyBDb2xsYXBzZSBub2Rlc1xyXG4gIGZ1bmN0aW9uIGNvbGxhcHNlKGQpIHtcclxuICAgIGlmIChkLmNoaWxkcmVuKSB7XHJcbiAgICAgICAgZC5fY2hpbGRyZW4gPSBkLmNoaWxkcmVuO1xyXG4gICAgICAgIGQuX2NoaWxkcmVuLmZvckVhY2goY29sbGFwc2UpO1xyXG4gICAgICAgIGQuY2hpbGRyZW4gPSBudWxsO1xyXG4gICAgICB9XHJcbiAgfVxyXG5cclxuXHJcbiAgLy8gaGlnaGxpZ2h0cyBzdWJub2RlcyBvZiBhIG5vZGVcclxuICBmdW5jdGlvbiBoaWdobGlnaHROb2RlU2VsZWN0aW9ucyhkKSB7XHJcbiAgICAgIHZhciBoaWdobGlnaHRMaW5rQ29sb3IgPSBcImRhcmtzbGF0ZWdyYXlcIjsvL1wiI2YwM2IyMFwiO1xyXG4gICAgICB2YXIgZGVmYXVsdExpbmtDb2xvciA9IFwibGlnaHRncmF5XCI7XHJcblxyXG4gICAgICB2YXIgZGVwdGggPSAgZC5kZXB0aDtcclxuICAgICAgdmFyIG5vZGVDb2xvciA9IGQuY29sb3I7XHJcbiAgICAgIGlmIChkZXB0aCA9PT0gMSkge1xyXG4gICAgICAgICAgbm9kZUNvbG9yID0gaGlnaGxpZ2h0TGlua0NvbG9yO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB2YXIgcGF0aExpbmtzID0gc3ZnUm9vdC5zZWxlY3RBbGwoXCJwYXRoLmxpbmtcIik7XHJcblxyXG4gICAgICBwYXRoTGlua3Muc3R5bGUoXCJzdHJva2VcIixmdW5jdGlvbihkZCkge1xyXG4gICAgICAgICAgaWYgKGRkLnNvdXJjZS5kZXB0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgIGlmIChkLm5hbWUgPT09ICcnKSB7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBoaWdobGlnaHRMaW5rQ29sb3I7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIHJldHVybiBkZWZhdWx0TGlua0NvbG9yO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGlmIChkZC5zb3VyY2UubmFtZSA9PT0gZC5uYW1lKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIG5vZGVDb2xvcjtcclxuICAgICAgICAgIH1lbHNlIHtcclxuICAgICAgICAgICAgICByZXR1cm4gZGVmYXVsdExpbmtDb2xvcjtcclxuICAgICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgfVxyXG5cclxuICAvL1dhbGtpbmcgcGFyZW50cycgY2hhaW4gZm9yIHJvb3QgdG8gbm9kZSB0cmFja2luZ1xyXG4gIGZ1bmN0aW9uIGhpZ2hsaWdodFJvb3RUb05vZGVQYXRoKGQsY2xpY2tUeXBlKXtcclxuICAgIHZhciBhbmNlc3RvcnMgPSBbXTtcclxuICAgIHZhciBwYXJlbnQgPSBkO1xyXG4gICAgd2hpbGUgKCFfLmlzVW5kZWZpbmVkKHBhcmVudCkpIHtcclxuICAgICAgICBhbmNlc3RvcnMucHVzaChwYXJlbnQpO1xyXG4gICAgICAgIHBhcmVudCA9IHBhcmVudC5wYXJlbnQ7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gR2V0IHRoZSBtYXRjaGVkIGxpbmtzXHJcbiAgICB2YXIgbWF0Y2hlZExpbmtzID0gW107XHJcblxyXG4gICAgc3ZnUm9vdC5zZWxlY3RBbGwoJ3BhdGgubGluaycpXHJcbiAgICAgICAgLmZpbHRlcihmdW5jdGlvbihkLCBpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIF8uYW55KGFuY2VzdG9ycywgZnVuY3Rpb24ocClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHAgPT09IGQudGFyZ2V0O1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgfSlcclxuICAgICAgICAuZWFjaChmdW5jdGlvbihkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbWF0Y2hlZExpbmtzLnB1c2goZCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgYW5pbWF0ZUNoYWlucyhtYXRjaGVkTGlua3MsY2xpY2tUeXBlKTtcclxuXHJcbiAgICBmdW5jdGlvbiBhbmltYXRlQ2hhaW5zKGxpbmtzLGNsaWNrVHlwZSl7XHJcbiAgICAgIGFuaW1Hcm91cC5zZWxlY3RBbGwoXCJwYXRoLnNlbGVjdGVkXCIpXHJcbiAgICAgICAgICAuZGF0YShbXSlcclxuICAgICAgICAgIC5leGl0KCkucmVtb3ZlKCk7XHJcblxyXG4gICAgICBhbmltR3JvdXAuc2VsZWN0QWxsKFwicGF0aC5zZWxlY3RlZFwiKVxyXG4gICAgICAgICAgLmRhdGEobGlua3MpXHJcbiAgICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJzdmc6cGF0aFwiKVxyXG4gICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInNlbGVjdGVkXCIpXHJcbiAgICAgICAgICAuYXR0cihcImRcIiwgZGlhZ29uYWwpO1xyXG5cclxuXHJcbiAgICAgIC8vUmVzZXQgcGF0aCBoaWdobGlnaHQgaWYgY29sbGFwc2UgYnV0dG9uIGNsaWNrZWRcclxuICAgICAgaWYoY2xpY2tUeXBlID09ICdidXR0b24nKXtcclxuICAgICAgICBhbmltR3JvdXAuc2VsZWN0QWxsKFwicGF0aC5zZWxlY3RlZFwiKS5jbGFzc2VkKCdyZXNldC1zZWxlY3RlZCcsdHJ1ZSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHZhciBvdmVybGF5Qm94ID0gc3ZnUm9vdC5ub2RlKCkuZ2V0QkJveCgpO1xyXG5cclxuICAgICAgc3ZnUm9vdC5zZWxlY3QoXCIjY2xpcC1yZWN0LWFuaW1cIilcclxuICAgICAgICAgIC5hdHRyKFwieFwiLCAtcmFkaXVzKVxyXG4gICAgICAgICAgLmF0dHIoXCJ5XCIsIC1yYWRpdXMpXHJcbiAgICAgICAgICAuYXR0cihcIndpZHRoXCIsMClcclxuICAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIscmFkaXVzKjIpXHJcbiAgICAgICAgICAudHJhbnNpdGlvbigpLmR1cmF0aW9uKGR1cmF0aW9uKVxyXG4gICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCByYWRpdXMqMik7XHJcbiAgICB9XHJcblxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gem9vbSgpIHtcclxuICAgICBzdmdSb290LmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBkMy5ldmVudC50cmFuc2xhdGUgKyBcIilzY2FsZShcIiArIGQzLmV2ZW50LnNjYWxlICsgXCIpXCIpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gY29sbGFwc2VMZXZlbHMoKXtcclxuXHJcbiAgICBpZihjaGVja0ZvclRoaXJkTGV2ZWxPcGVuQ2hpbGRyZW4oKSl7XHJcbiAgICAgIHRvZ2dsZUFsbFNlY29uZExldmVsQ2hpbGRyZW4oKTtcclxuICAgIH1lbHNle1xyXG4gICAgIHRvZ2dsZVNlY29uZExldmVsQ2hpbGRyZW4oKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBPcGVuIGZpcnN0IGxldmVsIG9ubHkgYnkgY29sbGFwc2luZyBzZWNvbmQgbGV2ZWxcclxuICAgIGZ1bmN0aW9uIHRvZ2dsZVNlY29uZExldmVsQ2hpbGRyZW4oKXtcclxuICAgICAgZm9yKHZhciByb290SW5kZXggPSAwLCByb290TGVuZ3RoID0gcm9vdEpzb25EYXRhLmNoaWxkcmVuLmxlbmd0aDsgcm9vdEluZGV4PHJvb3RMZW5ndGg7IHJvb3RJbmRleCsrKXtcclxuICAgICAgICAgIGlmKGlzTm9kZU9wZW4ocm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0pKXtcclxuICAgICAgICAgICAgICAgdG9nZ2xlQ2hpbGRyZW4ocm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0sJ2J1dHRvbicpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gT3BlbiBmaXJzdCBsZXZlbCBvbmx5IGJ5IGNvbGxhcHNpbmcgc2Vjb25kIGxldmVsXHJcbiAgICBmdW5jdGlvbiB0b2dnbGVBbGxTZWNvbmRMZXZlbENoaWxkcmVuKCl7XHJcbiAgICAgIGZvcih2YXIgcm9vdEluZGV4ID0gMCwgcm9vdExlbmd0aCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbi5sZW5ndGg7IHJvb3RJbmRleDxyb290TGVuZ3RoOyByb290SW5kZXgrKyl7XHJcbiAgICAgICAgaWYoaXNOb2RlT3Blbihyb290SnNvbkRhdGEuY2hpbGRyZW5bcm9vdEluZGV4XSkpe1xyXG5cclxuICAgICAgICAgIGZvcih2YXIgY2hpbGRJbmRleCA9IDAsIGNoaWxkTGVuZ3RoID0gcm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0uY2hpbGRyZW4ubGVuZ3RoOyBjaGlsZEluZGV4PGNoaWxkTGVuZ3RoOyBjaGlsZEluZGV4Kyspe1xyXG4gICAgICAgICAgICB2YXIgc2Vjb25kTGV2ZWxDaGlsZCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdLmNoaWxkcmVuW2NoaWxkSW5kZXhdO1xyXG4gICAgICAgICAgICBpZihpc05vZGVPcGVuKHNlY29uZExldmVsQ2hpbGQpKXtcclxuICAgICAgICAgICAgICB0b2dnbGVDaGlsZHJlbihyb290SnNvbkRhdGEuY2hpbGRyZW5bcm9vdEluZGV4XS5jaGlsZHJlbltjaGlsZEluZGV4XSwnYnV0dG9uJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIENoZWNrIGlmIGFueSBub2RlcyBvcGVucyBhdCBzZWNvbmQgbGV2ZWxcclxuICAgIGZ1bmN0aW9uIGNoZWNrRm9yVGhpcmRMZXZlbE9wZW5DaGlsZHJlbigpe1xyXG4gICAgICBmb3IodmFyIHJvb3RJbmRleCA9IDAsIHJvb3RMZW5ndGggPSByb290SnNvbkRhdGEuY2hpbGRyZW4ubGVuZ3RoOyByb290SW5kZXg8cm9vdExlbmd0aDsgcm9vdEluZGV4Kyspe1xyXG4gICAgICAgIGlmKGlzTm9kZU9wZW4ocm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0pKXtcclxuXHJcbiAgICAgICAgICBmb3IodmFyIGNoaWxkSW5kZXggPSAwLCBjaGlsZExlbmd0aCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdLmNoaWxkcmVuLmxlbmd0aDsgY2hpbGRJbmRleDxjaGlsZExlbmd0aDsgY2hpbGRJbmRleCsrKXtcclxuXHJcbiAgICAgICAgICAgIHZhciBzZWNvbmRMZXZlbENoaWxkID0gcm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0uY2hpbGRyZW5bY2hpbGRJbmRleF07XHJcbiAgICAgICAgICAgIGlmKGlzTm9kZU9wZW4oc2Vjb25kTGV2ZWxDaGlsZCkpe1xyXG4gICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gaXNOb2RlT3BlbihkKXtcclxuICAgICAgaWYoZC5jaGlsZHJlbil7cmV0dXJuIHRydWU7fVxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuXHJcblxyXG5cclxufVxyXG5cclxuICAiLCJmdW5jdGlvbiBsb2FkSnF1ZXJ5KCl7XHJcbiAgICAkKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpe1xyXG4gICAgICAgICQoXCIjdG9nZ2xlLXNpZGViYXJcIikuY2xpY2soZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgJCgnLnVpLnNpZGViYXInKVxyXG4gICAgICAgICAgICAgICAgLnNpZGViYXIoJ3RvZ2dsZScpXHJcbiAgICAgICAgICAgIDtcclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgIH0pO1xyXG59XHJcbiIsInJlcXVpcmUuY29uZmlnKHtcclxuICAgIHBhdGhzOiB7XHJcbiAgICAgICAgXCJkM1wiOiBcImh0dHBzOi8vZDNqcy5vcmcvZDMudjMubWluXCJcclxuICAgIH1cclxufSk7XHJcblxyXG5mdW5jdGlvbiBsb2FkRDMoKXtcclxuXHJcbiAgICB3aW5kb3cuZDNPbGQgPSBkMztcclxuICAgIHJlcXVpcmUoWydkMyddLCBmdW5jdGlvbihkM1YzKSB7XHJcbiAgICAgICAgd2luZG93LmQzVjMgPSBkM1YzO1xyXG4gICAgICAgIHdpbmRvdy5kMyA9IGQzT2xkO1xyXG4gICAgICAgIC8vIHdpbmRvdy5kb2N1bWVudHMgPSBbXHJcbiAgICAgICAgLy8gICAgICAgICAvLyAgIFtcImlcIiwgXCJhbVwiLCBcImJhdG1hblwiLCBcIm9mXCIsIFwid2ludGVyZmFsbFwiXSxcclxuICAgICAgICAvLyAgICAgICAgIC8vICAgW1widGhlcmVcIiwgXCJzaG91bGRcIiwgXCJhbHdheXNcIiwgXCJiZVwiLCBcImFcIiwgXCJzdGFya1wiLCBcImluXCIsIFwid2ludGVyZmVsbFwiXSxcclxuICAgICAgICAvLyAgICAgICAgIC8vICAgW1wicHJvcGhlY3lcIiwgXCJzYXlzXCIsIFwicHJpbmNlXCIsIFwid2lsbFwiLCBcImJlXCIgLCBcInJlYm9yblwiXVxyXG4gICAgICAgIC8vICAgICAgICAgLy8gXTtcclxuICAgICAgICAvLyAgICAgd2luZG93LmRvY3VtZW50cyA9IFtbJ3Byb2plY3QnLCAnY2xhc3NpZmljYXRpb24nLCAnY29tcGFyZScsICduZXVyYWwnLCAnbmV0cycsICdTVk0nLCAnZHVlJywgJ2R1ZSddLCBbJ3R3bycsICduZXcnLCAncHJvZ3Jlc3MnLCAnY2hlY2tzJywgJ2ZpbmFsJywgJ3Byb2plY3QnLCAgJ2Fzc2lnbmVkJywgJ2ZvbGxvd3MnXSwgWydyZXBvcnQnLCAnZ3JhZGVkJywgICdjb250cmlidXRlJywgJ3BvaW50cycsICAndG90YWwnLCAnc2VtZXN0ZXInLCAnZ3JhZGUnXSwgWydwcm9ncmVzcycsICd1cGRhdGUnLCAnZXZhbHVhdGVkJywgJ1RBJywgJ3BlZXJzJ10sIFsnY2xhc3MnLCAnbWVldGluZycsICd0b21vcnJvdycsJ3RlYW1zJywgJ3dvcmsnLCAncHJvZ3Jlc3MnLCAncmVwb3J0JywgJ2ZpbmFsJywgJ3Byb2plY3QnXSwgWyAncXVpeicsICAnc2VjdGlvbnMnLCAncmVndWxhcml6YXRpb24nLCAnVHVlc2RheSddLCBbICdxdWl6JywgJ1RodXJzZGF5JywgJ2xvZ2lzdGljcycsICd3b3JrJywgJ29ubGluZScsICdzdHVkZW50JywgJ3Bvc3Rwb25lJywgICdxdWl6JywgJ1R1ZXNkYXknXSwgWydxdWl6JywgJ2NvdmVyJywgJ1RodXJzZGF5J10sIFsncXVpeicsICdjaGFwJywgJ2NoYXAnLCAnbGluZWFyJywgJ3JlZ3Jlc3Npb24nXV07XHJcblxyXG4gICAgICAgIHdpbmRvdy5kb2N1bWVudHMgPSBbXHJcbiAgICAgICAgICAgIFsnc2VyaW91cycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAndGFsaycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnZnJpZW5kcycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnZmxha3knLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ2xhdGVseScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAndW5kZXJzdG9vZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnZ29vZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnZXZlbmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnaGFuZ2luZyddLFxyXG4gICAgICAgICAgICBbJ2dvdCcsICdnaWZ0JywgJ2VsZGVyJywgJ2Jyb3RoZXInLCAncmVhbGx5JywgJ3N1cnByaXNpbmcnXSxcclxuICAgICAgICAgICAgICAgICAgICAgWydjb21wbGV0ZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJzUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ21pbGVzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICdydW4nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ3dpdGhvdXQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ2JyZWFrJyxcclxuICAgICAgICAgICAgICAgICAgICAgICdtYWtlcycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnZmVlbCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnc3Ryb25nJ10sXHJcblxyXG4gICAgICAgICAgICBbJ3NvbicsICdwZXJmb3JtZWQnLCAnd2VsbCcsICd0ZXN0JyxcclxuICAgICAgICAgICAgICAgICdwcmVwYXJhdGlvbiddXHJcbiAgICAgICAgICAgIF07XHJcblxyXG4gICAgICAgICAgICAgICAgZ2V0QW5hbHlzaXMoXCJMREFcIik7XHJcbiAgICAgICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldERvY3ModGV4dHMpIHtcclxuICByZXR1cm4gd2luZG93LmRvY3VtZW50cyA9IHRleHRzLm1hcCh4ID0+IHguc3BsaXQoKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldEFuYWx5c2lzKG1ldGhvZCwgc3VjY2VzcywgZmFpbCkge1xyXG4gIGxldCBkb2NzID0gdnVlQXBwLm5ld0RvY3M7XHJcbiAgbGV0IGZuYyA9IHggPT4geDtcclxuICBpZiAobWV0aG9kID09PSBcIkxEQVwiKSB7XHJcbiAgICBmbmMgPSBnZXRMREFDbHVzdGVycztcclxuICB9IGVsc2Uge1xyXG4gICAgZm5jID0gZ2V0V29yZDJWZWNDbHVzdGVycztcclxuICB9XHJcbiAgd2luZG93LmxvYWRERnVuYyA9ICBmbmM7XHJcbiAgZm5jKGRvY3MsIHJlc3AgPT4ge1xyXG4gICAgICB3aW5kb3cuZ2xvYmFsX2RhdGEgPSByZXNwO1xyXG4gICAgaW5pdFBhZ2UxKHJlc3ApO1xyXG4gICAgaW5pdFBhZ2UyKHJlc3ApO1xyXG4gICAgaW5pdFBhZ2UzKHJlc3ApO1xyXG4gICAgaW5pdFBhZ2U0KCk7XHJcbiAgICBpZihzdWNjZXNzKXtcclxuICAgICAgICBzdWNjZXNzKHJlc3ApO1xyXG4gICAgfVxyXG4gIH0sIGZhaWwpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBsb2FkVmlzdWFsaXphdGlvbnMoKSB7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluaXRQYWdlMShyZXNwKSB7XHJcbiAgcmVuZGVyQ2x1c3RlckFuYWx5c2lzKHJlc3ApO1xyXG59XHJcblxyXG5cclxuXHJcbmZ1bmN0aW9uIGluaXRQYWdlMihyZXNwKSB7XHJcbiAgICAkKFwiI3NwZWNpZXNjb2xsYXBzaWJsZVwiKS5odG1sKFwiXCIpO1xyXG4gIHJlbmRlckNsdXN0ZXJGb3JjZUxheW91dChyZXNwKTtcclxuXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluaXRQYWdlMyhyZXNwKXtcclxuICAgICQoXCIjcGFyYWxsZWwtY29vcmRpbmF0ZS12aXNcIikuaHRtbChcIlwiKTtcclxuICAgICQoXCIjcGMtY29udGFpbmVyXCIpLmh0bWwoXCJcIik7XHJcbiAgICBsb2FkUGFyYWxsZWxDb29yZGluYXRlKHJlc3ApO1xyXG4gICAgbG9hZFBhcmFsbGVsQ29vcmRpbmF0ZXNIQyhyZXNwKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5pdFBhZ2U0KCl7XHJcbiAgICAkKFwiI292ZXJhbGwtd2NcIikuaHRtbChcIlwiKTtcclxuICAgIGxvYWRXb3JkQ2xvdWQod2luZG93Lmdsb2JhbF9kYXRhKTtcclxufSIsIi8vdmVjdG9ycyBmb3JtYXQ6IE1hcFtzdHJpbmcodG9waWNfaWQpOiBMaXN0W2Zsb2F0XV1cclxuZnVuY3Rpb24gZ2V0MkRWZWN0b3JzKHZlY3RvcnMsIHN1Y2Nlc3NDYWxsYmFjayl7XHJcbiAgICB2YXIgcmVxdWVzdCA9ICQuYWpheCh7XHJcbiAgICAgICAgdXJsOiBcIi9nZXQyRFZlY3RvcnNcIixcclxuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICAgIGRhdGE6IHZlY3RvcnNcclxuICAgICAgfSk7XHJcbiAgICAgICBcclxuICAgICAgcmVxdWVzdC5kb25lKGZ1bmN0aW9uKCByZXNwb25zZSApIHtcclxuICAgICAgICBzdWNjZXNzQ2FsbGJhY2socmVzcG9uc2UpO1xyXG4gICAgICB9KTtcclxuICAgICAgIFxyXG4gICAgICByZXF1ZXN0LmZhaWwoZnVuY3Rpb24oIGpxWEhSLCB0ZXh0U3RhdHVzICkge1xyXG4gICAgICAgIGFsZXJ0KCBcIlJlcXVlc3QgZmFpbGVkOiBcIiArIHRleHRTdGF0dXMgKTtcclxuICAgICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFRva2VuaXplZERvY3MoZG9jcywgc3VjY2Vzc0NhbGxiYWNrLCBmYWlsdXJlQ2FsbGJhY2spe1xyXG4gICAgdmFyIHJlcXVlc3QgPSAkLmFqYXgoe1xyXG4gICAgICAgIHVybDogXCIvZ2V0RG9jc0Zyb21UZXh0c1wiLFxyXG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkoe2RvY3M6IGRvY3N9KSxcclxuICAgICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIsXHJcbiAgICAgICAgZGF0YVR5cGUgICA6IFwianNvblwiXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgcmVxdWVzdC5kb25lKGZ1bmN0aW9uKCByZXNwb25zZSApIHtcclxuICAgICAgICBzdWNjZXNzQ2FsbGJhY2socmVzcG9uc2UuZG9jcyk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgcmVxdWVzdC5mYWlsKGZ1bmN0aW9uKCBqcVhIUiwgdGV4dFN0YXR1cyApIHtcclxuICAgICAgICBpZihmYWlsdXJlQ2FsbGJhY2spXHJcbiAgICAgICAgICAgIGZhaWx1cmVDYWxsYmFjayh0ZXh0U3RhdHVzKTtcclxuICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgICAgYWxlcnQoIFwiUmVxdWVzdCBmYWlsZWQ6IFwiICsgdGV4dFN0YXR1cyApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICB9KTtcclxufVxyXG5cclxuLy8gZG9jcyBmb3JtYXQ6IExpc3RbTGlzdFtzdHJpbmcod29yZCldXVxyXG5mdW5jdGlvbiBnZXRXb3JkMlZlY0NsdXN0ZXJzKGRvY3MsIHN1Y2Nlc3NDYWxsYmFjaywgZmFpbHVyZUNhbGxiYWNrKXtcclxuICAgIHZhciByZXF1ZXN0ID0gJC5hamF4KHtcclxuICAgICAgICB1cmw6IFwiL2FwaS9nZXRDbHVzdGVyc1dvcmQyVmVjXCIsXHJcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSh7ZG9jczogZG9jcywgc3RhcnQ6IHdpbmRvdy52dWVBcHAuc2V0dGluZ3Muc3RhcnQyLCBlbmQ6IHdpbmRvdy52dWVBcHAuc2V0dGluZ3MuZW5kMiwgc2VsZWN0ZWQ6IHdpbmRvdy52dWVBcHAuc2V0dGluZ3Muc2VsZWN0ZWREYXRhc2V0fSksXHJcbiAgICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiLFxyXG4gICAgICAgIGRhdGFUeXBlICAgOiBcImpzb25cIlxyXG4gICAgICB9KTtcclxuICAgICAgIFxyXG4gICAgICByZXF1ZXN0LmRvbmUoZnVuY3Rpb24oIHJlc3BvbnNlICkge1xyXG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhKU09OLnBhcnNlKHJlc3BvbnNlKSk7XHJcbiAgICAgIH0pO1xyXG4gICAgICAgXHJcbiAgICAgIHJlcXVlc3QuZmFpbChmdW5jdGlvbigganFYSFIsIHRleHRTdGF0dXMgKSB7XHJcbiAgICAgICAgICBpZihmYWlsdXJlQ2FsbGJhY2spXHJcbiAgICAgICAgICAgIGZhaWx1cmVDYWxsYmFjayh0ZXh0U3RhdHVzKTtcclxuICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgICAgYWxlcnQoIFwiUmVxdWVzdCBmYWlsZWQ6IFwiICsgdGV4dFN0YXR1cyApO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldExEQUNsdXN0ZXJzKGRvY3MsIHN1Y2Nlc3NDYWxsYmFjaywgZmFpbHVyZUNhbGxiYWNrKXtcclxuICAgIHZhciByZXF1ZXN0ID0gJC5hamF4KHtcclxuICAgICAgICB1cmw6IFwiL2FwaS9nZXRMREFEYXRhXCIsXHJcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSh7ZG9jczogZG9jcywgc3RhcnQ6IHdpbmRvdy52dWVBcHAuc2V0dGluZ3Muc3RhcnQxLCBlbmQ6IHdpbmRvdy52dWVBcHAuc2V0dGluZ3MuZW5kMSwgc2VsZWN0ZWQ6IHdpbmRvdy52dWVBcHAuc2V0dGluZ3Muc2VsZWN0ZWREYXRhc2V0fSksXHJcbiAgICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiLFxyXG4gICAgICAgIGRhdGFUeXBlICAgOiBcImpzb25cIlxyXG4gICAgICB9KTtcclxuICAgICAgIFxyXG4gICAgICByZXF1ZXN0LmRvbmUoZnVuY3Rpb24oIHJlc3BvbnNlICkge1xyXG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhyZXNwb25zZSk7XHJcbiAgICAgIH0pO1xyXG4gICAgICAgXHJcbiAgICAgIHJlcXVlc3QuZmFpbChmdW5jdGlvbigganFYSFIsIHRleHRTdGF0dXMgKSB7XHJcbiAgICAgICAgaWYoZmFpbHVyZUNhbGxiYWNrKVxyXG4gICAgICAgICAgICBmYWlsdXJlQ2FsbGJhY2sodGV4dFN0YXR1cyk7XHJcbiAgICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICAgIGFsZXJ0KCBcIlJlcXVlc3QgZmFpbGVkOiBcIiArIHRleHRTdGF0dXMgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgfSk7XHJcbn1cclxuIiwiZnVuY3Rpb24gbG9hZFBhcmFsbGVsQ29vcmRpbmF0ZXNIQyhyZXNwKXtcclxuXHJcblxyXG4gICAgICAgIGxldCBkYXRhID0gZ2VuZXJhdGVQYXJhbGxlbENvb3JkaW5hdGVEYXRhSEMocmVzcCwgd2luZG93LnZ1ZUFwcC5wYXJhbXMudG9waWNUaHJlc2hvbGQsIHdpbmRvdy52dWVBcHAucGFyYW1zLndvcmRUaHJlc2hvbGQpO1xyXG4gICAgICAgIEhpZ2hjaGFydHMuY2hhcnQoJ3BjLWNvbnRhaW5lcicsIHtcclxuICAgICAgICAgICAgY2hhcnQ6IHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdzcGxpbmUnLFxyXG4gICAgICAgICAgICAgICAgcGFyYWxsZWxDb29yZGluYXRlczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHBhcmFsbGVsQXhlczoge1xyXG4gICAgICAgICAgICAgICAgICAgIGxpbmVXaWR0aDogMlxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB0aXRsZToge1xyXG4gICAgICAgICAgICAgICAgdGV4dDogJ0RvY3VtZW50IC0gVG9waWMgLSBXb3JkIFJlbGF0aW9uc2hpcCdcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcGxvdE9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIHNlcmllczoge1xyXG4gICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbjogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgbWFya2VyOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZWQ6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhvdmVyOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhvdmVyOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYWxvOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZTogMFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBldmVudHM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW91c2VPdmVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdyb3VwLnRvRnJvbnQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLy8gdG9vbHRpcDoge1xyXG4gICAgICAgICAgICAvLyAgICAgcG9pbnRGb3JtYXQ6ICc8c3BhbiBzdHlsZT1cImNvbG9yOntwb2ludC5jb2xvcn1cIj5cXHUyNUNGPC9zcGFuPicgK1xyXG4gICAgICAgICAgICAvLyAgICAgICAgICd7c2VyaWVzLm5hbWV9OiA8Yj57cG9pbnQuZm9ybWF0dGVkVmFsdWV9PC9iPjxici8+J1xyXG4gICAgICAgICAgICAvLyB9LFxyXG4gICAgICAgICAgICB4QXhpczoge1xyXG4gICAgICAgICAgICAgICAgY2F0ZWdvcmllczogW1xyXG4gICAgICAgICAgICAgICAgICAgICdEb2N1bWVudCcsXHJcbiAgICAgICAgICAgICAgICAgICAgJ1RvcGljJyxcclxuICAgICAgICAgICAgICAgICAgICAnV29yZCdcclxuICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICBvZmZzZXQ6IDEwXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHlBeGlzOiBbe1xyXG4gICAgICAgICAgICAgICAgY2F0ZWdvcmllczogT2JqZWN0LmtleXMocmVzcFtcImRvY3VtZW50X3RvcGljXCJdKS5tYXAoeD0+IFwiLi4uLi4uLi4uLi4uLi4uLkRvY3VtZW50IFwiK3gpXHJcbiAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgIGNhdGVnb3JpZXM6IHJlc3BbXCJ0b3BpY3NcIl0ubWFwKHg9PiBcIi4uLi4uLi4uLi4uLi4uLi5Ub3BpYyBcIit4KVxyXG4gICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICBjYXRlZ29yaWVzOiBPYmplY3QudmFsdWVzKHJlc3BbXCJ3b3Jkc1wiXSkubWFwKHg9PiBcIi4uLi4uLi4uLi4uLi4uLi5cIit4KVxyXG4gICAgICAgICAgICB9XSxcclxuICAgICAgICAgICAgY29sb3JzOiBbJ3JnYmEoMTEsIDIwMCwgMjAwLCAwLjEpJ10sXHJcbiAgICAgICAgICAgIHNlcmllczogZGF0YS5tYXAoZnVuY3Rpb24gKHNldCwgaSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnJyxcclxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBzZXQsXHJcbiAgICAgICAgICAgICAgICAgICAgc2hhZG93OiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9KTtcclxuXHJcbn1cclxuXHJcblxyXG4iLCJmdW5jdGlvbiBsb2FkUGFyYWxsZWxDb29yZGluYXRlKHJlc3Ape1xyXG4gICAgdmFyIG1hcmdpbiA9IHt0b3A6IDMwLCByaWdodDogMTAsIGJvdHRvbTogMTAsIGxlZnQ6IDEwfSxcclxuICAgICAgICB3aWR0aCA9IDk2MCAtIG1hcmdpbi5sZWZ0IC0gbWFyZ2luLnJpZ2h0LFxyXG4gICAgICAgIGhlaWdodCA9IDUwMCAtIG1hcmdpbi50b3AgLSBtYXJnaW4uYm90dG9tO1xyXG5cclxuICAgIHZhciB4ID0gZDNWMy5zY2FsZS5vcmRpbmFsKCkucmFuZ2VQb2ludHMoWzAsIHdpZHRoXSwgMSksXHJcbiAgICAgICAgeSA9IHt9LFxyXG4gICAgICAgIGRyYWdnaW5nID0ge307XHJcblxyXG4gICAgdmFyIGxpbmUgPSBkM1YzLnN2Zy5saW5lKCksXHJcbiAgICAgICAgYmFja2dyb3VuZCxcclxuICAgICAgICBmb3JlZ3JvdW5kO1xyXG5cclxuICAgIHZhciBzdmcgPSBkM1YzLnNlbGVjdChcIiNwYXJhbGxlbC1jb29yZGluYXRlLXZpc1wiKS5hcHBlbmQoXCJzdmdcIilcclxuICAgICAgICAuYXR0cihcIndpZHRoXCIsIHdpZHRoICsgbWFyZ2luLmxlZnQgKyBtYXJnaW4ucmlnaHQpXHJcbiAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0ICsgbWFyZ2luLnRvcCArIG1hcmdpbi5ib3R0b20pXHJcbiAgICAuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgbWFyZ2luLmxlZnQgKyBcIixcIiArIG1hcmdpbi50b3AgKyBcIilcIiksIGRpbWVuc2lvbnM7XHJcblxyXG5cclxuICAgIC8vIEV4dHJhY3QgdGhlIGxpc3Qgb2YgZGltZW5zaW9ucyBhbmQgY3JlYXRlIGEgc2NhbGUgZm9yIGVhY2guXHJcbiAgICB2YXIgY2FycyA9IGdlbmVyYXRlUGFyYWxsZWxDb29yZGluYXRlRGF0YShyZXNwLCB3aW5kb3cudnVlQXBwLnBhcmFtcy50b3BpY1RocmVzaG9sZCwgd2luZG93LnZ1ZUFwcC5wYXJhbXMud29yZFRocmVzaG9sZCk7XHJcbiAgICAvLyB2YXIgYXhpc0QgPSBkM1YzLnN2Zy5heGlzKCkub3JpZW50KFwibGVmdFwiKS50aWNrcyhPYmplY3Qua2V5cyhyZXNwW1wiZG9jdW1lbnRfdG9waWNcIl0pLmxlbmd0aCksXHJcbiAgICB2YXIgYXhpc0QgPSBkM1YzLnN2Zy5heGlzKCkub3JpZW50KFwibGVmdFwiKS50aWNrVmFsdWVzKE9iamVjdC5rZXlzKHJlc3BbXCJkb2N1bWVudF90b3BpY1wiXSkubWFwKHggPT4gcGFyc2VJbnQoeCkpKSxcclxuICAgICAgICBheGlzVCA9IGQzVjMuc3ZnLmF4aXMoKS5vcmllbnQoXCJsZWZ0XCIpLnRpY2tWYWx1ZXMocmVzcFtcInRvcGljc1wiXS5tYXAoeCA9PiBwYXJzZUludCh4KSkpLFxyXG4gICAgICAgIGF4aXNXID0gZDNWMy5zdmcuYXhpcygpLm9yaWVudChcImxlZnRcIikudGlja1ZhbHVlcyhPYmplY3QudmFsdWVzKHJlc3BbXCJvdmVyYWxsX3dvcmRcIl0pLm1hcCh4ID0+IHBhcnNlRmxvYXQoeCkpKTtcclxuXHJcbiAgICB4LmRvbWFpbihkaW1lbnNpb25zID0gZDNWMy5rZXlzKGNhcnNbMF0pLmZpbHRlcihmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgcmV0dXJuIGQgIT0gXCJuYW1lXCIgJiYgKHlbZF0gPSBkM1YzLnNjYWxlLmxpbmVhcigpXHJcbiAgICAgICAgICAgIC5kb21haW4oZDNWMy5leHRlbnQoY2FycywgZnVuY3Rpb24ocCkgeyByZXR1cm4gK3BbZF07IH0pKVxyXG4gICAgICAgICAgICAucmFuZ2UoW2hlaWdodCwgMF0pKTtcclxuICAgIH0pKTtcclxuXHJcbiAgICAvLyBBZGQgZ3JleSBiYWNrZ3JvdW5kIGxpbmVzIGZvciBjb250ZXh0LlxyXG4gICAgYmFja2dyb3VuZCA9IHN2Zy5hcHBlbmQoXCJnXCIpXHJcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImJhY2tncm91bmRcIilcclxuICAgICAgICAuc2VsZWN0QWxsKFwicGF0aFwiKVxyXG4gICAgICAgIC5kYXRhKGNhcnMpXHJcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwicGF0aFwiKVxyXG4gICAgICAgIC5hdHRyKFwiZFwiLCBwYXRoKTtcclxuXHJcbiAgICAvLyBBZGQgYmx1ZSBmb3JlZ3JvdW5kIGxpbmVzIGZvciBmb2N1cy5cclxuICAgIGZvcmVncm91bmQgPSBzdmcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJmb3JlZ3JvdW5kXCIpXHJcbiAgICAgICAgLnNlbGVjdEFsbChcInBhdGhcIilcclxuICAgICAgICAuZGF0YShjYXJzKVxyXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZChcInBhdGhcIilcclxuICAgICAgICAuYXR0cihcImRcIiwgcGF0aCk7XHJcblxyXG4gICAgLy8gQWRkIGEgZ3JvdXAgZWxlbWVudCBmb3IgZWFjaCBkaW1lbnNpb24uXHJcbiAgICB2YXIgZyA9IHN2Zy5zZWxlY3RBbGwoXCIuZGltZW5zaW9uXCIpXHJcbiAgICAgICAgLmRhdGEoZGltZW5zaW9ucylcclxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJnXCIpXHJcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImRpbWVuc2lvblwiKVxyXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIFwidHJhbnNsYXRlKFwiICsgeChkKSArIFwiKVwiOyB9KVxyXG4gICAgICAgIC5jYWxsKGQzVjMuYmVoYXZpb3IuZHJhZygpXHJcbiAgICAgICAgICAgIC5vcmlnaW4oZnVuY3Rpb24oZCkgeyByZXR1cm4ge3g6IHgoZCl9OyB9KVxyXG4gICAgICAgICAgICAub24oXCJkcmFnc3RhcnRcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICBkcmFnZ2luZ1tkXSA9IHgoZCk7XHJcbiAgICAgICAgICAgIGJhY2tncm91bmQuYXR0cihcInZpc2liaWxpdHlcIiwgXCJoaWRkZW5cIik7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5vbihcImRyYWdcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICBkcmFnZ2luZ1tkXSA9IE1hdGgubWluKHdpZHRoLCBNYXRoLm1heCgwLCBkM1YzLmV2ZW50LngpKTtcclxuICAgICAgICAgICAgZm9yZWdyb3VuZC5hdHRyKFwiZFwiLCBwYXRoKTtcclxuICAgICAgICAgICAgZGltZW5zaW9ucy5zb3J0KGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIHBvc2l0aW9uKGEpIC0gcG9zaXRpb24oYik7IH0pO1xyXG4gICAgICAgICAgICB4LmRvbWFpbihkaW1lbnNpb25zKTtcclxuICAgICAgICAgICAgZy5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIFwidHJhbnNsYXRlKFwiICsgcG9zaXRpb24oZCkgKyBcIilcIjsgfSlcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLm9uKFwiZHJhZ2VuZFwiLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBkcmFnZ2luZ1tkXTtcclxuICAgICAgICAgICAgdHJhbnNpdGlvbihkM1YzLnNlbGVjdCh0aGlzKSkuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIHgoZCkgKyBcIilcIik7XHJcbiAgICAgICAgICAgIHRyYW5zaXRpb24oZm9yZWdyb3VuZCkuYXR0cihcImRcIiwgcGF0aCk7XHJcbiAgICAgICAgICAgIGJhY2tncm91bmRcclxuICAgICAgICAgICAgICAgIC5hdHRyKFwiZFwiLCBwYXRoKVxyXG4gICAgICAgICAgICAgICAgLnRyYW5zaXRpb24oKVxyXG4gICAgICAgICAgICAgICAgLmRlbGF5KDUwMClcclxuICAgICAgICAgICAgICAgIC5kdXJhdGlvbigwKVxyXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJ2aXNpYmlsaXR5XCIsIG51bGwpO1xyXG4gICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgLy8gQWRkIGFuIGF4aXMgYW5kIHRpdGxlLlxyXG4gICAgZy5hcHBlbmQoXCJnXCIpXHJcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImF4aXNcIilcclxuICAgICAgICAuZWFjaChmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgIGxldCBheGlzID0gbnVsbDtcclxuICAgICAgICAgICAgaWYoZCA9PSBcImRvY3VtZW50XCIpe1xyXG4gICAgICAgICAgICAgICAgYXhpcyA9IGF4aXNEO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYoZCA9PSBcInRvcGljXCIpe1xyXG4gICAgICAgICAgICAgICAgYXhpcyA9IGF4aXNUO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgYXhpcyA9IGF4aXNXO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGQzVjMuc2VsZWN0KHRoaXMpLmNhbGwoXHJcbiAgICAgICAgICAgICAgICBheGlzLnNjYWxlKHlbZF0pXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXHJcbiAgICAgICAgLmF0dHIoXCJ5XCIsIC05KVxyXG4gICAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGQ7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgLy8gQWRkIGFuZCBzdG9yZSBhIGJydXNoIGZvciBlYWNoIGF4aXMuXHJcbiAgICBnLmFwcGVuZChcImdcIilcclxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiYnJ1c2hcIilcclxuICAgICAgICAuZWFjaChmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgIGQzVjMuc2VsZWN0KHRoaXMpLmNhbGwoeVtkXS5icnVzaCA9IGQzVjMuc3ZnLmJydXNoKCkueSh5W2RdKS5vbihcImJydXNoc3RhcnRcIiwgYnJ1c2hzdGFydCkub24oXCJicnVzaFwiLCBicnVzaCkpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnNlbGVjdEFsbChcInJlY3RcIilcclxuICAgICAgICAuYXR0cihcInhcIiwgLTgpXHJcbiAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCAxNik7XHJcblxyXG5cclxuICAgIGZ1bmN0aW9uIHBvc2l0aW9uKGQpIHtcclxuICAgIHZhciB2ID0gZHJhZ2dpbmdbZF07XHJcbiAgICByZXR1cm4gdiA9PSBudWxsID8geChkKSA6IHY7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gdHJhbnNpdGlvbihnKSB7XHJcbiAgICByZXR1cm4gZy50cmFuc2l0aW9uKCkuZHVyYXRpb24oNTAwKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBSZXR1cm5zIHRoZSBwYXRoIGZvciBhIGdpdmVuIGRhdGEgcG9pbnQuXHJcbiAgICBmdW5jdGlvbiBwYXRoKGQpIHtcclxuICAgIHJldHVybiBsaW5lKGRpbWVuc2lvbnMubWFwKGZ1bmN0aW9uKHApIHsgcmV0dXJuIFtwb3NpdGlvbihwKSwgeVtwXShkW3BdKV07IH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBicnVzaHN0YXJ0KCkge1xyXG4gICAgZDNWMy5ldmVudC5zb3VyY2VFdmVudC5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBIYW5kbGVzIGEgYnJ1c2ggZXZlbnQsIHRvZ2dsaW5nIHRoZSBkaXNwbGF5IG9mIGZvcmVncm91bmQgbGluZXMuXHJcbiAgICBmdW5jdGlvbiBicnVzaCgpIHtcclxuICAgIHZhciBhY3RpdmVzID0gZGltZW5zaW9ucy5maWx0ZXIoZnVuY3Rpb24ocCkgeyByZXR1cm4gIXlbcF0uYnJ1c2guZW1wdHkoKTsgfSksXHJcbiAgICAgICAgZXh0ZW50cyA9IGFjdGl2ZXMubWFwKGZ1bmN0aW9uKHApIHsgcmV0dXJuIHlbcF0uYnJ1c2guZXh0ZW50KCk7IH0pO1xyXG4gICAgZm9yZWdyb3VuZC5zdHlsZShcImRpc3BsYXlcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgIHJldHVybiBhY3RpdmVzLmV2ZXJ5KGZ1bmN0aW9uKHAsIGkpIHtcclxuICAgICAgICByZXR1cm4gZXh0ZW50c1tpXVswXSA8PSBkW3BdICYmIGRbcF0gPD0gZXh0ZW50c1tpXVsxXTtcclxuICAgICAgICB9KSA/IG51bGwgOiBcIm5vbmVcIjtcclxuICAgIH0pO1xyXG4gICAgfVxyXG5cclxufSIsImZ1bmN0aW9uIHJlbmRlckNsdXN0ZXJBbmFseXNpcyhyZXNwKSB7XHJcbiAgZDMuc2VsZWN0KFwiLmNoYXJ0MTJcIikucmVtb3ZlKCk7XHJcbiAgdmFyIGRvY3VtZW50X3RvcGljID0gcmVzcFtcImRvY3VtZW50X3RvcGljXCJdWzBdO1xyXG4gIHZhciB0b3BpY192ZWN0b3JzID0gcmVzcFtcInRvcGljX3ZlY3RvcnNcIl07XHJcbiAgdmFyIGJiID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2NsdXN0ZXInKVxyXG4gICAgLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLFxyXG4gICAgd2lkdGggPSA0MDA7XHJcbiAgdmFyIGhlaWdodCA9IDQwMDtcclxuICB2YXIgbWFyZ2luID0gODA7XHJcbiAgdmFyIGRhdGEgPSBbXTtcclxuXHJcbiAgT2JqZWN0LmtleXModG9waWNfdmVjdG9ycykuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcclxuICAgIHZhciB2YWx1ZSA9IHRvcGljX3ZlY3RvcnNba2V5XTtcclxuICAgIGRhdGEucHVzaCh7XHJcbiAgICAgIHg6IHZhbHVlWzBdLFxyXG4gICAgICB5OiB2YWx1ZVsxXSxcclxuICAgICAgYzogMSxcclxuICAgICAgc2l6ZTogZG9jdW1lbnRfdG9waWNba2V5XSxcclxuICAgICAga2V5OiBrZXlcclxuICAgIH0pO1xyXG4gIH0pO1xyXG4gIHZhciBsYWJlbFggPSAnWCc7XHJcbiAgdmFyIGxhYmVsWSA9ICdZJztcclxuXHJcbiAgdmFyIHN2ZyA9IGQzLnNlbGVjdCgnI2NsdXN0ZXInKVxyXG4gICAgLmFwcGVuZCgnc3ZnJylcclxuICAgIC5hdHRyKCdjbGFzcycsICdjaGFydDEyJylcclxuICAgIC5hdHRyKCdpZCcsJ2NsdXN0ZXJfaWQnKVxyXG4gICAgLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aCArIG1hcmdpbiArIG1hcmdpbilcclxuICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodCArIG1hcmdpbiArIG1hcmdpbilcclxuICAgIC5hcHBlbmQoXCJnXCIpXHJcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIG1hcmdpbiArIFwiLFwiICsgbWFyZ2luICsgXCIpXCIpO1xyXG5cclxuICB2YXIgeCA9IGQzLnNjYWxlTGluZWFyKClcclxuICAgIC5kb21haW4oW2QzLm1pbihkYXRhLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gZC54O1xyXG4gICAgfSksIGQzLm1heChkYXRhLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gZC54O1xyXG4gICAgfSldKVxyXG4gICAgLnJhbmdlKFswLCB3aWR0aF0pO1xyXG5cclxuICB2YXIgeSA9IGQzLnNjYWxlTGluZWFyKClcclxuICAgIC5kb21haW4oW2QzLm1pbihkYXRhLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gZC55O1xyXG4gICAgfSksIGQzLm1heChkYXRhLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gZC55O1xyXG4gICAgfSldKVxyXG4gICAgLnJhbmdlKFtoZWlnaHQsIDBdKTtcclxuXHJcbiAgdmFyIHNjYWxlID0gZDMuc2NhbGVTcXJ0KClcclxuICAgIC5kb21haW4oW2QzLm1pbihkYXRhLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gZC5zaXplO1xyXG4gICAgfSksIGQzLm1heChkYXRhLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gZC5zaXplO1xyXG4gICAgfSldKVxyXG4gICAgLnJhbmdlKFsxMCwgMjBdKTtcclxuXHJcbiAgdmFyIG9wYWNpdHkgPSBkMy5zY2FsZVNxcnQoKVxyXG4gICAgLmRvbWFpbihbZDMubWluKGRhdGEsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiBkLnNpemU7XHJcbiAgICB9KSwgZDMubWF4KGRhdGEsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiBkLnNpemU7XHJcbiAgICB9KV0pXHJcbiAgICAucmFuZ2UoWzEsIC41XSk7XHJcblxyXG5cclxuICB2YXIgeEF4aXMgPSBkMy5heGlzQm90dG9tKCkuc2NhbGUoeCk7XHJcbiAgdmFyIHlBeGlzID0gZDMuYXhpc0xlZnQoKS5zY2FsZSh5KTtcclxuXHJcblxyXG4gIHN2Zy5hcHBlbmQoXCJnXCIpXHJcbiAgICAuYXR0cihcImNsYXNzXCIsIFwieSBheGlzXCIpXHJcbiAgICAuY2FsbCh5QXhpcylcclxuICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXHJcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInJvdGF0ZSgtOTApXCIpXHJcbiAgICAuYXR0cihcInhcIiwgMjApXHJcbiAgICAuYXR0cihcInlcIiwgLW1hcmdpbilcclxuICAgIC5hdHRyKFwiZHlcIiwgXCIuNzFlbVwiKVxyXG4gICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcclxuICAgIC50ZXh0KGxhYmVsWSk7XHJcbiAgLy8geCBheGlzIGFuZCBsYWJlbFxyXG4gIHN2Zy5hcHBlbmQoXCJnXCIpXHJcbiAgICAuYXR0cihcImNsYXNzXCIsIFwieCBheGlzXCIpXHJcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgwLFwiICsgaGVpZ2h0ICsgXCIpXCIpXHJcbiAgICAuY2FsbCh4QXhpcylcclxuICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXHJcbiAgICAuYXR0cihcInhcIiwgd2lkdGggKyAyMClcclxuICAgIC5hdHRyKFwieVwiLCBtYXJnaW4gLSAxMClcclxuICAgIC5hdHRyKFwiZHlcIiwgXCIuNzFlbVwiKVxyXG4gICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcclxuICAgIC50ZXh0KGxhYmVsWCk7XHJcblxyXG4gIHN2Zy5zZWxlY3RBbGwoXCJjaXJjbGVcIilcclxuICAgIC5kYXRhKGRhdGEpXHJcbiAgICAuZW50ZXIoKVxyXG4gICAgLmFwcGVuZChcImdcIilcclxuICAgIC5pbnNlcnQoXCJjaXJjbGVcIilcclxuICAgIC5hdHRyKFwiY3hcIiwgd2lkdGggLyAyKVxyXG4gICAgLmF0dHIoXCJjeVwiLCBoZWlnaHQgLyAyKVxyXG4gICAgLmF0dHIoXCJyXCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiBzY2FsZShkLnNpemUpO1xyXG4gICAgfSlcclxuICAgIC5hdHRyKFwiaWRcIixmdW5jdGlvbihkKSB7XHJcbiAgICAgIHJldHVybiBkLmtleVxyXG4gICAgfSlcclxuICAgIC5zdHlsZShcImZpbGxcIiwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIFwiI0QwRTNGMFwiO1xyXG4gICAgfSlcclxuICAgIC5vbignbW91c2VvdmVyJywgZnVuY3Rpb24gKGQsIGkpIHtcclxuICAgICAgcmVuZGVyQmFyR3JhcGgoZFtcImtleVwiXSwgcmVzcCk7XHJcbiAgICAgIGZhZGUoZFtcImtleVwiXSwgMSk7XHJcbiAgICB9KVxyXG4gICAgLm9uKCdtb3VzZW91dCcsIGZ1bmN0aW9uIChkLCBpKSB7XHJcbiAgICAgIGZhZGVPdXQoKTtcclxuICAgIH0pXHJcbiAgICAudHJhbnNpdGlvbigpXHJcbiAgICAuZGVsYXkoZnVuY3Rpb24gKGQsIGkpIHtcclxuICAgICAgcmV0dXJuIHgoZC54KSAtIHkoZC55KTtcclxuICAgIH0pXHJcbiAgICAuZHVyYXRpb24oNTAwKVxyXG4gICAgLmF0dHIoXCJjeFwiLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4geChkLngpO1xyXG4gICAgfSlcclxuICAgIC5hdHRyKFwiY3lcIiwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIHkoZC55KTtcclxuICAgIH0pO1xyXG5cclxuICAgICAgLy8gdGV4dCBsYWJlbCBmb3IgdGhlIHggYXhpc1xyXG4gIHN2Zy5hcHBlbmQoXCJ0ZXh0XCIpXHJcbiAgICAuYXR0cihcImNsYXNzXCIsIFwieCBsYWJlbFwiKVxyXG4gICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcImVuZFwiKVxyXG4gICAgLmF0dHIoXCJ4XCIsIHdpZHRoKVxyXG4gICAgLmF0dHIoXCJ5XCIsIGhlaWdodCArNDApXHJcbiAgICAudGV4dChcIlBDMVwiKTtcclxuXHJcblxyXG4gIHN2Zy5hcHBlbmQoXCJ0ZXh0XCIpXHJcbiAgICAuYXR0cihcImNsYXNzXCIsIFwieSBsYWJlbFwiKVxyXG4gICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcImVuZFwiKVxyXG4gICAgLmF0dHIoXCJ5XCIsIC01MClcclxuICAgIC5hdHRyKFwiZHlcIiwgXCIuNzVlbVwiKVxyXG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJyb3RhdGUoLTkwKVwiKVxyXG4gICAgLnRleHQoXCJQQzJcIik7XHJcblxyXG5cclxuICBmdW5jdGlvbiBmYWRlKGtleSwgb3BhY2l0eSkge1xyXG4gICAgc3ZnLnNlbGVjdEFsbChcImNpcmNsZVwiKVxyXG4gICAgICAuZmlsdGVyKGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIGQua2V5ID09IGtleTtcclxuICAgICAgfSkuXHJcbiAgICAgIHN0eWxlKFwiZmlsbFwiLCBcIiNDODQyM0VcIilcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGZhZGVPdXQoKSB7XHJcbiAgICBzdmcuc2VsZWN0QWxsKFwiY2lyY2xlXCIpXHJcbiAgICAgIC50cmFuc2l0aW9uKClcclxuICAgICAgLnN0eWxlKFwiZmlsbFwiLFwiI0QwRTNGMFwiKTtcclxuICB9XHJcbn0iLCJmdW5jdGlvbiByZW5kZXJCYXJHcmFwaCh0b3BpY19udW1iZXIsIHJlc3ApIHtcclxuICBkMy5zZWxlY3QoXCIjc3RhY2stYmFyXCIpLnJlbW92ZSgpO1xyXG4gIGQzLnNlbGVjdChcIiNsZWdlbmRzdmdcIikucmVtb3ZlKCk7XHJcbiAgdmFyIGZpbmFsX2RhdGEgPSBbXTtcclxuICB2YXIgZGF0YVZhbCA9cmVzcFtcInRvcGljX3dvcmRcIl1bdG9waWNfbnVtYmVyXTtcclxuICBmb3IgKHZhciBrZXkgaW4gZGF0YVZhbCkge1xyXG4gICAgaWYgKGRhdGFWYWwuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG4gICAgICAgIHZhciB0ZW1wID17fTtcclxuICAgICAgICB0ZW1wLlN0YXRlID0ga2V5O1xyXG4gICAgICAgIHRlbXAudG9waWNfZnJlcXVlbmN5ID0gTWF0aC5hYnMoZGF0YVZhbFtrZXldKTtcclxuICAgICAgICB0ZW1wLm92ZXJhbGwgPSBNYXRoLmFicyhyZXNwW1wib3ZlcmFsbF93b3JkXCJdW2tleV0pO1xyXG4gICAgICAgIHRlbXAudG90YWwgPSB0ZW1wLnRvcGljX2ZyZXF1ZW5jeSArIHRlbXAub3ZlcmFsbDtcclxuICAgICAgICBmaW5hbF9kYXRhLnB1c2godGVtcCk7XHJcbiAgICAgICAgY29uc29sZS5sb2coa2V5ICsgXCItPlwiICsgcmVzcFtcIm92ZXJhbGxfd29yZFwiXVtrZXldKTtcclxuICAgIH1cclxuICAgIFxyXG4gIH1cclxuICBcclxuICB2YXIgYmIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc3RhY2tlZC1iYXInKVxyXG4gICAgLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLFxyXG4gICAgd2lkdGggPSA0MDA7XHJcblxyXG4gIHZhciBkYXRhID0gZmluYWxfZGF0YTtcclxuICB2YXIgaGVpZ2h0ID0gZGF0YS5sZW5ndGggKiAyNSArMTAwO1xyXG4gIHZhciBzdmcgPSBkMy5zZWxlY3QoXCIjc3RhY2tlZC1iYXJcIikuYXBwZW5kKFwic3ZnXCIpLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aCkuYXR0cihcImhlaWdodFwiLCBoZWlnaHQpLmF0dHIoXCJpZFwiLFwic3RhY2stYmFyXCIpLFxyXG4gICAgbWFyZ2luID0ge1xyXG4gICAgICB0b3A6IDIwLFxyXG4gICAgICByaWdodDogMCxcclxuICAgICAgYm90dG9tOiA1MCxcclxuICAgICAgbGVmdDogODBcclxuICAgIH0sXHJcbiAgICB3aWR0aCA9ICtzdmcuYXR0cihcIndpZHRoXCIpIC0gbWFyZ2luLmxlZnQgLSBtYXJnaW4ucmlnaHQsXHJcbiAgICBoZWlnaHQgPSArc3ZnLmF0dHIoXCJoZWlnaHRcIikgLSBtYXJnaW4udG9wIC0gbWFyZ2luLmJvdHRvbSxcclxuICAgIGcgPSBzdmcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgbWFyZ2luLmxlZnQgKyBcIixcIiArIG1hcmdpbi50b3AgKyBcIilcIik7XHJcbiAgdmFyIHkgPSBkMy5zY2FsZUJhbmQoKSAvLyB4ID0gZDMuc2NhbGVCYW5kKCkgIFxyXG4gICAgLnJhbmdlUm91bmQoWzAsIGhlaWdodF0pIC8vIC5yYW5nZVJvdW5kKFswLCB3aWR0aF0pXHJcbiAgICAucGFkZGluZ0lubmVyKDAuMjUpLmFsaWduKDAuMSk7XHJcbiAgdmFyIHggPSBkMy5zY2FsZUxpbmVhcigpIC8vIHkgPSBkMy5zY2FsZUxpbmVhcigpXHJcbiAgICAucmFuZ2VSb3VuZChbMCwgd2lkdGhdKTsgLy8gLnJhbmdlUm91bmQoW2hlaWdodCwgMF0pO1xyXG5cclxuICB2YXIgeiA9IGQzLnNjYWxlT3JkaW5hbCgpLnJhbmdlKFtcIiNDODQyM0VcIiwgXCIjQTFDN0UwXCJdKTtcclxuICB2YXIga2V5cyA9IFtcInRvcGljX2ZyZXF1ZW5jeVwiLCBcIm92ZXJhbGxcIl07XHJcbiAgZGF0YS5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XHJcbiAgICByZXR1cm4gYi50b3RhbCAtIGEudG90YWw7XHJcbiAgfSk7XHJcbiAgeS5kb21haW4oZGF0YS5tYXAoZnVuY3Rpb24gKGQpIHtcclxuICAgIHJldHVybiBkLlN0YXRlO1xyXG4gIH0pKTsgLy8geC5kb21haW4uLi5cclxuXHJcbiAgeC5kb21haW4oWzAsIGQzLm1heChkYXRhLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgcmV0dXJuIGQudG90YWw7XHJcbiAgfSldKS5uaWNlKCk7IC8vIHkuZG9tYWluLi4uXHJcblxyXG4gIHouZG9tYWluKGtleXMpO1xyXG4gIGcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgLnNlbGVjdEFsbChcImdcIilcclxuICAgIC5kYXRhKGQzLnN0YWNrKCkua2V5cyhrZXlzKShkYXRhKSlcclxuICAgIC5lbnRlcigpLmFwcGVuZChcImdcIilcclxuICAgICAgLmF0dHIoXCJmaWxsXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHooZC5rZXkpOyB9KVxyXG4gICAgLnNlbGVjdEFsbChcInJlY3RcIilcclxuICAgIC5kYXRhKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQ7IH0pXHJcbiAgICAuZW50ZXIoKS5hcHBlbmQoXCJyZWN0XCIpXHJcbiAgICAgIC5hdHRyKFwieVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiB5KGQuZGF0YS5TdGF0ZSk7IH0pICAgICAvLy5hdHRyKFwieFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiB4KGQuZGF0YS5TdGF0ZSk7IH0pXHJcbiAgICAgIC5hdHRyKFwieFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiB4KGRbMF0pOyB9KSAgICAgICAgIC8vLmF0dHIoXCJ5XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHkoZFsxXSk7IH0pIFxyXG4gICAgICAuYXR0cihcIndpZHRoXCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICBcclxuICAgICAgIHJldHVybiB4KGRbMV0pIC0geChkWzBdKTsgXHJcbiAgICB9KSAvLy5hdHRyKFwiaGVpZ2h0XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHkoZFswXSkgLSB5KGRbMV0pOyB9KVxyXG4gICAgICAuYXR0cihcImhlaWdodFwiLCB5LmJhbmR3aWR0aCgpKTsgICAgICAgICAgICAgICAvLy5hdHRyKFwid2lkdGhcIiwgeC5iYW5kd2lkdGgoKSk7ICBcclxuXHJcbiAgZy5hcHBlbmQoXCJnXCIpXHJcbiAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJheGlzXCIpXHJcbiAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKDAsMClcIikgICAgICAgICAgICAvLyAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMCxcIiArIGhlaWdodCArIFwiKVwiKVxyXG4gICAgICAuY2FsbChkMy5heGlzTGVmdCh5KSk7ICAgICAgICAgICAgICAgICAgLy8gICAuY2FsbChkMy5heGlzQm90dG9tKHgpKTtcclxuXHJcbiAgZy5hcHBlbmQoXCJnXCIpXHJcbiAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJheGlzXCIpXHJcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgwLFwiK2hlaWdodCtcIilcIikgICAgICAgLy8gTmV3IGxpbmVcclxuICAgICAgLmNhbGwoZDMuYXhpc0JvdHRvbSh4KS50aWNrcyhudWxsLCBcInNcIikpICAgICAgICAgIC8vICAuY2FsbChkMy5heGlzTGVmdCh5KS50aWNrcyhudWxsLCBcInNcIikpXHJcbiAgICAuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgICAuYXR0cihcInlcIiwgMikgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAuYXR0cihcInlcIiwgMilcclxuICAgICAgLmF0dHIoXCJ4XCIsIHgoeC50aWNrcygpLnBvcCgpKSArIDAuNSkgICAgICAgICAgICAvLyAgICAgLmF0dHIoXCJ5XCIsIHkoeS50aWNrcygpLnBvcCgpKSArIDAuNSlcclxuICAgICAgLmF0dHIoXCJkeVwiLCBcIjRlbVwiKSAgICAgICAgICAgICAgICAgICAvLyAgICAgLmF0dHIoXCJkeVwiLCBcIjAuMzJlbVwiKVxyXG4gICAgICAuYXR0cihcImZpbGxcIiwgXCIjMDAwXCIpXHJcbiAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJzdGFydFwiKVxyXG4gICAgICAudGV4dChcIlByb2JhYmlsaXR5L0Nvc2luZSBTaW1pbGFyaXR5XCIpXHJcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIisgKC13aWR0aCkgK1wiLC0xMClcIik7ICAgIC8vIE5ld2xpbmVcclxuXHJcbiAgdmFyIGxlZ2VuZCA9IGcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAuYXR0cihcImZvbnQtZmFtaWx5XCIsIFwic2Fucy1zZXJpZlwiKVxyXG4gICAgICAuYXR0cihcImZvbnQtc2l6ZVwiLCAxMClcclxuICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcImVuZFwiKVxyXG4gICAgLnNlbGVjdEFsbChcImdcIilcclxuICAgIC5kYXRhKGtleXMuc2xpY2UoKS5yZXZlcnNlKCkpXHJcbiAgICAuZW50ZXIoKS5hcHBlbmQoXCJnXCIpXHJcbiAgICAvLy5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIFwidHJhbnNsYXRlKDAsXCIgKyBpICogMjAgKyBcIilcIjsgfSk7XHJcbiAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIFwidHJhbnNsYXRlKC01MCxcIiArICgzMDAgKyBpICogMjApICsgXCIpXCI7IH0pO1xyXG4gIFxyXG5cclxuICB2YXIga2V5czEgPSBbXCJPdmVyYWxsIFRlcm0gRnJlcXVlbmN5L092ZXJhbGwgUmVsZXZhbmNlXCIsIFwiRXN0aW1hdGVkIFRlcm0gZnJlcXVlbmN5IHdpdGhpbiB0aGUgc2VsZWN0ZWQgdG9waWNcIl07XHJcbiAgdmFyIHN2ZzEgPSBkMy5zZWxlY3QoXCIjbGVnZW5kVFwiKS5hcHBlbmQoXCJzdmdcIikuYXR0cihcIndpZHRoXCIsIDUwMCkuYXR0cihcImhlaWdodFwiLCBoZWlnaHQpLmF0dHIoXCJpZFwiLFwibGVnZW5kc3ZnXCIpXHJcbnZhciBsZWdlbmQgPSBzdmcxLmFwcGVuZChcImdcIikuYXR0cihcImZvbnQtZmFtaWx5XCIsIFwic2Fucy1zZXJpZlwiKS5hdHRyKFwiZm9udC1zaXplXCIsIDEwKS5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIikuc2VsZWN0QWxsKFwiZ1wiKS5kYXRhKGtleXMxLnNsaWNlKCkucmV2ZXJzZSgpKS5lbnRlcigpLmFwcGVuZChcImdcIikgLy8uYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBcInRyYW5zbGF0ZSgwLFwiICsgaSAqIDIwICsgXCIpXCI7IH0pO1xyXG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24gKGQsIGkpIHtcclxuICAgICAgcmV0dXJuIFwidHJhbnNsYXRlKC01MCxcIiArICgwICsgaSAqIDIwKSArIFwiKVwiO1xyXG4gICAgfSk7XHJcbiAgbGVnZW5kLmFwcGVuZChcInJlY3RcIikuYXR0cihcInhcIiwgd2lkdGgpXHJcbiAgLmF0dHIoXCJ3aWR0aFwiLCBmdW5jdGlvbiAoZCwgaSl7XHJcbiAgICAgIGlmKGk9PTApe1xyXG4gICAgICAgIHJldHVybiA2MDtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gMTYwO1xyXG4gIH0pLmF0dHIoXCJoZWlnaHRcIiwgMTkpLmF0dHIoXCJmaWxsXCIsIHopO1xyXG5cclxuICBsZWdlbmQuYXBwZW5kKFwidGV4dFwiKS5hdHRyKFwieFwiLCB3aWR0aCAtIDEwKS5hdHRyKFwieVwiLCAxOCkuYXR0cihcImR5XCIsIFwiMC4wZW1cIikudGV4dChmdW5jdGlvbiAoZCkge1xyXG4gICAgcmV0dXJuIGQ7XHJcbiAgfSk7XHJcbiAgXHJcbn0iLCJmdW5jdGlvbiBnZW5lcmF0ZVRvcGljVmVjdG9ycygpe1xyXG4gICAgd2luZG93LnRvcGljVmVjdG9ycyA9IHt9O1xyXG4gICAgaWYod2luZG93LnRvcGljX3dvcmRfcHJvYmFiaWxpdHlfaW5fdG9waWMpe1xyXG4gICAgICAgIGZvcih2YXIgeCBpbiB3aW5kb3cudG9waWNfd29yZF9wcm9iYWJpbGl0eV9pbl90b3BpYyl7XHJcbiAgICAgICAgICAgIHZhciB2ZWN0b3IgPSBbXTtcclxuICAgICAgICAgICAgZm9yKHZhciB5IGluIHdpbmRvdy50b3BpY193b3JkX3Byb2JhYmlsaXR5X2luX3RvcGljW3hdKXtcclxuICAgICAgICAgICAgICAgIHZlY3Rvci5wdXNoKHdpbmRvdy50b3BpY193b3JkX3Byb2JhYmlsaXR5X2luX3RvcGljW3hdW3ldKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB3aW5kb3cudG9waWNWZWN0b3JzW3hdID0gdmVjdG9yO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZ2VuZXJhdGVQYXJhbGxlbENvb3JkaW5hdGVEYXRhKHJlc3BvbnNlLCB0b3BpY190aHJlc2hvbGQsIHdvcmRfdGhyZXNob2xkKXtcclxuICAgIGxldCB2aXNEYXRhID0gW107XHJcbiAgICBmb3IgKHZhciBkb2NLZXkgaW4gcmVzcG9uc2VbXCJkb2N1bWVudF90b3BpY1wiXSl7XHJcbiAgICAgICAgZm9yKHZhciB0b3BpYyBpbiByZXNwb25zZVtcImRvY3VtZW50X3RvcGljXCJdW2RvY0tleV0pe1xyXG4gICAgICAgICAgICBsZXQgdG9waWNTY29yZSA9IHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl1bZG9jS2V5XVt0b3BpY107XHJcbiAgICAgICAgICAgIGlmICh0b3BpY1Njb3JlID4gdG9waWNfdGhyZXNob2xkKXtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IodmFyIHdvcmQgaW4gcmVzcG9uc2VbXCJ0b3BpY193b3JkXCJdW3RvcGljXSl7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHdvcmRTY29yZSA9IHJlc3BvbnNlW1widG9waWNfd29yZFwiXVt0b3BpY11bd29yZF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHdvcmRTY29yZSA+IHdvcmRfdGhyZXNob2xkKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmlzRGF0YS5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwibmFtZVwiOiBkb2NLZXksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImRvY3VtZW50XCI6ICBkb2NLZXksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInRvcGljXCI6IHRvcGljLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ3b3JkXCI6IHJlc3BvbnNlW1wib3ZlcmFsbF93b3JkXCJdW3dvcmRdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdmlzRGF0YTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2VuZXJhdGVQYXJhbGxlbENvb3JkaW5hdGVEYXRhSEMocmVzcG9uc2UsIHRvcGljX3RocmVzaG9sZCwgd29yZF90aHJlc2hvbGQpe1xyXG4gICAgbGV0IHZpc0RhdGEgPSBbXTtcclxuICAgIGZvciAodmFyIGRvY0tleSBpbiByZXNwb25zZVtcImRvY3VtZW50X3RvcGljXCJdKXtcclxuICAgICAgICBmb3IodmFyIHRvcGljIGluIHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl1bZG9jS2V5XSl7XHJcbiAgICAgICAgICAgIGxldCB0b3BpY1Njb3JlID0gcmVzcG9uc2VbXCJkb2N1bWVudF90b3BpY1wiXVtkb2NLZXldW3RvcGljXTtcclxuICAgICAgICAgICAgaWYgKHRvcGljU2NvcmUgPiB0b3BpY190aHJlc2hvbGQpe1xyXG5cclxuICAgICAgICAgICAgICAgIGZvcih2YXIgd29yZCBpbiByZXNwb25zZVtcInRvcGljX3dvcmRcIl1bdG9waWNdKXtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgd29yZFNjb3JlID0gcmVzcG9uc2VbXCJ0b3BpY193b3JkXCJdW3RvcGljXVt3b3JkXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAod29yZFNjb3JlID4gd29yZF90aHJlc2hvbGQpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2aXNEYXRhLnB1c2goW3BhcnNlSW50KGRvY0tleSksIHBhcnNlSW50KHRvcGljKSwgcmVzcG9uc2VbXCJ3b3Jkc1wiXS5pbmRleE9mKHdvcmQpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB2aXNEYXRhO1xyXG59XHJcblxyXG5cclxuIiwid2luZG93LnZ1ZUFwcCA9IG5ldyBWdWUoe1xyXG4gICAgZWw6ICcjdnVlLWFwcCcsXHJcbiAgICBkYXRhOiB7XHJcbiAgICAgICAgbWVzc2FnZTogJ0hlbGxvIHVzZXIhJyxcclxuICAgICAgICBub25lU2VsZWN0ZWQ6IHRydWUsXHJcbiAgICAgICAgc2VsZWN0ZWRQYWdlOiA1LFxyXG4gICAgICAgIHBsYXllckRldGFpbDoge1xyXG4gICAgICAgICAgICBuYW1lOiBcIjxQbGF5ZXIgTmFtZT5cIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb3ZlcnZpZXdGaWx0ZXJzOiB7fSxcclxuICAgICAgICBuZXdEb2NzOiBbXSxcclxuICAgICAgICBzZWxlY3RlZE1hcDogMSxcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBsb2FkaW5nOiBmYWxzZSxcclxuICAgICAgICBmYWlsdXJlOiBmYWxzZSxcclxuICAgICAgICBuZXdEb2M6ICcnLFxyXG4gICAgICAgIG5ld0RvY3NQcm9jY2Vzc2VkOiAnJyxcclxuICAgICAgICBzaG93UHJvY2Vzc2VkOiBmYWxzZSxcclxuICAgICAgICBzZXR0aW5nczoge1xyXG4gICAgICAgICAgICBzZWxlY3RlZE1ldGhvZDogXCJMREFcIixcclxuICAgICAgICAgICAgc2VsZWN0ZWREYXRhc2V0OiAwLFxyXG4gICAgICAgICAgICBsZGFUb3BpY1RocmVzaG9sZDogMCxcclxuICAgICAgICAgICAgd29yZDJWZWNUaHJlc2hvbGQ6IDBcclxuICAgICAgICB9LFxyXG4gICAgICAgIHBhcmFtczoge1xyXG4gICAgICAgICAgICB0b3BpY1RocmVzaG9sZDogMC4wMixcclxuICAgICAgICAgICAgd29yZFRocmVzaG9sZDogMC4wMixcclxuICAgICAgICAgICAgd29yZE92ZXJhbGxUaHJlc2hvbGQ6IDAsXHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIG1ldGhvZHM6IHtcclxuICAgICAgICBzZWxlY3RQYWdlOiBmdW5jdGlvbih4KXtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZFBhZ2UgPSB4O1xyXG4gICAgICAgICAgICBpZiAoeCA9PSAxKXtcclxuICAgICAgICAgICAgICAgIGluaXRQYWdlMSh3aW5kb3cuZ2xvYmFsX2RhdGEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh4ID09IDIpe1xyXG4gICAgICAgICAgICAgICAgaW5pdFBhZ2UyKHdpbmRvdy5nbG9iYWxfZGF0YSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHggPT0gMyl7XHJcbiAgICAgICAgICAgICAgICBpbml0UGFnZTMod2luZG93Lmdsb2JhbF9kYXRhKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoeCA9PSA0KXtcclxuICAgICAgICAgICAgICAgIGluaXRQYWdlNCh3aW5kb3cuZ2xvYmFsX2RhdGEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBhZGROZXdEb2M6IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm5ld0RvYy50cmltKCkuc3BsaXQoXCIgXCIpLmxlbmd0aCA8IDMpe1xyXG4gICAgICAgICAgICAgICAgYWxlcnQoXCJQbGVhc2UgYWRkIGF0IGxlYXN0IDMgd29yZHNcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5uZXdEb2NzLnB1c2godGhpcy5uZXdEb2MpO1xyXG4gICAgICAgICAgICB0aGlzLm5ld0RvYyA9ICcnO1xyXG4gICAgICAgICAgICB0aGlzLnNob3dQcm9jZXNzZWQgPSBmYWxzZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNhdmVDaGFuZ2VzOiBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgICAgIHNlbGYuc3VjY2VzcyA9IGZhbHNlO1xyXG4gICAgICAgICAgICBzZWxmLmZhaWx1cmUgPSBmYWxzZTtcclxuICAgICAgICAgICAgc2VsZi5sb2FkaW5nID0gdHJ1ZTtcclxuICAgICAgICAgICAgaWYoc2VsZi5uZXdEb2NzLmxlbmd0aCA9PSAwKXtcclxuICAgICAgICAgICAgICAgIGFsZXJ0KFwiTm8gZG9jdW1lbnRzLlwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZ2V0QW5hbHlzaXModGhpcy5zZXR0aW5ncy5zZWxlY3RlZE1ldGhvZCwgZnVuY3Rpb24ocmVzcCl7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnN1Y2Nlc3MgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5sb2FkaW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvclN0YXR1cykge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5sb2FkaW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmZhaWx1cmUgPSB0cnVlO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgbW91bnRlZDogZnVuY3Rpb24oKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIk1vdW50ZWRcIik7XHJcbiAgICAgICAgbG9hZEQzKCk7XHJcbiAgICAgICAgbG9hZEpxdWVyeSgpO1xyXG4gICAgfVxyXG59KTsiLCJmdW5jdGlvbiBsb2FkV29yZENsb3VkKHJlc3Ape1xyXG4gICAgbGV0IGRhdGEgPSBbXTtcclxuICAgIGZvcih2YXIgd29yZCBpbiByZXNwW1wib3ZlcmFsbF93b3JkXCJdKXtcclxuICAgICAgICBsZXQgd2VpZ2h0ID0gcmVzcFtcIm92ZXJhbGxfd29yZFwiXVt3b3JkXTtcclxuICAgICAgICAgZGF0YS5wdXNoKHtcclxuICAgICAgICAgICAgbmFtZTogd29yZCxcclxuICAgICAgICAgICAgd2VpZ2h0OiB3ZWlnaHRcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIGNyZWF0ZVdvcmRDbG91ZChcIm92ZXJhbGwtd2NcIiwgZGF0YSwgXCJBbGwgRG9jdW1lbnRzXCIpO1xyXG5cclxuICAgIGZvcih2YXIgdG9waWMgaW4gcmVzcFtcInRvcGljX3dvcmRcIl0pe1xyXG4gICAgICAgIGxldCBkYXRhID0gW107XHJcbiAgICAgICAgZm9yKHZhciB3b3JkIGluIHJlc3BbXCJ0b3BpY193b3JkXCJdW3RvcGljXSl7XHJcbiAgICAgICAgICAgIGxldCB3ZWlnaHQgPSByZXNwW1widG9waWNfd29yZFwiXVt0b3BpY11bd29yZF07XHJcbiAgICAgICAgICAgIGRhdGEucHVzaCh7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiB3b3JkLFxyXG4gICAgICAgICAgICAgICAgd2VpZ2h0OiB3ZWlnaHRcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgICQoXCIjdG9waWMtd2NzXCIpLmFwcGVuZCgnPGRpdiBjbGFzcz1cImNvbC1zbS02XCI+PGRpdiBzdHlsZT1cIm91dGxpbmU6IHNvbGlkIDFweDtcIiBpZD1cInRvcGljJyt0b3BpYysnXCIgc3R5bGU9XCJoZWlnaHQ6IDMwMHB4O1wiPjwvZGl2PjwvZGl2PicpO1xyXG4gICAgICAgIGNyZWF0ZVdvcmRDbG91ZChcInRvcGljXCIrdG9waWMsIGRhdGEsIFwiVG9waWMgXCIrdG9waWMpO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVXb3JkQ2xvdWQoaWQsIGRhdGEsIHRpdGxlKXtcclxuICAgIEhpZ2hjaGFydHMuY2hhcnQoaWQsIHtcclxuICAgICAgICBzZXJpZXM6IFt7XHJcbiAgICAgICAgICAgIHR5cGU6ICd3b3JkY2xvdWQnLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhLFxyXG4gICAgICAgICAgICByb3RhdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgZnJvbTogMCxcclxuICAgICAgICAgICAgICAgIHRvOiAwLFxyXG4gICAgICAgICAgICAgICAgb3JpZW50YXRpb25zOiA1XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG5hbWU6ICdTY29yZSdcclxuICAgICAgICB9XSxcclxuICAgICAgICB0aXRsZToge1xyXG4gICAgICAgICAgICB0ZXh0OiB0aXRsZVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59Il19
