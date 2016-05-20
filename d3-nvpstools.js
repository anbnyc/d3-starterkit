var grouper = function(parent,element,data,dims){
    _.each(arguments, function(x){console.log(x)});
    
    //groups
    var groups = parent.selectAll("g."+element)
        .data(data)
        .enter()
        .append("g."+element)
        .transform("translate",function(d){
            return "("+d[dims.x]+","+d[dims.y]+")";
        });
     
    //shapes
    groups.append(element)
        .attr("fill",dims.color);
        
    //labels
    groups.append("text")
        .text(function(d){ return d[dims.label]});
}