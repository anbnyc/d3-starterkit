(function () {

  'use strict';

d3.palettes = function(palette){
  var colorMenu = {
    blue: '#0000FF',
    altblue: '#0080FF',
    green: '#008000',
    altgreen: '#00C600',
    palegreen: '#98DF8A',
    altpalegreen: '#C3FFCE',
    yellow: '#FFFF00',
    orange: '#FF8000',
    palered: '#F0ACAC',
    red: '#FF0000',
    darkred: '#800000',
    gray: '#7F7F7F',
    brown: '#804000',
    lightgray: '#CFCFCF'
  };

  var palettes = {
    standard7: [
      colorMenu.blue,
      colorMenu.green,
      colorMenu.palegreen,
      colorMenu.yellow,
      colorMenu.orange,
      colorMenu.red,
      colorMenu.gray
    ],
    basic5: [
      colorMenu.blue,
      colorMenu.green,
      colorMenu.yellow,
      colorMenu.orange,
      colorMenu.red
    ]
  };

  if(typeof palette === "string"){
    return palettes[palette];
  } else {
    return _.map(palette,function(each){
      return colorMenu[each.color];
    });
  }
};

//adapted from d3.conventions and d3angularjs ebook
d3.init = function(c){
  c = c || {};
  c.data = c.data || [];
  c.filter = c.filter || function(){};

  c.sort = function(a,b){
    if(c.element === "rect" && !c.stacked){
      return c.values[a[c.dims.color]].rank - c.values[b[c.dims.color]].rank;
    } else if (c.element === "rect" && c.stacked) {
      var bRank = b[c.dims.color[0]][0] ? b[c.dims.color[0]][0].count : 0;
      var aRank = a[c.dims.color[0]][0] ? a[c.dims.color[0]][0].count : 0;
      return bRank - aRank;
    } else if (c.element === "path") {
      return a[c.dims.x] - b[c.dims.x];
    } else {
      return d3.ascending(a,b);
    }
  };

  //define scales and axes
  c.margin = c.margin || {top: 20, right: 10, bottom: 40, left: 40};
  c.width = c.width - c.margin.left - c.margin.right || 600;
  c.height = c.height - c.margin.top - c.margin.bottom || 500;
  c.x       = c.x       || d3.scaleLinear().range([0, c.width]);
  c.y       = c.y       || d3.scaleLinear().range([c.height, 0]);
  c.rScale  = c.rScale  || d3.scaleSqrt().range([2, 7]);
  c.line    = c.line    || d3.line();
  c.offset  = c.offset  || 5;

  c.color = c.values ? d3.scaleOrdinal().domain(_.keys(c.values)).range(d3.palettes(c.values)) : d3.scaleOrdinal(d3.schemeCategory20c);

  c.x = (c.element === "rect") ? d3.scaleBand() : (c.element === "path") ? d3.scaleTime() : c.x;

  c.xAxis = c.xAxis || d3.axisBottom(c.x);
  c.yAxis = c.yAxis || d3.axisLeft(c.y);

  //start drawing
  c.parent = c.parent || d3.select('body');
  c.rootSVG = c.rootSVG || c.parent.append('svg');
  c.svg = c.svg || c.rootSVG.append('g');

  c.xAxisG = c.svg.append('g')
    .attr('class','x axis');

  c.yAxisG = c.svg.append('g')
    .attr('class','y axis');

  c.svg.append("text")
    .attr("class","x axis-label")
    .text(() => c.dims.xLabel ? c.dims.xLabel : _.startCase(c.dims.x));

  c.svg.append("text")
    .attr("class","y axis-label")
    .attr("dy", "-4em")
    .text(() => c.dims.yLabel ? c.dims.yLabel : _.startCase(c.dims.y));

  c.tip = c.parent.append('div.tooltip')
    .style("position","absolute")
    .style("visibility","hidden");

  return c;

};

d3.resize = function(c){
  c.tip.style("visibility","hidden");
  c.width = c.width - c.margin.left - c.margin.right;
  c.height = c.height - c.margin.top - c.margin.bottom;

  c.rootSVG
    .attr("width", c.width + c.margin.left + c.margin.right)
    .attr("height", c.height + c.margin.top + c.margin.bottom);

  c.svg.attr("transform", "translate(" + c.margin.left + "," + c.margin.top + ")");

  c.svg.selectAll(".y.axis-label")
    .style("text-anchor","middle")
    .attr("transform", "translate("+(.6*c.margin.left)+","+(c.height/2)+") rotate(-90)");

  c.svg.selectAll(".x.axis-label")
    .style("text-anchor","middle")
    .attr("transform", "translate("+(c.width/2)+","+(c.height+c.margin.bottom - 3)+")");

  c.x.range([0, c.width]);
  c.y.range([c.height, 0]);

  c.xAxisG.attr("transform", "translate(0," + c.height + ")");

  var nTicks = c.height < 200 ? Math.floor(c.height/40) : 10;

  c.yAxis.ticks(nTicks);

  return c;
};

d3.update = function(c){
  var enter;
  var t = d3.transition().duration(1000);

  if(typeof c.values === "object") c.data.sort(c.sort);

  c.svg.select(".x.axis-label")
    .text(() => c.dims.xLabel ? c.dims.xLabel : _.startCase(c.dims.x));

  c.svg.select(".y.axis-label")
    .text(() => c.dims.yLabel ? c.dims.yLabel : _.startCase(c.dims.y));

  switch(c.element){

    //scatterplot
    case "circle":
      c.x.domain([ 
        .9*d3.min(c.data, d => d[c.dims.x]),
        d3.max(c.data, d => d[c.dims.x])
      ]);
      c.y.domain([0, d3.max(c.data, d => d[c.dims.y])]);

      c.groups = c.svg.selectAll('g.'+c.element)
        .data(c.data, d => d[c.dims.x]+"_"+d[c.dims.y]+"_"+d[c.dims.color]);
      c.groups.exit().remove();

      enter = c.groups.enter()
        .append("g."+c.element);
      enter.append(c.element);
      enter.append("text");

      c.groups = enter.merge(c.groups)
        .attr("transform","translate(0,"+c.height+")");

      c.groups.selectAll(c.element)
        .data(c.data, d => d[c.dims.x]+"_"+d[c.dims.y]+"_"+d[c.dims.color])
        .attr("r", d => c.rScale(d[c.dims.r]))
        .attr("fill", d => c.color(d[c.dims.color]))
        .transition(t)
        .attr("cx", d => c.x(d[c.dims.x]))
        .attr("cy", d => -c.height + c.y(d[c.dims.y]));

      //labels
      if(c.dims.label){
        c.groups.selectAll("text")
          .data(c.data, d => d[c.dims.x]+"_"+d[c.dims.y]+"_"+d[c.dims.color])
          .attr("class","label")
          .text(d => d[c.dims.label])
          .transition(t)
          .attr("x", d => c.x(d[c.dims.x]) + c.offset)
          .attr("y", d => -c.height + c.y(d[c.dims.y]) -c.offset);
      }

      break;

    //bar chart
    case "rect":
      c.x.domain(c.data.map(d => d[c.dims.x]));
      c.x.paddingInner(.05).paddingOuter(.05);

      //stacked
      if(c.stacked){

        _.each(c.data,function(column){
          var y0 = 0;
          _.each(column.segments,function(segm){
            segm.y0 = y0;
            // for stacked of 100, change count -> pct and sum below
            y0 = segm.y1 = (segm.y0 + segm.count);
          });
        });

        c.y.domain([0,d3.max(c.data, d => d.sum)]);

        c.groups = c.svg.selectAll('g.'+c.element)
          .data(c.data, d => d[c.dims.x]);
        c.groups.exit().remove();

        //enter and update groups
        enter = c.groups.enter()
          .append("g."+c.element);
        // enter.append("text");

        c.groups = enter.merge(c.groups)
          .attr("transform", d => "translate("+ c.x(d[c.dims.x]) +","+c.height+")");

        var rects = c.groups.selectAll(c.element)
          .data(d => d[c.dims.y[0]]);
        rects.exit().remove();
        rects.enter()
          .append(c.element)
          .merge(rects)
          .attr("width", c.x.bandwidth())
          .attr("fill", function(d){
            return c.color(d[c.dims.color[1]]);
          })
          .transition(t)
          .attr("height", d => c.y(d.y0) - c.y(d.y1))
          .attr("y", d => (-c.height + c.y(d.y1)));

      //unstacked
      } else {
        c.y.domain([0,d3.max(c.data, d => d[c.dims.y])]);

        c.groups = c.svg.selectAll('g.'+c.element)
          .data(c.data, d => d[c.dims.x]);
        c.groups.exit().remove();

        // enter and update groups
        enter = c.groups.enter()
          .append("g."+c.element);
        enter.append("text");
        enter.append(c.element);

        c.groups = enter.merge(c.groups)
          .attr("transform", d => "translate("+ c.x(d[c.dims.x]) +","+c.height+")");

        c.groups.selectAll(c.element)
          .data(c.data, d => d[c.dims.x])
          .attr("fill", d => c.color(d[c.dims.color]))
          .attr("width", c.x.bandwidth())
          .transition(t)
          .attr("height", d => (c.height - c.y(d[c.dims.y])))
          .attr("y", d => (-c.height + c.y(d[c.dims.y])));

        //labels
        if(c.dims.label){
          c.groups.selectAll('text')
            .data(c.data, d => d[c.dims.x])
            .attr("x", c.x.bandwidth()/2)
            .attr("class","label")
            .text(d => d[c.dims.label])
            .transition(t)
            .attr("y", d => (-c.height + c.y(d[c.dims.y]) - c.offset));
        }

      }
      break;
    
    case "path":

      var parseTime = d3.timeParse(c.time);

      c.data.forEach(function(line){
        line.sort(c.sort);
      });

      c.x.domain([
        d3.min(c.data,d => d3.min(d,g => parseTime(g[c.dims.x]))),
        d3.max(c.data,d => d3.max(d,g => parseTime(g[c.dims.x])))
      ]);

      c.y.domain([
        d3.min(c.data,d => d3.min(d,g => g[c.dims.y])),
        d3.max(c.data,d => d3.max(d,g => g[c.dims.y]))
      ]);

      var line = d3.line()
        .x(d => c.x(parseTime(d[c.dims.x])))
        .y(d => c.y(d[c.dims.y]));

      c.groups = c.svg.selectAll('.line')
        .data(c.data);
      c.groups.exit().remove();

      enter = c.groups.enter()
        .append(c.element+'.line');

      c.groups = enter.merge(c.groups);

      c.groups
        .style("stroke", (d,i) => c.color(i))
        .transition(t)
        .attr("d", line);

      break;

    case "sankey":

      if(c.data.nodes){

        var sankey = d3.sankey()
          .nodeWidth(24)
          .nodePadding(8)
          .size([c.width,c.height]);

        var path = sankey.link();

        sankey
          .nodes(c.data.nodes)
          .links(c.data.links)
          .layout(32);

        var link = c.svg.append("g")
          .selectAll('.link')
          .data(c.data.links);

        link.exit().remove();

        link
          .enter()
          .append("path")
          .attr("class","link")
          .attr("d",path)
          .style("stroke-width",d => Math.max(1,d.dy))
          .sort((a,b) => b.dy - a.dy);

        var node = c.svg.append("g")
          .selectAll(".node")
          .data(c.data.nodes);

        node.exit().remove();

        node = node
          .enter()
          .append("g")
          .attr("class","node")
          .attr("transform", d => "translate("+d.x+","+d.y+")");

        node.append("rect")
          .attr("height", d => d.dy)
          .attr("width",sankey.nodeWidth());

        node.append("text")
          .attr("x", d => d.x === 0 ? -d.dx : d.dx)
          .attr("y", d => .5*d.dy)
          .text(d => d.name.substring(d.name.indexOf("_")));

      }

      c.groups = c.svg.selectAll('rect');

      break;
  }

  if(c.element !== "sankey"){
    c.xAxisG.call(c.xAxis);
    c.yAxisG
      .call(c.yAxis);
  }

  //wrap bar labels
  if(c.element === "rect"){
    var cutoff = 10;
    c.margin.bottom = c.x.bandwidth() < cutoff ? 80 : 40;
    c.xAxisG
      .selectAll("text")
      .attr("transform", c.x.bandwidth() < cutoff ? "translate("+(-c.x.bandwidth()/2)+",8) rotate(-90)" : "")
      .style("text-anchor", c.x.bandwidth() < cutoff ? "end" : "middle")
      .call(wrap, c.x.bandwidth() < cutoff ? c.margin.bottom - 20 : c.x.bandwidth());
  };

  //tooltips
  c.groups.selectAll(c.element)
    .on('click', function(d) {
      d3.event.stopPropagation();
      if(c.tip.style("visibility") === "visible"){
        c.tip.html('').style("visibility","hidden");
      } else {
        return d3.showTooltip(d,c);
      }
    });

  c.rootSVG
    .on('click', function() {
      if(c.tip.style("visibility") === "visible"){
        c.tip.html('').style("visibility","hidden");
      }
    });


  return c;

};

d3.showTooltip = function(data, c){
  c.tip
    .html(function(){
      var header;
      if(c.stacked){
        header = "<span class='text header'>"+_.startCase(c.dims.color[1])+": "+data[c.dims.color[1]]+"</span><br/>";
      } else {
        if(c.element === "circle"){
          header = "<span class='text header'>"+_.startCase(c.dims.x)+": "+data[c.dims.x]+"</span><br/>"
            +"<span class='text header'>"+_.startCase(c.dims.y)+": "+data[c.dims.y]+"</span><br/>";;
        } else {
          header = "<span class='text header'>"+_.startCase(c.dims.x)+": "+data[c.dims.x]+"</span><br/>";
        }
      }
      return header
        +"<span class='text header'>"+data.pct+"%</span><br/>"
        +"<span class='text body'>"+data.count+" students<br/></span>";
    })
    .style("visibility","visible")
    .style("left", d3.event.x)
    .style("top", d3.event.y);
};

// https://bl.ocks.org/mbostock/7555321
function wrap(text, width) {
  text.each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+|-/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
      }
    }
  });
};

})();