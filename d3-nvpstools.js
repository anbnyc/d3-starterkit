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
      return colorMenu[each];
    });
  }
};

//adapted from d3.conventions and d3angularjs ebook
d3.init = function(c){
  c = c || {};
  c.data = c.data || [];

  c.sort = function(a,b){
    if(c.rank){
      return c.rank[a[c.dims.x]] - c.rank[b[c.dims.x]];
    } else {
      return d3.ascending(a,b);
    }
  };

  //define scales and axes
  c.width = c.width || 600;
  c.height = c.height || 500;
  c.margin = c.margin || {top: 20, right: 20, bottom: 20, left: 40};
  c.x       = c.x       || d3.scale.linear().range([0, c.width]);
  c.y       = c.y       || d3.scale.linear().range([c.height, 0]);
  c.rScale  = c.rScale  || d3.scale.sqrt().range([5, 20]);
  c.line    = c.line    || d3.svg.line();
  c.offset  = c.offset  || 5;

  c.color = d3.scale.ordinal().range(d3.palettes(c.palette));

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

  c.groups = c.svg.selectAll('g.'+c.element).data(c.data);
  c.groups.exit().remove();

  var groups = c.groups.enter().append("g."+c.element);

  switch(c.element){
    case "circle":
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

      if(c.stacked){

        c.groups
          .attr("transform", function(d){
            return "translate("+ c.x(d[c.dims.x]) +","+c.y(d.sum)+")";
          });

        var temp = c.groups.selectAll(c.element)
          .data(function(d){
            return d[c.dims.y[0]];
          })
          .enter()
          .append(c.element)
          .attr("height", function(d){
            return c.y(d.y0) - c.y(d.y1);
          })
          .attr("y", function(d){
            return c.y(d.y1);
          })
          .attr("width", c.x.rangeBand())
          .attr("fill", function(d){
            return c.color(d[c.dims.color[1]]);
          });

      } else {
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
              .attr("x", c.x.rangeBand()/2)
              .attr("y",function(d){
                  return -c.offset;
              })
              .text(d3.f(c.dims.label));
        }

      }
  }

  c.xAxisG
    .call(c.xAxis);

  c.yAxisG
    .call(c.yAxis);

  c.groups.selectAll(c.element)
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
  var header;
  if(c.stacked){
    header = data[c.dims.color[1]];
  } else {
    if(c.element === "circle"){
      header = c.dims.x+": "+data[c.dims.x]+"<br/>"+c.dims.y+": "+data[c.dims.y];
    } else {
      header = data[c.dims.x];
    }
  }
  c.tip
    .html("<span class='text header'>"+header+": "+data.pct+"%</span><br/><span class='text body'>"+data.count+" students<br/></span>"+
          "<span><button class='md-button md-primary' onclick='d3.filterGrid("+arg+")'>Apply Filter</button></span><br/>"+
          "<span><button class='md-button md-primary'>View Profiles</button></span>")
    .style("visibility","visible")
    .style("left", function(){
      if(c.width - d3.event.pageX > 100){
        return (d3.event.pageX)+"px";
      } else {
        return (d3.event.pageX - 150)+"px";
      }
    })
    .style("top", function(){
      if(d3.event.pageY < 300){
        return (d3.event.pageY)+"px";
      } else {
        return (d3.event.pageY - 120)+"px";
      }
    });
};

d3.filterGrid = function(data){
  console.log(data);
};

}());
