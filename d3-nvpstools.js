var grouper = function(element,data,dims){
                
    var c = d3.conventions({
        parentSel: d3.select('dee-three'),
        width: angular.element(document.querySelector("dee-three"))[0].offsetWidth,
        height: angular.element(document.querySelector("dee-three"))[0].offsetWidth
    });
    
    c.x = (element === "rect") ? d3.scale.ordinal().range([0,c.width]) : c.x;
    
    c.x.domain([
        d3.min(data,d3.f(dims.x)),
        d3.max(data,d3.f(dims.x))
    ]);
    
    c.y.domain([
        d3.min(data, d3.f(dims.y)),
        d3.max(data, d3.f(dims.y))
    ]);
    
    var groups;

    if(element === "circle"){
        
        groups = c.svg.dataAppend(data,"g."+element)     
            .attr("transform", function(d){
                return "translate("+c.x(d[dims.x])+","+c.y(d[dims.y])+")";
            });
            
        groups.append(element)
            .attr("fill",dims.color)
            .attr("r",5);
            
    } else if (element === "rect"){
        
        groups = c.svg.dataAppend(data,"g."+element)     
            .attr("transform", function(d,i){
                return "translate("+c.x(i)+","+ (c.y(d[dims.y]))+")";
            });
        
        groups.append(element)
            .attr("height", function(d){
                return c.y(d[dims.y]);
            })
            .attr("width", c.width/data.length)
            .attr("fill",dims.color);
            
    }

    //labels
    groups.append("text")
        .text(d3.f(dims.label));
        
}