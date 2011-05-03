define(["dojo/_base/kernel", "dojo/_base/declare", "dojo/listen", "dojo/_base/html"], function(dojo, declare, listen){
	
return declare([], {
	resizeNode: null,
	minColumnWidth: 20,	//in px
	detectWidth: 5,
	column: function(){
		var column = this.inherited(arguments);
		var grid = this;
		var setWidth = column.setWidth;
		column.setWidth = function(width){
			// call original
			setWidth && setWidth.call(column, width);
			// call our handler
			grid.setColumnWidth(column.id, width);
		};
		return column;
	},
	postCreate: function(){
		this.inherited(arguments);
		var grid = this,
			body = document.body;
		listen(grid.headerNode, "mousemove", function(e){
			if(grid._resizing || !grid._getCell(e)){
				return;
			}
			if(grid._isInResizeRange(e)){
				grid._readyToResize = true;
				dojo.addClass(dojo.body(), 'dojoxGridxColumnResizing');
			}else{
				grid._readyToResize = false;
				dojo.removeClass(dojo.body(), 'dojoxGridxColumnResizing');
			}
		});
		listen(grid, ".dojoxGridxHeader:mouseout", function(e){ // should this be the mouse.leave event?
			console.log("mouseout");
			if(grid._resizing){return;}
			grid._readyToResize = false;
			dojo.removeClass(dojo.body(), 'dojoxGridxColumnResizing');			
		});
		listen(grid, ".dojoxGridxHeader:mousedown", function(e){
			console.log("mousedown");
			//begin resize
			if(!grid._readyToResize){return;}
			dojo.setSelectable(grid.domNode, false);
			grid._resizing = true;
			grid._startX = e.pageX;
			grid._gridX = dojo.position(grid.bodyNode).x;
			
			// show resizer inlined
			if(!grid._resizer){
				grid._resizer = dojo.create('div', {
					className: 'dojoxGridxColumnResizer'}, 
					grid.domNode, 'last');
		    	listen(grid._resizer, 'mouseup', mouseup);
			}
			grid._resizer.style.display = 'block';
			grid._updateResizerPosition(e);
		});
		listen(body, "mousemove", function(e){
			if(!grid._resizing){return;}
			grid._updateResizerPosition(e);
		});
		listen(body, "mouseup", mouseup);
		function mouseup(e){
			//end resize
			if(!grid._resizing){return;}
			grid._resizing = false;
			grid._readyToResize = false;
			dojo.removeClass(dojo.body(), 'dojoxGridxColumnResizing');
			dojo.setSelectable(grid.domNode, true);
			
			var cell = grid._targetCell, delta = e.pageX - grid._startX;
			var w = cell.offsetWidth + delta;
			if(w < grid.minWidth){w = grid.minWidth;}
			grid.setColumnWidth(dojo.attr(cell, 'colid'), w);
			grid._hideResizer();
		}
	},
	setColumnWidth: function(colId, width){
		dojo.query('[colid=' + colId + ']', this.domNode).forEach(function(cell){
			cell.style.width = width + 'px';
		});
		// now refresh, things have changed (any plugin might attach to this)
		//this.refresh();
	},
	
	_updateResizerPosition: function(e){
		var delta = e.pageX - this._startX, cell = this._targetCell;
		var left = e.pageX - this._gridX;

		if(cell.offsetWidth + delta < this.minWidth){
			left = this._startX - this._gridX - (cell.offsetWidth - this.minWidth); 
		}
		this._resizer.style.left = left  + 'px';
	},
	_hideResizer: function(){
		this._resizer.style.display = 'none';
	},
	
	_isInResizeRange: function(e){
		var cell = this._getCell(e);
		var x = this._getCellX(e);
		if(x < this.detectWidth){
			this._targetCell = cell.previousSibling;
			if(!this._targetCell){
				return false;	//the first cell is not able to be resize
			}
			return true;
		}else if(x > cell.offsetWidth - this.detectWidth && x <= cell.offsetWidth){
			this._targetCell = cell;
			return true;
		}
		return false;
	},
	
	_getCellX: function(e){
		var cell = this._getCell(e);
		if(!cell){
			return 100000;
		}
		var x = e.layerX - cell.offsetLeft;
		if(x < 0){x = e.layerX;} //chrome take layerX as cell x.
		return x;
	},
	
	_getCell: function(e){
		var node = e.target;
		while(node && node.tagName && node.tagName.toLowerCase() !== 'th'){
			node = node.parentNode;
		}
		return node;
	}
	
});
});
