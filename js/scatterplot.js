/**
 * Created by krause on 2015-04-03 12:02am.
 */

function Scatterplot(sel, size, radius, duration, ease, colors) {
  var that = this;
  var paddingLeft = 45;
  var paddingRight = 25;
  var paddingTop = 10 + (paddingLeft + paddingRight) * 0.5;
  var paddingBottom = 20 + (paddingLeft + paddingRight) * 0.5;
  this.padding = function() {
    return [ paddingTop, paddingRight, paddingBottom, paddingLeft ];
  };

  var ixs = [];
  var lastSelIxs = [];
  var featureA = null;
  var featureB = null;
  var axisX = d3.svg.axis();
  var axisY = d3.svg.axis();

  sel.style({
    "display": "inline-block"
  });
  var svg = sel.append("svg").style({
    "width": size + "px",
    "height": size + "px",
    "cursor": "crosshair"
  }).attr({
    "width": size,
    "height": size
  });
  svg.append("rect").attr({
    "width": size - paddingLeft - paddingRight,
    "height": size - paddingTop - paddingBottom,
    "fill": "none",
    "stroke": "lightgray",
    "transform": "translate(" + paddingLeft + " " + paddingTop + ")"
  });
  var selPath = svg.append("path").attr({
    "stroke": "black",
    "stroke-width": 0.2,
    "fill": "gray",
    "opacity": 0,
    "fill-rule": "evenodd"
  });

  function mousePos() {
    var pos = d3.mouse(svg.node());
    return [ pos[0], pos[1] ];
  }

  var dragList = [];
  function computeSelection(finalSel) {
    var selIxs = [];
    var sx = featureA.scale();
    var sy = featureB.scale();

    function getX(ix) {
      return sx(featureA.getValue(ix));
    }

    function getY(ix) {
      return sy(featureB.getValue(ix));
    }

    var circles = svg.selectAll("circle");
    circles.each(function(ix) {
      var circle = d3.select(this);
      var px = getX(ix);
      var py = getY(ix);
      var inPoly = pointInPolygon(px, py, dragList);
      if(inPoly) {
        selIxs.push(ix);
      }
      circle.attr({
        "fill": !inPoly ? colors[0] : !finalSel ? colors[1] : colors[2]
      });
    });
    return selIxs;
  }

  var drag = d3.behavior.drag();
  drag.on("dragstart", function() {
    lastSelIxs = [];
    if(!featureA || !featureB) return;
    dragList = [ mousePos() ];
    selPath.attr({
      "opacity": 0.5,
      "d": ""
    });
  });
  drag.on("drag", function() {
    if(!featureA || !featureB) return;
    dragList.push(mousePos());
    selPath.attr({
      "opacity": 0.5,
      "d": toPoly(dragList)
    });
    computeSelection(false);
  });
  drag.on("dragend", function() {
    if(!featureA || !featureB) return;
    selPath.attr({
      "opacity": 0,
      "d": ""
    });
    dragList.push(mousePos());
    lastSelIxs = computeSelection(true);
  });
  svg.call(drag);

  var axisSelX = svg.append("g").classed("axis", true);
  var axisSelY = svg.append("g").classed("axis", true);

  var nameX = svg.append("text").attr({
    "transform": "translate(" + (paddingLeft + (size - paddingLeft - paddingRight) * 0.5) + " " + (size - 15) + ")",
    "text-anchor": "middle"
  });
  var nameY = svg.append("text").attr({
    "transform": "translate(" + (size - 15) + " " + (paddingTop + (size - paddingTop - paddingBottom) * 0.5) + ") rotate(90)",
    "text-anchor": "middle"
  });

  this.ixs = function(_) {
    if(!arguments.length) return ixs;
    ixs = _;
  };
  this.getLastSelectionIxs = function() {
    return lastSelIxs;
  }
  this.setFeature = function(f, isA) {
    if(isA) {
      featureA = f;
    } else {
      featureB = f;
    }
  };
  this.getFeature = function(isA) {
    return isA ? featureA : featureB;
  };
  this.update = function() {
    if(!featureA || !featureB) {
      svg.selectAll("circle").transition().duration(duration).ease(ease).attr({
        "r": 0
      }).remove();
      return;
    }
    var oldSx = featureA.oldScale();
    var oldSy = featureB.oldScale();
    var sx = featureA.scale().domain(featureA.getExtent(ixs)).range([ paddingLeft, size - paddingRight ]).nice();
    var sy = featureB.scale().domain(featureB.getExtent(ixs)).range([ size - paddingBottom, paddingTop ]).nice();
    featureA.oldScale(sx.copy());
    featureB.oldScale(sy.copy());

    axisX.scale(sx).orient("bottom").tickSize(size - paddingTop - paddingBottom);
    axisY.scale(sy).orient("left").tickSize(size - paddingLeft - paddingRight);
    axisSelX.attr({
      "transform": "translate(0 " + paddingTop + ")"
    }).transition().duration(duration).ease(ease).call(axisX);
    axisSelY.attr({
      "transform": "translate(" + (size - paddingRight) + " 0)"
    }).transition().duration(duration).ease(ease).call(axisY);

    nameX.text(featureA.getName());
    nameY.text(featureB.getName());

    function getX(ix) {
      return sx(featureA.getValue(ix));
    }

    function getY(ix) {
      return sy(featureB.getValue(ix));
    }

    var circles = svg.selectAll("circle").data(ixs, function(ix) {
      return ix;
    });
    circles.exit().transition().duration(duration).ease(ease).attr({
      "cx": getX,
      "cy": getY,
      "r": 0
    }).remove();
    circles.enter().append("circle").attr({
      "r": 0,
      "cx": function(ix) {
        return oldSx(featureA.getValue(ix));
      },
      "cy": function(ix) {
        return oldSy(featureB.getValue(ix));
      },
      "fill": colors[0],
      "stroke": "black",
      "stroke-width": 0.2
    });
    circles.transition().duration(duration).ease(ease).attr({
      "r": radius,
      "cx": getX,
      "cy": getY
    });
    circles.sort(d3.ascending);
  }

} // Scatterplot
