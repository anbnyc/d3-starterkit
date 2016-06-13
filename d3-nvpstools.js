(function () {

  'use strict';

//adapted from d3.conventions and d3angularjs ebook
d3.init = function(c){
  c = c || {};

  //define scales and axes
  c.width = c.width || 600;
  c.height = c.height || 500;
  c.margin = c.margin || {top: 20, right: 20, bottom: 20, left: 30};
  c.color   = c.color   || d3.scale.category10();
  c.x       = c.x       || d3.scale.linear().range([0, c.width]);
  c.y       = c.y       || d3.scale.linear().range([c.height, 0]);
  c.rScale  = c.rScale  || d3.scale.sqrt().range([5, 20]);
  c.line    = c.line    || d3.svg.line();
  c.offset  = c.offset  || 5;

  c.x = (c.element === "rect") ? d3.scale.ordinal() : c.x;

  c.xAxis = c.xAxis || d3.svg.axis().scale(c.x).orient("bottom");
  c.yAxis = c.yAxis || d3.svg.axis().scale(c.y).orient("left");

  //start drawing
  c.parent = c.parent || d3.select('body');
  c.rootSVG = c.rootSVG || c.parent.append('svg');
  c.svg = c.svg || c.rootSVG
    .append('g');

  c.xAxisG = c.svg.append('g')
    .attr('class','x axis');

  c.yAxisG = c.svg.append('g')
    .attr('class','y axis');

  c.tip = c.parent.append('div.tooltip')
    .style("position","absolute")
    .style("visibility","hidden");

  return c;

};

d3.resize = function(c){

  c.tip.style("visibility","hidden");

  c.rootSVG
      .attr("width", c.width + c.margin.left + c.margin.right)
      .attr("height", c.height + c.margin.top + c.margin.bottom);

  c.svg.attr("transform", "translate(" + c.margin.left + "," + c.margin.top + ")");

  if(c.element === "rect"){
    c.x.rangeRoundBands([0,c.width], .1);
  } else {
    c.x.range([0, c.width]);
  }

  c.y.range([c.height, 0]);

  c.xAxisG.attr("transform", "translate(0," + c.height + ")");

  return c;

};

d3.update = function(c){

  c.y.domain([
    0,
    d3.max(c.data, d3.f(c.dims.y))
  ]);

  c.groups = c.svg.selectAll('g.'+c.element).data(c.data);
  c.groups.exit().remove();

  switch(c.element){
    case "circle":
        c.x.domain([
          .9*d3.min(c.data,d3.f(c.dims.x)),
          d3.max(c.data,d3.f(c.dims.x))
        ]);

        var groups = c.groups.enter().append("g."+c.element);
        groups.append(c.element);
        groups.append("text");

        c.groups
          .attr("transform", function(d){
            return "translate("+c.x(d[c.dims.x])+","+c.y(d[c.dims.y])+")";
          });

        c.groups.selectAll(c.element)
          .attr("r","5")
          .attr("fill",function(d){
              return c.color(d[c.dims.color]);
          });

        //labels
        if(c.dims.label){
            c.groups.selectAll("text")
                .attr("x", c.offset)
                .attr("y",-c.offset)
                .text(d3.f(c.dims.label));
        }

        break;

    case "rect":
        c.x.domain(c.data.map(d3.f(c.dims.x)));

        var groups = c.groups.enter().append("g."+c.element);
        groups.append(c.element);
        groups.append("text");

        c.groups
          .attr("transform", function(d){
            return "translate("+ c.x(d[c.dims.x]) +","+c.y(d[c.dims.y])+")";
          });

        c.groups.selectAll(c.element)
          .attr("height", function(d){
              return c.height - c.y(d[c.dims.y]);
          })
          .attr("width", c.x.rangeBand())
          .attr("fill",function(d){
              return c.color(d[c.dims.color]);
          });

        //labels
        if(c.dims.label){
            c.groups.selectAll("text")
              .attr("x", c.x.rangeBand()/2 - c.offset)
              .attr("y",function(d){
                  return -c.offset;
              })
              .text(d3.f(c.dims.label));
        }

        break;
  }

  c.xAxisG
    .call(c.xAxis);

  c.yAxisG
    .call(c.yAxis);

  c.groups
    .on('click', function(d) {
      if(c.tip.style("visibility") === "visible"){
        c.tip.html('').style("visibility","hidden");
      } else {
        return d3.showTooltip(d,c);
      }
    });

  return c;

};

d3.showTooltip = function(data,c){
  var arg = JSON.stringify(data);
  c.tip
    .html("<span>No Plan: "+data.pct+"%<br/>"+data.count+" students<br/></span>"+
          "<span><button class='md-button' onclick='d3.filterGrid("+arg+")'>Apply Filter</button></span><br/>"+
          "<span><button class='md-button'>View Profiles</button></span>")
    .style("visibility","visible")
    .style("left",(d3.event.pageX)+"px")
    .style("top",(d3.event.pageY)+"px");
};

d3.filterGrid = function(data){
  console.log(data);
};

}());
