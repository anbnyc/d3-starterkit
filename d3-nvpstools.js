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
    if(c.values && !c.stacked){
      return c.values[a[c.dims.color]].rank - c.values[b[c.dims.color]].rank;
    } else if (c.values && c.stacked) {
      return c.values[a[c.dims.x]] - c.values[b[c.dims.x]];
    } else {
      return d3.ascending(a,b);
    }
  };

  //define scales and axes
  c.margin = c.margin || {top: 20, right: 100, bottom: 35, left: 100};
  c.width = c.width - c.margin.left - c.margin.right || 600;
  c.height = c.height - c.margin.top - c.margin.bottom || 500;
  c.x       = c.x       || d3.scale.linear().range([0, c.width]);
  c.y       = c.y       || d3.scale.linear().range([c.height, 0]);
  c.rScale  = c.rScale  || d3.scale.sqrt().range([5, 20]);
  c.line    = c.line    || d3.svg.line();
  c.offset  = c.offset  || 5;

  c.color = d3.scale.ordinal()
    .domain(_.keys(c.values))
    .range(d3.palettes(c.values));

  c.x = (c.element === "rect") ? d3.scale.ordinal() : c.x;

  c.xAxis = c.xAxis || d3.svg.axis().scale(c.x).orient("bottom");
  c.yAxis = c.yAxis || d3.svg.axis().scale(c.y).orient("left");

  //start drawing
  c.parent = c.parent || d3.select('body');
  c.rootSVG = c.rootSVG || c.parent.append('svg');
  c.svg = c.svg || c.rootSVG.append('g');

  c.xAxisG = c.svg.append('g')
    .attr('class','x axis');

  c.yAxisG = c.svg.append('g')
    .attr('class','y axis');

  c.svg.append("text")
    .attr("class","y axis-label")
    .attr("dy", "-4em")
    .text(function(){
      if(c.dims.yLabel){
        return c.dims.yLabel;
      } else {
        return _.startCase(c.dims.y);
      }
    });

  c.svg.append("text")
    .attr("class","x axis-label")
    .text(function(){
      if(c.dims.xLabel){
        return c.dims.xLabel;
      } else {
        return _.startCase(c.dims.x);
      }
    });

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
    .attr("transform", "translate("+(.15*c.margin.left)+","+(c.height/2)+") rotate(-90)");

  c.svg.selectAll(".x.axis-label")
    .attr("transform", "translate("+(c.width/2)+","+(c.height+c.margin.bottom - 3)+")");

  if(c.element === "rect"){
    c.x.rangeRoundBands([0,c.width], .1);
  } else {
    c.x.range([0, c.width]);
  }

  c.y.range([c.height, 0]);

  c.xAxisG.attr("transform", "translate(0," + c.height + ")");

  var nTicks = c.height < 200 ? Math.floor(c.height/40) : 10;

  c.yAxis.ticks(nTicks);

  return c;

};

d3.update = function(c){

  c.data.sort(c.sort);

  c.y.domain([
    0,
    d3.max(c.data, function(d){
      if(c.stacked){
        return d.sum;
      } else {
        return d[c.dims.y];
      }
    })
  ]);

  switch(c.element){

    //scatterplot
    case "circle":

      c.groups = c.svg.selectAll('g.'+c.element)
        .data(c.data, function(d){
          return d[c.dims.x]+"_"+d[c.dims.y]+"_"+d[c.dims.color];
        });
      c.groups.exit().remove();
      var groups = c.groups.enter().append("g."+c.element);

      groups.append(c.element);
      groups.append("text");

      c.x.domain([
        .9*d3.min(c.data,d3.f(c.dims.x)),
        d3.max(c.data,d3.f(c.dims.x))
      ]);

      c.groups
        .attr("transform", function(d){
          return "translate("+c.x(d[c.dims.x])+","+c.y(d[c.dims.y])+")";
        });

      c.groups.selectAll(c.element)
        .data(c.data, function(d){
          return d[c.dims.x]+"_"+d[c.dims.y]+"_"+d[c.dims.color];
        })
        .attr("r","5")
        .attr("fill",function(d){
            return c.color(d[c.dims.color]);
        });

      //labels
      if(c.dims.label){
        c.groups.selectAll("text")
          .data(c.data, function(d){
            return d[c.dims.x]+"_"+d[c.dims.y]+"_"+d[c.dims.color];
          })
          .attr("x", c.offset)
          .attr("y",-c.offset)
          .text(d3.f(c.dims.label));
      }

      break;

    //bar chart
    case "rect":
      c.x.domain(c.data.map(d3.f(c.dims.x)));

      //stacked
      if(c.stacked){

        c.groups = c.svg.selectAll('g.'+c.element).data(c.data,d3.f(c.dims.x));
        c.groups.exit().remove();
        var groups = c.groups.enter().append("g."+c.element);

        c.groups
          .attr("transform", function(d){
            return "translate("+ c.x(d[c.dims.x]) +","+c.y(d.sum)+")";
          });

        var rects = c.groups.selectAll(c.element)
          .data(function(d){
            return d[c.dims.y[0]];
          });

        rects.exit().remove();
        rects.enter().append(c.element);

        rects
          .attr("width", c.x.rangeBand())
          .attr("fill", function(d){
            return c.color(d[c.dims.color[1]]);
          })
          .transition()
          .duration(500)
          .attr("height", function(d){
            return c.y(d.y0) - c.y(d.y1);
          })
          .attr("y", function(d){
            return c.y(d.y1);
          });

      //unstacked
      } else {

        c.groups = c.svg.selectAll('g.'+c.element).data(c.data,d3.f(c.dims.x));
        c.groups.exit().remove();

        c.groups
          .attr("transform", function(d){
            return "translate("+ c.x(d[c.dims.x]) +","+c.y(d[c.dims.y])+")";
          });

        //update
        c.groups.selectAll(c.element)
          .data(c.data,d3.f(c.dims.x))
          .attr("fill",function(d){
            return c.color(d[c.dims.color]);
          })
          .attr("width", c.x.rangeBand())
          .attr("height",0)
          .attr("y",function(d){
            return c.height - c.y(d[c.dims.y]);
          })
          .transition()
          .duration(500)
          .attr("height", function(d){
            return c.height - c.y(d[c.dims.y]);
          })
          .attr("y",0);

        //enter
        var groups = c.groups.enter().append("g."+c.element);
        groups.append(c.element)
          .attr("fill",function(d){
            return c.color(d[c.dims.color]);
          })
          .attr("width", c.x.rangeBand())
          .attr("height",0)
          .attr("y",function(d){
            return c.height - c.y(d[c.dims.y]);
          })
          .transition()
          .duration(3000)
          .attr("height", function(d){
            return c.height - c.y(d[c.dims.y]);
          })
          .attr("y",0);
        groups.append("text");

        //labels
        if(c.dims.label){
          c.groups.selectAll('text')
            .data(c.data,d3.f(c.dims.x))
            .attr("x", c.x.rangeBand()/2)
            .attr("y",-c.offset)
            .text(d3.f(c.dims.label));
        }

      }
  }

  var narrowBar = c.element === "rect" && c.x.rangeBand() < 50;
  if(narrowBar){
    c.margin.bottom = 75;
  } else {
    c.margin.bottom = 50;
  }
  c.xAxisG
    .call(c.xAxis)
    .selectAll("text")
      .attr("transform",function(){
        if(narrowBar){
          return "translate(-5, 2) rotate(-20)";
        } else {
          return "";
        }
      })
      .style("text-anchor",function(){
        if(narrowBar){
          return "end";
        } else {
          return "middle";
        }
      });

  c.yAxisG
    .call(c.yAxis);

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
  var arg = JSON.stringify(data);
  var header;
  if(c.stacked){
    header = data[c.dims.color[1]];
  } else {
    if(c.element === "circle"){
      header = data[c.dims.x]+" "+_.startCase(c.dims.x)+",<br/>"+data[c.dims.y]+" "+_.startCase(c.dims.y);
    } else {
      header = data[c.dims.x];
    }
  }
  c.tip
    .html("<span class='text header'>"+header+": "+data.pct+"%</span><br/><span class='text body'>"+data.count+" students<br/></span>"+
          "<span><button class='md-button md-primary' onclick='d3.filterGrid("+arg+")'>Apply Filter</button></span><br/>"+
          "<span><button class='md-button md-primary' onclick='d3.studentView("+arg+")'>View Profiles</button></span>")
    .style("visibility","visible")
    .style("left", function(){
      // too close to the right side
      if(c.width - d3.event.layerX < c.tip[0][0].clientWidth){
        return (d3.event.layerX - c.tip[0][0].clientWidth)+"px";
      } else {
        return d3.event.layerX+"px";
      }
    })
    .style("top", function(){
      // too close to the bottom
      if(128 + c.height - d3.event.layerY < c.tip[0][0].clientHeight){
        return (d3.event.layerY - c.tip[0][0].clientHeight)+"px";
      } else {
        return d3.event.layerY+"px";
      }
    });
};

}());
