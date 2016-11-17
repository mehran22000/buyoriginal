module.exports = {
 unique : function(items,field) {
  	var dic = [];
  	var result = [];
	items.forEach( function( item ) {
    	if (!dic[item[field]]){
    		dic[item[field]]=item[field];
    		result.push(item);
    		}
    	})
    return result;
	}
};
